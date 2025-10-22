import { expect, test } from "vitest";
import { timeFromMaskValue, isValidEmail } from "./-utils.tsx";

//timeFromMaskValue unit tests

test("correctly handles 0:00AM", () => {
  expect(timeFromMaskValue(0)).toBe("00:00 AM");
});
test("correctly identifies 0:30AM", () => {
  expect(timeFromMaskValue(1)).toBe("00:30 AM");
});
test("correctly handles 1:00AM", () => {
  expect(timeFromMaskValue(2)).toBe("1:00 AM");
});
test("correctly identifies 1:30AM", () => {
  expect(timeFromMaskValue(3)).toBe("1:30 AM");
});
test("correctly handles 2:00AM", () => {
  expect(timeFromMaskValue(4)).toBe("2:00 AM");
});
test("correctly identifies 2:30AM", () => {
  expect(timeFromMaskValue(5)).toBe("2:30 AM");
});
test("correctly handles 3:00AM", () => {
  expect(timeFromMaskValue(6)).toBe("3:00 AM");
});
test("correctly identifies 3:30AM", () => {
  expect(timeFromMaskValue(7)).toBe("3:30 AM");
});
test("correctly handles 4:00AM", () => {
  expect(timeFromMaskValue(8)).toBe("4:00 AM");
});
test("correctly identifies 4:30AM", () => {
  expect(timeFromMaskValue(9)).toBe("4:30 AM");
});
test("correctly handles 5:00AM", () => {
  expect(timeFromMaskValue(10)).toBe("5:00 AM");
});
test("correctly identifies 5:30AM", () => {
  expect(timeFromMaskValue(11)).toBe("5:30 AM");
});
test("correctly handles 6:00AM", () => {
  expect(timeFromMaskValue(12)).toBe("6:00 AM");
});
test("correctly identifies 6:30AM", () => {
  expect(timeFromMaskValue(13)).toBe("6:30 AM");
});
test("correctly handles 7:00AM", () => {
  expect(timeFromMaskValue(14)).toBe("7:00 AM");
});
test("correctly identifies 7:30AM", () => {
  expect(timeFromMaskValue(15)).toBe("7:30 AM");
});
test("correctly handles 8:00AM", () => {
  expect(timeFromMaskValue(16)).toBe("8:00 AM");
});
test("correctly identifies 8:30AM", () => {
  expect(timeFromMaskValue(17)).toBe("8:30 AM");
});
test("correctly handles 9:00AM", () => {
  expect(timeFromMaskValue(18)).toBe("9:00 AM");
});
test("correctly identifies 9:30AM", () => {
  expect(timeFromMaskValue(19)).toBe("9:30 AM");
});
test("correctly handles 10:00AM", () => {
  expect(timeFromMaskValue(20)).toBe("10:00 AM");
});
test("correctly identifies 10:30AM", () => {
  expect(timeFromMaskValue(21)).toBe("10:30 AM");
});
test("correctly handles 11:00AM", () => {
  expect(timeFromMaskValue(22)).toBe("11:00 AM");
});
test("correctly identifies 11:30AM", () => {
  expect(timeFromMaskValue(23)).toBe("11:30 AM");
});
test("correctly handles 12:00PM", () => {
  expect(timeFromMaskValue(24)).toBe("12:00 PM");
});
test("correctly identifies 12:30PM", () => {
  expect(timeFromMaskValue(25)).toBe("12:30 PM");
});
test("correctly handles 1:00PM", () => {
  expect(timeFromMaskValue(26)).toBe("1:00 PM");
});
test("correctly identifies 1:30PM", () => {
  expect(timeFromMaskValue(27)).toBe("1:30 PM");
});
test("correctly handles 2:00PM", () => {
  expect(timeFromMaskValue(28)).toBe("2:00 PM");
});
test("correctly identifies 2:30PM", () => {
  expect(timeFromMaskValue(29)).toBe("2:30 PM");
});
test("correctly handles 3:00PM", () => {
  expect(timeFromMaskValue(30)).toBe("3:00 PM");
});
test("correctly identifies 3:30PM", () => {
  expect(timeFromMaskValue(31)).toBe("3:30 PM");
});
test("correctly handles 4:00PM", () => {
  expect(timeFromMaskValue(32)).toBe("4:00 PM");
});
test("correctly identifies 4:30PM", () => {
  expect(timeFromMaskValue(33)).toBe("4:30 PM");
});
test("correctly handles 5:00PM", () => {
  expect(timeFromMaskValue(34)).toBe("5:00 PM");
});
test("correctly identifies 5:30PM", () => {
  expect(timeFromMaskValue(35)).toBe("5:30 PM");
});
test("correctly handles 6:00PM", () => {
  expect(timeFromMaskValue(36)).toBe("6:00 PM");
});
test("correctly identifies 6:30PM", () => {
  expect(timeFromMaskValue(37)).toBe("6:30 PM");
});
test("correctly handles 7:00PM", () => {
  expect(timeFromMaskValue(38)).toBe("7:00 PM");
});
test("correctly identifies 7:30PM", () => {
  expect(timeFromMaskValue(39)).toBe("7:30 PM");
});
test("correctly handles 8:00PM", () => {
  expect(timeFromMaskValue(40)).toBe("8:00 PM");
});
test("correctly identifies 8:30PM", () => {
  expect(timeFromMaskValue(41)).toBe("8:30 PM");
});
test("correctly handles 9:00PM", () => {
  expect(timeFromMaskValue(42)).toBe("9:00 PM");
});
test("correctly identifies 9:30PM", () => {
  expect(timeFromMaskValue(43)).toBe("9:30 PM");
});
test("correctly handles 10:00PM", () => {
  expect(timeFromMaskValue(44)).toBe("10:00 PM");
});
test("correctly identifies 10:30PM", () => {
  expect(timeFromMaskValue(45)).toBe("10:30 PM");
});
test("correctly handles 11:00PM", () => {
  expect(timeFromMaskValue(46)).toBe("11:00 PM");
});
test("correctly identifies 11:30PM", () => {
  expect(timeFromMaskValue(47)).toBe("11:30 PM");
});

//isValidEmail unit tests

test("accepts standard valid emails", () => {
  expect(isValidEmail("test@example.com")).toBe(true);
  expect(isValidEmail("user.name+tag@domain.co")).toBe(true);
  expect(isValidEmail("first_last@sub.domain.org")).toBe(true);
});

test("rejects emails missing '@'", () => {
  expect(isValidEmail("plainaddress")).toBe(false);
  expect(isValidEmail("test.example.com")).toBe(false);
});

test("rejects emails missing domain part", () => {
  expect(isValidEmail("user@")).toBe(false);
  expect(isValidEmail("user@.com")).toBe(false);
  expect(isValidEmail("user@com")).toBe(false);
});

test("rejects emails missing local part", () => {
  expect(isValidEmail("@example.com")).toBe(false);
});

test("rejects emails with spaces", () => {
  expect(isValidEmail("user name@example.com")).toBe(false);
  expect(isValidEmail("user@ example.com")).toBe(false);
});

test("rejects emails with multiple '@'", () => {
  expect(isValidEmail("user@@example.com")).toBe(false);
});

test("accepts emails with different TLD lengths", () => {
  expect(isValidEmail("user@domain.c")).toBe(true);
  expect(isValidEmail("user@domain.community")).toBe(true);
});
