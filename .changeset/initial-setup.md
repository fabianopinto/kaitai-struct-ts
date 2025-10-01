---
"kaitai-struct-ts": minor
---

# v0.1.0 - Phase 1 Foundation Release

Initial release of kaitai-struct-ts - a TypeScript runtime interpreter for Kaitai Struct binary format definitions.

## 🎉 Phase 1 MVP Complete

This release establishes the foundation for the project with a complete binary stream reader implementation and comprehensive project infrastructure.

## ✨ Features

### Core Implementation
- **KaitaiStream** - Complete binary stream reader
  - Unsigned integers: u1, u2le, u2be, u4le, u4be, u8le, u8be
  - Signed integers: s1, s2le, s2be, s4le, s4be, s8le, s8be
  - Floating point: f4le, f4be, f8le, f8be (IEEE 754)
  - Byte arrays: fixed length, until terminator, all remaining
  - Strings: UTF-8, ASCII, Latin-1, UTF-16LE, UTF-16BE
  - Bit-level reading: readBitsIntBe, readBitsIntLe
  - Position management: seek, pos, isEof
  - Substreams: isolated stream views

### Error Handling
- `KaitaiError` - Base error class with position tracking
- `EOFError` - End of stream errors
- `ParseError` - Parsing failures
- `ValidationError` - Validation failures
- `NotImplementedError` - Feature placeholders

### String Encoding
- UTF-8 encoding/decoding with fallback implementation
- ASCII and Latin-1 support
- UTF-16 Little Endian and Big Endian
- TextDecoder integration for additional encodings

## 🧪 Testing
- 100+ test cases covering all KaitaiStream functionality
- Full coverage of integer types, floats, bytes, strings, and bit operations
- Error scenario testing
- Edge case coverage

## 📚 Documentation
- Complete JSDoc on all public APIs
- File headers on all source files
- README with quick start guide
- PROJECT_DESIGN.md with detailed architecture
- ARCHITECTURE.md with 12 Mermaid diagrams
- CONTRIBUTING.md with development guidelines
- PROGRESS.md for tracking development
- SUMMARY.md for project overview
- QUICKREF.md for quick reference

## 🛠️ Infrastructure
- TypeScript 5.9.3 with strict mode
- Build system: tsup (ESM + CJS)
- Testing: vitest with coverage and UI
- Linting: eslint with TypeScript plugin
- Formatting: prettier
- Version management: changesets
- Package exports for Node.js and browsers

## 📦 What's Next

Phase 2 will add:
- KSY YAML parser
- Type interpreter for executing schemas
- Expression evaluator
- Conditionals and enums
- Repetitions and instances

## 🔗 Links
- Repository: https://github.com/fabianopinto/kaitai-struct-ts
- NPM: https://www.npmjs.com/package/kaitai-struct-ts
- Documentation: See README.md and docs/
