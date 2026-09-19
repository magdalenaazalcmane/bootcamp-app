# Tab key cycles focus within the quick search modal [Quick Search]

## Preconditions

The quick search modal is open and a search has returned at least one result, so the modal contains multiple focusable elements (the input and result buttons).

## Steps

1. Type a term that returns at least one result.
2. Press Tab repeatedly until focus reaches the last focusable element in the modal (the last result button).
3. Press Tab once more.
4. From the search input (first focusable element), press Shift+Tab.

## Expected result

After step 3, focus wraps back to the search input instead of leaving the modal. After step 4, focus wraps to the last focusable element in the modal.

## Severity

Minor

## Status

draft
