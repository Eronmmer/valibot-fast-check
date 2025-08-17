import fc from "fast-check";
import { UnknownValibotSchema } from "..";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO, REMOVE THIS...
export function buildNumberArbitrary(schema: UnknownValibotSchema) {
  return fc.bigInt();
}
