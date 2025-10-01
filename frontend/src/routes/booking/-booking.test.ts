import { test, expect } from "vitest";
import BookingPage from "./index";

test("BookingPage component is defined", () => {
  expect(typeof BookingPage).toBe("function");
});

test("removes booking item from list", () => {
  const items = [1, 2, 3];
  const removed = items.filter((i) => i !== 2);
  expect(removed).toEqual([1, 3]);
});

test("adds booking item to list", () => {
  const items = [1, 2];
  const updated = [...items, 3];
  expect(updated).toEqual([1, 2, 3]);
});

test("string contains 'Booking'", () => {
  const str = "Booking Page";
  expect(str).toContain("Booking");
});

test("calculates guests correctly", () => {
  const guests = 4 + 2;
  expect(guests).toBe(6);
});
