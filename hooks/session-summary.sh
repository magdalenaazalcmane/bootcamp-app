#!/usr/bin/env bash
# SessionEnd hook: writes a short, plain-language summary of what happened in
# the session to logs/sessions/<timestamp>.md.
#
# Unlike PostToolUse, this can't print anything visible in the terminal at
# all — by the time SessionEnd fires, the session is already closing, so
# there's no live transcript left to show a message in (this is true no
# matter what exit code is used; SessionEnd can't block termination either,
# it's purely informational). Writing to a file is the only way to actually
# read this afterward.

set -euo pipefail

input="$(cat)"

get_field() {
  if command -v jq >/dev/null 2>&1; then
    echo "$input" | jq -r "$1 // empty" 2>/dev/null
  else
    echo ""
  fi
}

session_id="$(get_field '.session_id')"
transcript_path="$(get_field '.transcript_path')"
cwd="$(get_field '.cwd')"
reason="$(get_field '.reason')"

project_dir="${CLAUDE_PROJECT_DIR:-${cwd:-$(pwd)}}"
out_dir="$project_dir/logs/sessions"
mkdir -p "$out_dir"

timestamp="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
out_file="$out_dir/${timestamp}.md"

files_changed=""
action_list=""
tool_count=0

if command -v jq >/dev/null 2>&1 && [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
  files_changed="$(
    jq -r '
      select(.type == "assistant") | .message.content[]? |
      select(.type == "tool_use" and (.name == "Write" or .name == "Edit" or .name == "MultiEdit")) |
      .input.file_path // empty
    ' "$transcript_path" 2>/dev/null | sed "s|^${project_dir}/||" | sort -u
  )"

  action_list="$(
    jq -r '
      select(.type == "assistant") | .message.content[]? |
      select(.type == "tool_use" and .name == "Bash") |
      .input.description // empty
    ' "$transcript_path" 2>/dev/null | tail -15
  )"

  tool_count="$(
    jq -r '
      select(.type == "assistant") | .message.content[]? |
      select(.type == "tool_use") | .name
    ' "$transcript_path" 2>/dev/null | wc -l | tr -d ' '
  )"
fi

{
  echo "# Session summary — ${timestamp}"
  echo
  echo "Ended: $(date -u +"%Y-%m-%d %H:%M UTC") (${reason:-unknown reason})"
  echo "Tool calls this session: ${tool_count:-0}"
  echo
  echo "## Files changed"
  if [ -n "$files_changed" ]; then
    echo "$files_changed" | sed 's/^/- /'
  else
    echo "- none detected"
  fi
  echo
  echo "## Key actions taken"
  if [ -n "$action_list" ]; then
    echo "$action_list" | sed 's/^/- /'
  else
    echo "- none detected"
  fi
} > "$out_file"

exit 0
