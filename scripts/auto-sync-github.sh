#!/bin/bash

# Auto Git Sync Daemon
# Runs every 2 minutes (120s), checks for changes, commits, and pushes to GitHub.

INTERVAL=120
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR" || exit 1

echo "=================================================="
echo "🚀 Dayflow Auto Git Sync Daemon Started"
echo "📂 Repository: $PROJECT_DIR"
echo "⏱️  Interval: Every 2 minutes (${INTERVAL}s)"
echo "=================================================="

while true; do
  # Get current branch
  BRANCH=$(git branch --show-current)
  if [ -z "$BRANCH" ]; then
    BRANCH="main"
  fi

  # Check for modified, deleted, or untracked files
  STATUS=$(git status --porcelain)

  if [ -n "$STATUS" ]; then
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    echo ""
    echo "[$TIMESTAMP] 🔍 Changes detected. Preparing auto-commit..."
    
    # Stage all changes
    git add -A

    # Summary of modified files count
    CHANGES_COUNT=$(git status --porcelain | wc -l | tr -d ' ')
    
    COMMIT_MSG="chore(auto-sync): auto commit changes ($CHANGES_COUNT files) at $TIMESTAMP"

    git commit -m "$COMMIT_MSG"
    
    echo "[$TIMESTAMP] 📤 Pushing to origin/$BRANCH..."
    if git push origin "$BRANCH"; then
      echo "[$TIMESTAMP] ✅ Successfully synced code to GitHub (branch: $BRANCH)."
    else
      echo "[$TIMESTAMP] ⚠️  Push failed. Will retry next cycle in 2 minutes."
    fi
  else
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$TIMESTAMP] 💤 No changes detected. Waiting 2 minutes..."
  fi

  sleep $INTERVAL
done
