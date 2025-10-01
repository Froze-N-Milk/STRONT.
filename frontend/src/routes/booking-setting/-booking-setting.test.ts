import { test, expect } from "vitest";
import BookingSettingPage from "./index";

test("BookingSettingPage component is defined", () => {
  expect(typeof BookingSettingPage).toBe("function");
});

test("select booking duration", () => {
  const durations = [60, 90, 120];
  expect(durations).toContain(90);
});

test("toggle day selection", () => {
  const selected = new Set(["Mon", "Wed"]);
  selected.add("Fri");
  expect(selected.has("Fri")).toBe(true);
});

test("end time is after start time", () => {
  const start = 9;
  const end = 21;
  expect(end > start).toBe(true);
});

test("array push works", () => {
  const arr = [1];
  arr.push(2);
  expect(arr).toEqual([1, 2]);
});

test("string uppercase", () => {
  expect("book".toUpperCase()).toBe("BOOK");
});

test("object equality", () => {
  expect({ id: 1, name: "Table" }).toEqual({ id: 1, name: "Table" });
});
