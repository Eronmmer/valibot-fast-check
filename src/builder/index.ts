import { Arbitrary } from "fast-check";
import { UnknownValibotSchema } from "../index";
import { buildStringArbitrary } from "./string";
import { buildNumberArbitrary } from "./number";
import { buildObjectArbitrary } from "./object";
import { buildArrayArbitrary } from "./array";
import { buildBigIntArbitrary } from "./bigint";
import { buildBooleanArbitrary } from "./boolean";
import { buildDateArbitrary } from "./date";

export type VFCType =
  | "string"
  | "number"
  | "bigint"
  | "object"
  | "array"
  | "boolean"
  | "date";

export const arbitraryBuilder: Record<
  VFCType,
  (schema: UnknownValibotSchema) => Arbitrary<unknown>
> = {
  string: buildStringArbitrary,
  number: buildNumberArbitrary,
  bigint: buildBigIntArbitrary,
  boolean: buildBooleanArbitrary,
  object: buildObjectArbitrary,
  array: buildArrayArbitrary,
  date: buildDateArbitrary,
};
