import { describe, test, expect } from "vitest";
import {
  canAddTagCandidate,
  makeUpdatePayload,
  normalizeTagInput,
  shouldIncludeOptional,
} from "./index";

describe("profile logic (exported helpers)", () => {
  // --- canAddTagCandidate ---
  test("canAddTagCandidate: rejects empty and duplicate; accepts trimmed new tag", () => {
    expect(canAddTagCandidate("", ["Vegan"]).valueOf()).toBe(false);
    expect(canAddTagCandidate("   ", ["Vegan"]).valueOf()).toBe(false);
    expect(canAddTagCandidate("Vegan", ["Vegan"]).valueOf()).toBe(false);
    expect(canAddTagCandidate("  Vegan  ", ["Tag"]).valueOf()).toBe(true);
  });

  test("canAddTagCandidate: handles multiple existing tags", () => {
    const tags = ["Seafood", "Cafe", "Outdoor"];
    expect(canAddTagCandidate("Seafood", tags)).toBe(false); // duplicate
    expect(canAddTagCandidate(" BBQ ", tags)).toBe(true); // trimmed new
  });

  // --- normalizeTagInput ---
  test("normalizeTagInput trims spaces", () => {
    expect(normalizeTagInput("  Hello  ")).toBe("Hello");
    expect(normalizeTagInput("\n\tHi\t\n")).toBe("Hi");
    expect(normalizeTagInput("")).toBe("");
  });

  // --- shouldIncludeOptional ---
  test("shouldIncludeOptional returns true only for non-empty (after trim)", () => {
    expect(shouldIncludeOptional(" info@x.com ")).toBe(true);
    expect(shouldIncludeOptional("   ")).toBe(false);
    expect(shouldIncludeOptional("")).toBe(false);
  });

  // --- makeUpdatePayload ---
  test("makeUpdatePayload: includes base fields and conditionally optional ones", () => {
    const base = makeUpdatePayload(
      "r-1",
      "Cafe",
      "desc",
      "addr",
      ["Tag"],
      "",
      " ",
      "",
    );

    expect(base).toEqual({
      id: "r-1",
      name: "Cafe",
      description: "desc",
      locationText: "addr",
      tags: ["Tag"],
    });

    const full = makeUpdatePayload(
      "r-1",
      "Cafe",
      "desc",
      "addr",
      ["Tag"],
      "info@cafe.com",
      "123",
      " Hello ",
    );

    expect(full).toEqual({
      id: "r-1",
      name: "Cafe",
      description: "desc",
      locationText: "addr",
      tags: ["Tag"],
      contactEmail: "info@cafe.com",
      contactPhone: "123",
      frontpageMarkdown: "Hello",
    });
  });

  test("makeUpdatePayload: supports large tag lists and unicode", () => {
    const payload = makeUpdatePayload(
      "r-2",
      "火锅店",
      "麻辣",
      "上海",
      ["川菜", "麻辣", "热门"],
      "",
      "",
      "",
    );
    expect(payload).toEqual({
      id: "r-2",
      name: "火锅店",
      description: "麻辣",
      locationText: "上海",
      tags: ["川菜", "麻辣", "热门"],
    });
  });
});
