---
name: qa-review
description: Use when the user asks for a QA review of code or a feature, or asks things like "QA review this", "test my change", "what could break", or "what did I miss from a testing perspective".
allowed-tools: Read, Grep
---

Review the code or feature under discussion from a tester's angle, not an implementer's. Look specifically for:

1. Missing validation — inputs that aren't checked for type, length, format, or required-ness before being used.
2. Missing error handling — operations that can fail (network calls, file I/O, parsing, database queries) with no handling for the failure path.
3. Unclear user-facing messages — error or status messages that are vague, technical, or wouldn't tell a real user what happened or what to do next.
4. Missing confirmation dialogs before destructive actions — deletes, overwrites, or other irreversible actions that fire immediately with no "are you sure".
5. Accessibility issues — missing labels, non-semantic markup for interactive elements, color-only signals, missing keyboard support, poor focus handling.

Only use Read and Grep to investigate — do not edit any files as part of this review.

Report findings as a structured list grouped by severity, using exactly these severity levels from CLAUDE.md: Critical / Major / Minor / Trivial. Within each severity group, give each issue as a short bullet: what's wrong, where (file/line or component name), and why it matters. Omit any severity group that has no findings — don't pad the list. If nothing of note is found in a category, don't mention that category at all rather than saying "no issues found."
