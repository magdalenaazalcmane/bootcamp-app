# Signup rejects a password with no digit [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "newuser@example.com" in the Email field.
2. Enter "validuser1" in the Username field.
3. Enter "PasswordOnly" (12 characters, no digit) in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected with an error stating the password must contain at least one number. No account is created.

## Severity

Major

## Status

draft
