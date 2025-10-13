# Release Checklist

This document provides a step-by-step guide for releasing a new version.

## Automated Steps (via Changesets)

### 1. Create a Changeset

When you make changes that should be included in the next release:

```bash
pnpm changeset
```

Follow the prompts:
- Select the type of change (patch/minor/major)
- Describe the changes

This creates a file in `.changeset/` that will be used to generate the changelog.

### 2. Version Bump

When ready to release, run:

```bash
pnpm changeset version
```

This will:
- Update `package.json` version
- Update `CHANGELOG.md` with all pending changesets
- Remove consumed changeset files

### 3. Commit and Push

```bash
git add -A
git commit -m "release: v<VERSION>"
git push origin main
```

This triggers the `release.yml` workflow which:
- Detects the version change
- Extracts changelog entries
- Generates release notes
- Creates an issue with manual steps

## Manual Steps (Due to Repository Rules)

### 4. Create Git Tag

Repository rules prevent automated tag creation. Create manually:

**Option A: Command Line**
```bash
git tag v<VERSION>
git push origin v<VERSION>
```

**Option B: GitHub UI**
1. Go to Releases → Draft a new release
2. Click "Choose a tag"
3. Type `v<VERSION>` and click "Create new tag"

### 5. Publish to npm

Ensure you're logged in to npm:
```bash
npm whoami
```

If not logged in:
```bash
npm login
```

Publish the package:
```bash
pnpm publish --access public --no-git-checks
```

This will:
- Run `prepublishOnly` script (build, test, lint)
- Publish to npm registry

### 6. Create GitHub Release

**Option A: Using CLI**
```bash
gh release create v<VERSION> \
  --title "v<VERSION>" \
  --notes-file release-notes.md
```

**Option B: Using GitHub UI**
1. Go to Releases → Draft a new release
2. Select the tag `v<VERSION>`
3. Set title: `v<VERSION>`
4. Download release notes from workflow artifacts
5. Paste release notes into description
6. Publish release

## Verification

After release, verify:

1. **npm package published:**
   ```bash
   npm view @k67/kaitai-struct-ts version
   # Should show: <VERSION>
   ```

2. **GitHub release created:**
   - Visit: https://github.com/fabianopinto/kaitai-struct-ts/releases
   - Verify release notes are correct

3. **Installation works:**
   ```bash
   npm install @k67/kaitai-struct-ts@<VERSION>
   ```

4. **Close release issue:**
   - Find the auto-created issue
   - Add comment confirming release is complete
   - Close the issue

## Troubleshooting

### Tag already exists
```bash
# Delete local tag
git tag -d v<VERSION>

# Delete remote tag
git push origin :refs/tags/v<VERSION>

# Recreate tag
git tag v<VERSION>
git push origin v<VERSION>
```

### npm publish fails
```bash
# Check if version already published
npm view @k67/kaitai-struct-ts versions

# If published, bump version and try again
pnpm changeset version
```

### Release workflow didn't trigger
- Ensure both `CHANGELOG.md` and `package.json` were modified
- Check workflow runs: https://github.com/fabianopinto/kaitai-struct-ts/actions

## Quick Reference

### Version Types

- **Patch (0.0.X)** - Bug fixes, documentation, minor improvements
- **Minor (0.X.0)** - New features, non-breaking changes
- **Major (X.0.0)** - Breaking changes

### Common Commands

```bash
# Create changeset
pnpm changeset

# Version bump
pnpm changeset version

# Build and test
pnpm build && pnpm test

# Publish
pnpm publish --access public --no-git-checks

# Create tag
git tag v<VERSION> && git push origin v<VERSION>
```

## Future Improvements

Once repository rules are updated to allow GitHub Actions to create tags:

1. Remove manual tag creation step
2. Update `create-tag.yml` workflow
3. Automate full release pipeline
4. Update this checklist
