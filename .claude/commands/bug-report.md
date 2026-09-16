---
description: File a bug report by answering a few questions, then save it under tests/bugs/
---

Walk the user through filing a bug report. Ask the following questions one at a time, waiting for the user's answer before asking the next:

1. What did you do?
2. What did you expect to happen?
3. What actually happened?
4. Where did this happen (which page/screen)?
5. What's the severity — Critical, Major, Minor, or Trivial?

After all five are answered, save the bug report as a new markdown file under `tests/bugs/` (create the directory if it doesn't exist). Use a dated filename: `tests/bugs/<YYYY-MM-DD>-<short-kebab-case-slug>.md`, where the date is today's date and the slug is based on the bug/page. Avoid collisions with existing files in that directory.

Use exactly this format for the file contents:

```
# <Title summarizing the bug>

## Steps to reproduce

1. <step 1>
2. <step 2>
...

## Expected result

<what should have happened>

## Actual result

<what actually happened>

## Severity

<Critical | Major | Minor | Trivial>

## Timestamp

<ISO 8601 timestamp for when this report was filed>
```

Derive the numbered repro steps from the user's answer to "What did you do?" (break it into steps if it describes multiple actions), and fold "Where did this happen" into the title or the first repro step so the page/screen is clear.

Once saved, tell the user the file path and briefly confirm what was recorded.
