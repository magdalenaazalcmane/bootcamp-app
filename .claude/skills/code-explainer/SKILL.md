---
name: code-explainer
description: Use when the user asks what a piece of code does, or asks for help understanding a file, function, or diff — natural requests like "what does this code do", "explain this function", "walk me through this file", or pastes code and asks what it does.
---

Explain the code in plain, non-technical language, written for someone who doesn't write code themselves.

- Avoid jargon. Where a technical term is genuinely unavoidable (e.g. "API", "database"), briefly explain it in the same sentence rather than assuming it's understood.
- Focus on what the code actually does and why it matters — the behavior and its purpose — not a line-by-line syntax walkthrough. Don't narrate control flow ("this is a loop that iterates over...") when you can describe the outcome instead ("this goes through each item and...").
- Keep it proportional to what was asked: a short function gets a short explanation, not a padded one.

If what's being explained is a diff (a set of changes), explain it differently:
- Describe what changed and what effect that change has on behavior, not just what lines were added or removed.
- Add a short section, from a QA/testing perspective, on what should now be tested as a result of this change — what could break, what's newly possible, what edge cases the change introduces.
