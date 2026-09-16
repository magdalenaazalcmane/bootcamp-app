# Suite can be created with a very long name and feature [Test Suites]

## Preconditions

The user is on the /test-suites page with the "+ New suite" form open.

## Steps

1. Enter a 5,000-character string in the Name field.
2. Enter a 5,000-character string in the Feature field.
3. Click "Save".

## Expected result

The suite is created successfully with the full name and feature text preserved, with no truncation or error, since no max length is enforced.

## Severity

Minor

## Status

draft
