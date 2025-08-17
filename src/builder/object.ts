import fc from "fast-check";
import { UnknownValibotSchema } from "..";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO, REMOVE THIS...
export function buildObjectArbitrary(schema: UnknownValibotSchema) {
  return fc.record({});
}
