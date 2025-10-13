# Examples

This directory contains practical examples demonstrating how to use `@k67/kaitai-struct-ts` with real-world binary formats.

## 📁 Directory Structure

```
examples/
├── README.md               # This file (examples index)
├── common/                 # Shared formats used by others
│   └── riff.ksy            # RIFF container (imported by WAV)
├── media/                  # Media formats
│   ├── wav.ksy             # WAV format (imports /common/riff)
│   └── wav/
│       └── small.wav       # Sample WAV file
└── hardware/               # Hardware-related formats
    └── edid/
        ├── edid.ksy        # EDID format definition
        ├── edid-1.0.bin
        ├── edid-1.1.bin
        └── edid-1.2.bin
```

## 🎯 Examples

### WAV Audio Format

Parse Microsoft WAVE audio files. Demonstrates:

- RIFF container format
- Multiple chunk types
- Nested structures
- Enumerations

**See:** [`wav/README.md`](./wav/README.md)

### EDID Display Identification

Parse VESA Enhanced Extended Display Identification Data. Demonstrates:

- Bit-level parsing
- Fixed-precision arithmetic
- Calculated instances
- Version handling

**See:** [`edid/README.md`](./edid/README.md)

## 🚀 Quick Start

### Using the CLI

```bash
# From project root (when running from source)
pnpm build

# Parse WAV (imports /common/riff automatically)
node dist/cli.js examples/media/wav.ksy examples/media/wav/small.wav

# Parse EDID
node dist/cli.js examples/hardware/edid/edid.ksy examples/hardware/edid/edid-1.0.bin

# Output to a file
node dist/cli.js examples/media/wav.ksy examples/media/wav/small.wav -o out.json

# Extract a specific field
node dist/cli.js examples/media/wav.ksy examples/media/wav/small.wav --field chunk.id

# Alternate: using the published package via pnpx
pnpx @k67/kaitai-struct-ts examples/media/wav.ksy examples/media/wav/small.wav
```

## 🧩 Import Resolution (Standard Feature)

- Import paths declared in `meta.imports` are automatically resolved by the CLI.
- Imported types and enums are available via a namespace derived from the import path.

Example from `examples/media/wav.ksy`:

```yaml
meta:
  id: wav
  imports:
    - /common/riff # Import path

seq:
  - id: chunk
    type: 'riff::chunk' # Namespace-qualified type
```

### Using the Library

```typescript
import { readFileSync } from 'fs'
import { KsyParser, TypeInterpreter, KaitaiStream } from '@k67/kaitai-struct-ts'

// Load format definitions
const wavKsy = readFileSync('examples/media/wav.ksy', 'utf-8')
const riffKsy = readFileSync('examples/common/riff.ksy', 'utf-8')

// Parse schema with imports
const parser = new KsyParser()
const imports = new Map([['/common/riff', riffKsy]])
const schema = parser.parseWithImports(wavKsy, imports)

// Parse binary data
const data = readFileSync('examples/media/wav/small.wav')
const stream = new KaitaiStream(data)
const interpreter = new TypeInterpreter(schema)
const result = interpreter.parse(stream)
console.log(result)
```

## 📝 Note on Parsing

> ⚠️ **Note:** Some examples may not parse correctly yet as the library is under active development. These examples serve as test cases for implementing missing features.

If you encounter parsing errors:

1. Check the format definition (`.ksy` file) for unsupported features
2. Report issues with details about the error
3. Contribute fixes if you can!

## 🔗 Resources

- **Kaitai Struct Format Gallery:** https://formats.kaitai.io/
- **Format Specification:** https://doc.kaitai.io/ksy_reference.html
- **Library Documentation:** [../README.md](../README.md)

## 📚 Adding New Examples

To add a new example:

1. Create a directory: `examples/your-format/`
2. Add files:
   - `README.md` - Description and usage
   - `your-format.ksy` - Format definition
   - Sample binary files
3. Update this README with a link
4. Test with the CLI and library

Example structure:

```
examples/your-format/
├── README.md
├── your-format.ksy
└── sample.bin
```
