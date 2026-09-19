# Quick search clears results and stays usable when a search request fails [Quick Search]

## Preconditions

Ability to simulate a failing API response (e.g. the test cases, bugs, or suites endpoint returns an error) for the duration of the test.

## Steps

1. Open quick search.
2. Type a search term while one of the underlying endpoints is failing.
3. Wait for the request to settle.

## Expected result

The modal stops showing "Searching…", displays no result groups, and does not show an unhandled error or crash the page. The search field remains usable for further input.

## Severity

Major

## Status

draft
