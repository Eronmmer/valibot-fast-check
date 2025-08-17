import { Arbitrary } from "fast-check";
import { UnknownValibotSchema } from "../index";
import { buildStringArbitrary } from "./string";
import { buildNumberArbitrary } from "./number";
import { buildObjectArbitrary } from "./object";
import { buildArrayArbitrary } from "./array";

export type VFCType = "string" | "number" | "object" | "array";

export const arbitraryBuilder: Record<
  VFCType,
  (schema: UnknownValibotSchema) => Arbitrary<unknown>
> = {
  string: buildStringArbitrary,
  number: buildNumberArbitrary,
  object: buildObjectArbitrary,
  array: buildArrayArbitrary,
};
