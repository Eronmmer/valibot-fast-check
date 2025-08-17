/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}", "__tests__/**/*.test.{ts,tsx}"],
		exclude: ["node_modules", "dist", ".next", ".turbo", "coverage"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"coverage/**",
				"dist/**",
				"**/node_modules/**",
				"**/*.d.ts",
				"**/*.test.{js,jsx,ts,tsx}",
				"**/vitest.config.*",
			],
			all: true,
			include: ["src/**/*.{js,jsx,ts,tsx}"],
		},
		testTimeout: 10000,
		hookTimeout: 10000,
	},
});
