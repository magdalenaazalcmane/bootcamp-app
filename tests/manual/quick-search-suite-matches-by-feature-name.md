# Quick search matches suites by feature name as well as suite name [Quick Search]

## Preconditions

A suite named "Sprint 12 Regression" exists with its feature field set to "Checkout". No suite has "Checkout" in its name.

## Steps

1. Open quick search.
2. Type "Checkout".
3. Wait for the search results to load.

## Expected result

"Sprint 12 Regression" appears in the "Test suites" group, because its feature field matches even though its name doesn't contain the term.

## Severity

Major

## Status

draft
