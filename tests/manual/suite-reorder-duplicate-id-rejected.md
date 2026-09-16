# Reordering is rejected when the order array contains a duplicate id [Test Suites]

## Preconditions

A suite contains test case ids [1, 2].

## Steps

1. Send PUT /api/suites/:id/reorder with body {"order": [1, 1]}.

## Expected result

The API responds with status 400 and error "order must contain exactly the test case ids currently in the suite". The stored sort order is unchanged.

## Severity

Major

## Status

draft
