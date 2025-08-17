import { isOfKind } from "valibot";
import { UnknownValibotSchema, VFCUnsupportedSchemaError } from ".";
import { arbitraryBuilder } from "./builder";

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
