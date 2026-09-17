# Signup is rejected when email is only whitespace [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "   " (three spaces) in the Email field.
2. Enter "validuser1" in the Username field.
3. Enter "Password1" in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected with an error stating the email format is invalid or required. No account is created.

## Severity

Major

## Status

draft
