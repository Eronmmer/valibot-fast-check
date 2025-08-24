import fc from "fast-check";
import { UnknownValibotSchema } from "..";

export function buildBooleanArbitrary(schema: UnknownValibotSchema) {
  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc.boolean();
  }

  let literalValue: boolean | null = null;

  for (const pipe of pipes) {
    if (pipe.kind === "validation") {
      switch (pipe.type) {
        case "not_value":
          literalValue = !pipe.requirement;
          break;
        case "value":
          literalValue = !!pipe.requirement;
          break;
      }
    }
  }

  if (literalValue !== null) {
    return fc.constant(literalValue);
  } else {
    return fc.boolean();
  }
}
