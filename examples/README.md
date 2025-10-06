# Examples

This directory contains practical examples demonstrating how to use `@k67/kaitai-struct-ts` with real-world binary formats.

## 📁 Directory Structure

```
examples/
├── README.md          # This file
├── wav/               # WAV audio file format
│   ├── README.md
│   ├── wav.ksy        # Format definition
│   └── small.wav      # Sample file
└── edid/              # EDID display identification
    ├── README.md
    ├── edid.ksy       # Format definition
    ├── edid-1.0.bin   # EDID 1.0 sample
    ├── edid-1.1.bin   # EDID 1.1 sample
    └── edid-1.2.bin   # EDID 1.2 sample
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
# Parse WAV file
npx @k67/kaitai-struct-ts examples/wav/wav.ksy examples/wav/small.wav

# Parse EDID file
npx @k67/kaitai-struct-ts examples/edid/edid.ksy examples/edid/edid-1.0.bin
```

### Using the Library

```typescript
import { parse } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

// Load format definition
const ksy = readFileSync('examples/wav/wav.ksy', 'utf-8')

// Load binary data
const data = readFileSync('examples/wav/small.wav')

// Parse
const result = parse(ksy, data)
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
