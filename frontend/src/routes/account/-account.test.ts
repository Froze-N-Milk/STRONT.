/* @vitest-environment jsdom */
import { describe, test, expect } from "vitest";
import { isValidRestaurantName, isValidPassword } from "./index";

describe("Account page exported logic", () => {
  // --- Restaurant name validation ---
  test("accepts a valid restaurant name", () => {
    expect(isValidRestaurantName("My Restaurant")).toBe(true);
  });

  test("rejects empty or whitespace name", () => {
    expect(isValidRestaurantName("   ")).toBe(false);
    expect(isValidRestaurantName("")).toBe(false);
  });

  test("trims leading/trailing spaces before validating name", () => {
    expect(isValidRestaurantName("   Cafe ")).toBe(true);
  });

  // --- Password validation ---
  test("accepts matching passwords with sufficient length", () => {
    expect(isValidPassword("123456", "123456")).toBe(true);
  });

  test("rejects passwords that don't match", () => {
    expect(isValidPassword("123456", "654321")).toBe(false);
  });

  test("rejects passwords that are too short", () => {
    expect(isValidPassword("abcdef", "abcdeg")).toBe(false);
  });
});
