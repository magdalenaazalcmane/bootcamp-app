---
description: Quick daily log — answer three questions, save under logs/daily/
---

Ask the user the following questions one at a time, waiting for their answer before asking the next. Keep this fast — no extra chat, just the questions.

1. What did you work on today?
2. Anything blocking you or still in progress?
3. What's the plan for tomorrow?

After all three are answered, save the log as a new markdown file under `logs/daily/` (create the directory if it doesn't exist), named `logs/daily/<YYYY-MM-DD>.md` using today's date. If a file for today already exists, overwrite it.

Use exactly this format for the file contents:

```
# <YYYY-MM-DD>

## What I did

<answer 1>

## Blockers / in progress

<answer 2>

## Plan for tomorrow

<answer 3>
```

Once saved, tell the user the file path in one short line.
