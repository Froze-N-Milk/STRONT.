import { describe, test, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Account from "./index";
import React from "react";

type FetchInit = {
  body?: unknown;
  method?: string;
  headers?: Record<string, string>;
  credentials?: string;
};

type MockResponse = {
  status: number;
  ok: boolean;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

const g = globalThis as unknown as {
  fetch: (input: unknown, init?: FetchInit) => Promise<MockResponse>;
};

function makeJsonResponse(payload: unknown, status = 200): MockResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

// Seed list returned by GET /api/account/restaurants
const seedList = [
  {
    id: "a1",
    name: "Alpha Cafe",
    description: "Tasty brunch",
    locationText: "CBD",
    locationUrl: "https://maps.example/alpha",
    frontpageMarkdown: null,
  },
  {
    id: "b2",
    name: "Beta Bistro",
    description: "Seafood",
    locationText: "Harbor",
    locationUrl: null,
    frontpageMarkdown: null,
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

// 1) Initial render & list load
describe("Account page — list & search", () => {
  test("shows Loading… then renders restaurants from API", async () => {
    const fetchSpy = vi.spyOn(g, "fetch");
    fetchSpy.mockResolvedValueOnce(makeJsonResponse(seedList, 200));

    render(React.createElement(Account));

    // Initial state
    expect(screen.getByText("Loading…")).toBeInTheDocument();

    // After fetch
    expect(await screen.findByText("Alpha Cafe")).toBeInTheDocument();
    expect(screen.getByText("Beta Bistro")).toBeInTheDocument();
    expect(screen.queryByText("No restaurants yet.")).not.toBeInTheDocument();
  });

  test("filters by the Search input", async () => {
    const fetchSpy = vi.spyOn(g, "fetch");
    fetchSpy.mockResolvedValueOnce(makeJsonResponse(seedList, 200));

    render(React.createElement(Account));

    await screen.findByText("Alpha Cafe");

    const search = screen.getByPlaceholderText("Search");
    fireEvent.change(search, { target: { value: "beta" } });

    expect(screen.queryByText("Alpha Cafe")).not.toBeInTheDocument();
    expect(screen.getByText("Beta Bistro")).toBeInTheDocument();
  });

  test("each card links to /profile with ?restaurantId=", async () => {
    const fetchSpy = vi.spyOn(g, "fetch");
    fetchSpy.mockResolvedValueOnce(makeJsonResponse(seedList, 200));

    render(React.createElement(Account));

    await screen.findByText("Alpha Cafe");
    // Clickable card is wrapped in a <a> by TanStack Router's <Link>
    const betaLink = screen.getByText("Beta Bistro").closest("a");
    expect(betaLink).toBeTruthy();
    expect(betaLink!.getAttribute("href")).toMatch(/\/profile\?/);
    expect(betaLink!.getAttribute("href")).toMatch(/restaurantId=b2/);
  });
});

// 2) Create flow (New Restaurant modal)
describe("Account page — create new restaurant", () => {
  test("opens New modal, posts only { name }, then appends to the list", async () => {
    const fetchSpy = vi.spyOn(g, "fetch");
    // 1st fetch: initial list
    fetchSpy.mockResolvedValueOnce(makeJsonResponse(seedList, 200));

    render(React.createElement(Account));
    await screen.findByText("Alpha Cafe");

    // Open modal via toolbar (+) button (title = "Add New Restaurant")
    const addBtn = screen.getByTitle("Add New Restaurant");
    fireEvent.click(addBtn);

    // Modal appears
    expect(screen.getByText("New Restaurant")).toBeInTheDocument();

    // Fill name
    const nameInput = screen.getByLabelText("Restaurant Name:");
    fireEvent.change(nameInput, { target: { value: "New Place" } });

    // Submit
    const saveBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(saveBtn);

    // Modal closes & list updated
    await waitFor(() => {
      expect(screen.queryByText("New Restaurant")).not.toBeInTheDocument();
    });
    expect(screen.getByText("New Place")).toBeInTheDocument();

    // Assert second fetch call body equals { name: "New Place" }
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    const [, createOptions] = fetchSpy.mock.calls[1] as [
      unknown,
      { body?: unknown },
    ];
    const raw = (createOptions && createOptions.body) ?? null;
    const body = raw
      ? JSON.parse(typeof raw === "string" ? raw : String(raw))
      : null;
    expect(body).toEqual({ name: "New Place" });
  });
});

// 3) Settings (password validation & save)
describe("Account page — account settings", () => {
  test("validation: mismatch and too short password show errors; Save disabled until valid", async () => {
    const fetchSpy = vi.spyOn(g, "fetch");
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(seedList), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(React.createElement(Account));
    await screen.findByText("Alpha Cafe");

    // Open settings via toolbar gear (title = "Settings")
    const settingsBtn = screen.getByTitle("Settings");
    fireEvent.click(settingsBtn);

    // Modal visible
    expect(screen.getByText("Account Setting")).toBeInTheDocument();

    const newPwd = screen.getByLabelText("New Password:");
    const confirm = screen.getByLabelText("Confirm Password:");
    const saveBtn = screen.getByRole("button", { name: "Save" });

    // Too short
    fireEvent.change(newPwd, { target: { value: "12345" } });
    fireEvent.change(confirm, { target: { value: "12345" } });
    expect(
      await screen.findByText("Password should be at least 6 characters."),
    ).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();

    // Mismatch
    fireEvent.change(newPwd, { target: { value: "123456" } });
    fireEvent.change(confirm, { target: { value: "654321" } });
    expect(
      await screen.findByText("Passwords do not match."),
    ).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();

    // Valid
    fireEvent.change(newPwd, { target: { value: "abcdef" } });
    fireEvent.change(confirm, { target: { value: "abcdef" } });
    expect(
      screen.queryByText("Passwords do not match."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Password should be at least 6 characters."),
    ).not.toBeInTheDocument();
    expect(saveBtn).not.toBeDisabled();

    // POST /api/account/update ok closes modal
    fetchSpy.mockResolvedValueOnce(makeJsonResponse({}, 200));
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.queryByText("Account Setting")).not.toBeInTheDocument();
    });

    // Check POST body (last call)
    const last = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1] as [
      unknown,
      { body?: unknown },
    ];
    const raw = (last[1] && last[1].body) ?? null;
    const body = raw
      ? JSON.parse(typeof raw === "string" ? raw : String(raw))
      : null;
    expect(body).toEqual({ password: "abcdef" });
  });
});

// 4) Remove restaurant flow
describe("Account page — remove restaurant", () => {
  test("click Remove opens confirm; Yes posts delete and removes the card", async () => {
    const fetchSpy = vi.spyOn(g, "fetch");
    fetchSpy.mockResolvedValueOnce(makeJsonResponse(seedList, 200));

    render(React.createElement(Account));
    await screen.findByText("Alpha Cafe");

    // Click Remove on Alpha card (button text is exactly "Remove")
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]);

    // Confirm modal
    expect(
      screen.getByText("Are you sure to remove this restaurant?"),
    ).toBeInTheDocument();

    // Delete POST ok
    fetchSpy.mockResolvedValueOnce(makeJsonResponse({}, 200));

    const yes = screen.getByRole("button", { name: "Yes" });
    fireEvent.click(yes);

    // Alpha should disappear
    await waitFor(() => {
      expect(screen.queryByText("Alpha Cafe")).not.toBeInTheDocument();
    });
    // Beta still there
    expect(screen.getByText("Beta Bistro")).toBeInTheDocument();
  });
});

// 5) Auth redirect on 401
describe("Account page — redirects to /login on 401", () => {
  test("GET /api/account/restaurants -> 401 sets window.location.href", async () => {
    const w = window as unknown as { location: { href: string } };
    const originalHref = w.location.href;
    w.location.href = "";

    const fetchSpy = vi.spyOn(g, "fetch");
    fetchSpy.mockResolvedValueOnce(makeJsonResponse("", 401));

    render(React.createElement(Account));

    await waitFor(() => {
      expect(w.location.href).toBe("/login");
    });

    w.location.href = originalHref;
  });
});
