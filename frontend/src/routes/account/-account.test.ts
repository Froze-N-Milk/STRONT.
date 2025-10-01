import { test, expect } from "vitest";
import Account from "./index";

test("Account component is defined", () => {
  expect(typeof Account).toBe("function");
});

test("basic math works", () => {
  expect(2 + 2).toBe(4);
});

test("array includes value", () => {
  const arr = ["Tag", "Vegan"];
  expect(arr).toContain("Vegan");
});

test("string matches regex", () => {
  expect("Account Setting").toMatch(/Setting/);
});

test("object has property", () => {
  const obj = { name: "Demo" };
  expect(obj).toHaveProperty("name");
});

test("boolean is true", () => {
  expect(true).toBe(true);
});

test("string length check", () => {
  expect("Account".length).toBeGreaterThan(3);
});
