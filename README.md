# valibot-fast-check

Generate [fast-check](https://github.com/dubzzz/fast-check) arbitraries from [Valibot](https://github.com/fabian-hiller/valibot) schemas for property-based testing.

<!-- [![npm version](https://badge.fury.io/js/valibot-fast-check.svg)](https://www.npmjs.com/package/valibot-fast-check)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) -->

## Installation

```bash
npm install valibot-fast-check
# or
pnpm add valibot-fast-check
# or
yarn add valibot-fast-check
```

## Quick Start

```typescript
import { vfc } from "valibot-fast-check";
import * as v from "valibot";
import fc from "fast-check";

// Define a Valibot schema
const UserSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
	age: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(120)),
	email: v.pipe(v.string(), v.email()),
});

// Generate fast-check arbitraries
const userArbitrary = vfc().inputOf(UserSchema);

// Use in property-based tests
fc.assert(
	fc.property(userArbitrary, (user) => {
		// Your test logic here
		const result = v.safeParse(UserSchema, user);
		expect(result.success).toBe(true);
	})
);
```

## API Reference

### Core Methods

#### `vfc().inputOf(schema)`

Generates arbitraries that produce valid input values for the given schema.

```typescript
const schema = v.pipe(v.string(), v.email());
const arbitrary = vfc().inputOf(schema);
// Generates valid email strings
```

#### `vfc().outputOf(schema)`

Generates arbitraries that produce parsed/transformed output values for schemas with transformations.

```typescript
const schema = v.pipe(v.string(), v.trim(), v.minLength(1));
const arbitrary = vfc().outputOf(schema);
// Generates trimmed, non-empty strings
```

#### `vfc().override(schema, arbitrary)`

Override generation for specific schemas with custom arbitraries.

```typescript
const customSchema = v.string();
const customArbitrary = fc.constant("fixed-value");

const generator = vfc().override(customSchema, customArbitrary);
// Will use customArbitrary when encountering customSchema
```

## Supported Schema Types

### Primitive Types

- ✅ `string` - with optimizations for length, format constraints
- ✅ `number` - with range, integer, finite, safe integer optimizations
- ✅ `bigint` - with range constraints
- ✅ `boolean` - simple boolean generation
- ✅ `date` - with min/max date constraints
- ✅ `undefined`, `null`, `void`, `any`, `unknown`
- ✅ `nan` - generates `Number.NaN`

### Composite Types

- ✅ `object` - recursive object generation
- ✅ `array` - with length constraints
- ✅ `tuple` - fixed-length arrays with typed elements
- ✅ `map` - generates `Map` instances
- ✅ `set` - generates `Set` instances with size constraints

### Special Types

- ✅ `optional` - uses `fc.option()` with undefined
- ✅ `nullable` - uses `fc.option()` with null
- ✅ `nullish` - generates value, null, or undefined
- ✅ `enum` - picks from enum values
- ✅ `literal` - generates exact literal values
- ✅ `union` - generates from union alternatives
- ✅ `function` - generates callable functions
- ✅ `symbol` - generates unique symbols

## Performance Optimizations

This library includes several performance optimizations over naive filtering approaches:

### Range Constraints

Instead of generating random numbers and filtering:

```typescript
// ❌ Slow: generates any number, filters most out
fc.integer().filter((x) => x >= 10 && x <= 20);

// ✅ Fast: generates only valid range
fc.integer({ min: 10, max: 20 });
```

### Discrete Values

Direct generation for exact values:

```typescript
// Schema: v.pipe(v.number(), v.value(42))
// ✅ Generates: fc.constant(42)

// Schema: v.pipe(v.string(), v.values(["a", "b", "c"]))
// ✅ Generates: fc.constantFrom("a", "b", "c")
```

### String Formats

Built-in fast-check generators for common formats:

```typescript
// Schema: v.pipe(v.string(), v.email())
// ✅ Generates: fc.emailAddress()

// Schema: v.pipe(v.string(), v.uuid())
// ✅ Generates: fc.uuid()

// Schema: v.pipe(v.string(), v.url())
// ✅ Generates: fc.webUrl()
```

### Complex Validations

For complex constraints, falls back to schema validation with efficiency monitoring:

```typescript
// Automatically detects low success rates and provides helpful errors
const schema = v.pipe(
	v.number(),
	v.check((x) => isPrime(x))
);
// Will warn if success rate drops below 1%
```

## Error Handling

The library provides detailed error messages for unsupported schemas and generation failures:

```typescript
// Unsupported schema type
try {
	vfc().inputOf(unsupportedSchema);
} catch (error) {
	// VFCUnsupportedSchemaError: Unable to generate valid values for Valibot schema. CustomType schemas are not supported.
}

// Low success rate
try {
	const restrictiveSchema = v.pipe(
		v.number(),
		v.check((x) => x === Math.PI)
	);
	vfc().inputOf(restrictiveSchema);
} catch (error) {
	// VFCGenerationError: Unable to generate valid values for the passed Valibot schema. Please provide an override for the schema at path '.'.
}
```

## Examples

### Basic Property Testing

```typescript
import { vfc } from "valibot-fast-check";
import * as v from "valibot";
import fc from "fast-check";

const schema = v.object({
	username: v.pipe(v.string(), v.minLength(3), v.maxLength(20)),
	password: v.pipe(v.string(), v.minLength(8)),
	age: v.pipe(v.number(), v.integer(), v.minValue(13)),
});

fc.assert(
	fc.property(vfc().inputOf(schema), (data) => {
		// Test that all generated data is valid
		const result = v.safeParse(schema, data);
		expect(result.success).toBe(true);

		// Test business logic
		expect(data.username.length).toBeGreaterThanOrEqual(3);
		expect(data.age).toBeGreaterThanOrEqual(13);
	})
);
```

### Complex Nested Schemas

```typescript
const AddressSchema = v.object({
	street: v.string(),
	city: v.string(),
	zipCode: v.pipe(v.string(), v.regex(/^\d{5}$/)),
});

const PersonSchema = v.object({
	name: v.string(),
	addresses: v.array(AddressSchema),
	primaryAddress: v.optional(AddressSchema),
});

const personArbitrary = vfc().inputOf(PersonSchema);
// Generates complex nested objects with arrays and optional fields
```

### Using Overrides

```typescript
const schema = v.object({
	id: v.string(), // We want specific ID format
	data: v.any(),
});

const customGenerator = vfc().override(
	v.string(),
	fc.uuid() // All strings will be UUIDs
);

const arbitrary = customGenerator.inputOf(schema);
```

## Acknowledgments

Inspired by [zod-fast-check](https://github.com/DavidTimms/zod-fast-check) by David Timms. This library brings the same concept to Valibot, leveraging Valibot's smaller bundle size.
