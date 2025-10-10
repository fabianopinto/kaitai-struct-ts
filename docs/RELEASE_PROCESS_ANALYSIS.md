# Release Process Analysis & Proposed Improvements

## Current State Analysis

### Branch Protection Rules

The `main` branch has the following protections:

- ✅ Require pull request before merging
- ✅ Require status checks to pass (CI must pass)
- ✅ Block force pushes
- ✅ Restrict deletions
- ❌ **Tags are NOT protected** (ruleset applies to branches only)

### Current Workflow Triggers

#### CI Workflow (`.github/workflows/ci.yml`)

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

- Runs on pushes to `main` and PRs targeting `main`
- Required status check for merging

#### Publish Workflow (`.github/workflows/publish.yml`)

```yaml
on:
  push:
    tags:
      - 'v*'
```

- Triggers on ANY tag push matching `v*` pattern
- **Does NOT check which branch the tag points to**
- Runs: lint, typecheck, tests, build, publish to npm, create GitHub release

---

## Key Findings

### 1. ✅ Tags Can Be Pushed Without PRs

**Answer: YES**

- Branch protection rules apply to **branches**, not **tags**
- You can push tags directly without going through a PR
- The `v0.8.0` tag was pushed successfully and triggered the publish workflow
- Evidence: Publish workflow ran at `2025-10-06T17:26:53Z` with `head_sha: ae00386` (the version bump commit)

### 2. ⚠️ Tags From Non-Main Branches Can Trigger Publish

**Answer: YES - This is a potential issue**

The publish workflow triggers on **any** `v*` tag push, regardless of:

- Which branch the tag points to
- Whether the commit is in `main`
- Whether CI has passed

**Example scenario:**

```bash
# On a feature branch
git checkout -b feature/experimental
git commit -m "experimental changes"
git tag v0.9.0
git push origin v0.9.0  # ⚠️ This WILL trigger publish!
```

This could accidentally publish:

- Unreviewed code
- Code that hasn't passed CI
- Code not merged to main

### 3. Current Process Is Overly Complex

The current release process requires:

1. Create changeset file
2. Create release branch
3. Push branch
4. Create PR
5. Wait for CI
6. Merge PR (creates commit on main)
7. Create tag pointing to main
8. Push tag (triggers publish)

**Issues:**

- Steps 2-6 are only needed because of branch protection
- The actual publish trigger (tag push) bypasses all protections
- Version bump commits clutter the history

---

## Proposed Improvements

### Option 1: Simplified Tag-Based Release (Recommended)

**Protect tags and simplify the process:**

#### Changes Needed:

1. **Add Tag Protection Rule**
   - Settings → Tags → Add rule
   - Pattern: `v*`
   - Require signed commits (optional)
   - Restrict who can create/delete tags (maintainers only)

2. **Update Publish Workflow**

   ```yaml
   on:
     push:
       tags:
         - 'v*'

   jobs:
     publish:
       runs-on: ubuntu-latest
       steps:
         # Add validation step
         - name: Verify tag is on main branch
           run: |
             git fetch origin main
             if ! git merge-base --is-ancestor ${{ github.sha }} origin/main; then
               echo "Error: Tag must point to a commit on main branch"
               exit 1
             fi
   ```

3. **Simplified Release Process**

   ```bash
   # 1. Ensure you're on main and up to date
   git checkout main
   git pull

   # 2. Run changeset version (updates package.json, CHANGELOG.md)
   pnpm changeset:version

   # 3. Commit version bump
   git add .
   git commit -m "chore: release v0.x.x"

   # 4. Create and push tag
   git tag v0.x.x
   git push origin main v0.x.x
   ```

**Benefits:**

- No PR needed for version bumps
- Tag push triggers publish automatically
- Validation ensures tag is on main
- CI already passed on main commits
- Cleaner git history

**Trade-offs:**

- Requires direct push to main (need bypass permission for version bumps)
- Less review of version bump commits

---

### Option 2: GitHub Actions-Based Release

**Automate everything with a workflow dispatch:**

#### Create `.github/workflows/release.yml`

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version bump type'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run changeset version
        run: pnpm changeset:version

      - name: Get new version
        id: version
        run: echo "VERSION=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

      - name: Commit version bump
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .
          git commit -m "chore: release v${{ steps.version.outputs.VERSION }}"
          git push

      - name: Create and push tag
        run: |
          git tag v${{ steps.version.outputs.VERSION }}
          git push origin v${{ steps.version.outputs.VERSION }}

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Publish to NPM
        run: pnpm publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Release Process:**

1. Go to Actions → Release → Run workflow
2. Select version bump type
3. Click "Run workflow"
4. Everything happens automatically

**Benefits:**

- One-click release
- No local git operations needed
- Guaranteed to run from main
- All steps automated
- Can add approval gates

**Trade-offs:**

- Requires GitHub Actions to have write permissions
- Need to configure bot to bypass branch protection

---

### Option 3: Keep Current Process (Not Recommended)

Continue with PR-based version bumps, but add safety checks:

1. **Update Publish Workflow** to validate tag is on main
2. **Add Tag Protection** to prevent accidental tags
3. Keep creating PRs for version bumps

**Benefits:**

- Maximum review/safety
- No permission changes needed

**Trade-offs:**

- Most complex process
- Version bump PRs add noise
- Slowest release cycle

---

## Recommendation

**Use Option 1 (Simplified Tag-Based Release)** because:

1. ✅ **Secure**: Tag protection + validation ensures only main commits are published
2. ✅ **Simple**: 4 commands instead of 8+ steps
3. ✅ **Fast**: No waiting for PR approval/CI (already passed on main)
4. ✅ **Clean**: Version bumps are clearly marked as release commits
5. ✅ **Standard**: Matches common OSS release patterns (changesets, semantic-release)

### Implementation Steps

1. **Add tag protection rule** (Settings → Tags)
   - Pattern: `v*`
   - Restrict creation to maintainers

2. **Update publish workflow** with branch validation

   ```bash
   # Add this step after checkout in publish.yml
   - name: Verify tag is on main branch
     run: |
       git fetch origin main
       if ! git merge-base --is-ancestor ${{ github.sha }} origin/main; then
         echo "Error: Tag must point to a commit on main branch"
         exit 1
       fi
   ```

3. **Grant yourself bypass permission** for version bump commits
   - Settings → Branches → main → Add bypass
   - Or: Use a GitHub App token with bypass permissions

4. **Document the new process** in CONTRIBUTING.md

5. **Test with a patch release** (v0.8.1)

---

## Security Considerations

### Current Risk

- Anyone with push access can publish by pushing a tag from any branch
- No validation that code has been reviewed or tested

### After Improvements

- Tag protection limits who can create tags
- Branch validation ensures only main commits are published
- CI has already passed on main before tag is created
- Changesets provide audit trail of what's being released

---

## Questions?

- **Q: Can I still do emergency releases?**
  - A: Yes, with bypass permission you can push directly to main + tag
- **Q: What if CI fails on main?**
  - A: Don't create the tag until CI is fixed
- **Q: Can I test the publish workflow?**
  - A: Yes, create a tag like `v0.8.1-test` (won't match `v*` pattern)
  - Or: Use a separate test workflow with manual trigger

- **Q: What about pre-releases (alpha, beta, rc)?**
  - A: Tag pattern `v*` matches `v0.9.0-alpha.1`, will publish as prerelease
