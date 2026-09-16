# Reordering is rejected when the order array contains an id not in the suite [Test Suites]

## Preconditions

A suite contains test case ids [1, 2, 3]. Test case id 99 is not in the suite.

## Steps

1. Send PUT /api/suites/:id/reorder with body {"order": [1, 2, 3, 99]}.

## Expected result

The API responds with status 400 and error "order must contain exactly the test case ids currently in the suite". The stored sort order is unchanged.

## Severity

Major

## Status

draft
