---
'@k67/kaitai-struct-ts': minor
---

# v0.2.0 - Phase 2 Core Implementation

Major update adding KSY parser and type interpreter for parsing binary data with Kaitai Struct definitions.

## ✨ New Features

### KSY Parser

- **Complete YAML parser** for .ksy format definitions
- **Schema validation** with detailed error messages and warnings
- **Nested type support** - types section with inheritance
- **Validation options** - strict mode and custom validation

### Type Interpreter

- **Execute schemas** against binary streams
- **All primitive types** - integers, floats, strings, bytes
- **Both endianness** - little-endian and big-endian support
- **Nested user-defined types** - parse complex structures
- **Repetitions** - repeat: expr and repeat: eos
- **Contents validation** - verify expected byte sequences
- **Absolute positioning** - pos attribute support
- **Sized substreams** - size attribute for nested parsing

### Main API

- **`parse()` function** - convenient one-line parsing
- **Full TypeScript types** - complete type definitions exported
- **Options support** - validate and strict mode

## 🧪 Testing

- **58 tests passing** - comprehensive test coverage
- **Integration tests** - real-world parsing scenarios
- **Error handling tests** - proper error reporting

## 📚 Documentation

- Complete JSDoc on all public APIs
- Updated README with examples
- Phase 2 progress tracking
- Architecture documentation

## 🔧 Improvements

- Fixed vitest commands to use `run` mode
- Proper nested type validation
- Parent meta inheritance for nested types
- Better error messages with position tracking

## 📦 What Works Now

Parse binary data with .ksy definitions:

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
  - id: header
    type: header_type
types:
  header_type:
    seq:
      - id: flags
        type: u1
`

const buffer = new Uint8Array([...])
const result = parse(ksy, buffer)
console.log(result.version)
console.log(result.header.flags)
```

## ⏳ Not Yet Implemented

- Expression evaluator (for if, repeat-until, calculated values)
- Enums (named constants)
- Switch types (type selection)
- Conditional parsing (if conditions)
- String terminators (strz)
- Processing (compression, encryption)
- Instances (lazy evaluation)
- Imports (cross-file references)

## 🔗 Links

- Repository: https://github.com/fabianopinto/kaitai-struct-ts
- Documentation: See README.md and docs/
