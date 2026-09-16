# User can reorder suite cases by drag-and-drop [Test Suites]

## Preconditions

A suite contains at least 3 cases in a known order: A, B, C.

## Steps

1. Open the suite's detail page.
2. Press and hold the drag handle on the row for case C.
3. Drag it and drop it above the row for case A.

## Expected result

The table immediately shows the new order (C, A, B), and the change is saved (the PUT /:id/reorder request succeeds).

## Severity

Major

## Status

draft
