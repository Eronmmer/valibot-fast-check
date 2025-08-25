import fc from "fast-check";
import { UnknownValibotSchema } from "../index";
import { filterBySchema } from "../helpers";

export function buildStringArbitrary(
  schema: UnknownValibotSchema,
  path: string,
) {
  let minLength = 0;
  let maxLength: number | null = null;
  const mappings: Array<(s: string) => string> = [];
  let hasUnsupportedFormat = false;

  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc.string();
  }

  for (const validation of pipes.filter((pipe) => pipe.kind === "validation")) {
    switch (validation.type) {
      case "min_length":
        minLength = Math.max(minLength, validation.requirement);
        break;
      case "max_length":
        maxLength = Math.min(maxLength ?? Infinity, validation.requirement);
        break;
      case "length":
        minLength = validation.requirement;
        maxLength = validation.requirement;
        break;
      case "starts_with":
        mappings.push((s) => validation.requirement + s);
        break;
      case "ends_with":
        mappings.push((s) => s + validation.requirement);
        break;
      case "uuid":
        return fc.uuid();
      case "email":
        return fc.emailAddress();
      case "url":
        return fc.webUrl();
      case "includes":
        mappings.push((s) =>
          s.includes(validation.requirement) ? s : s + validation.requirement,
        );
        break;
      case "non_empty":
        minLength = Math.max(minLength, 1);
        break;
      case "trim":
        mappings.push((s) => s.trim());
        break;
      default:
        hasUnsupportedFormat = true;
    }
  }

  if (maxLength === null) maxLength = 2 * minLength + 10;

  let arbitrary = fc.string({
    minLength,
    maxLength,
  });

  for (const mapping of mappings) {
    arbitrary = arbitrary.map(mapping);
  }

  if (hasUnsupportedFormat) {
    return filterBySchema(arbitrary, schema, path);
  } else {
    return arbitrary;
  }
}
