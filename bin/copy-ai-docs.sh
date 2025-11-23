#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGGING_DIR="$REPO_ROOT/logging"
GITMODULES="$REPO_ROOT/.gitmodules"

if [ ! -d "$LOGGING_DIR" ]; then
  echo "logging directory not found at $LOGGING_DIR"
  exit 1
fi
if [ ! -f "$LOGGING_DIR/AGENTS.md" ]; then
  echo "AGENTS.md not found in logging"
  exit 1
fi
if [ ! -d "$LOGGING_DIR/workdocs/ai" ]; then
  echo "logging/workdocs/ai not found"
  exit 1
fi

if [ ! -f "$GITMODULES" ]; then
  echo ".gitmodules not found at $GITMODULES"
  exit 1
fi

# parse paths from .gitmodules
paths=$(grep "path =" "$GITMODULES" | sed -E 's/^[[:space:]]*path = //')

echo "Found submodule paths:"
echo "$paths"

for p in $paths; do
  # skip logging itself
  if [ "$p" = "logging" ]; then
    echo "Skipping logging"
    continue
  fi

  target="$REPO_ROOT/$p"
  if [ ! -d "$target" ]; then
    echo "Target submodule path does not exist locally: $target (skipping)"
    continue
  fi

  echo "Updating $p..."

  # backup existing AGENTS.md if present
  if [ -f "$target/AGENTS.md" ]; then
    cp "$target/AGENTS.md" "$target/AGENTS.md.bak-$(date +%Y%m%d%H%M%S)" || true
  fi
  cp "$LOGGING_DIR/AGENTS.md" "$target/AGENTS.md"

  # copy workdocs/ai
  mkdir -p "$target/workdocs/ai"
  # backup existing ai folder if present
  if [ -d "$target/workdocs/ai" ]; then
    # we already ensured folder exists; move previous to backup only if it has files
    if [ -n "$(ls -A "$target/workdocs/ai" 2>/dev/null)" ]; then
      mv "$target/workdocs/ai" "$target/workdocs/ai.bak-$(date +%Y%m%d%H%M%S)" || true
      mkdir -p "$target/workdocs/ai"
    fi
  fi

  # copy files
  cp -r "$LOGGING_DIR/workdocs/ai/." "$target/workdocs/ai/"

  echo "Updated $p"
done

echo "All done."
mpts