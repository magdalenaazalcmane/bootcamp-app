#!/usr/bin/env bash
# PostToolUse hook: warns (never blocks) when a file under server/routes/ is
# written/edited and writes to test_run_results without also referencing the
# shared flake-detection path from server/lib/flakiness.js.
#
# This is a heuristic, not a real parser: it looks for
# `UPDATE test_run_results` / `INSERT INTO test_run_results` in the file, and
# if found, checks whether the file also mentions `checkNewlyFlaky` or
# `getFlakeLeaderboard` anywhere. If a route writes a result but never calls
# either, flake detection silently stops working for that write path.
#
# Deliberately scoped to server/routes/ only (not server/db.js) — db.js's
# seed data writes to test_run_results directly and on purpose skips flake
# detection (seeding shouldn't fire a live Discord alert), the same kind of
# documented, intentional exception check-response-shape.sh already has for
# non-route files.

set -euo pipefail

input="$(cat)"

get_field() {
  if command -v jq >/dev/null 2>&1; then
    echo "$input" | jq -r "$1 // empty" 2>/dev/null
  else
    echo "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"file_path"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/'
  fi
}

tool_name="$(get_field '.tool_name')"
file_path="$(get_field '.tool_input.file_path')"

if [ -z "$file_path" ]; then
  exit 0
fi

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

if ! grep -qE 'UPDATE[[:space:]]+test_run_results|INSERT[[:space:]]+INTO[[:space:]]+test_run_results' "$file_path"; then
  exit 0
fi

if grep -q 'checkNewlyFlaky\|getFlakeLeaderboard' "$file_path"; then
  exit 0
fi

{
  echo "⚠️  check-flake-recompute: ${file_path} writes to test_run_results but never references"
  echo "   checkNewlyFlaky or getFlakeLeaderboard (server/lib/flakiness.js) — flake detection may"
  echo "   silently not run for this write path."
  echo "   (This is a heuristic warning, not a hard rule — verify manually if this is intentional.)"
} >&2
exit 2
