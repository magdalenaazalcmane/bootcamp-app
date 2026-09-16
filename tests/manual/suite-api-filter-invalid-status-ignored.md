# Filtering suites via the API with an invalid status value returns the unfiltered list [Test Suites]

## Preconditions

At least one suite exists.

## Steps

1. Send GET /api/suites?status=bogus.

## Expected result

The API responds with status 200 and returns all suites; the invalid status filter is silently ignored rather than causing an error or an empty list.

## Severity

Minor

## Status

draft
