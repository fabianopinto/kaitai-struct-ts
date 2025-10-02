# Examples

This document provides examples of using kaitai-struct-ts with real-world binary formats.

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

console.log(result.header)  // "GIF"
console.log(result.version) // "89a"
```

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
```

### Using Instances

```yaml
seq:
  - id: ofs_footer
    type: u4
instances:
  footer:
    pos: ofs_footer
    type: footer_type
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
