import { expect, test } from "vitest";
import {
  filterByCustomerNotes,
  filterByDateRange,
  filterByRestaurantNotes,
  type Booking,
} from "../-helper";

const testBooking: Booking = {
  booking_id: "1",
  given_name: "John",
  family_name: "Doe",
  phone: "1234567890",
  email: "john@example.com",
  party_size: 2,
  booking_date: new Date("2024-05-10").getTime(),
  time_slot: 10,
  creation_date: Date.now(),
  customer_notes: "Allergic to peanuts",
  restaurant_notes: "Quiet table by the window",
  attendance: "cancelled",
};

/* ---------------- filterByDateRange ---------------- */

test("filterByDateRange returns true when bookingdate is within range", () => {
  const bookingdate = new Date("2024-05-10").getTime();
  const mindate = "2024-05-01";
  const maxdate = "2024-05-15";
  expect(filterByDateRange(bookingdate, mindate, maxdate)).toBe(true);
});

test("filterByDateRange returns false when bookingdate is before range", () => {
  const bookingdate = new Date("2024-04-25").getTime();
  const mindate = "2024-05-01";
  const maxdate = "2024-05-15";
  expect(filterByDateRange(bookingdate, mindate, maxdate)).toBe(false);
});

test("filterByDateRange returns false when bookingdate is after range", () => {
  const bookingdate = new Date("2024-05-20").getTime();
  const mindate = "2024-05-01";
  const maxdate = "2024-05-15";
  expect(filterByDateRange(bookingdate, mindate, maxdate)).toBe(false);
});

test("filterByDateRange returns true if either mindate or maxdate is empty", () => {
  const bookingdate = new Date("2024-05-10").getTime();
  expect(filterByDateRange(bookingdate, "", "")).toBe(true);
  expect(filterByDateRange(bookingdate, "2024-05-01", "")).toBe(true);
  expect(filterByDateRange(bookingdate, "", "2024-05-15")).toBe(true);
});

/* ---------------- filterByRestaurantNotes ---------------- */

test("filterByRestaurantNotes returns true if searchTerm is empty", () => {
  expect(filterByRestaurantNotes(testBooking, "")).toBe(true);
});

test("filterByRestaurantNotes matches case-insensitively", () => {
  expect(filterByRestaurantNotes(testBooking, "quiet")).toBe(true);
  expect(filterByRestaurantNotes(testBooking, "WINDOW")).toBe(true);
});

test("filterByRestaurantNotes returns false if term not found", () => {
  expect(filterByRestaurantNotes(testBooking, "outside")).toBe(false);
});

/* ---------------- filterByCustomerNotes ---------------- */

test("filterByCustomerNotes returns true if searchTerm is empty", () => {
  expect(filterByCustomerNotes(testBooking, "")).toBe(true);
});

test("filterByCustomerNotes matches case-insensitively", () => {
  expect(filterByCustomerNotes(testBooking, "PEANUTS")).toBe(true);
  expect(filterByCustomerNotes(testBooking, "allergic")).toBe(true);
});

test("filterByCustomerNotes returns false if term not found", () => {
  expect(filterByCustomerNotes(testBooking, "gluten")).toBe(false);
});
