#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
FIXTURE_ROOT=$(mktemp -d)
trap 'rm -rf "$FIXTURE_ROOT"' EXIT
export RESULTS_DIR="$FIXTURE_ROOT/results"
. "$SCRIPT_DIR/lib.sh"

fixture() {
  local name=$1
  mkdir "$FIXTURE_ROOT/$name"
  cd "$FIXTURE_ROOT/$name"
  git init -q
  git config user.name "Workshop fixture"
  git config user.email "fixture@example.invalid"
  git config commit.gpgsign false
  mkdir -p src/api tests/api src/front docs
  printf '.copilot-tracking/\n' > .gitignore
  printf 'baseline\n' > src/api/Program.cs
  git add .
  git commit -qm baseline
  BASE=$(git rev-parse HEAD)
}

equal() {
  if [ "$1" != "$2" ]; then
    printf 'Expected <%s>, got <%s>\n' "$2" "$1" >&2
    exit 1
  fi
}

fixture committed
printf 'implementation\n' >> src/api/Program.cs
git add .
git commit -qm implementation
equal "$(implementation_changes_since "$BASE")" src/api/Program.cs
equal "$(git status --porcelain)" ""
echo "pass: committed implementation detected on clean tree"

fixture unstaged
printf 'implementation\n' >> src/api/Program.cs
equal "$(implementation_changes_since "$BASE")" src/api/Program.cs
echo "pass: unstaged implementation detected"

fixture staged
printf 'API tests\n' > tests/api/PlaylistTests.cs
git add .
equal "$(implementation_changes_since "$BASE")" tests/api/PlaylistTests.cs
echo "pass: staged implementation detected"

fixture untracked
printf 'front end\n' > src/front/App.tsx
equal "$(implementation_changes_since "$BASE")" src/front/App.tsx
echo "pass: untracked implementation detected"

fixture mixed
printf 'implementation\n' >> src/api/Program.cs
git add .
git commit -qm implementation
printf 'API tests\n' > tests/api/PlaylistTests.cs
equal "$(implementation_changes_since "$BASE")" $'src/api/Program.cs\ntests/api/PlaylistTests.cs'
echo "pass: committed and untracked implementation detected together"

fixture no_changes
equal "$(implementation_changes_since "$BASE")" ""
echo "pass: empty implementation not accepted"

fixture notes_only
mkdir .copilot-tracking
printf 'notes\n' > .copilot-tracking/notes.md
equal "$(implementation_changes_since "$BASE")" ""
echo "pass: ignored notes not accepted as implementation"

fixture unrelated
printf 'unrelated\n' > docs/notes.md
git add .
git commit -qm unrelated
equal "$(implementation_changes_since "$BASE")" ""
echo "pass: unrelated commits not accepted as implementation"

if implementation_changes_since invalid-baseline > "$FIXTURE_ROOT/invalid.log" 2>&1; then
  echo "invalid baseline must fail" >&2
  exit 1
fi
echo "pass: invalid baseline remains a failure"

fixture clean_checkpoint
export -f commit_checkpoint
step fixture checkpoint "Already committed" translated 30 'commit_checkpoint "checkpoint"'
equal "$STEP_CODE" 0
equal "$(git rev-parse HEAD)" "$BASE"
echo "pass: clean checkpoint succeeds without an empty commit through step runner"

fixture dirty_checkpoint
printf 'implementation\n' >> src/api/Program.cs
commit_checkpoint checkpoint > "$FIXTURE_ROOT/dirty.log" 2>&1
equal "$(git status --porcelain)" ""
equal "$(git rev-list --count "$BASE"..HEAD)" 1
echo "pass: pending implementation committed"

fixture staging_error
if (
  git() {
    if [ "$1" = add ]; then return 73; fi
    command git "$@"
  }
  commit_checkpoint checkpoint
) > "$FIXTURE_ROOT/staging-error.log" 2>&1; then
  echo "staging error must fail" >&2
  exit 1
else
  equal "$?" 73
fi
equal "$(git rev-parse HEAD)" "$BASE"
echo "pass: staging error propagated"

fixture index_error
if (
  git() {
    if [ "$1" = diff ]; then return 74; fi
    command git "$@"
  }
  commit_checkpoint checkpoint
) > "$FIXTURE_ROOT/index-error.log" 2>&1; then
  echo "index comparison error must fail" >&2
  exit 1
else
  equal "$?" 74
fi
echo "pass: index comparison error propagated"

fixture commit_error
printf 'implementation\n' >> src/api/Program.cs
printf '#!/bin/sh\nexit 1\n' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
if commit_checkpoint checkpoint > "$FIXTURE_ROOT/commit-error.log" 2>&1; then
  echo "commit error must fail" >&2
  exit 1
fi
equal "$(git rev-parse HEAD)" "$BASE"
if git diff --cached --quiet; then
  echo "failed commit must leave staged changes" >&2
  exit 1
fi
echo "pass: rejected commit remains failed with staged changes intact"

step failed_check "Validation fixture" "Failed check" translated 30 'true'
check "intentional failing check" false
finish_step
equal "$STEP_FAILED" 1
step next_step "Validation fixture" "Next step resets failure state" translated 30 'true'
finish_step
equal "$STEP_FAILED" 0
echo "pass: validation failures gate dependent steps and reset for the next step"
