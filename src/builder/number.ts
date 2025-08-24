import fc from "fast-check";
import { UnknownValibotSchema } from "..";

export function buildNumberArbitrary(schema: UnknownValibotSchema) {
  let minValue = Number.MIN_SAFE_INTEGER;
  let maxValue = Number.MAX_SAFE_INTEGER;
  let multipleOf: number | null = null;
  let isFinite = false;

  const filters: Array<(n: number) => boolean> = [];

  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc.double({ noNaN: true });
  }

  for (const pipe of pipes) {
    if (pipe.kind === "validation") {
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
        case "check":
          filters.push(pipe.requirement);
          break;
        case "gt_value":
          filters.push((value) => value > pipe.requirement);
          break;
        case "lt_value":
          filters.push((value) => value < pipe.requirement);
          break;
        case "not_value":
          filters.push((value) => value !== pipe.requirement);
          break;
        case "not_values":
          filters.push((value) => !pipe.requirement.includes(value));
          break;
        case "safe_integer":
          filters.push((value) => Number.isSafeInteger(value));
          break;
        case "value":
          filters.push((value) => value === pipe.requirement);
          break;
        case "values":
          filters.push((value) => pipe.requirement.includes(value));
          break;
      }
    }
  }

  if (multipleOf !== null) {
    const factor = multipleOf;

    let arbitrary = fc
      .integer({
        min: Math.ceil(minValue / factor),
        max: Math.floor(maxValue / factor),
      })
      .map((value) => value * factor);

    for (const filter of filters) {
      arbitrary = arbitrary.filter(filter);
    }

    return arbitrary;
  } else {
    const finiteArbitrary = fc.double({
      min: minValue,
      max: maxValue,
      noNaN: true,
    });

    if (isFinite) {
      let arbitrary = finiteArbitrary;

      for (const filter of filters) {
        arbitrary = arbitrary.filter(filter);
      }

      return arbitrary;
    } else {
      let arbitrary = fc.oneof(finiteArbitrary, fc.constant(Infinity));

      for (const filter of filters) {
        arbitrary = arbitrary.filter(filter);
      }

      return arbitrary;
    }
  }
}
