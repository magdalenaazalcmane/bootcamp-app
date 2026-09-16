# A failed reorder request rolls back the case order shown in the UI [Test Suites]

## Preconditions

A suite has cases in a known order. The network can be made to fail for the reorder call (e.g. via browser dev tools request blocking).

## Steps

1. Open the suite's detail page.
2. Block or simulate a failure of the PUT /:id/reorder request.
3. Drag a case row to a new position and drop it.

## Expected result

The table briefly shows the new order, then reverts to the original order, and an error alert is shown to the user.

## Severity

Minor

## Status

draft
