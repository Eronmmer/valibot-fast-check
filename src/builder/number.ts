import fc from "fast-check";
import { UnknownValibotSchema } from "..";
import { filterBySchema } from "../helpers";

export function buildNumberArbitrary(
  schema: UnknownValibotSchema,
  path: string,
) {
  let minValue = Number.MIN_SAFE_INTEGER;
  let maxValue = Number.MAX_SAFE_INTEGER;
  let multipleOf: number | null = null;
  let isFinite = false;
  let hasUnsupportedFormat = false;

  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc.double({ noNaN: true });
  }

  for (const pipe of pipes.filter((pipe) => pipe.kind === "validation")) {
    switch (pipe.type) {
      case "min_value":
        minValue = Math.max(minValue, pipe.requirement);
        break;
      case "max_value":
        maxValue = Math.min(maxValue, pipe.requirement);
        break;
      case "integer":
        multipleOf = multipleOf ?? 1;
        break;
      case "finite":
        isFinite = true;
        break;
      case "multiple_of":
        multipleOf = (multipleOf ?? 1) * pipe.requirement;
        break;
      case "gt_value":
        minValue = Math.max(
          minValue,
          pipe.requirement +
            (Number.isInteger(pipe.requirement) ? 1 : Number.EPSILON),
        );
        break;
      case "lt_value":
        maxValue = Math.min(
          maxValue,
          pipe.requirement -
            (Number.isInteger(pipe.requirement) ? 1 : Number.EPSILON),
        );
        break;
      case "safe_integer":
        minValue = Math.max(minValue, Number.MIN_SAFE_INTEGER);
        maxValue = Math.min(maxValue, Number.MAX_SAFE_INTEGER);
        multipleOf = multipleOf ?? 1;
        break;
      case "value":
        return fc.constant(pipe.requirement);
      case "values":
        return fc.constantFrom(...pipe.requirement);
      default:
        hasUnsupportedFormat = true;
    }
  }

  let arbitrary: fc.Arbitrary<number> | null = null;

  if (multipleOf !== null) {
    const factor = multipleOf;

    arbitrary = fc
      .integer({
        min: Math.ceil(minValue / factor),
        max: Math.floor(maxValue / factor),
      })
      .map((value) => value * factor);
  } else {
    const finiteArbitrary = fc.double({
      min: minValue,
      max: maxValue,
      noNaN: true,
    });

    if (isFinite) {
      arbitrary = finiteArbitrary;
    } else {
      // Only include infinity values if they don't violate constraints
      const infinityOptions = [];
      if (maxValue >= Infinity) infinityOptions.push(fc.constant(Infinity));
      if (minValue <= -Infinity) infinityOptions.push(fc.constant(-Infinity));

      arbitrary =
        infinityOptions.length > 0
          ? fc.oneof(finiteArbitrary, ...infinityOptions)
          : finiteArbitrary;
    }
  }

  return hasUnsupportedFormat
    ? filterBySchema(arbitrary, schema, path)
    : arbitrary;
}
