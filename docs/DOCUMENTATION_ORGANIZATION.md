# Documentation Organization

This document explains the organization and purpose of all documentation files in the project.

## Overview

Documentation is organized into three main categories:

1. **User Documentation** - For end users of the library
2. **Contributor Documentation** - For developers contributing to the project
3. **Maintainer Documentation** - For project maintainers and release managers

## Root Level Files

These are the most important user-facing documents:

| File              | Purpose                                               | Audience     |
| ----------------- | ----------------------------------------------------- | ------------ |
| `README.md`       | Main project documentation, installation, quick start | Everyone     |
| `CHANGELOG.md`    | Complete version history and changes                  | Everyone     |
| `CONTRIBUTING.md` | How to contribute, coding standards, workflow         | Contributors |
| `EXAMPLES.md`     | Real-world format examples and usage patterns         | Users        |
| `QUICKREF.md`     | Quick reference for Kaitai Struct syntax              | Users        |
| `LICENSE`         | MIT license                                           | Everyone     |

**Principle:** Keep root level clean with only essential, user-facing documents.

## docs/ Directory Structure

### Main Documentation Files

| File                               | Purpose                                   | Audience     |
| ---------------------------------- | ----------------------------------------- | ------------ |
| `docs/README.md`                   | Documentation index and navigation        | Everyone     |
| `docs/ARCHITECTURE.md`             | System architecture with diagrams         | Contributors |
| `docs/CLI.md`                      | Complete CLI documentation                | Users        |
| `docs/RELEASE_GUIDE.md`            | Step-by-step release instructions         | Maintainers  |
| `docs/RELEASE_PROCESS_ANALYSIS.md` | Release process analysis and improvements | Maintainers  |

### docs/cli/ - CLI-Specific Documentation

| File                            | Purpose                  | Status |
| ------------------------------- | ------------------------ | ------ |
| `CLI_GUIDE.md`                  | CLI implementation guide | Active |
| `CLI_QUICKREF.md`               | CLI quick reference card | Active |
| `CLI_IMPLEMENTATION_SUMMARY.md` | Implementation summary   | Active |
| `CLI_TEST_RESULTS.md`           | Test results snapshot    | Active |

**Purpose:** Detailed CLI documentation for users and developers.

### docs/development/ - Development Documentation

| File                      | Purpose                       | Status     |
| ------------------------- | ----------------------------- | ---------- |
| `PROJECT_DESIGN.md`       | Project design and roadmap    | Active     |
| `PROGRESS.md`             | Development progress tracking | Active     |
| `PHASE_1_COMPLETE.md`     | Phase 1 completion report     | Historical |
| `PHASE_2_PROGRESS.md`     | Phase 2 progress report       | Historical |
| `RELEASE_NOTES_v0.1.0.md` | v0.1.0 release notes          | Historical |
| `RELEASE_NOTES_v0.2.0.md` | v0.2.0 release notes          | Historical |
| `RELEASE_SUMMARY.md`      | Release summary               | Historical |
| `SUMMARY.md`              | Project summary               | Historical |

**Purpose:** Development planning, progress tracking, and historical records.

### docs/.archive/ - Archived Documents

| File                                 | Purpose                                | Reason for Archiving                          |
| ------------------------------------ | -------------------------------------- | --------------------------------------------- |
| `COMMIT_SUMMARY.md`                  | CLI implementation commit summary      | Temporary document, info now in CHANGELOG     |
| `OPTION_1_IMPLEMENTATION_SUMMARY.md` | Release process implementation summary | Temporary document, info now in RELEASE_GUIDE |

**Purpose:** Preserve temporary documents for reference without cluttering active documentation.

## Documentation Principles

### 1. Clear Hierarchy

```
Root (Essential user docs)
└── docs/
    ├── Main docs (Architecture, CLI, Release)
    ├── cli/ (CLI-specific)
    ├── development/ (Planning & history)
    └── .archive/ (Outdated/temporary)
```

### 2. Audience-Based Organization

- **Users** → Root level + `docs/CLI.md`
- **Contributors** → `CONTRIBUTING.md` + `docs/ARCHITECTURE.md` + `docs/development/`
- **Maintainers** → `docs/RELEASE_GUIDE.md` + `docs/RELEASE_PROCESS_ANALYSIS.md`

