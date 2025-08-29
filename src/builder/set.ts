import fc, { Arbitrary } from "fast-check";
import { UnknownValibotSchema } from "..";
import { filterBySchema } from "../helpers";
import { SetSchema } from "valibot";

export function buildSetArbitrary(
  schema: UnknownValibotSchema,
  path: string,
  recurse: (schema: UnknownValibotSchema, path: string) => Arbitrary<unknown>,
) {
  const setSchema = schema as SetSchema<UnknownValibotSchema, undefined>;
  let minSize = 0;
  let maxSize = 10;
  let hasUnsupportedFormat = false;

  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc
      .uniqueArray(recurse(setSchema.value, path + ".(value)"), {
        minLength: minSize,
        maxLength: maxSize,
      })
      .map((members) => new Set(members));
  }

  for (const pipe of pipes.filter((pipe) => pipe.kind === "validation")) {
    switch (pipe.type) {
      case "min_size":
        minSize = Math.max(minSize, pipe.requirement);
        break;
      case "max_size":
        maxSize = Math.min(maxSize, pipe.requirement);
        break;
      case "size":
        minSize = pipe.requirement;
        maxSize = pipe.requirement;
        break;
      default:
        hasUnsupportedFormat = true;
    }
  }

  const arbitrary = fc
    .uniqueArray(recurse(setSchema.value, path + ".(value)"), {
      minLength: minSize,
      maxLength: maxSize,
    })
    .map((members) => new Set(members));

  return hasUnsupportedFormat
    ? filterBySchema(arbitrary, schema, path)
    : arbitrary;
}
