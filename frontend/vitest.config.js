/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    passWithNoTests: true,
    reporters: ["default", "junit"],
    outputFile: "vite-test-junit.xml",
  },
});
