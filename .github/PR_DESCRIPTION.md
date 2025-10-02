# Release v0.7.0 - CLI Utility & Documentation Reorganization

## 🎉 Summary

This release adds a complete command-line interface for parsing binary files and reorganizes project documentation following best practices.

## ✨ New Features

### CLI Utility
- **Command-line executable** `kaitai` for parsing binary files without writing code
- Available via `npx @k67/kaitai-struct-ts` or global install
- Zero external dependencies (uses Node.js built-in APIs)

### CLI Features
- Parse binary files with .ksy definitions
- Output as JSON or YAML
- Pretty-print or compact JSON output
- Extract specific fields with dot notation (`--field header.version`)
- Write output to file (`-o output.json`)
- Quiet mode for scripting (`--quiet`)
- Schema validation options (`--strict`, `--no-validate`)
- Comprehensive help and version commands
- Proper exit codes (0, 1, 2, 3)

## 📚 Documentation Improvements

### Reorganization
- Moved development docs to `docs/development/`
- Moved CLI docs to `docs/cli/`
- Created `docs/CLI.md` with complete CLI documentation
- Created `docs/README.md` as documentation index
- Updated all cross-references

### Updates
- Updated README.md status to v0.7.0 (95% complete, production ready)
- Updated QUICKREF.md to reflect all completed features
- Updated CHANGELOG.md with comprehensive v0.7.0 entry
- Removed outdated status information

## 🧪 Testing

- ✅ 15 comprehensive CLI integration tests
- ✅ All tests passing (100+ total tests)
- ✅ Tests cover: basic functionality, output options, field extraction, error handling, validation, quiet mode

## 🔧 Technical Details

### Implementation
- **File:** `src/cli.ts` (311 lines)
- **Tests:** `test/cli.test.ts` (228 lines)
- **Build:** Separate CLI build in `tsup.config.ts`
- **Package:** `bin` field added to `package.json`

### Configuration Updates
- Updated `tsup.config.ts` to build CLI separately
- Added `bin` field in `package.json`
- Updated ESLint config for Node.js globals

## 📦 Usage Examples

### CLI
```bash
# Parse binary file
kaitai format.ksy data.bin

# Save to file
kaitai format.ksy data.bin -o output.json

# Extract field
kaitai format.ksy data.bin --field version --quiet

# Batch processing
for file in *.bin; do
  kaitai format.ksy "$file" -o "${file%.bin}.json" --quiet
done
```

### Library (unchanged)
```typescript
import { parse } from '@k67/kaitai-struct-ts'

const result = parse(ksyDefinition, binaryData)
console.log(result.version)
```

## 🚀 Breaking Changes

**None** - This is a purely additive feature.

- Library API unchanged
- Existing code continues to work
- No dependency changes for library users
- CLI is optional (only used if invoked)

## 📊 Statistics

- **Code Added:** 539 lines (CLI + tests)
- **Documentation:** ~2,000 lines reorganized/updated
- **Files Changed:** 21 files
- **New Tests:** 15 integration tests
- **Test Coverage:** 100% of CLI functionality

## ✅ Checklist

- [x] All tests passing
- [x] Documentation updated
- [x] CHANGELOG.md updated
- [x] Version bumped to 0.7.0
- [x] No breaking changes
- [x] Zero new dependencies
- [x] Build successful
- [x] ESLint passing

## 🔗 Related

- Closes #[issue-number] (if applicable)
- Documentation: [docs/CLI.md](./docs/CLI.md)
- Architecture: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 📝 Commits

- feat: add CLI utility and reorganize documentation (c20af11)
- docs: update README and QUICKREF to reflect current status (902a1f8)
- docs: add commit summary documentation (3970f30)
- chore: release v0.7.0 (74be534)

---

**Ready for merge and npm publish** 🚀