### 3. No Clutter

- Temporary documents go to `.archive/`
- Implementation summaries are archived after completion
- Historical documents stay in `development/` for reference

### 4. Easy Navigation

- `docs/README.md` serves as the main index
- Clear categorization by role
- Quick links for common tasks
- Emojis for visual hierarchy

## File Lifecycle

### Active Documents

**Characteristics:**

- Regularly updated
- Referenced by other docs
- Essential for current work

**Examples:**

- `README.md`
- `CHANGELOG.md`
- `docs/RELEASE_GUIDE.md`
- `docs/ARCHITECTURE.md`

### Historical Documents

**Characteristics:**

- No longer updated
- Useful for reference
- Part of project history

**Examples:**

- `docs/development/PHASE_1_COMPLETE.md`
- `docs/development/RELEASE_NOTES_v0.1.0.md`

**Location:** `docs/development/`

### Archived Documents

**Characteristics:**

- Temporary/one-time use
- Superseded by other docs
- Kept for reference only

**Examples:**

- `docs/.archive/COMMIT_SUMMARY.md`
- `docs/.archive/OPTION_1_IMPLEMENTATION_SUMMARY.md`

**Location:** `docs/.archive/`

## When to Archive a Document

Archive a document when:

1. ✅ It was created for temporary use (commit summaries, implementation notes)
2. ✅ Its information has been incorporated into permanent docs
3. ✅ It's no longer referenced by active documentation
4. ✅ It's not part of the regular workflow

**Don't archive:**

- Historical records (phase reports, old release notes) → Keep in `development/`
- Active documentation that's still useful
- Documents referenced in README or other active docs

## Maintenance Guidelines

### Regular Reviews

**Quarterly:**

- Review `docs/development/` for outdated progress tracking
- Update `docs/README.md` if structure changes
- Check for broken links

**After Each Release:**

- Update `CHANGELOG.md`
- Archive any temporary release documents
- Update version references in docs

### Adding New Documentation

**User documentation:**

- Add to root level if essential (rare)
- Add to `docs/` if detailed/specialized
- Update `docs/README.md` index

**Development documentation:**

- Add to `docs/development/`
- Update `docs/README.md` index

**Temporary documentation:**

- Create in appropriate location
- Plan to archive after use
- Reference from relevant active docs

### Removing Documentation

**Never delete:**

- Historical records
- Release notes
- Phase completion reports

**Archive instead:**

- Temporary documents
- Superseded implementation notes
- One-time summaries

**Only delete:**

- Duplicate files
- Truly obsolete content with no historical value

## Quick Reference

### I want to...

**...understand the project**
→ Start with `README.md`

**...use the CLI**
→ Read `docs/CLI.md`

**...contribute code**
→ Read `CONTRIBUTING.md` and `docs/ARCHITECTURE.md`

**...release a new version**
→ Follow `docs/RELEASE_GUIDE.md`

**...understand the architecture**
→ Read `docs/ARCHITECTURE.md`

**...see what's been done**
→ Check `CHANGELOG.md` and `docs/development/PROGRESS.md`

**...find all documentation**
→ Start with `docs/README.md`

## Documentation Standards

### File Naming

- Use `SCREAMING_SNAKE_CASE.md` for important root-level docs
- Use `PascalCase.md` for docs/ directory files
- Use descriptive names (not `doc1.md`, `notes.md`)

### Content Standards

- Start with a clear title (# heading)
- Include a brief description of purpose
- Use proper Markdown formatting
- Include table of contents for long documents
- Use code blocks with language specification
- Include examples where appropriate
- Link to related documentation

### Maintenance

- Keep documentation in sync with code
- Update examples when API changes
- Fix broken links promptly
- Archive outdated temporary docs
- Review quarterly for accuracy

## Summary

The documentation is organized to:

- ✅ Make essential docs easy to find (root level)
- ✅ Provide detailed docs for those who need them (docs/)
- ✅ Separate by audience (users, contributors, maintainers)
- ✅ Preserve history without clutter (development/, .archive/)
- ✅ Maintain clear navigation (docs/README.md)

This organization ensures documentation is discoverable, maintainable, and useful for all audiences.
