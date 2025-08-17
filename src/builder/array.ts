import fc from "fast-check";
import { UnknownValibotSchema } from "..";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO, REMOVE THIS...
export function buildArrayArbitrary(schema: UnknownValibotSchema) {
  return fc.array(fc.anything());
}
