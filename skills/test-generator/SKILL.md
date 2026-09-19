---
name: test-generator
description: Use when the user asks to write test cases, generate tests, or create ISTQB-style tests for a feature, function, form, field, or API endpoint — matches requests like "write test cases for X", "generate ISTQB tests for X", "give me test coverage for X".
---

Apply ISTQB boundary-value analysis when generating test cases. For the feature or input under test, cover:

1. Happy path
2. Boundary values (min, max, min−1, max+1)
3. Empty and whitespace input
4. Very long input
5. Equivalence partitions
6. Negative cases (wrong type, missing required field, duplicate entry)

Skip any category that genuinely doesn't apply to the thing being tested (e.g. a boolean toggle has no boundary values), but don't skip a category just to save space.

Format every test case using the test case shape defined in CLAUDE.md:

- **Title** — end with the feature area in brackets, e.g. "User can log in with valid credentials [Login]"
- **Preconditions**
- **Steps** (numbered)
- **Expected result**
- **Severity** — Critical / Major / Minor / Trivial, chosen using the severity definitions in CLAUDE.md
- **Status** — default to `draft` for newly generated cases

Write in the voice CLAUDE.md specifies: clear, direct English, no buzzwords, no filler, no hedging.
