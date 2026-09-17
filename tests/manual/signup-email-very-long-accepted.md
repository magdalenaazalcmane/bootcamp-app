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
