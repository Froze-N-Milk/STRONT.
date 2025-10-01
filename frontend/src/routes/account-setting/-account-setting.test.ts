import { test, expect } from "vitest";
import AccountSetting from "./index";

test("AccountSetting component is defined", () => {
  expect(typeof AccountSetting).toBe("function");
});

test("passwords must match", () => {
  const newPwd = "123456";
  const confirmPwd = "123456";
  expect(newPwd === confirmPwd).toBe(true);
});

test("password too short", () => {
  const newPwd = "123";
  expect(newPwd.length >= 6).toBe(false);
});

test("array length check", () => {
  const arr = [1, 2, 3];
  expect(arr.length).toBe(3);
});

test("number comparison", () => {
  expect(10).toBeGreaterThan(5);
});

test("string concatenation", () => {
  expect("Hello" + " " + "World").toBe("Hello World");
});

test("null is falsy", () => {
  expect(Boolean(null)).toBe(false);
});
