# Requesting a non-existent suite id via the API returns a 404 error [Test Suites]

## Preconditions

No suite exists with id 999999.

## Steps

1. Send GET /api/suites/999999.

## Expected result

The API responds with status 404 and body { "success": false, "data": null, "error": "Suite not found" }.

## Severity

Minor

## Status

draft
