# Suite detail page lists cases in saved sort order [Test Suites]

## Preconditions

A suite exists with 3 cases in a known sort order (e.g. previously reordered).

## Steps

1. Navigate to the suite's detail page.
2. Observe the order of rows in the cases table.

## Expected result

The cases appear in the same order as their stored sort order, matching the order returned by GET /api/suites/:id.

## Severity

Major

## Status

draft
