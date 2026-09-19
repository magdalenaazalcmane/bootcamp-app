---
description: Write a manual test case by answering three questions, then save it under tests/manual/
---

Walk the user through writing a manual test case. Ask the following questions one at a time, waiting for the user's answer before asking the next:

1. What feature does this test cover?
2. What steps does the user take?
3. What is the expected result?

After the three questions are answered, ask the user to pick a severity: Critical / Major / Minor / Trivial. Wait for their answer.

Then save the test case as a new markdown file under `tests/manual/` (create the directory if it doesn't exist). Choose a short kebab-case filename based on the feature (e.g. `tests/manual/login-with-valid-credentials.md`), avoiding collisions with existing files in that directory.

Use exactly this format for the file contents:

```
# <Title based on the feature>

## Steps

1. <step 1>
2. <step 2>
...

## Expected result

<expected result>

## Severity

<Critical | Major | Minor | Trivial>
```

Once saved, tell the user the file path and briefly confirm what was recorded.
