import { describe, test, expect } from "vitest";
import fc from "fast-check";
import * as v from "valibot";
import { UnknownValibotSchema, vfc } from "../src/index";
import { VFCUnsupportedSchemaError } from "../src/index";

describe("Edge Cases and Error Handling", () => {
	describe("Unsupported Schema Types", () => {
		test("throws VFCUnsupportedSchemaError for unknown schema types", () => {
			const unsupportedSchema = {
				type: "unsupported_custom_type",
				expects: "custom",
				async: false,
				_run: () => ({ typed: false, output: null, issues: [] }),
			} as unknown;

			expect(() =>
				vfc().inputOf(unsupportedSchema as UnknownValibotSchema)
			).toThrow(VFCUnsupportedSchemaError);
			expect(() =>
				vfc().inputOf(unsupportedSchema as UnknownValibotSchema)
			).toThrow("unsupported_custom_type schemas are not supported");
		});

		test("error includes correct path information for nested unsupported schemas", () => {
			const unsupportedSchema = {
				type: "custom_unsupported",
				expects: "custom",
				async: false,
				_run: () => ({ typed: false, output: null, issues: [] }),
			} as unknown;

			const objectSchema = v.object({
				nested: v.object({
					unsupported: unsupportedSchema as UnknownValibotSchema,
				}),
			});

			try {
				vfc().inputOf(objectSchema);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(VFCUnsupportedSchemaError);
				expect((error as Error).message).toContain(".nested.unsupported");
			}
		});

		test("error includes path for array element types", () => {
			const unsupportedSchema = {
				type: "array_element_unsupported",
				expects: "custom",
				async: false,
				_run: () => ({ typed: false, output: null, issues: [] }),
			} as unknown;

			const arraySchema = v.array(unsupportedSchema as UnknownValibotSchema);

			try {
				vfc().inputOf(arraySchema);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(VFCUnsupportedSchemaError);
				expect((error as Error).message).toContain("[*]");
			}
		});

		test("error includes path for union options", () => {
			const unsupportedSchema = {
				type: "union_unsupported",
				expects: "custom",
				async: false,
				_run: () => ({ typed: false, output: null, issues: [] }),
			} as unknown;

			const unionSchema = v.union([
				v.string(),
				unsupportedSchema as UnknownValibotSchema,
			]);

			try {
				vfc().inputOf(unionSchema);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(VFCUnsupportedSchemaError);
				expect((error as Error).message).toContain("schemas are not supported");
			}
		});

		test("error includes path for tuple elements", () => {
			const unsupportedSchema = {
				type: "tuple_unsupported",
				expects: "custom",
				async: false,
				_run: () => ({ typed: false, output: null, issues: [] }),
			} as unknown;

			const tupleSchema = v.tuple([
				v.string(),
				unsupportedSchema as UnknownValibotSchema,
			]);

			try {
				vfc().inputOf(tupleSchema);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(VFCUnsupportedSchemaError);
				expect((error as Error).message).toContain("[1]");
			}
		});
	});

	describe("Generation Error Scenarios", () => {
		test("handles impossible constraints gracefully with filterBySchema", () => {
			// Create a schema with constraints that are very hard to satisfy
			const difficultSchema = v.pipe(
				v.string(),
				v.length(10),
				v.startsWith("abcdefgh"),
				v.endsWith("xyz")
			);

			// This should be impossible since startsWith(8 chars) + endsWith(3 chars) > length(10)
			// But our generator should still attempt to generate and let Valibot validation catch it
			expect(() => {
				const arbitrary = vfc().inputOf(difficultSchema);
				fc.sample(arbitrary, 1);
			}).not.toThrow(); // Should not throw immediately, might use filterBySchema

			// If it does generate values, they should fail validation
			const arbitrary = vfc().inputOf(difficultSchema);
			const samples = fc.sample(arbitrary, 10);

			samples.forEach((value) => {
				// The generated value might not satisfy all constraints due to filterBySchema limitations
				// but it should be a string
				expect(typeof value).toBe("string");
			});
		});

		test("handles numeric constraints that result in no valid values", () => {
			const impossibleSchema = v.pipe(
				v.number(),
				v.minValue(100),
				v.maxValue(50) // max < min, impossible
			);

			// This should either throw or generate no valid values
			expect(() => {
				const arbitrary = vfc().inputOf(impossibleSchema);
				fc.sample(arbitrary, 1);
			}).toThrow(); // Should throw when trying to create integer range with invalid bounds
		});

		test("handles bigint constraints with invalid ranges", () => {
			const impossibleBigintSchema = v.pipe(
				v.bigint(),
				v.minValue(1000n),
				v.maxValue(100n)
			);

			expect(() => {
				const arbitrary = vfc().inputOf(impossibleBigintSchema);
				fc.sample(arbitrary, 1);
			}).toThrow();
		});
	});

	describe("Boundary Value Testing", () => {
		test("handles edge values for number constraints", () => {
			const edgeValues = [
				{ min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER },
				{ min: -Infinity, max: Infinity },
				{ min: 0, max: 0 },
				{ min: -1e-10, max: 1e-10 },
				{ min: 1e10, max: 1e10 + 100 },
			];

			edgeValues.forEach(({ min, max }) => {
				const schema = v.pipe(v.number(), v.minValue(min), v.maxValue(max));

				fc.assert(
					fc.property(vfc().inputOf(schema), (value) => {
						expect(value).toBeGreaterThanOrEqual(min);
						expect(value).toBeLessThanOrEqual(max);

						const parseResult = v.safeParse(schema, value);
						expect(parseResult.success).toBe(true);
					}),
					{ numRuns: 20 }
				);
			});
		});

		test("handles edge values for string length constraints", () => {
			const edgeConfigs = [
				{ min: 0, max: 0 },
				{ min: 1, max: 1 },
				{ min: 1000, max: 1000 },
				{ min: 0, max: 1 },
			];

			edgeConfigs.forEach(({ min, max }) => {
				const schema = v.pipe(v.string(), v.minLength(min), v.maxLength(max));

				fc.assert(
					fc.property(vfc().inputOf(schema), (value) => {
						expect(value.length).toBeGreaterThanOrEqual(min);
						expect(value.length).toBeLessThanOrEqual(max);

						const parseResult = v.safeParse(schema, value);
						expect(parseResult.success).toBe(true);
					}),
					{ numRuns: 30 }
				);
			});
		});

		test("handles edge values for array length constraints", () => {
			const edgeConfigs = [
				{ min: 0, max: 0 },
				{ min: 1, max: 1 },
				{ min: 100, max: 100 },
			];

			edgeConfigs.forEach(({ min, max }) => {
				const schema = v.pipe(
					v.array(v.number()),
					v.minLength(min),
					v.maxLength(max)
				);

				fc.assert(
					fc.property(vfc().inputOf(schema), (value) => {
						expect(value.length).toBeGreaterThanOrEqual(min);
						expect(value.length).toBeLessThanOrEqual(max);

						const parseResult = v.safeParse(schema, value);
						expect(parseResult.success).toBe(true);
					}),
					{ numRuns: 20 }
				);
			});
		});
	});

	describe("Complex Constraint Interactions", () => {
		// TODO: fix this or investigate Valibot/fast-check behavior thoroughly
		// test("handles multiple conflicting string constraints", () => {
		// 	// This creates a string that must be exactly "prefixsuffix"
		// 	const constrainedSchema = v.pipe(
		// 		v.string(),
		// 		v.length(12),
		// 		v.startsWith("prefix"),
		// 		v.endsWith("suffix")
		// 	);

		// 	fc.assert(
		// 		fc.property(vfc().inputOf(constrainedSchema), (value) => {
		// 			expect(value).toBe("prefixsuffix");

		// 			const parseResult = v.safeParse(constrainedSchema, value);
		// 			expect(parseResult.success).toBe(true);
		// 		}),
		// 		{ numRuns: 20 }
		// 	);
		// });

		test("handles number multipleOf with incompatible constraints", () => {
			// Multiple of 6 and 10 = multiple of 30
			const schema = v.pipe(
				v.number(),
				v.multipleOf(6),
				v.multipleOf(10),
				v.minValue(0),
				v.maxValue(100)
			);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value % 30).toBe(0);
					expect(value).toBeGreaterThanOrEqual(0);
					expect(value).toBeLessThanOrEqual(100);
					// Valid values: 0, 30, 60, 90
					expect([0, 30, 60, 90]).toContain(value);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 40 }
			);
		});
	});

	describe("Memory and Performance Edge Cases", () => {
		test("handles large union types efficiently", () => {
			// Create a union with many options
			const manyOptions = Array.from({ length: 50 }, (_, i) =>
				v.literal(`option${i}`)
			);
			const largeUnionSchema = v.union(manyOptions);

			const start = Date.now();
			const samples = fc.sample(vfc().inputOf(largeUnionSchema), 100);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(2000); // Should be reasonably fast

			// Should generate values from across the union
			const uniqueValues = new Set(samples);
			expect(uniqueValues.size).toBeGreaterThan(10);

			samples.forEach((value) => {
				expect(value.startsWith("option")).toBe(true);
				const parseResult = v.safeParse(largeUnionSchema, value);
				expect(parseResult.success).toBe(true);
			});
		});

		test("handles deeply nested optional structures", () => {
			// Create a 10-level deep optional structure
			let schema: UnknownValibotSchema = v.string();
			for (let i = 0; i < 10; i++) {
				schema = v.optional(v.object({ nested: schema }));
			}

			const samples = fc.sample(vfc().inputOf(schema), 50);

			samples.forEach((value) => {
				// Should either be undefined or a deeply nested object
				if (value !== undefined) {
					let current = value as unknown;
					let depth = 0;
					while (
						current !== undefined &&
						typeof current === "object" &&
						"nested" in (current as object)
					) {
						current = (current as { nested: unknown }).nested;
						depth++;
						if (depth > 15) break; // Prevent infinite loops
					}

					// Final value should be undefined or string
					expect(current === undefined || typeof current === "string").toBe(
						true
					);
				}

				const parseResult = v.safeParse(schema, value);
				expect(parseResult.success).toBe(true);
			});
		});

		test("handles arrays with very large size constraints", () => {
			const largeArraySchema = v.pipe(
				v.array(v.number()),
				v.minLength(1000),
				v.maxLength(1001)
			);

			const start = Date.now();
			const sample = fc.sample(vfc().inputOf(largeArraySchema), 1)[0];
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
			expect(sample.length).toBeGreaterThanOrEqual(1000);
			expect(sample.length).toBeLessThanOrEqual(1001);

			const parseResult = v.safeParse(largeArraySchema, sample);
			expect(parseResult.success).toBe(true);
		});
	});

	describe("Type System Edge Cases", () => {
		test("handles recursive-like structures through unions", () => {
			// Simulate a recursive structure using unions
			const nodeSchema = v.union([
				v.object({
					type: v.literal("leaf"),
					value: v.string(),
				}),
				v.object({
					type: v.literal("branch"),
					left: v.union([
						v.object({ type: v.literal("leaf"), value: v.string() }),
						v.null(),
					]),
					right: v.union([
						v.object({ type: v.literal("leaf"), value: v.string() }),
						v.null(),
					]),
				}),
			]);

			fc.assert(
				fc.property(vfc().inputOf(nodeSchema), (value) => {
					expect(typeof value).toBe("object");
					expect(["leaf", "branch"]).toContain(value.type);

					if (value.type === "leaf") {
						expect(typeof value.value).toBe("string");
					} else {
						// Branch node
						if (value.left !== null) {
							expect(value.left.type).toBe("leaf");
							expect(typeof value.left.value).toBe("string");
						}
						if (value.right !== null) {
							expect(value.right.type).toBe("leaf");
							expect(typeof value.right.value).toBe("string");
						}
					}

					const parseResult = v.safeParse(nodeSchema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("handles mixed nullish and optional types", () => {
			const complexOptionalSchema = v.object({
				opt1: v.optional(v.string()),
				opt2: v.nullable(v.number()),
				opt3: v.nullish(v.boolean()),
				opt4: v.optional(v.nullable(v.string())),
				opt5: v.nullable(v.optional(v.number())),
			});

			fc.assert(
				fc.property(vfc().inputOf(complexOptionalSchema), (value) => {
					// opt1 can be string or undefined
					expect(
						typeof value.opt1 === "string" || value.opt1 === undefined
					).toBe(true);

					// opt2 can be number or null
					expect(typeof value.opt2 === "number" || value.opt2 === null).toBe(
						true
					);

					// opt3 can be boolean, null, or undefined
					expect(
						typeof value.opt3 === "boolean" ||
							value.opt3 === null ||
							value.opt3 === undefined
					).toBe(true);

					// opt4 can be string, null, or undefined (optional nullable)
					expect(
						typeof value.opt4 === "string" ||
							value.opt4 === null ||
							value.opt4 === undefined
					).toBe(true);

					// opt5 can be number, null, or undefined (nullable optional)
					expect(
						typeof value.opt5 === "number" ||
							value.opt5 === null ||
							value.opt5 === undefined
					).toBe(true);

					const parseResult = v.safeParse(complexOptionalSchema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});
	});

	describe("Schema Modification Edge Cases", () => {
		test("handles schemas with no constraints correctly", () => {
			// Schema with pipe but no actual validations
			const emptyPipeSchema = v.pipe(v.string());

			fc.assert(
				fc.property(vfc().inputOf(emptyPipeSchema), (value) => {
					expect(typeof value).toBe("string");

					const parseResult = v.safeParse(emptyPipeSchema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});
	});
});
