import { Arbitrary } from "fast-check";
import { UnknownValibotSchema } from "../index";
import { buildStringArbitrary } from "./string";
import { buildNumberArbitrary } from "./number";
import { buildObjectArbitrary } from "./object";
import { buildArrayArbitrary } from "./array";
import { buildBigIntArbitrary } from "./bigint";

export type VFCType = "string" | "number" | "bigint" | "object" | "array";

export const arbitraryBuilder: Record<
	VFCType,
	(schema: UnknownValibotSchema) => Arbitrary<unknown>
> = {
	string: buildStringArbitrary,
	number: buildNumberArbitrary,
	bigint: buildBigIntArbitrary,
	object: buildObjectArbitrary,
	array: buildArrayArbitrary,
};
