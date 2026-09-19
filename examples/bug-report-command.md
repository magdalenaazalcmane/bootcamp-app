# Example: `/bug-report`

Real output, not a constructed sample — the result below is
`tests/bugs/2026-09-09-test.md` in this repo exactly as the command saved
it.

## Prompt

`/bug-report`

(This particular run was an early smoke-test of the command itself — every
answer given was literally "test." Shown honestly, not cleaned up, because
it's genuine proof of what the command produces, not a cherry-picked case.
The exact original conversation predates this repo's recorded session
history, so the prompt above is the invocation itself, not a reconstructed
paraphrase.)

## What it did

Asked the 5 fixed questions the command defines (what happened, expected,
actual, where, severity) one at a time, then saved one file named by the
command's own `<YYYY-MM-DD>-<slug>.md` convention.

## Result

Saved to `tests/bugs/2026-09-09-test.md`:

```markdown
# test (test)

## Steps to reproduce

1. test

## Expected result

test

## Actual result

test

## Severity

Trivial

## Timestamp

2026-09-09T04:33:36Z
```
