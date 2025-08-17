import { Arbitrary } from "fast-check";
import { BaseSchema, BaseIssue, InferInput } from "valibot";
import { arbitraryBuilder, VFCType } from "./builder";
import { isSupportedSchemaType, unsupportedSchemaError } from "./helpers";
export type UnknownValibotSchema = BaseSchema<
  unknown,
  unknown,
  BaseIssue<unknown>
>;

class _VFC {
  /**
   * Creates an arbitrary which will generate valid inputs to the schema.
   *
   * @param schema - The schema to generate inputs for.
   * @returns An arbitrary which will generate valid inputs to the schema.
   */
  inputOf<Schema extends UnknownValibotSchema>(
    schema: Schema,
  ): Arbitrary<InferInput<Schema>> {
    if (isSupportedSchemaType(schema)) {
      return arbitraryBuilder[schema.type as VFCType](schema);
    }

    unsupportedSchemaError(schema.type);
  }

  // outputOf<Schema extends UnknownValibotSchema>(
  // 	schema: Schema
  // ): Arbitrary<InferOutput<Schema>> {
  // 	return "sup";
  // }
}

export type VFC = _VFC;

export function vfc(): VFC {
  return new _VFC();
}

vfc.prototype = _VFC.prototype;

export class VFCError extends Error {}

export class VFCUnsupportedSchemaError extends VFCError {}

export class VFCGenerationError extends VFCError {}
