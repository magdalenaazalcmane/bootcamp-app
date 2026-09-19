#!/usr/bin/env bash
# PostToolUse hook: warns (never blocks) when a file under server/routes/ is
# written/edited and appears to send a response that doesn't follow the
# {success, data, error} envelope required by CLAUDE.md.
#
# This is a heuristic, not a real parser: it looks at every response-sending
# call (`res.json(...)`, `res.status(...).json(...)`, `res.send(...)`) and
# checks whether "success", "data", and "error" all appear within a short
# window of lines after it. Route handlers that call a shared helper (like
# this codebase's `ok()`/`fail()`) are unaffected, since the helper's own
# `res.json(...)` call is what gets checked, and it already contains the
# right shape — only a response written to bypass that shape gets flagged.

set -euo pipefail

input="$(cat)"

get_field() {
  if command -v jq >/dev/null 2>&1; then
    echo "$input" | jq -r "$1 // empty" 2>/dev/null
  else
    # Crude fallback if jq isn't available: pull "file_path":"..." out by hand.
    echo "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"file_path"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/'
  fi
}

tool_name="$(get_field '.tool_name')"
file_path="$(get_field '.tool_input.file_path')"

if [ -z "$file_path" ]; then
  exit 0
fi

# Only care about Write/Edit-style tools touching server/routes/*.js.
case "$tool_name" in
  Write|Edit|MultiEdit) ;;
  *) exit 0 ;;
esac

case "$file_path" in
  */server/routes/*.js) ;;
  *) exit 0 ;;
esac

if [ ! -f "$file_path" ]; then
  exit 0
fi

violations=""
window_size=8

# Find every response-sending call site.
line_numbers="$(grep -n '\.json(\|\.send(' "$file_path" | cut -d: -f1 || true)"

if [ -z "$line_numbers" ]; then
  exit 0
fi

total_lines="$(wc -l < "$file_path" | tr -d ' ')"

for line_no in $line_numbers; do
  end_line=$((line_no + window_size))
  if [ "$end_line" -gt "$total_lines" ]; then
    end_line="$total_lines"
  fi
  snippet="$(sed -n "${line_no},${end_line}p" "$file_path")"

  if echo "$snippet" | grep -q 'success' && echo "$snippet" | grep -q 'data' && echo "$snippet" | grep -q 'error'; then
    continue
  fi

  call_line="$(sed -n "${line_no}p" "$file_path" | sed -E 's/^[[:space:]]+//')"
  violations="${violations}  line ${line_no}: ${call_line}\n"
done

if [ -n "$violations" ]; then
  # PostToolUse hooks only surface a message in the transcript on exit 2
  # (via stderr) — exit 0's stdout is written to the debug log only and is
  # never shown. The file write itself already happened either way; exit 2
  # here doesn't undo it, it just makes this warning actually visible.
  {
    echo "⚠️  check-response-shape: possible CLAUDE.md envelope violation in ${file_path}"
    echo "   The following response(s) don't clearly include {success, data, error} nearby:"
    echo -e "$violations"
    echo "   (This is a heuristic warning, not a hard rule — verify manually if the shape is actually correct.)"
  } >&2
  exit 2
fi

exit 0
