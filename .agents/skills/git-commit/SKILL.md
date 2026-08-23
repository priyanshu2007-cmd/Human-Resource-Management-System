---
name: git-commit
description: Guidelines and best practices for writing Git commit messages using Conventional Commits.
---

# Git Commit Guidelines

When making commits for this project, always adhere to the **Conventional Commits** format.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Allowed Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies (example scopes: npm, vite, webpack)
- `ci`: Changes to our CI configuration files and scripts (example scopes: GitHub Actions, Travis, Circle)
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

## Rules
1. **Use the imperative, present tense**: "add feature" not "added feature" nor "adds feature".
2. **Do not capitalize** the first letter of the description.
3. **No dot (.)** at the end of the description.
4. **Subject Length**: Keep the subject line short (under 50 characters if possible).
5. **Body Wrap**: If providing a body, wrap it at 72 characters. Explain *what* and *why* instead of *how*.

## Example

```
feat(auth): add email verification during signup

This adds an email verification step before the user is fully registered.
It prevents spam accounts from flooding the database.

Resolves: #123
```
