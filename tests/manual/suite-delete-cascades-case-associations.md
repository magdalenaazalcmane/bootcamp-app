# Deleting a suite removes its case associations [Test Suites]

## Preconditions

A suite exists with at least two test cases added to it.

## Steps

1. Note the suite's id and the test case ids in it.
2. Delete the suite and confirm the deletion.
3. Send GET /api/suites/:id for the deleted suite id.
4. Attempt to add one of the previously-linked test case ids to a different, existing suite.

## Expected result

GET /api/suites/:id returns a 404 "Suite not found" error for the deleted suite. No orphaned rows remain for that suite id in the suite/case association data (the foreign key cascade removes them). The test cases themselves still exist and can be added to another suite normally.

## Severity

Critical

## Status

draft
