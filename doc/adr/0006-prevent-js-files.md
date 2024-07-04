# 6. Prevent .js files

Date: 2024-07-03

## Status

Accepted

## Context

Currently when you build you get `.js` files alongside all of the `.ts` files, which just adds noise.

This is not coming from `tsc`, it is coming from

```shell
npm run build:esbuild
```

## Decision

Come back to this one, there are some files that still need to be converted to `.js` like everything in `ts/scripts`.

Tried briefly but it needs more thought.

## Consequences

It would reduce noise and make things easier to understand.
