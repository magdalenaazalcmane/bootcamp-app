# Creating a suite via the API with a non-string name value is handled without a server crash [Test Suites]

## Preconditions

None.

## Steps

1. Send POST /api/suites with body {"name": 12345, "feature": "checkout"}.

## Expected result

The API returns a clean 400 validation error in the standard { "success": false, "data": null, "error": "..." } shape, without an unhandled server exception or a 500 response.

## Severity

Major

## Status

draft
