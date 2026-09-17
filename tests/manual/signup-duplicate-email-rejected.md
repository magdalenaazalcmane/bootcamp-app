# Signup is rejected when the email is already registered [Signup]

## Preconditions

An account already exists with the email "existing@example.com".

## Steps

1. Enter "existing@example.com" in the Email field.
2. Enter "newuser2" in the Username field.
3. Enter "Password1" in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected with an error stating the email is already in use. No new account is created.

## Severity

Major

## Status

draft
