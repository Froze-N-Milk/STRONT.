import { describe, test, expect } from "vitest";
import {
  toggleDayForTest,
  formatHourMaskForTest,
  makeAvailabilitiesRequestForTest,
} from "./index";

describe("booking-setting functions", () => {
  // toggleDayForTest
  test("toggleDayForTest: flip existing day", () => {
    const prev = new Set(["monday", "tuesday"]);
    const next = toggleDayForTest(prev, "monday");
    expect(next.has("monday")).toBe(false);
    expect(next.has("tuesday")).toBe(true);
  });

  test("toggleDayForTest: add missing day", () => {
    const prev = new Set<string>();
    const next = toggleDayForTest(prev, "wednesday");
    expect(next.has("wednesday")).toBe(true);
  });

  // formatHourMaskForTest
  test("formatHourMaskForTest: 09:00-21:00 yields non-zero", () => {
    const m = formatHourMaskForTest("09", "00", "21", "00");
    expect(Number.isInteger(m)).toBe(true);
    expect(m).toBeGreaterThan(0);
  });

  test("formatHourMaskForTest: same open/close -> 0", () => {
    const m = formatHourMaskForTest("09", "00", "09", "00");
    expect(m).toBe(0);
  });

  test("formatHourMaskForTest: different span yields different mask", () => {
    const a = formatHourMaskForTest("09", "00", "21", "00");
    const b = formatHourMaskForTest("10", "00", "21", "00");
    expect(a).not.toBe(b);
  });

  // makeAvailabilitiesRequestForTest
  test("makeAvailabilitiesRequestForTest: builds day masks correctly", () => {
    const days = new Set(["monday", "friday", "sunday"]);
    const mask = formatHourMaskForTest("10", "00", "18", "00");
    const body = makeAvailabilitiesRequestForTest("rid-1", days, mask);

    expect(body.id).toBe("rid-1");
    expect(body.mondayHours).toBe(mask);
    expect(body.tuesdayHours).toBe(0);
    expect(body.fridayHours).toBe(mask);
    expect(body.sundayHours).toBe(mask);
  });
});
