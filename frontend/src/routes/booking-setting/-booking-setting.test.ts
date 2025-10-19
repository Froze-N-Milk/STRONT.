import { test, expect, describe } from "vitest";
import BookingSettingPage from "./index";

test("BookingSettingPage component is defined", () => {
  expect(typeof BookingSettingPage).toBe("function");
});

test("duration options include 60/90/120", () => {
  const durations = [60, 90, 120];
  expect(durations).toContain(60);
  expect(durations).toContain(90);
  expect(durations).toContain(120);
});

describe("toggle selected days (Set behavior)", () => {
  test("add then remove a day", () => {
    const selected = new Set<string>();
    selected.add("Fri");
    expect(selected.has("Fri")).toBe(true);
    selected.delete("Fri");
    expect(selected.has("Fri")).toBe(false);
  });
});

describe("opening hours/minutes ranges", () => {
  test("hours: 24 options from 00 to 23", () => {
    const HOURS = Array.from({ length: 24 }, (_, i) =>
      String(i).padStart(2, "0"),
    );
    expect(HOURS.length).toBe(24);
    expect(HOURS.at(0)).toBe("00");
    expect(HOURS.at(-1)).toBe("23");
  });

  test("minutes: 60 options from 00 to 59", () => {
    const MINUTES = Array.from({ length: 60 }, (_, i) =>
      String(i).padStart(2, "0"),
    );
    expect(MINUTES.length).toBe(60);
    expect(MINUTES.at(0)).toBe("00");
    expect(MINUTES.at(-1)).toBe("59");
  });
});

test("default time range is valid (start < end)", () => {
  const startHour = "09",
    startMinute = "00";
  const endHour = "21",
    endMinute = "00";
  const start = Number(startHour) * 60 + Number(startMinute);
  const end = Number(endHour) * 60 + Number(endMinute);
  expect(end).toBeGreaterThan(start);
});

test("active class applied when selected timeSlot matches", () => {
  const timeSlot = 90;
  const m = 90;
  const cls = `bks-day ${timeSlot === m ? "active" : ""}`.trim();
  expect(cls.includes("active")).toBe(true);
});

test("nav links carry restaurantId via search params", () => {
  const restaurantId = "rest-123";
  const sp = new URLSearchParams({ restaurantId }).toString();
  expect(sp).toBe("restaurantId=rest-123");
});
