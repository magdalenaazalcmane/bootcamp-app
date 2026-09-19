# Example: `test-generator` skill / `test-writer` agent

Real output, not constructed samples — the three files below already exist
in this repo under `tests/manual/signup-*.md`, part of a 27-file suite
covering a signup form's Email, Username, and Password fields.

## Prompt

The substance of the original request was: generate test coverage for a
signup form's Email, Username, and Password fields. The exact original
wording predates this repo's recorded session history, so it isn't quoted
verbatim here — what follows is real, verifiable output, not a
reconstructed prompt.

## What it did

Applied the ISTQB boundary-value methodology `skills/test-generator/SKILL.md`
defines — happy path, boundary values, empty/whitespace input, very long
input, equivalence partitions, negative cases — to each of the three
fields, and wrote one file per test case under `tests/manual/`, in the
format `CLAUDE.md` and the skill specify.

## Result

27 files total. A representative slice covering three of those categories:

**Format validation** — `tests/manual/signup-email-missing-at-symbol-rejected.md`:
```markdown
# Signup is rejected when email is missing the @ symbol [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "userexample.com" in the Email field.
2. Enter "validuser1" in the Username field.
3. Enter "Password1" in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected with an error stating the email format is invalid. No account is created.

## Severity

Major

## Status

draft
```

**Boundary value (below minimum)** — `tests/manual/signup-password-below-min-length-rejected.md`:
```markdown
# Signup rejects a password below the minimum length of 8 characters [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "newuser@example.com" in the Email field.
2. Enter "validuser1" in the Username field.
3. Enter "Pass12a" (7 characters, contains a number) in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected with an error stating the password must be 8-20 characters. No account is created.

## Severity

Minor

## Status

draft
```

**Very long input** — `tests/manual/signup-email-very-long-accepted.md`:
```markdown
# Signup accepts a very long but validly formatted email [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter a 250-character validly formatted email address (long local part, e.g. "aaaa...aaaa@example.com") in the Email field.
2. Enter "validuser1" in the Username field.
3. Enter "Password1" in the Password field.
4. Click "Sign up".

## Expected result

The account is created. The email is accepted, since no length limit is specified for the email field, only a format requirement.

## Severity

Minor

## Status

draft
```

Note the third one isn't a rejection case — the methodology generates the
*correct* expected result for a boundary, which here is acceptance, not an
assumed failure. The other 24 files in the same suite cover the remaining
categories across all three fields.
