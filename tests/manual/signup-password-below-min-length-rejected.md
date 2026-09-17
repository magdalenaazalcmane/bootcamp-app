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
