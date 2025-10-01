# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2025-10-02

### 🎉 Phase 3 Advanced Features - Switch/Case & Instances

Major update with advanced Phase 3 features bringing the project to 83% completion.

### Added

#### Switch/Case Type Selection (7 tests)
- ✅ Expression-based type selection with switch-on
- ✅ Case matching with default fallback
- ✅ Complex expressions in switch-on
- ✅ Enum values in switch statements
- ✅ Nested switch types
- ✅ Built-in types in cases
- ✅ Full integration with type system

#### Instances - Lazy-Evaluated Fields (11 tests)
- ✅ Value instances (calculated fields)
- ✅ Pos instances (positioned reads with seek)
- ✅ Lazy evaluation with caching
- ✅ Automatic position restoration
- ✅ Complex types in instances
- ✅ Sized reads in instances
- ✅ Conditional instances (if attribute)
- ✅ Multiple instances per schema

### Changed
- Type inheritance now includes both enums and types through nested schemas
- Context properly handles nested type parsing
- Improved error messages for type resolution

### Fixed
- Type inheritance for nested schemas
- Enum inheritance through nested types
- Position restoration after pos instances

### Notes
- Phase 3: 30% complete
- Overall progress: 83% to v1.0.0
- 98 tests passing (69% increase from v0.3.0)

## [0.3.0] - 2025-10-01

### 🎉 Phase 2 Complete - Expression Integration & Enums

Major update completing Phase 2 with full expression support and enum implementation.

### Added

#### Expression Integration
- ✅ **if conditions** - Conditional field parsing based on expressions
- ✅ **repeat-expr** - Dynamic repetition counts from expressions
- ✅ **repeat-until** - Loop until condition is true with `_` variable
- ✅ **size attribute** - Calculated sizes for reads
- ✅ **pos attribute** - Absolute positioning with calculated values
- ✅ Expression evaluation helper in TypeInterpreter
- ✅ Support for all expression operators (arithmetic, comparison, logical)

#### Enum Support
- ✅ Enum definitions in schema
- ✅ Enum access in expressions (`EnumName::value`)
- ✅ Context support for enum lookups
- ✅ Enum inheritance through nested types
- ✅ Reverse lookup (name → integer value)
- ✅ Values kept as integers for expression compatibility

#### Testing
- ✅ 13 expression integration tests
- ✅ 9 enum integration tests
- ✅ **80 total tests passing** (up from 58)
- ✅ Comprehensive coverage of all Phase 2 features

#### Documentation
- ✅ Added professional logo to README
- ✅ Improved README layout with centered header
- ✅ Moved assets to proper folder structure
- ✅ Updated PROGRESS.md with Phase 2 completion

#### GitHub Infrastructure
- ✅ Full CI/CD with GitHub Actions
- ✅ Automated testing on Node 18, 20, 22 (Ubuntu, Windows, macOS)
- ✅ Automated npm publishing workflow
- ✅ Issue templates and PR template
- ✅ Branch protection with required CI checks

### Changed
- Enum values now kept as integers internally for expression compatibility
- Context now supports enum definitions and lookups
- TypeInterpreter evaluates expressions for all dynamic attributes

### Fixed
- Removed unused `applyEnum` method causing TypeScript errors
- Fixed enum inheritance through nested types
- Proper type coercion for expressions (number/bigint)

### Notes
- Phase 2 (Core Features) is now 100% complete
- Overall progress: ~80% to v1.0.0
- Ready to start Phase 3 (Advanced Features)

## [0.2.0] - 2025-10-01

### 🎉 Phase 2 Core Implementation

Major update adding KSY parser and type interpreter for parsing binary data.

### Added

#### KSY Parser (`src/parser/`)
- Complete YAML parser for .ksy format definitions
- Schema validation with detailed error messages
- Support for nested types in `types` section
- Validation options (strict mode)
- Type definitions for all schema elements

