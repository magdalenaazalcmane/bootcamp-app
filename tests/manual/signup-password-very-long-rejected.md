# Signup rejects a very long password far beyond the maximum length [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "newuser@example.com" in the Email field.
2. Enter "validuser1" in the Username field.
3. Enter a 100-character password containing at least one number in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected with an error stating the password must be 8-20 characters. No account is created.

## Severity

Minor

## Status

draft
