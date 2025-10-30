<div align="center">
  <img src=".github/logo.png" alt="kaitai-struct-ts" width="200"/>

# kaitai-struct-ts

[![npm version](https://badge.fury.io/js/%40k67%2Fkaitai-struct-ts.svg)](https://www.npmjs.com/package/@k67/kaitai-struct-ts)
[![CI](https://github.com/fabianopinto/kaitai-struct-ts/workflows/CI/badge.svg)](https://github.com/fabianopinto/kaitai-struct-ts/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

**A runtime interpreter for [Kaitai Struct](https://kaitai.io/) binary format definitions in TypeScript.**

</div>

---

Parse any binary data format by providing a `.ksy` (Kaitai Struct YAML) definition file - no compilation step required!

## Features

### Core Features

- 🚀 **Runtime interpretation** - No code generation needed
- 📦 **Zero dependencies** (runtime) - Only YAML parser for development
- 🎯 **TypeScript native** - Full type safety and IntelliSense support
- 🌐 **Universal** - Works in Node.js and browsers
- 🧪 **Well tested** - 283 comprehensive tests
- 📖 **Well documented** - Clear API and examples

### Advanced Features

- ⚡ **Expression evaluation** - Full support for Kaitai expressions
- 🔀 **Switch/case types** - Dynamic type selection based on data
- 💎 **Instances** - Lazy-evaluated fields with caching
- 🎨 **Enums** - Named constants with expression access
- 🔁 **Conditional parsing** - if, repeat-expr, repeat-until
- 📍 **Positioned reads** - Absolute positioning with pos attribute
- 🌊 **Streaming API** - Parse large files progressively (v0.10.0)

### Visual Debugger

**[🚀 Launch Debugger](https://fabianopinto.github.io/kaitai-struct-ts/)** | **[📚 Documentation](./debugger/README.md)**

Interactive web-based debugger for visualizing and stepping through binary parsing:

- 🔍 **Hex Viewer** - Editable hex view with virtual scrolling, and field highlighting
- 🌳 **Parse Tree** - Interactive tree view with expandable nodes
- ✏️ **Schema Editor** - Monaco-based .ksy editor with syntax highlighting
- 🐛 **Step Debugger** - Play/pause/step controls with breakpoints
- 💻 **Expression Console** - REPL for evaluating expressions against parsed data
  - Context variables: `root`, `_` (selected field), `data` (binary)
  - Helper functions: `hex()`, `bin()`, `bytes()`, `sizeof()`, `offsetof()`
  - Command history with ↑↓ navigation
- 📦 **Built-in Examples** - GIF, PNG, WAV, EDID formats ready to test
- ⌨️ **Keyboard Shortcuts** - F5 (run), F9 (breakpoint), F10 (step), F11 (step in)

## Installation

```bash
npm install @k67/kaitai-struct-ts
# or
pnpm add @k67/kaitai-struct-ts
# or
yarn add @k67/kaitai-struct-ts
```

## Quick Start

### CLI Usage

Parse binary files directly from the command line:

```bash
# Using npx (no installation needed)
npx @k67/kaitai-struct-ts format.ksy data.bin

# Or with pnpm
pnpx @k67/kaitai-struct-ts format.ksy data.bin

# After installing globally
npm install -g @k67/kaitai-struct-ts
kaitai format.ksy data.bin

# Save output to file
kaitai format.ksy data.bin -o output.json

# Extract specific field
kaitai format.ksy data.bin --field header.version

# Get help
kaitai --help
```

### Library Usage

```typescript
import { parse } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

// Load your .ksy definition
const ksyDefinition = `
meta:
  id: my_format
  endian: le
seq:
  - id: magic
    contents: [0x4D, 0x59, 0x46, 0x4D]
  - id: version
    type: u2
  - id: name
    type: str
    size: 32
    encoding: UTF-8
`

// Load your binary data
const binaryData = readFileSync('data.bin')

// Parse!
const result = parse(ksyDefinition, binaryData)

console.log(result.version) // Access parsed fields
console.log(result.name)
```

### Performance Optimization

For optimal performance when parsing multiple files with the same schema, pre-compile the schema once and reuse it:

```typescript
import { compileSchema, parseWithSchema } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

// Compile schema once
const compiled = compileSchema(ksyDefinition, { validate: true })

// Reuse for multiple files (50-70% faster for small files)
const result1 = parseWithSchema(compiled, readFileSync('file1.bin'))
const result2 = parseWithSchema(compiled, readFileSync('file2.bin'))
const result3 = parseWithSchema(compiled, readFileSync('file3.bin'))

// Or use the unified parse() function
const result = parse(compiled, binaryData)
```

**Benefits:**

- ✅ Eliminates redundant YAML parsing (1-5ms per parse)
- ✅ Skips schema validation overhead (0.5-2ms per parse)
- ✅ Ideal for batch processing or server applications
- ✅ Backward compatible - existing code works unchanged

## Current Status

**Version:** 0.13.0
**Status:** Production Ready 🚀
**Latest:** Schema Compilation API for performance optimization

### ✅ Fully Implemented

- **Core Runtime** - Complete binary stream reader with all primitive types
- **Streaming API** - Parse files larger than RAM with progressive results (NEW in v0.10.0)
- **KSY Parser** - Full YAML parser with schema validation
- **Type Interpreter** - Execute schemas against binary data
- **Expression Evaluator** - Complete Kaitai expression language support
- **Advanced Features** - Conditionals, enums, repetitions, instances, switch/case
- **CLI Tool** - Command-line utility for parsing binary files
- **Testing** - 283 comprehensive tests, all passing
- **Documentation** - Complete user and developer documentation

### 🎉 What's New in v0.13.0

- **Schema Compilation API** - Pre-compile schemas for optimal performance (NEW)
  - `compileSchema()` - Compile .ksy schemas once for reuse
  - `parseWithSchema()` - Parse with pre-compiled schemas
  - `parse()` - Now accepts both YAML strings and compiled schemas
  - 50-70% performance improvement for batch processing
  - Zero breaking changes - fully backward compatible

### 🎉 What's New in v0.12.0

- **Visual Debugger** - Interactive debugger with hex viewer, parse tree, and step debugging
  - **Expression Console/REPL** - Interactive JavaScript console in the debugger
  - **Unified Console** - Parse events and expressions in single chronological view
  - **Enhanced Debugger** - Better error display, execution timing, improved UX
  - Try [Visual Debugger](https://fabianopinto.github.io/kaitai-struct-ts/) in your browser
  - See [debugger/README.md](./debugger/README.md)

### 🚀 What's New in v0.10.0

- **Streaming API** - Parse large files without loading everything into memory
  - `StreamingKaitaiStream` - Forward-only stream reader
  - `parseStreaming()` - Event-based progressive parsing
  - Memory-efficient for files larger than RAM
  - See [docs/STREAMING.md](./docs/STREAMING.md)

### 🔄 Remaining for v1.0.0

- Processing implementations (zlib, encryption)
- Type imports across files
- Additional performance optimizations

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for architecture details.

## API Documentation

### `parse(ksy: string, buffer: ArrayBuffer | Uint8Array, options?: ParseOptions): Record<string, unknown>`

Parse binary data using a Kaitai Struct definition.

**Parameters:**

- `ksy` - YAML string containing the .ksy definition
- `buffer` - Binary data to parse
- `options` - Optional parsing options (validate, strict)

**Returns:** Parsed object with fields defined in the .ksy file

**Example:**

```typescript
import { parse } from 'kaitai-struct-ts'

const result = parse(ksyYaml, binaryData, { validate: true })
console.log(result.fieldName)
```

### `KaitaiStream`

Low-level binary stream reader.

```typescript
import { KaitaiStream } from '@k67/kaitai-struct-ts'

const stream = new KaitaiStream(buffer)
const value = stream.readU4le() // Read 4-byte unsigned little-endian integer
```

See [API Documentation](./docs/API.md) for complete reference.

## CLI Reference

The `kaitai` command-line tool allows you to parse binary files without writing code.

```bash
# Basic usage
kaitai <ksy-file> <binary-file> [options]

# Examples
kaitai format.ksy data.bin                    # Parse and display
kaitai format.ksy data.bin -o result.json     # Save to file
kaitai format.ksy data.bin --field version    # Extract field
kaitai format.ksy data.bin --quiet            # Quiet mode
```

**📖 Full CLI Documentation:** [docs/CLI.md](./docs/CLI.md)

**Quick Reference:**

- `-o, --output <file>` - Write to file
- `--field <path>` - Extract specific field
- `-q, --quiet` - Suppress progress messages
- `-h, --help` - Show help
- See [docs/CLI.md](./docs/CLI.md) for all options and examples

## Examples

Check the [examples](./examples) directory for more usage examples:

- Basic struct parsing
- Working with enums
- Conditional parsing
- Repetitions

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Test coverage
pnpm test:coverage

# Lint
pnpm lint

# Format
pnpm format
```

## Current Status

**Version:** 0.12.0
**Debugger Version:** 0.8.0
**Status:** Production-ready, actively maintained

The library is feature-complete for most use cases with comprehensive test coverage (283 tests). The visual debugger provides an interactive development experience with real-time parsing visualization, expression evaluation, and step-by-step debugging capabilities.

## Roadmap

### ✅ Completed

- **v0.1.0-v0.4.0** - Core runtime, KSY parser, type interpreter, expressions
- **v0.5.0-v0.6.0** - Advanced features (switch/case, instances, parametric types)
- **v0.7.0-v0.9.0** - CLI tool, production polish, expression-based endianness
- **v0.10.0** - Streaming API for large files
- **v0.11.0** - Visual debugger with hex viewer, parse tree, and step debugging
- **v0.12.0** - Expression console/REPL, unified console, debugger enhancements

### 🔄 In Progress (v1.0.0)

- Processing implementations (zlib, encryption)
- Additional performance optimizations
- Extended format testing
- Debugger improvements (performance, UX enhancements)

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) first.

## License

MIT © Fabiano Pinto

## Related Projects

- [Kaitai Struct](https://kaitai.io/) - Official Kaitai Struct project
- [kaitai-struct-compiler](https://github.com/kaitai-io/kaitai_struct_compiler) - Official compiler
- [Format Gallery](https://formats.kaitai.io/) - Collection of .ksy format definitions

## Acknowledgments

This project implements the [Kaitai Struct specification](https://doc.kaitai.io/) created by the Kaitai Struct team.
