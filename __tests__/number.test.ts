import { describe, test, expect } from "vitest";
import fc from "fast-check";
import * as v from "valibot";
import { vfc } from "../src/index";

describe("Number Schema Generation", () => {
	describe("Basic Number", () => {
		test("generates valid numbers", () => {
			const schema = v.number();
			const arbitrary = vfc().inputOf(schema);

			fc.assert(
				fc.property(arbitrary, (value) => {
					expect(typeof value).toBe("number");
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("can generate special number values", () => {
			const schema = v.number();
			const samples = fc.sample(vfc().inputOf(schema), 500);

			// Should sometimes generate special values like Infinity, -Infinity
			const hasInfinity = samples.some((n) => n === Infinity);
			const hasNegativeInfinity = samples.some((n) => n === -Infinity);
			const hasLargeNumbers = samples.some((n) => Math.abs(n) > 1e10);
			const hasSmallNumbers = samples.some(
				(n) => Math.abs(n) < 1e-10 && n !== 0
			);

			expect(
				hasInfinity || hasNegativeInfinity || hasLargeNumbers || hasSmallNumbers
			).toBe(true);
		});
	});

	describe("Minimum Value Constraint", () => {
		test("respects minimum value constraint", () => {
			const schema = v.pipe(v.number(), v.minValue(100));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeGreaterThanOrEqual(100);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("handles negative minimum values", () => {
			const schema = v.pipe(v.number(), v.minValue(-50));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeGreaterThanOrEqual(-50);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("does not generate -Infinity when min value is set", () => {
			const schema = v.pipe(v.number(), v.minValue(0));
			const samples = fc.sample(vfc().inputOf(schema), 100);

			expect(samples.every((n) => n >= 0)).toBe(true);
			expect(samples.includes(-Infinity)).toBe(false);
		});
	});

	describe("Maximum Value Constraint", () => {
		test("respects maximum value constraint", () => {
			const schema = v.pipe(v.number(), v.maxValue(100));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeLessThanOrEqual(100);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("does not generate Infinity when max value is set", () => {
			const schema = v.pipe(v.number(), v.maxValue(1000));
			const samples = fc.sample(vfc().inputOf(schema), 100);

			expect(samples.every((n) => n <= 1000)).toBe(true);
			expect(samples.includes(Infinity)).toBe(false);
		});
	});

	describe("Min and Max Combined", () => {
		test("respects both min and max constraints", () => {
			const schema = v.pipe(v.number(), v.minValue(10), v.maxValue(90));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeGreaterThanOrEqual(10);
					expect(value).toBeLessThanOrEqual(90);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("handles float min and max", () => {
			const schema = v.pipe(v.number(), v.minValue(0.5), v.maxValue(1.5));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeGreaterThanOrEqual(0.5);
					expect(value).toBeLessThanOrEqual(1.5);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});
	});

	describe("Integer Constraint", () => {
		test("generates only integers", () => {
			const schema = v.pipe(v.number(), v.integer());

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Number.isInteger(value)).toBe(true);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("combines integer with min/max constraints", () => {
			const schema = v.pipe(
				v.number(),
				v.integer(),
				v.minValue(5),
				v.maxValue(15)
			);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Number.isInteger(value)).toBe(true);
					expect(value).toBeGreaterThanOrEqual(5);
					expect(value).toBeLessThanOrEqual(15);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});
	});

	describe("Safe Integer Constraint", () => {
		test("generates only safe integers", () => {
			const schema = v.pipe(v.number(), v.safeInteger());

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Number.isSafeInteger(value)).toBe(true);
					expect(value).toBeGreaterThanOrEqual(Number.MIN_SAFE_INTEGER);
					expect(value).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});
	});

	describe("Multiple Of Constraint", () => {
		test("generates multiples of specified value", () => {
			const schema = v.pipe(v.number(), v.multipleOf(5));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Math.abs(value % 5)).toBe(0); // using math.abs here to avoid dealing with -0
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		// test("handles decimal multiples", () => {
		// 	const schema = v.pipe(v.number(), v.multipleOf(0.1));

		// 	fc.assert(
		// 		fc.property(vfc().inputOf(schema), (value) => {
		// 			// Account for floating point precision
		// 			const remainder = Math.abs(value % 0.1);
		// 			expect(remainder < 1e-10 || Math.abs(remainder - 0.1) < 1e-10).toBe(
		// 				true
		// 			);
		// 			const parseResult = v.safeParse(schema, value);
		// 			expect(parseResult.success).toBe(true);
		// 		}),
		// 		{ numRuns: 50 }
		// 	);
		// });

		// test("combines multiple multipleOf constraints", () => {
		// 	const schema = v.pipe(v.number(), v.multipleOf(3), v.multipleOf(5)); // Should be multiples of 15

		// 	fc.assert(
		// 		fc.property(vfc().inputOf(schema), (value) => {
		// 			expect(value % 15).toBe(0);
		// 			const parseResult = v.safeParse(schema, value);
		// 			expect(parseResult.success).toBe(true);
		// 		}),
		// 		{ numRuns: 50 }
		// 	);
		// });

		test("combines multipleOf with min/max constraints", () => {
			const schema = v.pipe(
				v.number(),
				v.multipleOf(10),
				v.minValue(67),
				v.maxValue(99)
			);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value % 10).toBe(0);
					expect(value).toBeGreaterThanOrEqual(67);
					expect(value).toBeLessThanOrEqual(99);
					// Valid values should be 70, 80, 90
					expect([70, 80, 90]).toContain(value);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});
	});

	describe("Greater Than Constraint", () => {
		test("respects greater than constraint", () => {
			const schema = v.pipe(v.number(), v.gtValue(50));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeGreaterThan(50);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});
	});

	describe("Less Than Constraint", () => {
		test("respects less than constraint", () => {
			const schema = v.pipe(v.number(), v.ltValue(50));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeLessThan(50);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});
	});

	describe("Discrete Values", () => {
		test("generates exact value with value() constraint", () => {
			const schema = v.pipe(v.number(), v.value(42));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBe(42);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 20 }
			);
		});

		test("generates values from enum with values() constraint", () => {
			const allowedValues = [1, 2, 3, 5, 8, 13];
			const schema = v.pipe(v.number(), v.values(allowedValues));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(allowedValues).toContain(value);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("values() generates all possible values over time", () => {
			const allowedValues = [10, 20, 30];
			const schema = v.pipe(v.number(), v.values(allowedValues));
			const samples = fc.sample(vfc().inputOf(schema), 100);

			// Should generate all allowed values
			allowedValues.forEach((expectedValue) => {
				expect(samples).toContain(expectedValue);
			});

			// Should not generate any other values
			samples.forEach((value) => {
				expect(allowedValues).toContain(value);
			});
		});
	});

	describe("Finite Constraint", () => {
		test("generates only finite numbers", () => {
			const schema = v.pipe(v.number(), v.finite());

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Number.isFinite(value)).toBe(true);
					expect(value).not.toBe(Infinity);
					expect(value).not.toBe(-Infinity);
					expect(Number.isNaN(value)).toBe(false);
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});
	});

	describe("Complex Combinations", () => {
		// TODO: fix this or investigate Valibot/fast-check behavior thoroughly
		// test("handles complex constraint combinations", () => {
		// 	const schema = v.pipe(
		// 		v.number(),
		// 		v.integer(),
		// 		v.minValue(0),
		// 		v.maxValue(100),
		// 		v.multipleOf(2)
		// 	);

		// 	fc.assert(
		// 		fc.property(vfc().inputOf(schema), (value) => {
		// 			expect(Number.isInteger(value)).toBe(true);
		// 			expect(value).toBeGreaterThanOrEqual(0);
		// 			expect(value).toBeLessThanOrEqual(100);
		// 			expect(value % 2).toBe(0);
		// 			const parseResult = v.safeParse(schema, value);
		// 			expect(parseResult.success).toBe(true);
		// 		}),
		// 		{ numRuns: 100 }
		// 	);
		// });

		test("generates reasonable distribution for constrained ranges", () => {
			const schema = v.pipe(
				v.number(),
				v.integer(),
				v.minValue(1),
				v.maxValue(10)
			);
			const samples = fc.sample(vfc().inputOf(schema), 200);

			// Should generate a good distribution across the range
			const uniqueValues = new Set(samples);
			expect(uniqueValues.size).toBeGreaterThan(5); // Should have good variety

			// Should generate values across the range
			expect(Math.min(...samples)).toBeLessThanOrEqual(3);
			expect(Math.max(...samples)).toBeGreaterThanOrEqual(8);
		});
	});
});
