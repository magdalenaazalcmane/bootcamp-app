# Suite detail page shows an error for a non-existent suite id [Test Suites]

## Preconditions

No suite exists with id 999999.

## Steps

1. Navigate directly to /test-suites/999999.

## Expected result

The page shows an error message (from the "Suite not found" API response) instead of a blank page or a crash.

## Severity

Major

## Status

draft
