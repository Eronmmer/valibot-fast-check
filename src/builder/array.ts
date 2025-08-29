import fc, { Arbitrary } from "fast-check";
import { UnknownValibotSchema } from "..";
import { filterBySchema } from "../helpers";
import { ArraySchema } from "valibot";

export function buildArrayArbitrary(
  schema: UnknownValibotSchema,
  path: string,
  recurse: (schema: UnknownValibotSchema, path: string) => Arbitrary<unknown>,
) {
  const arraySchema = schema as ArraySchema<UnknownValibotSchema, undefined>;
  let minLength = 0;
  let maxLength = 10;
  let hasUnsupportedFormat = false;

  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc.array(recurse(arraySchema.item, path + "[*]"), {
      minLength,
      maxLength,
    });
  }

  for (const pipe of pipes.filter((pipe) => pipe.kind === "validation")) {
    switch (pipe.type) {
      case "min_length":
        minLength = Math.max(minLength, pipe.requirement);
        break;
      case "max_length":
        maxLength = Math.min(maxLength, pipe.requirement);
        break;
      case "size":
        minLength = pipe.requirement;
        maxLength = pipe.requirement;
        break;
      // TODO: add support for other methods like includes, excludes, etc.
      default:
        hasUnsupportedFormat = true;
    }
  }

  const arbitrary = fc.array(recurse(arraySchema.item, path + "[*]"), {
    minLength,
    maxLength,
  });

  return hasUnsupportedFormat
    ? filterBySchema(arbitrary, schema, path)
    : arbitrary;
}
