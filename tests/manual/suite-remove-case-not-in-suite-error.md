# Removing a case that is not in the suite returns an error [Test Suites]

## Preconditions

Test case id 5 is not in suite id 1.

## Steps

1. Send DELETE /api/suites/1/cases/5.

## Expected result

The API responds with status 404 and error "This test case is not in the suite".

## Severity

Minor

## Status

draft
