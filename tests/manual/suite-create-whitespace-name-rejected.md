# Creating a suite is rejected when name is whitespace only [Test Suites]

## Preconditions

The user is on the /test-suites page with the "+ New suite" form open.

## Steps

1. Enter "   " (spaces only) in the Name field.
2. Enter "checkout" in the Feature field.
3. Click "Save".

## Expected result

The form shows "Name is required." and no suite is created.

## Severity

Minor

## Status

draft
