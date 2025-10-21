import { describe, test, expect } from "vitest";
import {
  composeIso,
  isValidEmail,
  buildBookingPayload,
  validateBookingInput,
  filterBookings,
} from "./index";

describe("Booking logic functions", () => {
  test("composeIso correctly builds ISO timestamp", () => {
    const iso = composeIso("2025-10-21", "15:30");
    const expectedIso = new Date("2025-10-21T15:30:00").toISOString();
    expect(iso).toBe(expectedIso);
  });

  test("composeIso handles midnight correctly", () => {
    const iso = composeIso("2025-10-21", "00:00");
    const expectedIso = new Date("2025-10-21T00:00:00").toISOString();
    expect(iso).toBe(expectedIso);
  });

  // Email validation
  test("isValidEmail accepts valid formats", () => {
    expect(isValidEmail("john@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
  });

  test("isValidEmail rejects invalid formats", () => {
    expect(isValidEmail("wrong@com")).toBe(false);
    expect(isValidEmail(" ")).toBe(false);
    expect(isValidEmail("noatsymbol.com")).toBe(false);
  });

  // Build payload
  test("buildBookingPayload creates expected structure", () => {
    const payload = buildBookingPayload({
      restaurantId: "R123",
      date: "2025-11-01",
      time: "18:00",
      partySize: 3,
      firstName: "  Alice ",
      lastName: " Brown ",
      email: " alice@ex.com ",
    });
    expect(payload.firstName).toBe("Alice");
    expect(payload.lastName).toBe("Brown");
    const expectedIso2 = new Date("2025-11-01T18:00:00").toISOString();
    expect(payload.startsAt).toBe(expectedIso2);
  });

  test("buildBookingPayload omits empty optional fields", () => {
    const payload = buildBookingPayload({
      restaurantId: "R1",
      date: "2025-11-01",
      time: "18:00",
      partySize: 2,
      firstName: "John",
      lastName: "Smith",
      email: "john@example.com",
      phone: "",
      notes: "",
    });
    expect(payload.phone).toBeUndefined();
    expect(payload.notes).toBeUndefined();
  });

  // Input validation
  test("validateBookingInput catches missing fields", () => {
    expect(
      validateBookingInput({
        date: "",
        time: "12:00",
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
      }),
    ).toBe("Date and time are required");

    expect(
      validateBookingInput({
        date: "2025-10-01",
        time: "12:00",
        firstName: "",
        lastName: "",
        email: "a@b.com",
      }),
    ).toBe("Name is required");
  });

  test("validateBookingInput detects invalid email", () => {
    const err = validateBookingInput({
      date: "2025-10-21",
      time: "12:00",
      firstName: "John",
      lastName: "Doe",
      email: "badmail",
    });
    expect(err).toBe("Invalid email");
  });

  // Filter logic
  test("filterBookings filters correctly by keyword", () => {
    const list = [
      { firstName: "Alice", lastName: "Smith", email: "alice@ex.com" },
      { firstName: "Bob", lastName: "Wang", email: "bob@foo.com" },
    ];
    expect(filterBookings(list, "ali").length).toBe(1);
    expect(filterBookings(list, "Wang").length).toBe(1);
    expect(filterBookings(list, "nothing").length).toBe(0);
  });
});
