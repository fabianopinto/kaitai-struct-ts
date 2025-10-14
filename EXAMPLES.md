# Examples

This document provides examples of using kaitai-struct-ts with real-world binary formats.

## Table of Contents

- [Quick Start Example](#quick-start-example)
- [CLI Usage](#cli-usage)
- [Working with Imports](#working-with-imports)
- [Real-World Examples](#real-world-examples)
  - [WAV Audio File](#wav-audio-file)
  - [EDID Display Information](#edid-display-information)
  - [XAR Archive Format](#xar-archive-format)
  - [Chrome PAK Serialization](#chrome-pak-serialization)
- [Example Files](#example-files)
- [Common Format Examples](#common-format-examples)
- [Advanced Features](#advanced-features)
- [Format Gallery](#format-gallery)

## Quick Start Example

```typescript
import { parse } from '@k67/kaitai-struct-ts'

// Define a simple format
const schema = `
meta:
  id: gif
  file-extension: gif
  endian: le
seq:
  - id: header
    type: str
    size: 3
    contents: "GIF"
  - id: version
    type: str
    size: 3
`

// Parse binary data
const buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]) // "GIF89a"
const result = parse(schema, buffer)

console.log(result.header) // "GIF"
console.log(result.version) // "89a"
```

## CLI Usage

The CLI provides a quick way to parse binary files without writing code:

### Basic Parsing

```bash
# Parse a binary file
kaitai format.ksy data.bin

# Save output to file
kaitai format.ksy data.bin -o output.json

# Pretty-print JSON (default)
kaitai format.ksy data.bin --pretty

# Compact JSON
kaitai format.ksy data.bin --compact
```

### Field Extraction

```bash
# Extract a specific field
kaitai format.ksy data.bin --field header.version

# Extract nested field
kaitai format.ksy data.bin --field chunks[0].type
```

### Quiet Mode

```bash
# Suppress informational messages (only output data)
kaitai format.ksy data.bin --quiet
```

### Working with Imports

The CLI automatically resolves imports from the schema's `meta.imports` section:

```bash
# Parse WAV file (imports common/riff.ksy automatically)
kaitai examples/media/wav.ksy examples/media/wav/small.wav
```

## Working with Imports

Many formats depend on common type definitions. Here's how to handle imports:

### Using KsyParser with Imports

```typescript
import { KsyParser, TypeInterpreter, KaitaiStream } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

// Load schemas
const wavKsy = readFileSync('examples/media/wav.ksy', 'utf-8')
const riffKsy = readFileSync('examples/common/riff.ksy', 'utf-8')

// Parse schema with imports
const parser = new KsyParser()
const imports = new Map([['/common/riff', riffKsy]])
const schema = parser.parseWithImports(wavKsy, imports)

// Parse binary data
const binaryData = readFileSync('audio.wav')
const stream = new KaitaiStream(binaryData)
const interpreter = new TypeInterpreter(schema)
const result = interpreter.parse(stream)

console.log(result)
```

### Import Path Resolution

Import paths in `.ksy` files are resolved as follows:

```yaml
meta:
  id: wav
  imports:
    - /common/riff # Absolute path from format root
```

When using `parseWithImports()`, provide a Map with matching keys:

```typescript
const imports = new Map([
  ['/common/riff', riffKsyContent],
  ['/image/png', pngKsyContent],
])
```

## Real-World Examples

### WAV Audio File

The WAV format demonstrates imports, custom IO, and substreams:

```bash
# CLI usage
kaitai examples/media/wav.ksy examples/media/wav/small.wav
```

```typescript
// Library usage
import { KsyParser, TypeInterpreter, KaitaiStream } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

const wavKsy = readFileSync('examples/media/wav.ksy', 'utf-8')
const riffKsy = readFileSync('examples/common/riff.ksy', 'utf-8')

const parser = new KsyParser()
const imports = new Map([['/common/riff', riffKsy]])
const schema = parser.parseWithImports(wavKsy, imports)

const data = readFileSync('audio.wav')
const stream = new KaitaiStream(data)
const interpreter = new TypeInterpreter(schema)
const result = interpreter.parse(stream)

console.log('Sample rate:', result.subchunks[0].data.sample_rate)
console.log('Channels:', result.subchunks[0].data.num_channels)
```

### EDID Display Information

The EDID format demonstrates bit fields, array literals, and binary expressions:

```bash
# CLI usage
kaitai examples/hardware/edid.ksy examples/hardware/edid/edid-1.0.bin
```

```typescript
import { parse } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

const edidKsy = readFileSync('examples/hardware/edid.ksy', 'utf-8')
const edidData = readFileSync('edid.bin')

const result = parse(edidKsy, edidData)

console.log('Manufacturer:', result.mfg_str)
console.log('Product code:', result.product_code)
console.log('Serial:', result.serial)
console.log('Week/Year:', result.mfg_week, result.mfg_year)
```

**Features demonstrated:**

- Bit fields (b1, b2, b7, etc.)
- Binary literals (0b0111110000000000)
- Array literals and comparisons
- Computed instances
- Conditional parsing

### XAR Archive Format

The XAR (eXtensible ARchive) format demonstrates advanced features:

```bash
# CLI usage
kaitai examples/archive/xar.ksy examples/archive/xar/sha1-dir.xar
```

```typescript
import { parse } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

const xarKsy = readFileSync('examples/archive/xar.ksy', 'utf-8')
const xarData = readFileSync('archive.xar')

const result = parse(xarKsy, xarData)
console.log('Magic:', result.header_prefix.magic)
console.log('Version:', result.header_prefix.version)
```

**Features demonstrated:**

- Process algorithms (zlib decompression)
- Enum value conversion (`.to_i`)
- Complex conditional expressions
- `_sizeof` and `_root` references

**See:** [examples/archive/README.md](./examples/archive/README.md)

### Chrome PAK Serialization

The Chrome PAK format demonstrates serialization and parameterized types:

```bash
# CLI usage
kaitai examples/serialization/chrome_pak.ksy examples/serialization/pak/v4.pak
```

```typescript
import { parse } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

const pakKsy = readFileSync('examples/serialization/chrome_pak.ksy', 'utf-8')
const pakData = readFileSync('resources.pak')

const result = parse(pakKsy, pakData)
console.log('Version:', result.version)
console.log('Resources:', result.num_resources)
```

**Features demonstrated:**

- Version-specific parsing
- Instance-based repeat expressions
- Parametric types
- Forward references in lazy evaluation

**See:** [examples/serialization/README.md](./examples/serialization/README.md)

## Example Files

The [`examples/`](./examples/) directory contains working examples with sample files:

### 📁 Directory Structure

- **[examples/README.md](./examples/README.md)** - Complete examples documentation
- **[examples/media/](./examples/media/)** - Media formats (WAV audio)
  - [WAV format documentation](./examples/media/README.md)
  - Sample WAV files for testing
- **[examples/hardware/](./examples/hardware/)** - Hardware formats (EDID)
  - [EDID format documentation](./examples/hardware/README.md)
  - Multiple EDID versions (1.0, 1.1, 1.2)
- **[examples/archive/](./examples/archive/)** - Archive formats (XAR)
  - [XAR format documentation](./examples/archive/README.md)
  - Sample XAR archive files
- **[examples/serialization/](./examples/serialization/)** - Serialization formats (Chrome PAK)
  - [Chrome PAK documentation](./examples/serialization/README.md)
  - Sample PAK resource files
- **[examples/browser/](./examples/browser/)** - Browser usage examples
  - HTML examples for browser environments
- **[examples/common/](./examples/common/)** - Shared format definitions
  - RIFF container format (imported by WAV)

### 🚀 Quick Start with Examples

```bash
# From project root
pnpm build

# Parse WAV audio file
node dist/cli.js examples/media/wav.ksy examples/media/wav/small.wav

# Parse EDID display data
node dist/cli.js examples/hardware/edid/edid.ksy examples/hardware/edid/edid-1.0.bin

# Parse XAR archive
node dist/cli.js examples/archive/xar.ksy examples/archive/xar/sha1-dir.xar

# Parse Chrome PAK
node dist/cli.js examples/serialization/chrome_pak.ksy examples/serialization/pak/v4.pak
```

**See [examples/README.md](./examples/README.md) for detailed usage instructions.**

## Format Gallery

The Kaitai Struct project maintains extensive format definitions and sample files:

### Official Format Definitions

**Repository:** https://github.com/kaitai-io/kaitai_struct_formats

Contains 100+ format definitions including:

- **Archives:** ZIP, TAR, RAR, 7z
- **Images:** PNG, GIF, JPEG, BMP, ICO
- **Audio:** MP3, WAV, FLAC, OGG
- **Video:** AVI, MP4, MKV
- **Documents:** PDF, EPUB
- **Executables:** ELF, PE, Mach-O
- **Filesystems:** FAT, EXT2, ISO9660
- **Network:** PCAP, DNS, HTTP
- **And many more...**

### Sample Binary Files

**Repository:** https://codeberg.org/KOLANICH-datasets/kaitai_struct_samples

Contains sample binary files for testing and development.

## Using Format Definitions

### 1. Download a Format Definition

```bash
# Example: Download GIF format
curl -O https://raw.githubusercontent.com/kaitai-io/kaitai_struct_formats/master/image/gif.ksy
```

### 2. Use with kaitai-struct-ts

```typescript
import { parse } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

// Load the .ksy definition
const ksyContent = readFileSync('gif.ksy', 'utf-8')

// Load binary file
const binaryData = readFileSync('sample.gif')

// Parse
const result = parse(ksyContent, binaryData)
console.log(result)
```

## Common Format Examples

### PNG Image

```yaml
meta:
  id: png
  file-extension: png
  endian: be
seq:
  - id: magic
    contents: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  - id: chunks
    type: chunk
    repeat: eos
types:
  chunk:
    seq:
      - id: len
        type: u4
      - id: type
        type: str
        size: 4
      - id: data
        size: len
      - id: crc
        type: u4
```

### ZIP Archive

```yaml
meta:
  id: zip
  file-extension: zip
  endian: le
seq:
  - id: sections
    type: section
    repeat: eos
types:
  section:
    seq:
      - id: magic
        type: u4
      - id: body
        type:
          switch-on: magic
          cases:
            0x04034b50: local_file
            0x02014b50: central_dir_entry
            0x06054b50: end_of_central_dir
```

### ELF Executable

```yaml
meta:
  id: elf
  endian: le
seq:
  - id: magic
    contents: [0x7f, 0x45, 0x4c, 0x46]
  - id: bits
    type: u1
    enum: bits
  - id: endian
    type: u1
    enum: endian
enums:
  bits:
    1: b32
    2: b64
  endian:
    1: le
    2: be
```

## Advanced Features

### Using Expressions

```yaml
seq:
  - id: num_items
    type: u4
  - id: items
    type: item
    repeat: expr
    repeat-expr: num_items
  - id: checksum
    type: u4
    if: num_items > 0
```

**Supported operators:**

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `<`, `<=`, `>`, `>=`, `==`, `!=`
- Logical: `and`, `or`, `not`
- Bitwise: `&`, `|`, `^`, `<<`, `>>`
- Ternary: `condition ? ifTrue : ifFalse`

**Supported literals:**

- Decimal: `42`, `3.14`
- Hexadecimal: `0xFF`, `0x1A2B`
- Binary: `0b1010`, `0b11110000`
- Strings: `"text"`, `'text'`
- Booleans: `true`, `false`
- Arrays: `[1, 2, 3]`, `[0x01, 0x02]`

### Using Instances (Lazy Evaluation)

```yaml
seq:
  - id: ofs_footer
    type: u4
instances:
  footer:
    pos: ofs_footer
    type: footer_type
  is_valid:
    value: footer.magic == 0x1234
```

Instances are computed on-demand and cached:

```typescript
const result = parse(schema, data)
console.log(result.footer) // Computed on first access
console.log(result.footer) // Returns cached value
```

### Using Switch/Case

```yaml
seq:
  - id: file_type
    type: u1
  - id: body
    type:
      switch-on: file_type
      cases:
        1: text_file
        2: binary_file
        _: unknown_file # Default case
```

### Bit Fields

```yaml
seq:
  - id: flags
    type: b8
  - id: version
    type: b4
  - id: reserved
    type: b4
```

Supported bit types: `b1` through `b64`

### Custom IO Streams

```yaml
seq:
  - id: chunk
    type: chunk_type
types:
  chunk_type:
    seq:
      - id: data
        size-eos: true
        io: _parent._io # Use parent's stream
```

### Array Comparisons

```yaml
seq:
  - id: bytes_lookahead
    size: 2
instances:
  is_used:
    value: bytes_lookahead != [0x01, 0x01]
```

## Resources

- **Format Gallery:** https://formats.kaitai.io/
- **Format Definitions:** https://github.com/kaitai-io/kaitai_struct_formats
- **Sample Files:** https://codeberg.org/KOLANICH-datasets/kaitai_struct_samples
- **Documentation:** https://doc.kaitai.io/
- **User Guide:** https://doc.kaitai.io/user_guide.html

## Contributing Examples

If you create examples using kaitai-struct-ts, please consider contributing them back to the community!

1. Test your example thoroughly
2. Add clear documentation
3. Submit a pull request

## License

Examples are provided under the same MIT license as kaitai-struct-ts.
