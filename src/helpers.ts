import * as v from "valibot";
import { BaseIssue, BaseSchema, isOfKind } from "valibot";
import {
  UnknownValibotSchema,
  VFCGenerationError,
  VFCUnsupportedSchemaError,
} from ".";
import { arbitraryBuilder } from "./builder";
import { Arbitrary } from "fast-check";

export function unsupportedSchemaError(schemaTypeName: string): never {
  throw new VFCUnsupportedSchemaError(
    `Unable to generate valid values for Valibot schema.` +
      `${schemaTypeName} schemas are not supported.`,
  );
}

export function isSupportedSchemaType(schema: UnknownValibotSchema): boolean {
  const typeName = schema.type;

  return (
    !!typeName &&
    isOfKind("schema", schema) &&
    Object.prototype.hasOwnProperty.call(arbitraryBuilder, typeName)
  );
}

function guardPredicate<Value, Refined extends Value>(
  successRate: number,
  predicate: (value: Value) => value is Refined,
  path: string,
): (value: Value) => value is Refined {
  const MIN_RUNS = 1000;

  let successful = 0;
  let total = 0;

  return (value: Value): value is Refined => {
    const isSuccess = predicate(value);

    total += 1;
    if (isSuccess) successful += 1;

    if (total > MIN_RUNS && successful / total < successRate) {
      throw new VFCGenerationError(
        "Unable to generate valid values for the passed Valibot schema. " +
          `Please provide an override for the schema at path '${path || "."}'.`, // implement overrides. remove this comment before publishing.
      );
    }

    return isSuccess;
  };
}

const MIN_SUCCESS_RATE = 0.01;

export function filterBySchema(
  arbitrary: Arbitrary<unknown>,
  schema: BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  path: string,
): Arbitrary<unknown> {
  return arbitrary.filter(
    guardPredicate(
      MIN_SUCCESS_RATE,
      (value): value is typeof value => v.safeParse(schema, value).success,
      path,
    ),
  );
}
