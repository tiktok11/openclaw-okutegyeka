#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
fi

say() {
  printf "%s\n" "$1"
}

run_or_print() {
  if [ "$DRY_RUN" -eq 1 ]; then
    say "[dry-run] $*"
  else
    say "[run] $*"
    eval "$@"
  fi
}

CURRENT_VERSION=$(node -p "require('./package.json').version")
NEW_VERSION="${NEW_VERSION:-$CURRENT_VERSION}"
SKIP_PROMPT="${SKIP_PROMPT:-0}"

say "ClawPal release assistant"
say "======================================"
say "Current version: ${CURRENT_VERSION}"
say ""

if [ "$SKIP_PROMPT" != "1" ]; then
  read -rp "New version (leave empty to keep ${CURRENT_VERSION}): " INPUT_VERSION
  NEW_VERSION="${INPUT_VERSION:-$NEW_VERSION}"
fi

if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
  say ""
  say "Bumping version: ${CURRENT_VERSION} → ${NEW_VERSION}"

  # package.json
  run_or_print "npm version ${NEW_VERSION} --no-git-tag-version"

  # src-tauri/Cargo.toml (cross-platform, no sed -i portability issue)
  run_or_print "node -e \"const fs=require('fs');const p='src-tauri/Cargo.toml';let t=fs.readFileSync(p,'utf8');t=t.replace(/version = \\\"${CURRENT_VERSION}\\\"/, 'version = \\\"${NEW_VERSION}\\\"');fs.writeFileSync(p,t);\""

  # src-tauri/Cargo.lock (regenerate)
  run_or_print "cd src-tauri && cargo check --quiet"

  say ""
  say "Version bumped to ${NEW_VERSION}"
  if [ "$SKIP_PROMPT" != "1" ]; then
    say "Review changes, then commit before continuing."
    say ""
    read -rp "Press Enter to continue after committing, or Ctrl-C to abort..."
  fi
fi

VERSION="${NEW_VERSION}"

say ""
say "Building ClawPal v${VERSION}..."
say ""

run_or_print "npm run typecheck"
run_or_print "npm run build"
run_or_print "cd src-tauri && cargo fmt --all --check"
run_or_print "cd src-tauri && cargo tauri build"

say ""
say "Local build complete!"
say ""

# ─── Changelog preview ───
PREV_TAG=$(git tag --sort=-v:refname | head -1 2>/dev/null || true)
say "======================================"
say "Changelog (since ${PREV_TAG:-beginning}):"
say "======================================"

if [ -n "$PREV_TAG" ]; then
  COMMITS=$(git log --oneline --no-merges "${PREV_TAG}..HEAD")
else
  COMMITS=$(git log --oneline --no-merges)
fi

FEATURES=""
FIXES=""
OTHER=""

while IFS= read -r line; do
  [ -z "$line" ] && continue
  MSG="${line#* }"
  case "$MSG" in
    feat*) FEATURES="${FEATURES}  - ${MSG}"$'\n' ;;
    fix*)  FIXES="${FIXES}  - ${MSG}"$'\n' ;;
    *)     OTHER="${OTHER}  - ${MSG}"$'\n' ;;
  esac
done <<< "$COMMITS"

[ -n "$FEATURES" ] && say "Features:" && printf "%s" "$FEATURES" && say ""
[ -n "$FIXES" ]    && say "Fixes:"    && printf "%s" "$FIXES"    && say ""
[ -n "$OTHER" ]    && say "Other:"    && printf "%s" "$OTHER"    && say ""

say "======================================"
say ""
say "To publish via GitHub Actions (builds macOS + Windows + Linux):"
say "  git commit -am 'chore: release v${VERSION}'"
say "  git tag v${VERSION}"
say "  git push origin HEAD --tags"
say ""
say "This will trigger .github/workflows/release.yml and create/update a GitHub release with Windows installer assets (.exe/.msi)."
