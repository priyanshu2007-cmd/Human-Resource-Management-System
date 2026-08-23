---
name: auto-git-sync
description: Runs a continuous background sync daemon that checks every 1 minute for changes, stages them, creates Conventional Commits with timestamps, and pushes them to GitHub.
---

# Auto Git Sync (1-Minute Recurring Upload)

This skill manages continuous, automated syncing of project code to GitHub every 1 minute.

## How it works

1. **Daemon Script:** [`scripts/auto-sync-github.sh`](file:///Users/priyanshu/Documents/Odoo/scripts/auto-sync-github.sh)
2. **Frequency:** Runs every 60 seconds (1 minute).
3. **Behavior:**
   - Detects all created, modified, or deleted files.
   - Automatically stages changes (`git add -A`).
   - Commits with a structured conventional commit message: `chore(auto-sync): auto commit changes (N files) at YYYY-MM-DD HH:MM:SS`.
   - Pushes to the current active branch on GitHub (`origin/main`).

## Starting the Sync Daemon

You can run the auto-sync daemon at any time in the terminal with:
```bash
npm run sync
```
Or directly:
```bash
bash scripts/auto-sync-github.sh
```

## Running as Background Daemon
To run in the background:
```bash
nohup npm run sync > .sync.log 2>&1 &
```
