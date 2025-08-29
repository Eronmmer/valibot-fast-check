import fc from "fast-check";
import { UnknownValibotSchema } from "..";
import { filterBySchema } from "../helpers";

export function buildBigIntArbitrary(
  schema: UnknownValibotSchema,
  path: string,
) {
  let minValue: bigint | null = null;
  let maxValue: bigint | null = null;
  let hasUnsupportedFormat = false;
  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc.bigInt();
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
        if (
          (minValue === null || pipe.requirement > minValue) &&
          typeof pipe.requirement === "bigint"
        ) {
          minValue = pipe.requirement + BigInt(1);
        }
        break;
      case "lt_value":
        if (
          (maxValue === null || pipe.requirement < maxValue) &&
          typeof pipe.requirement === "bigint"
        ) {
          maxValue = pipe.requirement - BigInt(1);
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

  const constraints: { min?: bigint; max?: bigint } = {};

  if (typeof minValue === "bigint") {
    constraints.min = minValue;
  }

  if (typeof maxValue === "bigint") {
    constraints.max = maxValue;
  }

  let arbitrary = fc.bigInt(constraints);

  // Ensure zero is included in the generation for diversity tests
  if (
    Object.keys(constraints).length === 0 ||
    ((!constraints.min || constraints.min <= 0n) &&
      (!constraints.max || constraints.max >= 0n))
  ) {
    arbitrary = fc.oneof(
      { arbitrary: fc.constant(0n), weight: 5 },
      { arbitrary: arbitrary, weight: 20 },
    );
  }

  return hasUnsupportedFormat
    ? filterBySchema(arbitrary, schema, path)
    : arbitrary;
}
