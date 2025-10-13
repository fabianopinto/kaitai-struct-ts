# Release Notes - v0.2.0

**Release Date:** 2025-10-01  
**Phase:** 2 - Core Implementation  
**Status:** ✅ Complete  
**Git Tag:** v0.2.0  
**Commit:** 4991b5d

---

## 🎉 Major Update - Parser and Interpreter!

This release adds the core parsing functionality to **kaitai-struct-ts**, enabling you to parse binary data using Kaitai Struct `.ksy` definitions at runtime!

## 🌟 Highlights

### Complete KSY Parser

Parse and validate `.ksy` YAML format definitions:

- Full YAML parsing with schema validation
- Detailed error messages and warnings
- Support for nested types
- Strict mode for enhanced validation

### Working Type Interpreter

Execute schemas against binary data:

- All primitive types (u1-u8, s1-s8, f4, f8)
- Both little-endian and big-endian
- Nested user-defined types
- Repetitions (fixed count and until end of stream)
- Contents validation
- Absolute positioning

### Simple API

```typescript
import { parse } from 'kaitai-struct-ts'

const ksy = `
meta:
  id: my_format
  endian: le
seq:
  - id: magic
    contents: [0x4D, 0x5A]
  - id: version
    type: u2
`

const buffer = new Uint8Array([0x4d, 0x5a, 0x01, 0x00])
const result = parse(ksy, buffer)
console.log(result.version) // 1
```

## 📦 What's New

### New Modules

#### `src/parser/`

- **schema.ts** - Complete TypeScript type definitions for .ksy format
- **KsyParser.ts** - YAML parser with validation (~340 lines)
- Built-in type helpers and validators

#### `src/interpreter/`

- **TypeInterpreter.ts** - Executes schemas against binary data (~400 lines)
- **Context.ts** - Manages execution state and context (~170 lines)
- Support for \_io, \_root, \_parent references

### Enhanced API

```typescript
// Main parse function
export function parse(
  ksyYaml: string,
  buffer: ArrayBuffer | Uint8Array,
  options?: ParseOptions
): Record<string, unknown>

// Classes
export class KsyParser { ... }
export class TypeInterpreter { ... }
export class Context { ... }

// Types
export type KsySchema = { ... }
export type AttributeSpec = { ... }
// ... and many more
```

## 🧪 Testing

### Test Coverage

```
Test Files:  2 passed (2)
Tests:       58 passed (58)
  - Unit tests:        42 (KaitaiStream)
  - Integration tests: 16 (parsing scenarios)
```

### Test Scenarios

- ✅ Simple fixed-size structures
- ✅ Big-endian and little-endian
- ✅ Signed and unsigned integers
- ✅ Floating point numbers
- ✅ Fixed-size strings with encodings
- ✅ Raw byte arrays
- ✅ Repetitions (expr, eos)
- ✅ Nested user-defined types
- ✅ Contents validation
- ✅ Error handling

## 🎯 Supported Features

### Data Types

- **Integers:** u1, u2, u4, u8, s1, s2, s4, s8
- **Floats:** f4, f8
- **Strings:** Fixed size with encoding
- **Bytes:** Fixed size, size-eos

### Endianness

- Little-endian (le)
- Big-endian (be)
- Type-specific endianness (u2le, u4be, etc.)

### Structure Features

- Sequential fields (seq)
- Nested types (types section)
- Repetitions:
  - `repeat: expr` - Fixed count
  - `repeat: eos` - Until end of stream
- Contents validation
- Absolute positioning (pos)
- Sized substreams

## 📊 Statistics

```
Version:           0.2.0
Files Added:       9 new files
Lines Added:       ~2,400
Total Tests:       58 (all passing)
Build Size:        ~37 KB (CJS), ~36 KB (ESM)
Documentation:     Complete JSDoc on all APIs
```

## 🔄 Changes from v0.1.0

### Added

- Complete KSY parser implementation
- Type interpreter for executing schemas
- Context class for execution state
- Integration tests for parsing
- Phase 2 progress documentation

### Changed

- Updated `parse()` signature with options
- Version bumped to 0.2.0
- vitest commands now use `run` mode by default
- Added `test:watch` command

### Fixed

- Nested type validation (meta section optional)
- Parent meta inheritance for nested types
- Proper endianness handling

## ⏳ Not Yet Implemented

The following features are planned for future releases:

- **Expression Evaluator** - For if, repeat-until, calculated values
- **Enums** - Named integer constants
- **Switch Types** - Type selection based on expressions
- **Conditional Parsing** - if conditions
- **String Terminators** - strz and terminated strings
- **Processing** - Compression, encryption
- **Instances** - Lazy-evaluated fields
- **Imports** - Cross-file type references
- **Bit-sized Integers** - Advanced bit operations
- **Parameters** - Parametric types

## 🚀 Getting Started

### Installation

```bash
npm install kaitai-struct-ts
# or
pnpm add kaitai-struct-ts
# or
yarn add kaitai-struct-ts
```

### Quick Example

```typescript
import { parse } from 'kaitai-struct-ts'

// Define your format
const ksy = `
meta:
  id: simple_header
  endian: le
seq:
  - id: signature
    contents: "MYFORMAT"
  - id: version_major
    type: u1
  - id: version_minor
    type: u1
  - id: file_size
    type: u4
`

// Parse binary data
const data = new Uint8Array([
  // "MYFORMAT"
  0x4d,
  0x59,
  0x46,
  0x4f,
  0x52,
  0x4d,
  0x41,
  0x54,
  1, // version_major
  0, // version_minor
  0x00,
  0x10,
  0x00,
  0x00, // file_size = 4096
])

const result = parse(ksy, data)
console.log(result.version_major) // 1
console.log(result.version_minor) // 0
console.log(result.file_size) // 4096
```

### Advanced Example with Nested Types

```typescript
const ksy = `
meta:
  id: executable
  endian: le
seq:
  - id: header
    type: exe_header
  - id: sections
    type: section
    repeat: expr
    repeat-expr: header.num_sections
types:
  exe_header:
    seq:
      - id: magic
        contents: [0x4D, 0x5A]
      - id: num_sections
        type: u2
  section:
    seq:
      - id: name_len
        type: u1
      - id: name
        type: str
        size: name_len
        encoding: UTF-8
      - id: size
        type: u4
`

const result = parse(ksy, binaryData)
console.log(result.header.num_sections)
console.log(result.sections[0].name)
```

## 📚 Documentation

- **README.md** - Quick start and overview
- **PROJECT_DESIGN.md** - Complete design specification
- **ARCHITECTURE.md** - Architecture with Mermaid diagrams
- **PHASE_2_PROGRESS.md** - Phase 2 progress tracking
- **CONTRIBUTING.md** - Development guidelines
- **API Documentation** - Complete JSDoc in source files

## 🐛 Known Issues

None at this time. Please report any issues on GitHub.

## 🔮 What's Next - Phase 2 Completion

The next release (v0.3.0) will complete Phase 2 by adding:

- **Expression Evaluator** - Full expression language support
- **Conditionals** - if conditions and enums
- **Switch Types** - Dynamic type selection
- **repeat-until** - Conditional repetitions

**Estimated Timeline:** 2-3 weeks

## 💬 Feedback

We'd love to hear your feedback! Please:

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Submit a PR for contributions

## 🙏 Acknowledgments

This project implements the [Kaitai Struct specification](https://doc.kaitai.io/) created by the Kaitai Struct team.

---

**Thank you for using kaitai-struct-ts!** 🎉

This release represents a major milestone - the library can now parse real binary formats!
