import { describe, test, expect } from "vitest";
import fc from "fast-check";
import * as v from "valibot";
import { vfc } from "../src/index";

describe("String Schema Generation", () => {
	describe("Basic String", () => {
		test("generates valid strings", () => {
			const schema = v.string();
			const arbitrary = vfc().inputOf(schema);

			fc.assert(
				fc.property(arbitrary, (value) => {
					expect(typeof value).toBe("string");
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("generates diverse string content", () => {
			const schema = v.string();
			const samples = fc.sample(vfc().inputOf(schema), 100);

			const lengths = samples.map((s) => s.length);
			expect(Math.max(...lengths)).toBeGreaterThan(5);
			expect(Math.min(...lengths)).toBeLessThan(20);

			// Should include empty strings sometimes
			const hasEmpty = samples.some((s) => s.length === 0);
			expect(hasEmpty).toBe(true);
		});
	});

	describe("Length Constraints", () => {
		test("respects minimum length constraint", () => {
			const schema = v.pipe(v.string(), v.minLength(5));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value.length).toBeGreaterThanOrEqual(5);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("respects maximum length constraint", () => {
			const schema = v.pipe(v.string(), v.maxLength(10));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value.length).toBeLessThanOrEqual(10);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("respects exact length constraint", () => {
			const schema = v.pipe(v.string(), v.length(7));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value.length).toBe(7);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("combines min and max length constraints", () => {
			const schema = v.pipe(v.string(), v.minLength(3), v.maxLength(8));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value.length).toBeGreaterThanOrEqual(3);
					expect(value.length).toBeLessThanOrEqual(8);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});
	});

	describe("Content Constraints", () => {
		test("includes required substring with includes()", () => {
			const schema = v.pipe(v.string(), v.includes("test"));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toContain("test");
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("starts with required prefix", () => {
			const schema = v.pipe(v.string(), v.startsWith("prefix"));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value.startsWith("prefix")).toBe(true);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("ends with required suffix", () => {
			const schema = v.pipe(v.string(), v.endsWith("suffix"));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value.endsWith("suffix")).toBe(true);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		// test("combines multiple content constraints", () => {
		// 	const schema = v.pipe(
		// 		v.string(),
		// 		v.startsWith("start"),
		// 		v.endsWith("end"),
		// 		v.includes("middle")
		// 	);

		// 	fc.assert(
		// 		fc.property(vfc().inputOf(schema), (value) => {
		// 			expect(value.startsWith("start")).toBe(true);
		// 			expect(value.endsWith("end")).toBe(true);
		// 			expect(value).toContain("middle");
		// 			const parseResult = v.safeParse(schema, value);
		// 			expect(parseResult.success).toBe(true);
		// 		}),
		// 		{ numRuns: 30 }
		// 	);
		// });
	});

	describe("Format Constraints", () => {
		test("generates valid UUIDs", () => {
			const schema = v.pipe(v.string(), v.uuid());

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					// UUID format: 8-4-4-4-12 hex characters
					const uuidRegex =
						/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					expect(uuidRegex.test(value)).toBe(true);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates valid email addresses", () => {
			const schema = v.pipe(v.string(), v.email());

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					// Should contain @ and have basic email structure
					expect(value).toContain("@");
					expect(value.split("@")).toHaveLength(2);
					const [local, domain] = value.split("@");
					expect(local.length).toBeGreaterThan(0);
					expect(domain.length).toBeGreaterThan(0);
					expect(domain).toContain(".");

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("email addresses match Valibot's exact regex", () => {
			const schema = v.pipe(v.string(), v.email());
			const valibotEmailRegex =
				/^[\w+-]+(?:\.[\w+-]+)*@[\da-z]+(?:[.-][\da-z]+)*\.[a-z]{2,}$/iu;

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(valibotEmailRegex.test(value)).toBe(true);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("generates valid URLs", () => {
			const schema = v.pipe(v.string(), v.url());

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					// Should be a valid URL
					expect(() => new URL(value)).not.toThrow();
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});
	});

	// describe("Discrete Values", () => {});

	describe("Non-Empty Constraint", () => {
		test("generates non-empty strings", () => {
			const schema = v.pipe(v.string(), v.nonEmpty());

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value.length).toBeGreaterThan(0);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});
	});

	// TODO: work on a fix for this...
	// describe("Complex Combinations", () => {
	// 	// test("handles complex constraint combinations", () => {
	// 	// 	const schema = v.pipe(
	// 	// 		v.string(),
	// 	// 		v.minLength(5),
	// 	// 		v.maxLength(20),
	// 	// 		v.startsWith("test"),
	// 	// 		v.includes("data")
	// 	// 	);
	// 	// 	fc.assert(
	// 	// 		fc.property(vfc().inputOf(schema), (value) => {
	// 	// 			expect(value.length).toBeGreaterThanOrEqual(5);
	// 	// 			expect(value.length).toBeLessThanOrEqual(20);
	// 	// 			expect(value.startsWith("test")).toBe(true);
	// 	// 			expect(value).toContain("data");
	// 	// 			const parseResult = v.safeParse(schema, value);
	// 	// 			expect(parseResult.success).toBe(true);
	// 	// 		}),
	// 	// 		{ numRuns: 50 }
	// 	// 	);
	// 	// });
	// 	// test("length constraints work with content constraints", () => {
	// 	// 	const schema = v.pipe(
	// 	// 		v.string(),
	// 	// 		v.length(10),
	// 	// 		v.startsWith("ab"),
	// 	// 		v.endsWith("xy")
	// 	// 	);
	// 	// 	fc.assert(
	// 	// 		fc.property(vfc().inputOf(schema), (value) => {
	// 	// 			expect(value.length).toBe(10);
	// 	// 			expect(value.startsWith("ab")).toBe(true);
	// 	// 			expect(value.endsWith("xy")).toBe(true);
	// 	// 			// Should be "ab??????xy" where ?????? is 6 characters
	// 	// 			expect(value.substring(0, 2)).toBe("ab");
	// 	// 			expect(value.substring(8, 10)).toBe("xy");
	// 	// 			const parseResult = v.safeParse(schema, value);
	// 	// 			expect(parseResult.success).toBe(true);
	// 	// 		}),
	// 	// 		{ numRuns: 30 }
	// 	// 	);
	// 	// });
	// });

	describe("Edge Cases", () => {
		test("handles empty string constraints correctly", () => {
			const schema = v.pipe(v.string(), v.maxLength(0));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBe("");
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 10 }
			);
		});

		test("handles large length constraints", () => {
			const schema = v.pipe(v.string(), v.minLength(100), v.maxLength(150));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value.length).toBeGreaterThanOrEqual(100);
					expect(value.length).toBeLessThanOrEqual(150);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 20 }
			);
		});

		test("handles unicode characters in generated strings", () => {
			const schema = v.pipe(v.string(), v.minLength(1), v.maxLength(10));
			const samples = fc.sample(vfc().inputOf(schema), 100);

			samples.forEach((value) => {
				expect(typeof value).toBe("string");
				const parseResult = v.safeParse(schema, value);
				expect(parseResult.success).toBe(true);
			});
		});
	});
});
