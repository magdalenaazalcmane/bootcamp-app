# Creating a suite via the API without a name field is rejected [Test Suites]

## Preconditions

None.

## Steps

1. Send POST /api/suites with body {"feature": "checkout"} (no "name" field).

## Expected result

The API responds with status 400 and error "name is required". No suite is created.

## Severity

Minor

## Status

draft
