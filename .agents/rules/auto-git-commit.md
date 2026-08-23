# Automatic Git Commit & Push Rule

Whenever you complete a user request, code modification, feature implementation, or bug fix:
1. Verify the project builds cleanly without errors (`npm run build` or relevant check).
2. Stage modified and created files using `git add`.
3. Commit the changes using **Conventional Commits** format (`feat:`, `fix:`, `refactor:`, `chore:`, etc.).
4. Push the commit to GitHub (`git push origin <current-branch>`).
5. Provide the user with a brief summary of the commit hash and message.
