# Signup rejects a username below the minimum length of 3 characters [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "newuser@example.com" in the Email field.
2. Enter "ab" (2 characters) in the Username field.
3. Enter "Password1" in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected with an error stating the username must be 3-15 characters. No account is created.

## Severity

Minor

## Status

draft
