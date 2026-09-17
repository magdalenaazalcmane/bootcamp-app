# Signup is rejected when email has no local part [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "@example.com" in the Email field.
2. Enter "validuser1" in the Username field.
3. Enter "Password1" in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected with an error stating the email format is invalid. No account is created.

## Severity

Major

## Status

draft
