import { describe, test, expect } from "vitest";
import fc from "fast-check";
import * as v from "valibot";
import { UnknownValibotSchema, vfc } from "../src/index";

describe("Specific Type Generation", () => {
	describe("BigInt Schemas", () => {
		test("generates valid bigints", () => {
			const schema = v.bigint();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(typeof value).toBe("bigint");

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("respects minimum value constraint", () => {
			const schema = v.pipe(v.bigint(), v.minValue(100n));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeGreaterThanOrEqual(100n);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("respects maximum value constraint", () => {
			const schema = v.pipe(v.bigint(), v.maxValue(1000n));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeLessThanOrEqual(1000n);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("respects range constraints", () => {
			const schema = v.pipe(v.bigint(), v.minValue(10n), v.maxValue(100n));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeGreaterThanOrEqual(10n);
					expect(value).toBeLessThanOrEqual(100n);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("generates exact bigint values", () => {
			const schema = v.pipe(v.bigint(), v.value(123n));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBe(123n);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 20 }
			);
		});

		test("generates values from bigint enum", () => {
			const allowedValues = [1n, 10n, 100n, 1000n];
			const schema = v.pipe(v.bigint(), v.values(allowedValues));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(allowedValues).toContain(value);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		// TODO: fix this or remove due to unpredictable probability 
		// test("generates diverse bigint values", () => {
		// 	const schema = v.bigint();
		// 	const samples = fc.sample(vfc().inputOf(schema), 100);

		// 	// Should generate positive and negative values
		// 	const hasPositive = samples.some((n) => n > 0n);
		// 	const hasNegative = samples.some((n) => n < 0n);
		// 	const hasZero = samples.some((n) => n === 0n);

		// 	expect(hasPositive).toBe(true);
		// 	expect(hasNegative).toBe(true);
		// 	expect(hasZero).toBe(true);
		// });
	});

	describe("Date Schemas", () => {
		test("generates valid dates", () => {
			const schema = v.date();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeInstanceOf(Date);
					// Note: fc.date() can generate NaN dates, which is a limitation of fast-check
					// We only validate that Valibot accepts the generated dates
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		test("generates diverse date values", () => {
			const schema = v.date();
			const samples = fc.sample(vfc().inputOf(schema), 50);

			const timestamps = samples.map((d) => d.getTime());
			const uniqueTimestamps = new Set(timestamps);
			expect(uniqueTimestamps.size).toBeGreaterThan(10);

			const now = Date.now();
			const hasPast = samples.some(
				(d) => d.getTime() < now - 365 * 24 * 60 * 60 * 1000
			);
			const hasFuture = samples.some(
				(d) => d.getTime() > now + 365 * 24 * 60 * 60 * 1000
			);

			expect(hasPast || hasFuture).toBe(true);
		});
	});

	describe("Boolean Schema", () => {
		test("generates valid booleans", () => {
			const schema = v.boolean();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(typeof value).toBe("boolean");

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates both true and false", () => {
			const schema = v.boolean();
			const samples = fc.sample(vfc().inputOf(schema), 50);

			const hasTrue = samples.includes(true);
			const hasFalse = samples.includes(false);

			expect(hasTrue).toBe(true);
			expect(hasFalse).toBe(true);

			samples.forEach((value) => {
				expect([true, false]).toContain(value);
			});
		});
	});

	describe("Special Value Schemas", () => {
		test("generates undefined values", () => {
			const schema = v.undefined();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeUndefined();

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 10 }
			);
		});

		test("generates null values", () => {
			const schema = v.null();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeNull();

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 10 }
			);
		});

		test("generates NaN values", () => {
			const schema = v.nan();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Number.isNaN(value)).toBe(true);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 10 }
			);
		});

		test("generates void values (undefined)", () => {
			const schema = v.void();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value: unknown) => {
					expect(value).toBeUndefined();

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 10 }
			);
		});
	});

	describe("Any and Unknown Schemas", () => {
		test("generates values for any schema", () => {
			const schema = v.any();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					// Any value should be valid for v.any()
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates diverse values for any schema", () => {
			const schema = v.any();
			const samples = fc.sample(vfc().inputOf(schema), 100);

			// Should generate different types
			const types = new Set(samples.map((s) => typeof s));
			expect(types.size).toBeGreaterThan(2);
		});

		test("generates values for unknown schema", () => {
			const schema = v.unknown();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					// Any value should be valid for v.unknown()
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});
	});

	describe("Function Schema", () => {
		test("generates valid functions", () => {
			const schema = v.function();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(typeof value).toBe("function");

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generated functions are callable", () => {
			const schema = v.function();
			const samples = fc.sample(vfc().inputOf(schema), 10);

			samples.forEach((fn) => {
				expect(typeof fn).toBe("function");
				expect(() => fn()).not.toThrow();
			});
		});
	});

	describe("Symbol Schema", () => {
		test("generates valid symbols", () => {
			const schema = v.symbol();

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(typeof value).toBe("symbol");

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates unique symbols", () => {
			const schema = v.symbol();
			const samples = fc.sample(vfc().inputOf(schema), 20);

			const uniqueSymbols = new Set(samples);
			expect(uniqueSymbols.size).toBe(samples.length);

			samples.forEach((sym) => {
				expect(typeof sym).toBe("symbol");
			});
		});
	});

	describe("Map Schema", () => {
		test("generates valid maps", () => {
			const schema = v.map(v.string(), v.number());

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeInstanceOf(Map);

					value.forEach((val, key) => {
						expect(typeof key).toBe("string");
						expect(typeof val).toBe("number");
					});

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates maps with complex types", () => {
			const schema = v.map(v.object({ id: v.number() }), v.array(v.boolean()));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeInstanceOf(Map);

					value.forEach((val, key) => {
						expect(typeof key).toBe("object");
						expect(typeof key.id).toBe("number");
						expect(Array.isArray(val)).toBe(true);
						val.forEach((item) => {
							expect(typeof item).toBe("boolean");
						});
					});

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});
	});

	describe("Set Schema", () => {
		test("generates valid sets", () => {
			const schema = v.set(v.number());

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeInstanceOf(Set);

					value.forEach((val) => {
						expect(typeof val).toBe("number");
					});

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates sets with unique values", () => {
			const schema = v.set(v.string());
			const samples = fc.sample(vfc().inputOf(schema), 20);

			samples.forEach((set) => {
				expect(set).toBeInstanceOf(Set);

				// Convert to array to check uniqueness
				const arr = Array.from(set);
				const uniqueArr = [...new Set(arr)];
				expect(arr.length).toBe(uniqueArr.length);
			});
		});

		test("generates sets with constraints", () => {
			const schema = v.pipe(v.set(v.string()), v.minSize(2), v.maxSize(5));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value).toBeInstanceOf(Set);
					expect(value.size).toBeGreaterThanOrEqual(2);
					expect(value.size).toBeLessThanOrEqual(5);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});
	});

	describe("Performance and Edge Cases", () => {
		test("handles very large objects efficiently", () => {
			const largeObjectSchema = v.object(
				Object.fromEntries(
					Array.from({ length: 50 }, (_, i) => [`field${i}`, v.string()])
				)
			);

			const start = Date.now();
			const samples = fc.sample(vfc().inputOf(largeObjectSchema), 10);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(5000);

			samples.forEach((value) => {
				expect(typeof value).toBe("object");
				expect(Object.keys(value)).toHaveLength(50);
			});
		});

		test("handles deeply nested structures", () => {
			// Create a 5-level deep nested structure
			let schema: UnknownValibotSchema = v.string();
			for (let i = 0; i < 5; i++) {
				schema = v.object({ nested: schema });
			}

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					let current = value as unknown;
					for (let i = 0; i < 5; i++) {
						expect(typeof current).toBe("object");
						expect("nested" in (current as object)).toBe(true);
						current = (current as { nested: unknown }).nested;
					}
					expect(typeof current).toBe("string");

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 10 }
			);
		});

		test("handles empty collections correctly", () => {
			const schemas = [
				v.array(v.string()),
				v.set(v.number()),
				v.map(v.string(), v.number()),
			];

			schemas.forEach((schema) => {
				const samples = fc.sample(vfc().inputOf(schema), 50);

				// Should sometimes generate empty collections
				const hasEmpty = samples.some(
					(s: { size?: number; length?: number }) =>
						(s.size !== undefined && s.size === 0) ||
						(s.length !== undefined && s.length === 0)
				);
				expect(hasEmpty).toBe(true);

				// All samples should be valid
				samples.forEach((value) => {
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				});
			});
		});
	});
});
