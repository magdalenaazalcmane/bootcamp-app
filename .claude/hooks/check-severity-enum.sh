#!/usr/bin/env bash
# PostToolUse hook: warns (never blocks) when a JS/TS/React file is written or
# edited and contains a word that looks like a wrong severity value.
#
# CLAUDE.md defines severity as exactly: Critical / Major / Minor / Trivial.
# This scans for common wrong-vocabulary words that don't belong in that
# enum — things people reach for out of habit from other bug trackers.
#
# Known false-positive risk: "high"/"medium"/"low" are also this project's
# legitimate bug PRIORITY values (Low/Medium/High/Urgent, a separate, valid
# enum from severity). Editing bug-related files will likely trigger this
# warning even when the code is completely correct — this is a heuristic,
# not a real parser, so it can't tell "severity" usage from "priority" usage.
# Treat every warning as a prompt to double-check, not proof of a bug.

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
  *.js|*.jsx|*.ts|*.tsx) ;;
  *) exit 0 ;;
esac

if [ ! -f "$file_path" ]; then
  exit 0
fi

# Whole-word, case-insensitive matches only, so this doesn't fire on
# substrings inside other words (e.g. "workflow", "allow", "below", "slower").
matches="$(grep -inE '\b(high|medium|low|blocker|cosmetic)\b' "$file_path" || true)"

if [ -n "$matches" ]; then
  # PostToolUse hooks only surface a message in the transcript on exit 2
  # (via stderr) — exit 0's stdout is written to the debug log only and is
  # never shown. The file write itself already happened either way; exit 2
  # here doesn't undo it, it just makes this warning actually visible.
  {
    echo "⚠️  check-severity-enum: possible wrong severity word in ${file_path}"
    echo "   CLAUDE.md severity values are exactly: Critical / Major / Minor / Trivial."
    echo "   Found:"
    echo "$matches" | sed -E 's/^([0-9]+):/  line \1: /'
    echo "   (Heuristic warning — \"high\"/\"medium\"/\"low\" are also valid bug PRIORITY values in this codebase, so this may be a false positive. Verify before treating it as a bug.)"
  } >&2
  exit 2
fi

exit 0
