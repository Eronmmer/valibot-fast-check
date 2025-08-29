import fc, { Arbitrary } from "fast-check";
import { UnknownValibotSchema } from "../index";
import { buildStringArbitrary } from "./string";
import { buildNumberArbitrary } from "./number";
import { buildObjectArbitrary } from "./object";
import { buildArrayArbitrary } from "./array";
import { buildBigIntArbitrary } from "./bigint";
import { buildBooleanArbitrary } from "./boolean";
import { buildDateArbitrary } from "./date";

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
    >;

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
  object: buildObjectArbitrary,
  array: buildArrayArbitrary,
  date: buildDateArbitrary,
  undefined: () => fc.constant(undefined),
  null: () => fc.constant(null),
  nan: () => fc.constant(Number.NaN),
  any: () => fc.anything(),
  void: () => fc.constant(undefined),
  optional: (schema: UnknownValibotSchema, path, recurse) => {
    const optionalSchema = schema as OptionalSchema<
      UnknownValibotSchema,
      undefined
    >;
    return fc.option(recurse(optionalSchema.wrapped, path), {
      nil: undefined,
      freq: 2,
    });
  },
  nullable: (schema: UnknownValibotSchema, path, recurse) => {
    const nullableSchema = schema as NullableSchema<
      UnknownValibotSchema,
      undefined
    >;
    return fc.option(recurse(nullableSchema.wrapped, path), {
      nil: null,
      freq: 2,
    });
  },
};
