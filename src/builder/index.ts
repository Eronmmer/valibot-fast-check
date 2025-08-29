import fc, { Arbitrary } from "fast-check";
import { UnknownValibotSchema } from "../index";
import { buildStringArbitrary } from "./string";
import { buildNumberArbitrary } from "./number";
import { buildArrayArbitrary } from "./array";
import { buildBigIntArbitrary } from "./bigint";
import { buildBooleanArbitrary } from "./boolean";
import { buildDateArbitrary } from "./date";
import { buildSetArbitrary } from "./set";

import type {
  StringSchema,
  NumberSchema,
  BigintSchema,
  BooleanSchema,
  DateSchema,
  ArraySchema,
  ObjectSchema,
  NullSchema,
  UndefinedSchema,
  NanSchema,
  AnySchema,
  ObjectEntries,
  BaseSchema,
  BaseIssue,
  VoidSchema,
  OptionalSchema,
  NullableSchema,
  EnumSchema,
  Enum,
  FunctionSchema,
  LiteralSchema,
  Literal,
  MapSchema,
  NullishSchema,
  SetSchema,
  SymbolSchema,
  TupleSchema,
  TupleItems,
  UnionSchema,
  UnknownSchema,
} from "valibot";

type ExtractSchemaType<T> = T extends { readonly type: infer U } ? U : never;

export type VFCType =
  | ExtractSchemaType<StringSchema<undefined>>
  | ExtractSchemaType<NumberSchema<undefined>>
  | ExtractSchemaType<BigintSchema<undefined>>
  | ExtractSchemaType<ObjectSchema<ObjectEntries, undefined>>
  | ExtractSchemaType<
      ArraySchema<BaseSchema<unknown, unknown, BaseIssue<unknown>>, undefined>
    >
  | ExtractSchemaType<BooleanSchema<undefined>>
  | ExtractSchemaType<DateSchema<undefined>>
  | ExtractSchemaType<UndefinedSchema<undefined>>
  | ExtractSchemaType<NullSchema<undefined>>
  | ExtractSchemaType<NanSchema<undefined>>
  | ExtractSchemaType<AnySchema>
  | ExtractSchemaType<VoidSchema<undefined>>
  | ExtractSchemaType<
      OptionalSchema<
        BaseSchema<unknown, unknown, BaseIssue<unknown>>,
        undefined
      >
    >
  | ExtractSchemaType<
      NullableSchema<
        BaseSchema<unknown, unknown, BaseIssue<unknown>>,
        undefined
      >
    >
  | ExtractSchemaType<EnumSchema<Enum, undefined>>
  | ExtractSchemaType<FunctionSchema<undefined>>
  | ExtractSchemaType<LiteralSchema<Literal, undefined>>
  | ExtractSchemaType<
      MapSchema<
        BaseSchema<unknown, unknown, BaseIssue<unknown>>,
        BaseSchema<unknown, unknown, BaseIssue<unknown>>,
        undefined
      >
    >
  | ExtractSchemaType<
      NullishSchema<BaseSchema<unknown, unknown, BaseIssue<unknown>>, undefined>
    >
  | ExtractSchemaType<
      SetSchema<BaseSchema<unknown, unknown, BaseIssue<unknown>>, undefined>
    >
  | ExtractSchemaType<SymbolSchema<undefined>>
  | ExtractSchemaType<TupleSchema<TupleItems, undefined>>
  | ExtractSchemaType<UnionSchema<TupleItems, undefined>>
  | ExtractSchemaType<UnknownSchema>
  | ExtractSchemaType<VoidSchema<undefined>>;

export const arbitraryBuilder: Record<
  VFCType,
  (
    schema: UnknownValibotSchema,
    path: string,
    recurse: (schema: UnknownValibotSchema, path: string) => Arbitrary<unknown>,
  ) => Arbitrary<unknown>
> = {
  string: buildStringArbitrary,
  number: buildNumberArbitrary,
  bigint: buildBigIntArbitrary,
  boolean: buildBooleanArbitrary,
  object: (schema, path, recurse) => {
    const objectSchema = schema as ObjectSchema<ObjectEntries, undefined>;
    const propertyArbitraries = Object.fromEntries(
      Object.entries(objectSchema.entries).map(([property, propSchema]) => [
        property,
        recurse(propSchema, path + "." + property),
      ]),
    );
    return fc.record(propertyArbitraries);
  },
  array: buildArrayArbitrary,
  date: buildDateArbitrary,
  undefined: () => fc.constant(undefined),
  null: () => fc.constant(null),
  nan: () => fc.constant(Number.NaN),
  any: () => fc.anything(),
  void: () => fc.constant(undefined),
  optional: (schema, path, recurse) => {
    const optionalSchema = schema as OptionalSchema<
      UnknownValibotSchema,
      undefined
    >;
    return fc.option(recurse(optionalSchema.wrapped, path), {
      nil: undefined,
      freq: 2,
    });
  },
  nullable: (schema, path, recurse) => {
    const nullableSchema = schema as NullableSchema<
      UnknownValibotSchema,
      undefined
    >;
    return fc.option(recurse(nullableSchema.wrapped, path), {
      nil: null,
      freq: 2,
    });
  },
  nullish: (schema, path, recurse) => {
    const nullishSchema = schema as NullishSchema<
      UnknownValibotSchema,
      undefined
    >;
    const baseArbitrary = recurse(nullishSchema.wrapped, path);

    return fc.oneof(
      { arbitrary: baseArbitrary, weight: 8 },
      { arbitrary: fc.constant(null), weight: 1 },
      { arbitrary: fc.constant(undefined), weight: 1 },
    );
  },
  enum: (schema) => {
    const enumSchema = schema as EnumSchema<Enum, undefined>;
    return fc.oneof(...enumSchema.options.map((option) => fc.constant(option)));
  },
  function: () => fc.func(fc.anything()),
  literal: (schema) => {
    const literalSchema = schema as LiteralSchema<Literal, undefined>;
    return fc.constant(literalSchema.literal);
  },
  map: (schema: UnknownValibotSchema, path, recurse) => {
    const mapSchema = schema as MapSchema<
      UnknownValibotSchema,
      UnknownValibotSchema,
      undefined
    >;

    const key = recurse(mapSchema.key, path + ".(key)");
    const value = recurse(mapSchema.value, path + ".(value)");
    return fc.array(fc.tuple(key, value)).map((entries) => new Map(entries));
  },
  set: buildSetArbitrary,
  symbol: () => fc.string().map((s) => Symbol(s)),
  tuple(schema, path, recurse) {
    const tupleSchema = schema as TupleSchema<TupleItems, undefined>;

    return fc.tuple(
      ...tupleSchema.items.map((item, index) =>
        recurse(item, `${path}[${index}]`),
      ),
    );
  },
  union: (schema, path, recurse) => {
    const unionSchema = schema as UnionSchema<TupleItems, undefined>;

    return fc.oneof(
      ...unionSchema.options.map((option) => recurse(option, path)),
    );
  },
  unknown: () => fc.anything(),
};
