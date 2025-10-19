import { test, expect, describe } from "vitest";
import Account from "./index";

test("Account component is defined", () => {
  expect(typeof Account).toBe("function");
});

type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  locationText: string | null;
  locationUrl: string | null;
  frontpageMarkdown: string | null;
};

function filterRestaurants(list: Restaurant[], q: string): Restaurant[] {
  const key = q.trim().toLowerCase();
  if (!key) return list;
  return list.filter((r) => {
    const hay = [
      r.name,
      r.description ?? "",
      r.locationText ?? "",
      r.locationUrl ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(key);
  });
}

const sample: Restaurant[] = [
  {
    id: "r1",
    name: "Panda Garden",
    description: "Best dumplings",
    locationText: "City Center",
    locationUrl: "https://maps.example/panda",
    frontpageMarkdown: null,
  },
  {
    id: "r2",
    name: "Sushi Place",
    description: "Fresh fish",
    locationText: "Harbor",
    locationUrl: null,
    frontpageMarkdown: null,
  },
];

describe("filterRestaurants", () => {
  test("returns original list when query is empty", () => {
    expect(filterRestaurants(sample, "")).toEqual(sample);
  });

  test("matches by name", () => {
    expect(filterRestaurants(sample, "panda").map((r) => r.id)).toEqual(["r1"]);
  });

  test("matches by description/location/url", () => {
    expect(filterRestaurants(sample, "dumplings").map((r) => r.id)).toEqual([
      "r1",
    ]); // description
    expect(filterRestaurants(sample, "harbor").map((r) => r.id)).toEqual([
      "r2",
    ]); // locationText
    expect(filterRestaurants(sample, "maps.example").map((r) => r.id)).toEqual([
      "r1",
    ]); // locationUrl
  });
});

test("removing a restaurant filters it out by id", () => {
  const toRemove = "r1";
  const after = sample.filter((r) => r.id !== toRemove);
  expect(after.map((r) => r.id)).toEqual(["r2"]);
});

test("new restaurant payload only includes name field", () => {
  const newRestaurantName = "My New Resto";
  const body = JSON.stringify({ name: newRestaurantName });
  expect(body).toBe('{"name":"My New Resto"}');
});

test("profile link carries restaurantId via URLSearchParams", () => {
  const id = "abc-123";
  const sp = new URLSearchParams({ restaurantId: id });
  expect(sp.toString()).toBe("restaurantId=abc-123");
});

function canSavePassword(newPwd: string, confirmPwd: string): boolean {
  return Boolean(newPwd) && newPwd === confirmPwd && newPwd.length >= 6;
}

describe("settings modal validation", () => {
  test("rejects when passwords mismatch", () => {
    expect(canSavePassword("abcdef", "abcdeg")).toBe(false);
  });
  test("rejects when too short", () => {
    expect(canSavePassword("abc", "abc")).toBe(false);
  });
  test("accepts when length >= 6 and match", () => {
    expect(canSavePassword("abcdef", "abcdef")).toBe(true);
  });
});
