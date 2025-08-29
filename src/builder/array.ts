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
  let minLength: number | null = null;
  let maxLength: number | null = null;
  let hasUnsupportedFormat = false;

  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc.array(recurse(arraySchema.item, path + "[*]"), {
      minLength: 0,
      maxLength: 10,
    });
  }

  for (const pipe of pipes.filter((pipe) => pipe.kind === "validation")) {
    switch (pipe.type) {
      case "min_length":
        if (minLength === null || pipe.requirement > minLength) {
          minLength = pipe.requirement;
        }
        break;
      case "max_length":
        if (maxLength === null || pipe.requirement < maxLength) {
          maxLength = pipe.requirement;
        }
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
    minLength: minLength ?? 0,
    maxLength: maxLength ?? 10,
  });

  return hasUnsupportedFormat
    ? filterBySchema(arbitrary, schema, path)
    : arbitrary;
}
