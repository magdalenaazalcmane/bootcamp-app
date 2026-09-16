# Reordering is rejected when the order array is empty [Test Suites]

## Preconditions

A suite contains at least one case.

## Steps

1. Send PUT /api/suites/:id/reorder with body {"order": []}.

## Expected result

The API responds with status 400 and error "order must be a non-empty array of test case ids". The stored sort order is unchanged.

## Severity

Minor

## Status

draft
