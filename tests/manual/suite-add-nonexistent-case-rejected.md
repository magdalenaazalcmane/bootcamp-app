# Adding a non-existent test case id is rejected [Test Suites]

## Preconditions

No test case exists with id 999999.

## Steps

1. Send POST /api/suites/:id/cases with body {"test_case_id": 999999}.

## Expected result

The API responds with status 404 and error "Test case not found". The suite's case list is unchanged.

## Severity

Major

## Status

draft
