# Signup is rejected when username is only whitespace [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "newuser@example.com" in the Email field.
2. Enter "   " (3 spaces) in the Username field.
3. Enter "Password1" in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected, since the value contains spaces and has no non-space characters. No account is created.

## Severity

Minor

## Status

draft
