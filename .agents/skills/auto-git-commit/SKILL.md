---
name: auto-git-commit
description: Automatically stages, validates, formats Conventional Commits, and pushes code changes to GitHub after completing tasks or modifications.
---

# Auto Git Commit & Push Workflow

Use this workflow to reliably commit and push changes to GitHub whenever code modifications, bug fixes, or new features are completed.

## Standard Procedure

Whenever a task or set of file modifications is finished:

### 1. Verify Clean Build & Linting
Ensure no syntax or build errors are introduced before committing:
```bash
npm run build
```

### 2. Inspect Changes
Check modified and untracked files:
```bash
git status
```

### 3. Stage Appropriate Changes
Stage the relevant modified/created files (never stage secrets, credentials, or `.env` files):
```bash
git add <files...>
# Or stage all tracked & untracked project source files:
git add -A
```

### 4. Create Conventional Commit Message
Formulate a descriptive commit message following the Conventional Commits specification:

```
<type>(<scope>): <short description in imperative mood>

[optional body explaining context or rationale]
```

#### Types:
- `feat`: New feature or user-facing functionality
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `style`: Formatting, missing semicolons, styling adjustments
- `perf`: Performance improvement
- `docs`: Documentation updates
- `test`: Adding or updating tests
- `chore`: Maintenance, dependencies, config updates

#### Examples:
```bash
git commit -m "feat(payroll): add printable payslip modal and download action"
git commit -m "fix(attendance): handle edge cases in pagination range queries"
```

### 5. Push to GitHub
Push the committed changes to the current remote branch (e.g. `main`):
```bash
git push origin $(git branch --show-current)
```
