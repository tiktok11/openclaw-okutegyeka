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

VERSION=$(node -p "require('./package.json').version")

say "ClawPal v${VERSION} release assistant"
say "======================================"

run_or_print "npm run typecheck"
run_or_print "npm run build"
run_or_print "cd src-tauri && cargo fmt --all --check"
run_or_print "cd src-tauri && cargo tauri build"

say ""
say "Local build complete!"
say ""
say "To publish via GitHub Actions (builds macOS + Windows + Linux):"
say "  git tag v${VERSION}"
say "  git push origin v${VERSION}"
say ""
say "This will trigger .github/workflows/release.yml and create a draft release."
