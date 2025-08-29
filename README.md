# valibot-fast-check

> **Warning**
> This library is currently in development and will be ready for production use very soon! In a few days...

Generate [Arbitraries](https://fast-check.dev/docs/introduction/getting-started/#arbitrary) for [fast-check](https://github.com/dubzzz/fast-check) from schemas defined using the [Valibot](https://github.com/fabian-hiller/valibot) validation library.

## Installation

```bash
pnpm add valibot-fast-check
```

## Usage

```ts
import { vfc } from "valibot-fast-check";
import * as v from "valibot";

const schema = v.object({
	name: v.string(),
	age: v.number(),
});

const arbitrary = vfc().inputOf(schema);
```
