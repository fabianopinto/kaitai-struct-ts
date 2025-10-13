# XAR Archive Format Example

This example demonstrates parsing XAR (eXtensible ARchive) files using `@k67/kaitai-struct-ts`.

## 📄 Files

- **`xar.ksy`** - Kaitai Struct format definition for XAR archives
- **`xar/`** - Sample XAR archive files
  - `sha1-dir.xar` - XAR with SHA-1 checksum
  - `sha1-file-nocomp.xar` - Uncompressed file with SHA-1
  - `sha1-file-bzip2.xar` - Bzip2 compressed file
  - `md5-dir.xar` - XAR with MD5 checksum
  - `nocksum-dir.xar` - XAR without checksum
  - `apple-sha512-files-gzip.xar` - Gzip compressed with SHA-512
  - `custom-sha224-files-gzip.xar` - Custom SHA-224 checksum

## 📖 About XAR Format

XAR (eXtensible ARchive) is an open-source file archiver and format developed by Apple. It features:

- **XML Table of Contents** - Metadata stored in compressed XML
- **Flexible compression** - Supports zlib, bzip2, and no compression
- **Multiple checksums** - SHA-1, SHA-256, SHA-512, MD5, or custom algorithms
- **File attributes** - Preserves permissions, ownership, timestamps
- **Extensible design** - Custom properties via XML

## 🎯 Features Demonstrated

This example showcases:

- ✅ **Process algorithms** - Zlib decompression of TOC
- ✅ **Enumerations** - Checksum algorithm types
- ✅ **Instances** - Lazy-evaluated computed fields
- ✅ **Conditional parsing** - Optional checksum algorithm names
- ✅ **Complex expressions** - Ternary operators and enum comparisons
- ✅ **_sizeof tracking** - Calculating consumed bytes
- ✅ **_root references** - Accessing root-level fields from nested types
- ✅ **Property-style methods** - `.to_i` on enum values

## 🚀 Usage

### CLI

```bash
# Parse XAR with SHA-1 checksum
npx @k67/kaitai-struct-ts examples/archive/xar.ksy examples/archive/xar/sha1-dir.xar

# Parse compressed XAR
npx @k67/kaitai-struct-ts examples/archive/xar.ksy examples/archive/xar/sha1-file-bzip2.xar

# Save to JSON file
npx @k67/kaitai-struct-ts examples/archive/xar.ksy examples/archive/xar/sha1-dir.xar -o output.json

# Extract TOC XML
npx @k67/kaitai-struct-ts examples/archive/xar.ksy examples/archive/xar/sha1-dir.xar --field toc.xml_string
```

### Library

```typescript
import { parse } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

// Load format and data
const ksy = readFileSync('examples/archive/xar.ksy', 'utf-8')
const data = readFileSync('examples/archive/xar/sha1-dir.xar')

// Parse
const xar = parse(ksy, data)

// Access parsed data
console.log('Magic:', xar.header_prefix.magic)
console.log('Header length:', xar.header_prefix.len_header)
console.log('Version:', xar.header.version)
console.log('TOC compressed length:', xar.header.len_toc_compressed)
console.log('TOC uncompressed length:', xar.header.toc_length_uncompressed)
console.log('Checksum algorithm:', xar.header.checksum_algorithm_name)

// Access decompressed TOC
console.log('TOC XML:', xar.toc.xml_string)
```

## 📊 Expected Output Structure

```json
{
  "header_prefix": {
    "magic": "xar!",
    "len_header": 28,
    "_sizeof": 6
  },
  "header": {
    "version": 1,
    "len_toc_compressed": "278",
    "toc_length_uncompressed": "492",
    "checksum_algorithm_int": 1,
    "checksum_algorithm_name": "sha1",
    "has_checksum_alg_name": false,
    "len_header": 28,
    "_sizeof": 22
  },
  "toc": {
    "xml_string": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<xar>...</xar>",
    "_sizeof": 492
  },
  "checksum_algorithm_other": 3,
  "_sizeof": 306
}
```

## ⚠️ Current Status

> **Note:** This example is fully supported and demonstrates:
>
> - ✅ Zlib decompression (process: zlib)
> - ✅ Enum value conversion (.to_i)
> - ✅ Complex conditional expressions
> - ✅ _sizeof and _root references
> - ✅ Instance calculations

All features work correctly with this format.

## 🔗 References

- **XAR Project:** https://mackyle.github.io/xar/
- **Format Specification:** https://github.com/mackyle/xar/wiki/xarformat
- **Apple Documentation:** https://opensource.apple.com/source/xar/
- **Kaitai Struct Gallery:** https://formats.kaitai.io/xar/

## 📝 Format Details

### Header Structure

| Offset | Size | Field                    | Description                |
| ------ | ---- | ------------------------ | -------------------------- |
| 0-3    | 4    | Magic                    | "xar!" (0x78617221)        |
| 4-5    | 2    | Header length            | Size of header in bytes    |
| 6-7    | 2    | Version                  | XAR format version         |
| 8-15   | 8    | TOC compressed length    | Size of compressed TOC     |
| 16-23  | 8    | TOC uncompressed length  | Size of uncompressed TOC   |
| 24-27  | 4    | Checksum algorithm       | Algorithm identifier       |

### Checksum Algorithms

| Code | Algorithm (Apple) | Code | Algorithm (Other) |
| ---- | ----------------- | ---- | ----------------- |
| 0    | None              | 0    | None              |
| 1    | SHA-1             | 1    | SHA-1             |
| 2    | MD5               | 2    | MD5               |
| 3    | SHA-256           | 3    | SHA-256           |
| 4    | SHA-512           | 4    | SHA-512           |
|      |                   | 5    | SHA-224           |
|      |                   | 6    | SHA-384           |

### Compression Types

- **zlib** - Deflate compression (most common)
- **bzip2** - Bzip2 compression
- **none** - No compression

## 🧪 Testing

Test parsing with different XAR variants:

```bash
# Test all sample files
for file in examples/archive/xar/*.xar; do
  echo "Parsing $file..."
  npx @k67/kaitai-struct-ts examples/archive/xar.ksy "$file"
done
```

## 🔍 Examining TOC

Extract and examine the Table of Contents XML:

```bash
# Extract TOC to file
npx @k67/kaitai-struct-ts examples/archive/xar.ksy examples/archive/xar/sha1-dir.xar \
  --field toc.xml_string > toc.xml

# View TOC
cat toc.xml
```

## 💡 Advanced Features

This example demonstrates several advanced Kaitai Struct features:

### Process Algorithm (Zlib Decompression)

```yaml
- id: toc
  size: header.toc_length_uncompressed
  process: zlib
  type: toc_type
```

### Enum Value Conversion

```yaml
checksum_algorithm_int == checksum_algorithms_apple::sha1.to_i
```

### Root References

```yaml
checksum_algorithm_int == _root.checksum_algorithm_other
```

### Size Calculations

```yaml
len_header >= 32 and len_header % 4 == 0
```
