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
    return this.inputWithPath(schema, "");
  }

  private inputWithPath<Input>(
    schema: UnknownValibotSchema,
    path: string,
  ): Arbitrary<Input> {
    if (isSupportedSchemaType(schema)) {
      return arbitraryBuilder[schema.type as VFCType](
        schema,
        path,
        this.inputWithPath.bind(this),
      ) as Arbitrary<Input>;
    }

    unsupportedSchemaError(schema.type);
  }

  // output & override methods go here...
}

export type VFC = _VFC;

export function vfc(): VFC {
  return new _VFC();
}

vfc.prototype = _VFC.prototype;

export class VFCError extends Error {}

export class VFCUnsupportedSchemaError extends VFCError {}

export class VFCGenerationError extends VFCError {}
