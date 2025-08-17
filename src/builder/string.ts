import fc, { Arbitrary } from "fast-check";
import { UnknownValibotSchema } from "../index";

export function buildStringArbitrary(schema: UnknownValibotSchema) {
  let minLength = 0;
  let maxLength: number | null = null;
  const mappings: Array<(s: string) => string> = [];
  const regexFilters: RegExp[] = [];
  let hasSpecialFormat = false;
  let specialFormatArbitrary: Arbitrary<string> | null = null;

  const pipes = "pipe" in schema ? schema.pipe : undefined;

  if (!pipes || !Array.isArray(pipes)) {
    return fc.string();
  }

  for (const validation of pipes.filter(
    (pipe) => pipe.kind === "validation" || pipe.kind === "transformation",
  )) {
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
        hasSpecialFormat = true;
        specialFormatArbitrary = fc.uuid();
        break;
      case "email":
        hasSpecialFormat = true;
        specialFormatArbitrary = fc.emailAddress();
        break;
      case "url":
        hasSpecialFormat = true;
        specialFormatArbitrary = fc.webUrl();
        break;
      case "regex":
        regexFilters.push(validation.requirement);
        break;
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
        if (
          validation.requirement &&
          validation.requirement instanceof RegExp
        ) {
          regexFilters.push(validation.requirement);
        }
    }
  }

  /* If we have a special formats (like uuid, email, url), we use it as a base and then regex filters */
  if (hasSpecialFormat && specialFormatArbitrary) {
    let arbitrary = specialFormatArbitrary;

    for (const regex of regexFilters) {
      arbitrary = arbitrary.filter((s) => regex.test(s));
    }

    return arbitrary;
  }

  if (maxLength === null) maxLength = 2 * minLength + 10;

  let arbitrary = fc.string({
    minLength,
    maxLength,
  });

  for (const mapping of mappings) {
    arbitrary = arbitrary.map(mapping);
  }

  for (const regex of regexFilters) {
    arbitrary = arbitrary.filter((s) => regex.test(s));
  }

  return arbitrary;
}
