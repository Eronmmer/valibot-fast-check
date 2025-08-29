import { describe, test, expect } from "vitest";
import fc from "fast-check";
import * as v from "valibot";
import { vfc } from "../src/index";

describe("Complex Type Generation", () => {
	describe("Object Schemas", () => {
		test("generates valid simple objects", () => {
			const schema = v.object({
				name: v.string(),
				age: v.number(),
				active: v.boolean(),
			});

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(typeof value).toBe("object");
					expect(value).not.toBeNull();
					expect(typeof value.name).toBe("string");
					expect(typeof value.age).toBe("number");
					expect(typeof value.active).toBe("boolean");

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates valid nested objects", () => {
			const schema = v.object({
				user: v.object({
					id: v.number(),
					profile: v.object({
						name: v.string(),
						email: v.pipe(v.string(), v.email()),
					}),
				}),
				metadata: v.object({
					created: v.date(),
					tags: v.array(v.string()),
				}),
			});

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(typeof value.user.id).toBe("number");
					expect(typeof value.user.profile.name).toBe("string");
					expect(typeof value.user.profile.email).toBe("string");
					expect(value.metadata.created).toBeInstanceOf(Date);
					expect(Array.isArray(value.metadata.tags)).toBe(true);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});

		test("generates empty objects correctly", () => {
			const schema = v.object({});

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(typeof value).toBe("object");
					expect(value).not.toBeNull();
					expect(Object.keys(value)).toHaveLength(0);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 20 }
			);
		});

		test("handles objects with constrained properties", () => {
			const schema = v.object({
				name: v.pipe(v.string(), v.minLength(3), v.maxLength(20)),
				age: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(120)),
				email: v.pipe(v.string(), v.email()),
			});

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(value.name.length).toBeGreaterThanOrEqual(3);
					expect(value.name.length).toBeLessThanOrEqual(20);
					expect(Number.isInteger(value.age)).toBe(true);
					expect(value.age).toBeGreaterThanOrEqual(0);
					expect(value.age).toBeLessThanOrEqual(120);
					expect(value.email).toContain("@");

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});
	});

	describe("Array Schemas", () => {
		test("generates valid arrays of primitives", () => {
			const schema = v.array(v.string());

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Array.isArray(value)).toBe(true);
					value.forEach((item) => {
						expect(typeof item).toBe("string");
					});

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates arrays with length constraints", () => {
			const schema = v.pipe(
				v.array(v.number()),
				v.minLength(2),
				v.maxLength(5)
			);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Array.isArray(value)).toBe(true);
					expect(value.length).toBeGreaterThanOrEqual(2);
					expect(value.length).toBeLessThanOrEqual(5);
					value.forEach((item) => {
						expect(typeof item).toBe("number");
					});

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates arrays of objects", () => {
			const schema = v.array(
				v.object({
					id: v.number(),
					name: v.string(),
				})
			);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Array.isArray(value)).toBe(true);
					value.forEach((item) => {
						expect(typeof item).toBe("object");
						expect(typeof item.id).toBe("number");
						expect(typeof item.name).toBe("string");
					});

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});

		test("generates nested arrays", () => {
			const schema = v.array(v.array(v.boolean()));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Array.isArray(value)).toBe(true);
					value.forEach((innerArray) => {
						expect(Array.isArray(innerArray)).toBe(true);
						innerArray.forEach((item) => {
							expect(typeof item).toBe("boolean");
						});
					});

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});

		test("generates arrays with exact length", () => {
			const schema = v.pipe(v.array(v.string()), v.length(3));

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Array.isArray(value)).toBe(true);
					expect(value).toHaveLength(3);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});
	});

	describe("Tuple Schemas", () => {
		test("generates valid empty tuples", () => {
			const schema = v.tuple([]);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Array.isArray(value)).toBe(true);
					expect(value).toHaveLength(0);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 20 }
			);
		});

		test("generates valid simple tuples", () => {
			const schema = v.tuple([v.string(), v.number(), v.boolean()]);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Array.isArray(value)).toBe(true);
					expect(value).toHaveLength(3);
					expect(typeof value[0]).toBe("string");
					expect(typeof value[1]).toBe("number");
					expect(typeof value[2]).toBe("boolean");

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates nested tuples", () => {
			const schema = v.tuple([v.string(), v.tuple([v.number(), v.bigint()])]);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Array.isArray(value)).toBe(true);
					expect(value).toHaveLength(2);
					expect(typeof value[0]).toBe("string");
					expect(Array.isArray(value[1])).toBe(true);
					expect(value[1]).toHaveLength(2);
					expect(typeof value[1][0]).toBe("number");
					expect(typeof value[1][1]).toBe("bigint");

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});

		test("generates tuples with complex types", () => {
			const schema = v.tuple([
				v.object({ name: v.string() }),
				v.array(v.number()),
			]);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Array.isArray(value)).toBe(true);
					expect(value).toHaveLength(2);
					expect(typeof value[0]).toBe("object");
					expect(typeof value[0].name).toBe("string");
					expect(Array.isArray(value[1])).toBe(true);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 30 }
			);
		});
	});

	describe("Union Schemas", () => {
		test("generates values from simple unions", () => {
			const schema = v.union([v.string(), v.number()]);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(typeof value === "string" || typeof value === "number").toBe(
						true
					);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates all union variants over time", () => {
			const schema = v.union([v.string(), v.number(), v.boolean()]);
			const samples = fc.sample(vfc().inputOf(schema), 100);

			const hasString = samples.some((s) => typeof s === "string");
			const hasNumber = samples.some((s) => typeof s === "number");
			const hasBoolean = samples.some((s) => typeof s === "boolean");

			expect(hasString).toBe(true);
			expect(hasNumber).toBe(true);
			expect(hasBoolean).toBe(true);
		});

		test("generates values from complex unions", () => {
			const schema = v.union([
				v.object({ type: v.literal("user"), name: v.string() }),
				v.object({
					type: v.literal("admin"),
					permissions: v.array(v.string()),
				}),
				v.null(),
			]);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					if (value === null) {
						expect(value).toBeNull();
					} else {
						expect(typeof value).toBe("object");
						expect(value.type === "user" || value.type === "admin").toBe(true);

						if (value.type === "user") {
							expect(typeof value.name).toBe("string");
						} else {
							expect(Array.isArray(value.permissions)).toBe(true);
						}
					}

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates nested union values", () => {
			const schema = v.union([
				v.object({
					data: v.union([v.string(), v.array(v.number())]),
				}),
				v.null(),
			]);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					if (value === null) {
						expect(value).toBeNull();
					} else {
						expect(typeof value).toBe("object");
						expect(
							typeof value.data === "string" || Array.isArray(value.data)
						).toBe(true);
					}

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});
	});

	describe("Enum Schemas", () => {
		test("generates values from string enums", () => {
			const schema = v.picklist(["red", "green", "blue"]);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(["red", "green", "blue"]).toContain(value);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});

		test("generates all enum values over time", () => {
			const schema = v.picklist(["alpha", "beta", "gamma"]);
			const samples = fc.sample(vfc().inputOf(schema), 100);

			expect(samples).toContain("alpha");
			expect(samples).toContain("beta");
			expect(samples).toContain("gamma");

			// Should not generate any other values
			samples.forEach((value) => {
				expect(["alpha", "beta", "gamma"]).toContain(value);
			});
		});

		test("generates values from mixed-type enums", () => {
			const schema = v.picklist(["string", 42]);

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(["string", 42]).toContain(value);

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 50 }
			);
		});
	});

	describe("Literal Schemas", () => {
		test("generates exact literal values", () => {
			const literals = [
				{ schema: v.literal("hello"), expected: "hello" },
				{ schema: v.literal(42), expected: 42 },
				{ schema: v.literal(true), expected: true },
				{ schema: v.literal(123n), expected: 123n },
			];

			literals.forEach(({ schema, expected }) => {
				fc.assert(
					fc.property(vfc().inputOf(schema), (value) => {
						expect(value).toBe(expected);

						const parseResult = v.safeParse(schema, value);
						expect(parseResult.success).toBe(true);
					}),
					{ numRuns: 10 }
				);
			});
		});
	});

	describe("Special Type Wrappers", () => {
		test("generates optional values", () => {
			const schema = v.optional(v.string());
			const samples = fc.sample(vfc().inputOf(schema), 100);

			// Should generate both strings and undefined
			const hasString = samples.some((s) => typeof s === "string");
			const hasUndefined = samples.some((s) => s === undefined);

			expect(hasString).toBe(true);
			expect(hasUndefined).toBe(true);

			// All values should be valid
			samples.forEach((value) => {
				const parseResult = v.safeParse(schema, value);
				expect(parseResult.success).toBe(true);
			});
		});

		test("generates nullable values", () => {
			const schema = v.nullable(v.number());
			const samples = fc.sample(vfc().inputOf(schema), 100);

			const hasNumber = samples.some((s) => typeof s === "number");
			const hasNull = samples.some((s) => s === null);

			expect(hasNumber).toBe(true);
			expect(hasNull).toBe(true);

			samples.forEach((value) => {
				const parseResult = v.safeParse(schema, value);
				expect(parseResult.success).toBe(true);
			});
		});

		test("generates nullish values", () => {
			const schema = v.nullish(v.boolean());
			const samples = fc.sample(vfc().inputOf(schema), 150);

			// Should generate booleans, null, and undefined
			const hasBoolean = samples.some((s) => typeof s === "boolean");
			const hasNull = samples.some((s) => s === null);
			const hasUndefined = samples.some((s) => s === undefined);

			expect(hasBoolean).toBe(true);
			expect(hasNull).toBe(true);
			expect(hasUndefined).toBe(true);

			samples.forEach((value) => {
				const parseResult = v.safeParse(schema, value);
				expect(parseResult.success).toBe(true);
			});
		});
	});

	describe("Complex Nested Combinations", () => {
		test("generates deeply nested structures", () => {
			const schema = v.object({
				users: v.array(
					v.object({
						id: v.pipe(v.number(), v.integer(), v.minValue(1)),
						profile: v.optional(
							v.object({
								name: v.pipe(v.string(), v.minLength(1)),
								contacts: v.array(
									v.union([
										v.object({
											type: v.literal("email"),
											value: v.pipe(v.string(), v.email()),
										}),
										v.object({ type: v.literal("phone"), value: v.string() }),
									])
								),
							})
						),
						roles: v.picklist(["user", "admin", "moderator"]),
					})
				),
				metadata: v.object({
					created: v.date(),
					settings: v.nullable(
						v.object({
							theme: v.picklist(["light", "dark"]),
							notifications: v.boolean(),
						})
					),
				}),
			});

			fc.assert(
				fc.property(vfc().inputOf(schema), (value) => {
					expect(Array.isArray(value.users)).toBe(true);
					expect(value.metadata.created).toBeInstanceOf(Date);

					value.users.forEach((user) => {
						expect(Number.isInteger(user.id)).toBe(true);
						expect(user.id).toBeGreaterThanOrEqual(1);
						expect(["user", "admin", "moderator"]).toContain(user.roles);

						if (user.profile !== undefined) {
							expect(typeof user.profile.name).toBe("string");
							expect(user.profile.name.length).toBeGreaterThanOrEqual(1);
							expect(Array.isArray(user.profile.contacts)).toBe(true);

							user.profile.contacts.forEach((contact) => {
								expect(["email", "phone"]).toContain(contact.type);
								if (contact.type === "email") {
									expect(contact.value).toContain("@");
								}
							});
						}
					});

					const parseResult = v.safeParse(schema, value);
					expect(parseResult.success).toBe(true);
				}),
				{ numRuns: 20 }
			);
		});
	});
});
