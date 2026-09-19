# qa-plugin

## Overview

A portable QA workflow toolkit for Claude Code, bundled in this same repo
(top level, alongside `client/` and `server/`) rather than as a separate
project: manual test case and bug report authoring, ISTQB-style test
generation, QA/accessibility review, flaky-test root-causing, release
notes, daily logs, and CLAUDE.md compliance hooks — as commands, skills,
agents, and hooks you can drop into any project.

The app this plugin was built alongside — a test-case/bug-tracker tool —
lives in `client/` and `server/` in this same repo; see `docs/APP.md` for
its own setup, run, and deploy instructions.

This bundle mirrors what's actively used to build that app, kept in
`.claude/` at the project root (that copy is this project's own live
config — see `.claude/settings.json`). The copies here under `agents/`,
`commands/`, `skills/`, and `hooks/` are the same content, packaged the way
Claude Code expects a distributable plugin to be laid out, so it can be
installed into a different project too.

## Installation

1. Copy (or symlink) this repo — or just the plugin files (`.claude-plugin/`,
   `agents/`, `commands/`, `skills/`, `hooks/`) — into your Claude Code
   plugins location, or add it to a plugin marketplace your team uses.
2. Enable it for a project the way you'd enable any other Claude Code
   plugin (see the [Claude Code plugin docs](https://docs.claude.com/en/docs/claude-code/plugins) for your setup).
3. **Requirement:** several pieces here (`test-writer`, `qa-reviewer`,
   `test-generator`, `qa-review`, `flake-analyzer`) read a `CLAUDE.md` at
   your project root and depend on it defining:
   - Severity levels: `Critical` / `Major` / `Minor` / `Trivial`
   - A test case shape: title, preconditions, steps, expected result,
     severity, status
   - An API response envelope (only relevant if you use
     `check-response-shape.sh`)

   Without a compatible `CLAUDE.md`, these will still run, but their output
   won't match your project's actual conventions. If your project has no
   `CLAUDE.md` yet, write one first (or ask Claude to draft one) using the
   shape above.

No other setup is required — nothing here calls an external API or needs
credentials.

## What's Included

| Type | Name | What it does |
|---|---|---|
| Command | `/new-test` | Asks 3 questions + a severity, saves one manual test case under `tests/manual/`. |
| Command | `/bug-report` | Asks 5 questions, saves one bug report under `tests/bugs/`. |
| Command | `/daily-log` | Asks 3 questions, saves/overwrites today's log under `logs/daily/`. |
| Agent | `test-writer` | Given a feature description, writes a full ISTQB-style test suite (happy path, boundaries, negatives) as files under `tests/manual/`. |
| Agent | `qa-reviewer` | Reviews code/a feature from a tester's angle (read-only) and reports a severity-grouped list of what could break. |
| Agent | `release-notes-writer` | Turns a list of changes into plain-language release notes grouped into Added/Improved/Fixed/Known issues, saved under `release-notes/`. |
| Agent | `flake-analyzer` | Given a flaky test's title and pass/fail history, root-causes *why* it's flaky — grounded in the actual test steps and code, not a generic list. |
| Skill | `test-generator` | The ISTQB boundary-value methodology `test-writer` and `/new-test` follow — also loads on its own for ad hoc "write test cases for X" requests. |
| Skill | `qa-review` | The QA-review methodology `qa-reviewer` follows — also loads on its own for ad hoc "what could break here" requests. |
| Skill | `code-explainer` | Explains code or a diff in plain, non-technical language, with a QA angle for diffs (what to test as a result of the change). |
| Hook | `check-response-shape.sh` (PostToolUse) | Warns if an edited `server/routes/` file sends a response that doesn't follow the `{success, data, error}` envelope. |
| Hook | `check-severity-enum.sh` (PostToolUse) | Warns if an edited file uses a severity word outside `Critical`/`Major`/`Minor`/`Trivial`. |
| Hook | `check-flake-recompute.sh` (PostToolUse) | Warns if an edited `server/routes/` file writes a test result without also calling the shared flake-detection check. |
| Hook | `session-summary.sh` (SessionEnd) | Writes a plain-language summary of the session to `logs/sessions/<timestamp>.md`. |

All three PostToolUse hooks are warn-only (they never block a write), since
they're heuristics, not real parsers — see the comments at the top of each
script for known false-positive cases.

## Usage Examples

Both examples below are real output already sitting in this repo — not
constructed samples.

- **[`examples/bug-report-command.md`](examples/bug-report-command.md)** —
  the `/bug-report` command's actual saved output
  (`tests/bugs/2026-09-09-test.md`).
- **[`examples/test-generator-output.md`](examples/test-generator-output.md)** —
  a representative slice of a real 27-file ISTQB test suite the
  `test-generator` skill / `test-writer` agent produced for a signup form
  (`tests/manual/signup-*.md`).
