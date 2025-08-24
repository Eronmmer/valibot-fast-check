import fc from "fast-check";
import { UnknownValibotSchema } from "..";

export function buildDateArbitrary(schema: UnknownValibotSchema) {
  let minValue: Date | null = null;
  let maxValue: Date | null = null;

  const filters: Array<(n: Date) => boolean> = [];

  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc.date();
  }

  for (const pipe of pipes) {
    if (pipe.kind === "validation") {
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
        case "value":
          filters.push((value) => value === pipe.requirement);
          break;
        case "values":
          filters.push((value) => pipe.requirement.includes(value));
          break;
      }
    }
  }

  const constraints: { min?: Date; max?: Date } = {};

  if (minValue instanceof Date) {
    constraints.min = minValue;
  }

  if (maxValue instanceof Date) {
    constraints.max = maxValue;
  }

  let arbitrary = fc.date(constraints);

  for (const filter of filters) {
    arbitrary = arbitrary.filter(filter);
  }

  return arbitrary;
}
