# Release Guide

This guide explains how to release a new version of `@k67/kaitai-struct-ts`.

## Prerequisites

- Write access to the repository
- Bypass permission for the `main` branch protection (for pushing version bump commits)
- Permission to create tags matching `v*` pattern

## Release Process

### 1. Ensure Clean State

Make sure you're on the latest `main` branch with no uncommitted changes:

```bash
git checkout main
git pull origin main
git status  # Should show "nothing to commit, working tree clean"
```

### 2. Run Changeset Version

This command will:
- Consume all changeset files in `.changeset/`
- Update `package.json` version
- Update `CHANGELOG.md` with all changes
- Delete processed changeset files

```bash
pnpm changeset:version
```

**Review the changes:**
- Check the new version in `package.json`
- Review the `CHANGELOG.md` entries
- Verify changeset files were removed

### 3. Commit Version Bump

```bash
# Stage all changes
git add .

# Commit with version number
git commit -m "chore: release v$(node -p "require('./package.json').version")"

# Or manually specify version
git commit -m "chore: release v0.x.x"
```

### 4. Create and Push Tag

```bash
# Get the version from package.json
VERSION=$(node -p "require('./package.json').version")

# Create tag
git tag "v${VERSION}"

# Push commit and tag together
git push origin main "v${VERSION}"
```

**Alternative (manual version):**
```bash
git tag v0.x.x
git push origin main v0.x.x
```

### 5. Monitor the Release

The tag push will automatically trigger the publish workflow:

1. Go to [Actions → Publish to NPM](https://github.com/fabianopinto/kaitai-struct-ts/actions/workflows/publish.yml)
2. Watch the workflow run
3. Verify all steps pass:
   - ✅ Branch validation (ensures tag is on main)
   - ✅ Lint
   - ✅ Type check
   - ✅ Tests
   - ✅ Build
   - ✅ Publish to NPM
   - ✅ Create GitHub Release

### 6. Verify Publication

After the workflow completes:

**Check NPM:**
```bash
npm view @k67/kaitai-struct-ts version
# Should show the new version
```

**Check GitHub Release:**
- Go to [Releases](https://github.com/fabianopinto/kaitai-struct-ts/releases)
- Verify the new release was created with correct version and changelog

**Test Installation:**
```bash
npm install @k67/kaitai-struct-ts@latest
```

---

## Complete Example

Here's a complete example for releasing version `0.8.1`:

```bash
# 1. Clean state
git checkout main
git pull origin main

# 2. Version bump
pnpm changeset:version
# Review changes in package.json and CHANGELOG.md

# 3. Commit
git add .
git commit -m "chore: release v0.8.1"

# 4. Tag and push
git tag v0.8.1
git push origin main v0.8.1

# 5. Monitor
# Open: https://github.com/fabianopinto/kaitai-struct-ts/actions

# 6. Verify
npm view @k67/kaitai-struct-ts version
```

---

## Creating Changesets

Before releasing, ensure there are changesets describing the changes:

### Add a Changeset

```bash
pnpm changeset
```

This will prompt you to:
1. Select the type of change (patch/minor/major)
2. Write a summary of the changes

The changeset file will be created in `.changeset/` directory.

### Changeset Types

- **Patch** (0.0.X) - Bug fixes, documentation updates, minor improvements
- **Minor** (0.X.0) - New features, non-breaking changes
- **Major** (X.0.0) - Breaking changes

### Example Changeset

```markdown
---
'@k67/kaitai-struct-ts': patch
---

Fix memory leak in stream processing
```

---

## Pre-releases

To create a pre-release (alpha, beta, rc):

### 1. Create Pre-release Changeset

```bash
pnpm changeset pre enter alpha
pnpm changeset:version
```

This will create versions like `0.9.0-alpha.0`

### 2. Release Pre-release

```bash
git add .
git commit -m "chore: release v0.9.0-alpha.0"
git tag v0.9.0-alpha.0
git push origin main v0.9.0-alpha.0
```

### 3. Exit Pre-release Mode

When ready for stable release:

```bash
pnpm changeset pre exit
pnpm changeset:version
```

---

## Troubleshooting

### Tag Push Rejected

**Error:** `Tag protection rule violation`

**Solution:** Ensure you have permission to create tags matching `v*` pattern. Contact repository admin.

### Publish Workflow Fails on Branch Check

**Error:** `Tag must point to a commit on main branch`

**Cause:** The tag was created from a branch other than main.

**Solution:**
1. Delete the tag: `git tag -d v0.x.x && git push origin :refs/tags/v0.x.x`
2. Ensure you're on main: `git checkout main && git pull`
3. Create tag again: `git tag v0.x.x && git push origin main v0.x.x`

### NPM Publish Fails

**Error:** `401 Unauthorized` or `403 Forbidden`

**Cause:** NPM token is invalid or expired.

**Solution:**
1. Generate new NPM token with publish permissions
2. Update `NPM_TOKEN` secret in repository settings
3. Re-run the workflow

### Version Already Published

**Error:** `You cannot publish over the previously published versions`

**Cause:** The version in `package.json` already exists on NPM.

**Solution:**
1. Delete the tag: `git tag -d v0.x.x && git push origin :refs/tags/v0.x.x`
2. Run `pnpm changeset:version` again (it will bump to next version)
3. Commit and tag with the new version

### CI Fails on Main

**Problem:** CI is failing on main, can't release.

**Solution:**
1. Fix the failing tests/lint issues
2. Push fix to main through a PR
3. Once CI is green, proceed with release

---

## Emergency Releases

For urgent security fixes or critical bugs:

### Fast-track Process

1. **Create hotfix branch from main:**
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/critical-fix
   ```

2. **Make the fix and add changeset:**
   ```bash
   # Make your changes
   pnpm changeset  # Select patch, describe the fix
   git add .
   git commit -m "fix: critical security issue"
   ```

3. **Create PR and merge immediately:**
   ```bash
   git push origin hotfix/critical-fix
   gh pr create --title "fix: critical security issue" --body "Emergency fix"
   gh pr merge --squash --auto
   ```

4. **Release immediately:**
   ```bash
   git checkout main
   git pull
   pnpm changeset:version
   git add .
   git commit -m "chore: release v0.x.x"
   VERSION=$(node -p "require('./package.json').version")
   git tag "v${VERSION}"
   git push origin main "v${VERSION}"
   ```

---

## Best Practices

### ✅ Do

- Always release from `main` branch
- Ensure all tests pass before releasing
- Review CHANGELOG.md before pushing tag
- Use semantic versioning correctly
- Add meaningful changeset descriptions
- Monitor the publish workflow to completion
- Verify the package on NPM after release

### ❌ Don't

- Don't create tags from feature branches
- Don't skip the changeset step
- Don't force push tags
- Don't release with failing CI
- Don't manually edit CHANGELOG.md (use changesets)
- Don't reuse version numbers

---

## Security Notes

### Tag Protection

Tags matching `v*` pattern should be protected to prevent:
- Accidental releases
- Unauthorized releases
- Releases from non-main branches

**To configure (admin only):**
1. Go to Settings → Tags → Add rule
2. Pattern: `v*`
3. Enable: "Restrict tag creation"
4. Add allowed users/teams

### Branch Validation

The publish workflow includes automatic validation to ensure tags point to commits on `main`. This prevents:
- Publishing unreviewed code
- Publishing code that hasn't passed CI
- Accidental releases from feature branches

If validation fails, the workflow will exit with an error before publishing.

---

## Questions?

- **Q: Can I test the release process?**
  - A: Yes, create a tag with a different pattern (e.g., `test-v0.8.1`) that won't trigger the workflow

- **Q: How do I roll back a release?**
  - A: You can't unpublish from NPM (except within 72 hours). Instead, publish a new patch version with the fix

- **Q: Can I release multiple versions at once?**
  - A: No, release one version at a time to avoid conflicts

- **Q: What if I forgot to add a changeset?**
  - A: Add it before running `changeset:version`, or manually edit CHANGELOG.md (not recommended)

- **Q: How do I see what will be released?**
  - A: Run `pnpm changeset status` to see pending changesets
