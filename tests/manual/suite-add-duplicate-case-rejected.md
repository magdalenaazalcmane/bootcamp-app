# Adding a test case already in the suite is rejected [Test Suites]

## Preconditions

A suite already contains test case id 1.

## Steps

1. Send POST /api/suites/:id/cases with body {"test_case_id": 1}, where :id is the suite that already contains test case 1.

## Expected result

The API responds with status 400 and body { "success": false, "data": null, "error": "This test case is already in the suite" }. The case is not duplicated in the suite.

## Severity

Major

## Status

draft
