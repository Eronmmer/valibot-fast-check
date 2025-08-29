import fc from "fast-check";
import { UnknownValibotSchema } from "..";
import { filterBySchema } from "../helpers";

export function buildDateArbitrary(schema: UnknownValibotSchema, path: string) {
  let minValue: Date | null = null;
  let maxValue: Date | null = null;
  let hasUnsupportedFormat = false;

  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc.date();
  }

  for (const pipe of pipes.filter((pipe) => pipe.kind === "validation")) {
    switch (pipe.type) {
      case "min_value":
        if (minValue === null || pipe.requirement > minValue) {
          minValue = pipe.requirement;
        }
        break;
      case "max_value":
        if (maxValue === null || pipe.requirement < maxValue) {
          maxValue = pipe.requirement;
        }
        break;
      case "gt_value":
        if (minValue === null || pipe.requirement > minValue) {
          minValue = pipe.requirement;
        }
        break;
      case "lt_value":
        if (maxValue === null || pipe.requirement < maxValue) {
          maxValue = pipe.requirement;
        }
        break;
      case "value":
        return fc.constant(pipe.requirement);
      case "values":
        return fc.constantFrom(...pipe.requirement);
      default:
        hasUnsupportedFormat = true;
    }
  }

  const constraints: { min?: Date; max?: Date } = {};

  if (minValue instanceof Date) {
    constraints.min = minValue;
  }

  if (maxValue instanceof Date) {
    constraints.max = maxValue;
  }

  const arbitrary = fc.date(constraints);

  return hasUnsupportedFormat
    ? filterBySchema(arbitrary, schema, path)
    : arbitrary;
}
