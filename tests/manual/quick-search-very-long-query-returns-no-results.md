# Quick search handles a very long query without errors [Quick Search]

## Preconditions

None.

## Steps

1. Open quick search.
2. Paste a 500-character random string into the search field.
3. Wait for the search to finish.

## Expected result

The modal shows "Searching…" while loading, then "No results for "<the long string>"." The app does not freeze, crash, or log a console error.

## Severity

Major

## Status

draft
