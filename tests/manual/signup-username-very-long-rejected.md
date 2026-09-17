# Signup rejects a very long username far beyond the maximum length [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "newuser@example.com" in the Email field.
2. Enter a 100-character username with no spaces in the Username field.
3. Enter "Password1" in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected with an error stating the username must be 3-15 characters. No account is created.

## Severity

Minor

## Status

draft
