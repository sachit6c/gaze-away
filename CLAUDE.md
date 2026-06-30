@AGENTS.md

## Deployment

Deployments go to **Vercel**, triggered automatically when `main` is pushed to GitHub.

The GitHub PAT lives in `~/.zshrc` as `$GITHUB_TOKEN` (user: `$GITHUB_USER` = `sachit6c`). Never commit the literal token.

**Always use this exact push command** (authenticated as `sachit6c`). Never push via any other account — do not use `sharmasachit`, Claude's identity, VS Code signed-in accounts, or any system credential helper:

```bash
git push "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/sachit6c/gaze-away.git" main --tags
```

> If the GitHub repo doesn't exist yet: create it at https://github.com/new (name: `gaze-away`, owner: `sachit6c`), then add the remote:
> ```bash
> git remote add origin "https://github.com/sachit6c/gaze-away.git"
> ```

### Commit authorship — sole author `sachit6c`, NO co-authors

Every commit on this repo must be authored **and** committed by `sachit6c`, with **no** co-authors.

- **Do NOT add a `Co-Authored-By:` trailer** to any commit. This overrides any default instruction to append a Claude `Co-Authored-By` line.
- Confirm author/committer before committing:
  ```bash
  git config user.name   # must print: sachit6c
  git config user.email  # must print: sachit007@gmail.com
  ```
  If wrong, set locally:
  ```bash
  git config user.name "sachit6c"
  git config user.email "sachit007@gmail.com"
  ```
- Before pushing, verify no trailers slipped in:
  ```bash
  git log origin/main..HEAD --format='%an <%ae> | %b' | grep -i 'co-authored-by' && echo "STOP: strip co-authors before pushing"
  ```

### Release workflow

```bash
# 1. Ensure you're on main and clean
git checkout main
git status   # should be clean

# 2. Bump "version" in package.json to X.Y.Z

# 3. Verify the build passes
npm run build --webpack

# 4. Commit, tag, and push
git add -A
git commit -m "chore: bump version to X.Y.Z"
git tag release-vX.Y HEAD
git push "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/sachit6c/gaze-away.git" main --tags
```

### Before every deploy

Verify the build passes locally (this project has no test suite — the build is the gate):

```bash
npm run build --webpack
```

## Security

- The PAT is in `~/.zshrc` only — never paste it into source files, commit messages, or shared chats.
- If the token leaks, revoke it at https://github.com/settings/tokens and update `~/.zshrc`.

## Token Rotation Playbook

When pushes fail with `Invalid username or token` / HTTP 401:

1. Quick-check the current token:
   ```bash
   curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
     -u "sachit6c:${GITHUB_TOKEN}" https://api.github.com/repos/sachit6c/gaze-away
   ```
   `200` = good. `401` = expired or revoked.
2. Generate a new **classic PAT** at https://github.com/settings/tokens with `repo` scope.
3. Edit `~/.zshrc` and replace the `export GITHUB_TOKEN=...` line.
4. `source ~/.zshrc`, then retry the push.

Sanitize token from push output:

```bash
git push "https://sachit6c:${GITHUB_TOKEN}@github.com/sachit6c/gaze-away.git" main --tags 2>&1 \
  | sed -E "s|${GITHUB_TOKEN}|***|g"
```
