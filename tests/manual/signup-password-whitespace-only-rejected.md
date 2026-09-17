# Signup is rejected when password is only whitespace [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "newuser@example.com" in the Email field.
2. Enter "validuser1" in the Username field.
3. Enter "        " (8 spaces) in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected, since the value contains no digit. No account is created.

## Severity

Minor

## Status

draft
