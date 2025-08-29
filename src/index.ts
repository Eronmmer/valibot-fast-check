import { Arbitrary } from "fast-check";
import { BaseSchema, BaseIssue, InferInput, safeParse } from "valibot";
import { arbitraryBuilder, VFCType } from "./builder";
import {
  isSupportedSchemaType,
  unsupportedSchemaError,
  SCALAR_TYPES,
  guardPredicate,
  MIN_SUCCESS_RATE,
} from "./helpers";

export type UnknownValibotSchema = BaseSchema<
  unknown,
  unknown,
  BaseIssue<unknown>
>;

type OverrideArbitrary<Input = unknown> =
  | Arbitrary<Input>
  | ((vfc: VFC) => Arbitrary<Input>);

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

  /**
   * Creates an arbitrary which will generate valid parsed outputs of the schema.
   *
   */
  outputOf<Schema extends UnknownValibotSchema>(
    schema: Schema,
  ): Arbitrary<InferInput<Schema>> {
    const inputArbitrary = this.inputOf(schema);

    if (isSupportedSchemaType(schema) && SCALAR_TYPES.has(schema.type)) {
      return inputArbitrary;
    }

    return inputArbitrary
      .map((value) => safeParse(schema, value))
      .filter(
        guardPredicate(
          MIN_SUCCESS_RATE,
          (parsed) => parsed.success === true,
          "",
        ),
      )
      .map((parsed) => parsed.output);
  }

  /**
   * Returns a new `VFC` instance which will use the provided arbitrary when generating inputs for the given schema.
   */
  override<Schema extends UnknownValibotSchema>(
    schema: Schema,
    arbitrary: Arbitrary<unknown>,
  ): VFC {
    const withOverride = this.clone();
    withOverride.overrides.set(schema, arbitrary);
    return withOverride;
  }

  private inputWithPath(
    schema: UnknownValibotSchema,
    path: string,
  ): Arbitrary<unknown> {
    const override = this.findOverride(schema);

    if (override) {
      return override;
    }

    if (isSupportedSchemaType(schema)) {
      return arbitraryBuilder[schema.type as VFCType](
        schema,
        path,
        this.inputWithPath.bind(this),
      );
    }

    unsupportedSchemaError(schema.type);
  }

  private findOverride<Input>(
    schema: UnknownValibotSchema,
  ): Arbitrary<Input> | null {
    const override = this.overrides.get(schema);

    if (override) {
      return (
        typeof override === "function" ? override(this) : override
      ) as Arbitrary<Input>;
    }

    return null;
  }

  private overrides = new Map<UnknownValibotSchema, OverrideArbitrary>();

  private clone(): VFC {
    const cloned = new _VFC();
    this.overrides.forEach((arbitrary, schema) => {
      cloned.overrides.set(schema, arbitrary);
    });
    return cloned;
  }
}

export type VFC = _VFC;

export function vfc(): VFC {
  return new _VFC();
}

vfc.prototype = _VFC.prototype;

export class VFCError extends Error {}

export class VFCUnsupportedSchemaError extends VFCError {}

export class VFCGenerationError extends VFCError {}
