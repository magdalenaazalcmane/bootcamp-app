# Signup rejects a password above the maximum length of 20 characters [Signup]

## Preconditions

The user is on the signup page.

## Steps

1. Enter "newuser@example.com" in the Email field.
2. Enter "validuser1" in the Username field.
3. Enter "Passw0rdPassw0rd12345" (21 characters, contains numbers) in the Password field.
4. Click "Sign up".

## Expected result

Signup is rejected with an error stating the password must be 8-20 characters. No account is created.

## Severity

Minor

## Status

draft
