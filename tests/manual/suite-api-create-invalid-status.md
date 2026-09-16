# Creating a suite via the API with an invalid status value is rejected [Test Suites]

## Preconditions

None.

## Steps

1. Send POST /api/suites with body {"name": "Checkout suite", "feature": "checkout", "status": "archived"}.

## Expected result

The API responds with status 400 and error "status must be one of draft, ready, in-progress, passed, failed". No suite is created.

## Severity

Minor

## Status

draft
