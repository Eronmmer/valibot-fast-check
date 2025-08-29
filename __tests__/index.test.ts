import { describe, test, expect } from "vitest";
import fc from "fast-check";
import * as v from "valibot";
import { UnknownValibotSchema, vfc } from "../src/index";
import { VFCUnsupportedSchemaError } from "../src/index";

describe("VFC Core Functionality", () => {
	describe("Basic API", () => {
		test("vfc() returns a VFC instance", () => {
			const generator = vfc();
			expect(generator).toBeDefined();
			expect(typeof generator.inputOf).toBe("function");
			expect(typeof generator.outputOf).toBe("function");
			expect(typeof generator.override).toBe("function");
		});

		test("inputOf() returns a fast-check Arbitrary", () => {
			const schema = v.string();
			const arbitrary = vfc().inputOf(schema);

			expect(arbitrary).toBeDefined();
			expect(typeof arbitrary.generate).toBe("function");
			expect(typeof arbitrary.shrink).toBe("function");
		});

		test("outputOf() returns a fast-check Arbitrary", () => {
			const schema = v.string();
			const arbitrary = vfc().outputOf(schema);

			expect(arbitrary).toBeDefined();
			expect(typeof arbitrary.generate).toBe("function");
			expect(typeof arbitrary.shrink).toBe("function");
		});
	});

	describe("Primitive Types", () => {
		const primitiveTests = [
			{
				name: "string",
				schema: () => v.string(),
				validator: (val: unknown) => typeof val === "string",
			},
			{
				name: "number",
				schema: () => v.number(),
				validator: (val: unknown) => typeof val === "number",
			},
			{
				name: "bigint",
				schema: () => v.bigint(),
				validator: (val: unknown) => typeof val === "bigint",
			},
			{
				name: "boolean",
				schema: () => v.boolean(),
				validator: (val: unknown) => typeof val === "boolean",
			},
			{
				name: "date",
				schema: () => v.date(),
				validator: (val: unknown) => val instanceof Date,
			},
			{
				name: "undefined",
				schema: () => v.undefined(),
				validator: (val: unknown) => val === undefined,
			},
			{
				name: "null",
				schema: () => v.null(),
				validator: (val: unknown) => val === null,
			},
			{
				name: "nan",
				schema: () => v.nan(),
				validator: (val: unknown) => Number.isNaN(val),
			},
			{
				name: "void",
				schema: () => v.void(),
				validator: (val: unknown) => val === undefined,
			},
		];

		primitiveTests.forEach(({ name, schema, validator }) => {
			test(`generates valid ${name} values`, () => {
				fc.assert(
					fc.property(vfc().inputOf(schema()), (value: unknown) => {
						expect(validator(value)).toBe(true);
						const parseResult = v.safeParse(schema(), value);
						expect(parseResult.success).toBe(true);
					}),
					{ numRuns: 50 }
				);
			});
		});

		test("generates valid any values", () => {
			const schema = v.any();
			const arbitrary = vfc().inputOf(schema);

			fc.assert(
				fc.property(arbitrary, (value) => {
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});

		test("generates valid unknown values", () => {
			const schema = v.unknown();
			const arbitrary = vfc().inputOf(schema);

			fc.assert(
				fc.property(arbitrary, (value) => {
					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});
	});

	describe("Error Handling", () => {
		test("throws VFCUnsupportedSchemaError for unsupported schema types", () => {
			const unsupportedSchema = {
				type: "unsupported_type",
				expects: "custom",
				async: false,
				_run: () => ({ typed: false, output: null, issues: [] }),
			} as unknown;

			expect(() => vfc().inputOf(unsupportedSchema as UnknownValibotSchema)).toThrow(
				VFCUnsupportedSchemaError
			);
			expect(() => vfc().inputOf(unsupportedSchema as UnknownValibotSchema)).toThrow(
				"unsupported_type schemas are not supported"
			);
		});

		test("error messages include schema path information", () => {
			const unsupportedSchema = {
				type: "custom_unsupported",
				expects: "custom",
				async: false,
				_run: () => ({ typed: false, output: null, issues: [] }),
			} as unknown;

			try {
				vfc().inputOf(unsupportedSchema as UnknownValibotSchema);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(VFCUnsupportedSchemaError);
				expect((error as Error).message).toContain("at path '.'");
			}
		});
	});

	describe("Override Functionality", () => {
		test("override with custom arbitrary", () => {
			const schema = v.string();
			const customArb = fc.constant("FIXED_VALUE");
			const generator = vfc().override(schema, customArb);

			fc.assert(
				fc.property(generator.inputOf(schema), (value) => {
					expect(value).toBe("FIXED_VALUE");
				}),
				{ numRuns: 10 }
			);
		});

		test("override with function", () => {
			const schema = v.pipe(v.number(), v.integer());
			const generator = vfc().override(
				schema,
				fc.integer({ min: 100, max: 200 })
			);

			fc.assert(
				fc.property(generator.inputOf(schema), (value) => {
					expect(Number.isInteger(value)).toBe(true);
					expect(value).toBeGreaterThanOrEqual(100);
					expect(value).toBeLessThanOrEqual(200);
				}),
				{ numRuns: 20 }
			);
		});

		test("override affects nested schemas", () => {
			const stringSchema = v.string();
			const objectSchema = v.object({
				name: stringSchema,
				age: v.number(),
			});

			const generator = vfc().override(stringSchema, fc.constant("OVERRIDE"));

			fc.assert(
				fc.property(generator.inputOf(objectSchema), (value) => {
					expect(value.name).toBe("OVERRIDE");
					expect(typeof value.age).toBe("number");
				}),
				{ numRuns: 10 }
			);
		});

		// Note: clone() is private, so we'll test override behavior instead
		test("multiple overrides work independently", () => {
			const schema = v.string();
			const generator1 = vfc().override(schema, fc.constant("FIRST"));
			const generator2 = vfc().override(schema, fc.constant("SECOND"));

			const value1 = fc.sample(generator1.inputOf(schema), 1)[0];
			const value2 = fc.sample(generator2.inputOf(schema), 1)[0];

			expect(value1).toBe("FIRST");
			expect(value2).toBe("SECOND");
		});
	});

	describe("Input vs Output", () => {
		test("input and output are identical for basic schemas", () => {
			const schemas = [
				v.string(),
				v.number(),
				v.boolean(),
				v.object({ name: v.string() }),
			];

			schemas.forEach((schema) => {
				const inputSamples = fc.sample(vfc().inputOf(schema), 10);
				const outputSamples = fc.sample(vfc().outputOf(schema), 10);

				// For basic schemas without transforms, all values should parse successfully
				inputSamples.forEach((value) => {
					const result = v.safeParse(schema, value);
					expect(result.success).toBe(true);
				});

				outputSamples.forEach((value) => {
					const result = v.safeParse(schema, value);
					expect(result.success).toBe(true);
				});
			});
		});
	});
});