#### Type Interpreter (`src/interpreter/`)
- Execute schemas against binary streams
- All primitive types (u1-u8, s1-s8, f4, f8)
- Both endianness (le, be)
- Nested user-defined types
- Repetitions (repeat: expr, repeat: eos)
- Contents validation
- Absolute positioning (pos)
- Sized substreams

#### Main API
- `parse()` function for convenient parsing
- Full TypeScript type exports
- Options support (validate, strict)

#### Testing
- 58 tests passing (42 unit + 16 integration)
- Integration tests for real-world scenarios
- Error handling tests

### Changed
- Updated vitest commands to use `run` mode by default
- Added `test:watch` command for watch mode
- Version bumped to 0.2.0

### Fixed
- Nested type validation (no longer requires meta section)
- Parent meta inheritance for nested types
- Proper endianness handling in nested types

## [0.1.0] - 2025-10-01

### 🎉 Phase 1 Foundation Release

Initial release establishing the foundation for kaitai-struct-ts - a TypeScript runtime interpreter for Kaitai Struct binary format definitions.

### Added

#### Core Implementation
- **KaitaiStream** - Complete binary stream reader (`src/stream/KaitaiStream.ts`)
  - Unsigned integers: u1, u2le, u2be, u4le, u4be, u8le, u8be
  - Signed integers: s1, s2le, s2be, s4le, s4be, s8le, s8be
  - Floating point: f4le, f4be, f8le, f8be (IEEE 754)
  - Byte arrays: fixed length, until terminator, all remaining
  - Strings with encoding support: UTF-8, ASCII, Latin-1, UTF-16LE, UTF-16BE
  - Bit-level reading: readBitsIntBe, readBitsIntLe
  - Position management: seek, pos, isEof
  - Substream support for isolated stream views

#### Error Handling (`src/utils/errors.ts`)
- `KaitaiError` - Base error class with position tracking
- `EOFError` - End of stream errors
- `ParseError` - Parsing failures
- `ValidationError` - Validation failures
- `NotImplementedError` - Feature placeholders

#### String Encoding (`src/utils/encoding.ts`)
- UTF-8 encoding/decoding with fallback implementation
- ASCII and Latin-1 (ISO-8859-1) support
- UTF-16 Little Endian and Big Endian
- TextDecoder integration for additional encodings

#### Testing
- 100+ test cases for KaitaiStream (`test/unit/stream.test.ts`)
- Full coverage of all integer types, floats, bytes, strings
- Bit-level reading tests
- Error scenario testing
- Edge case coverage

#### Documentation
- Complete JSDoc on all public APIs with examples
- File headers on all source files
- README.md with quick start guide
- PROJECT_DESIGN.md with detailed architecture and roadmap
- ARCHITECTURE.md with 12 Mermaid diagrams
- CONTRIBUTING.md with development guidelines and workflows
- PROGRESS.md for tracking development milestones
- SUMMARY.md for project overview
- QUICKREF.md for quick reference
- LICENSE (MIT)

#### Infrastructure
- TypeScript 5.9.3 with strict mode configuration
- Build system: tsup for ESM + CJS output
- Testing: vitest with coverage reporting and UI
- Linting: eslint with TypeScript plugin
- Formatting: prettier with consistent configuration
- Version management: changesets for semantic versioning
- Package exports configured for Node.js and browsers
- pnpm workspace setup

### Notes

This release completes Phase 1 (MVP) of the project roadmap. The KaitaiStream implementation provides a solid foundation for binary data reading. Future releases will add:
- Phase 2: KSY parser, type interpreter, expression evaluator
- Phase 3: Advanced features, full Kaitai Struct spec compliance

[Unreleased]: https://github.com/fabianopinto/kaitai-struct-ts/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/fabianopinto/kaitai-struct-ts/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/fabianopinto/kaitai-struct-ts/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/fabianopinto/kaitai-struct-ts/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/fabianopinto/kaitai-struct-ts/releases/tag/v0.1.0
