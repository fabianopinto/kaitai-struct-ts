# EDID Display Identification Example

This example demonstrates parsing VESA Enhanced Extended Display Identification Data (EDID) using `@k67/kaitai-struct-ts`.

## 📄 Files

- **`edid.ksy`** - Kaitai Struct format definition for EDID
- **`edid-1.0.bin`** - EDID version 1.0 sample
- **`edid-1.1.bin`** - EDID version 1.1 sample
- **`edid-1.2.bin`** - EDID version 1.2 sample

## 📖 About EDID

EDID (Extended Display Identification Data) is a data structure provided by a display to describe its capabilities to a video source. It includes:

- **Manufacturer information** - Vendor ID, product code, serial number
- **Display characteristics** - Screen size, gamma, color characteristics
- **Supported timings** - Video modes and refresh rates
- **Version information** - EDID standard version

## 🎯 Features Demonstrated

This example showcases:

- ✅ **Bit-level parsing** - Extracting individual bits from bytes
- ✅ **Fixed-precision arithmetic** - 10-bit color coordinates
- ✅ **Calculated instances** - Derived values from raw data
- ✅ **Enumerations** - Aspect ratios
- ✅ **Conditional fields** - Version-specific data
- ✅ **Magic bytes validation** - Format identification
- ✅ **Complex bit manipulation** - Manufacturer ID encoding

## 🚀 Usage

### CLI

```bash
# Parse EDID 1.0
npx @k67/kaitai-struct-ts examples/edid/edid.ksy examples/edid/edid-1.0.bin

# Parse EDID 1.1
npx @k67/kaitai-struct-ts examples/edid/edid.ksy examples/edid/edid-1.1.bin

# Parse EDID 1.2
npx @k67/kaitai-struct-ts examples/edid/edid.ksy examples/edid/edid-1.2.bin

# Save to JSON
npx @k67/kaitai-struct-ts examples/edid/edid.ksy examples/edid/edid-1.0.bin -o edid.json

# Extract manufacturer info
npx @k67/kaitai-struct-ts examples/edid/edid.ksy examples/edid/edid-1.0.bin --field mfg_str
```

### Library

```typescript
import { parse } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

// Load format and data
const ksy = readFileSync('examples/edid/edid.ksy', 'utf-8')
const data = readFileSync('examples/edid/edid-1.0.bin')

// Parse
const edid = parse(ksy, data)

// Access parsed data
console.log('Manufacturer:', edid.mfg_str)
console.log('Product code:', edid.product_code)
console.log('Serial number:', edid.serial)
console.log('Manufacture year:', edid.mfg_year)
console.log(
  'EDID version:',
  `${edid.edid_version_major}.${edid.edid_version_minor}`
)
console.log('Screen size:', `${edid.screen_size_h}cm x ${edid.screen_size_v}cm`)
console.log('Gamma:', edid.gamma)

// Access chromaticity info
console.log(
  'Red chromaticity:',
  `(${edid.chromacity.red_x}, ${edid.chromacity.red_y})`
)
console.log(
  'Green chromaticity:',
  `(${edid.chromacity.green_x}, ${edid.chromacity.green_y})`
)
console.log(
  'Blue chromaticity:',
  `(${edid.chromacity.blue_x}, ${edid.chromacity.blue_y})`
)
console.log(
  'White point:',
  `(${edid.chromacity.white_x}, ${edid.chromacity.white_y})`
)

// Check supported timings
console.log('Supports 1024x768@60Hz:', edid.est_timings.can_1024x768px_60hz)
console.log('Supports 1280x1024@75Hz:', edid.est_timings.can_1280x1024px_75hz)
```

## 📊 Expected Output Structure

```json
{
  "magic": [0, 255, 255, 255, 255, 255, 255, 0],
  "mfg_str": "SAM",
  "product_code": 1234,
  "serial": 12345678,
  "mfg_week": 15,
  "mfg_year": 2020,
  "edid_version_major": 1,
  "edid_version_minor": 3,
  "screen_size_h": 52,
  "screen_size_v": 29,
  "gamma": 2.2,
  "chromacity": {
    "red_x": 0.64,
    "red_y": 0.33,
    "green_x": 0.3,
    "green_y": 0.6,
    "blue_x": 0.15,
    "blue_y": 0.06,
    "white_x": 0.313,
    "white_y": 0.329
  },
  "est_timings": {
    "can_1024x768px_60hz": true,
    "can_1280x1024px_75hz": true
  }
}
```

## ⚠️ Current Status

> **Note:** This example requires the following features to be fully supported:
>
> - ✅ Bit-level parsing
> - ✅ Calculated instances
> - ✅ Enumerations
> - ⚠️ Complex expressions with bit operations
> - ⚠️ String conversion methods (`.as<bytes>.to_s("ASCII")`)

Some features may not work yet. This serves as a test case for development.

## 🔗 References

- **EDID Specification:** https://en.wikipedia.org/wiki/Extended_Display_Identification_Data
- **VESA Standards:** https://vesa.org/
- **Kaitai Struct Gallery:** https://formats.kaitai.io/edid/

## 📝 Format Details

### EDID Structure (128 bytes)

| Offset | Size | Field                                  |
| ------ | ---- | -------------------------------------- |
| 0-7    | 8    | Header (magic bytes)                   |
| 8-9    | 2    | Manufacturer ID (compressed)           |
| 10-11  | 2    | Product code                           |
| 12-15  | 4    | Serial number                          |
| 16     | 1    | Week of manufacture                    |
| 17     | 1    | Year of manufacture (offset from 1990) |
| 18     | 1    | EDID version                           |
| 19     | 1    | EDID revision                          |
| 20-24  | 5    | Video input definition                 |
| 25-34  | 10   | Chromaticity coordinates               |
| 35-37  | 3    | Established timings                    |
| 38-53  | 16   | Standard timings (8 × 2 bytes)         |
| 54-125 | 72   | Detailed timing descriptors            |
| 126    | 1    | Extension flag                         |
| 127    | 1    | Checksum                               |

### Manufacturer ID Encoding

The manufacturer ID is encoded as 3 compressed ASCII characters:

- Each character is 5 bits (A=1, B=2, ..., Z=26)
- Packed into 15 bits of a 16-bit big-endian value
- Example: "SAM" = 0x4C2D

### Chromaticity Coordinates

Color coordinates are stored as 10-bit fixed-precision values:

- Bits 9-2 stored in one byte
- Bits 1-0 stored in shared bytes
- Converted to floating point by dividing by 1024.0

## 🧪 Testing

Test parsing with different EDID versions:

```bash
# Test all versions
for file in examples/edid/edid-*.bin; do
  echo "Parsing $file..."
  npx @k67/kaitai-struct-ts examples/edid/edid.ksy "$file"
done
```

## 🔍 Comparing Versions

Compare different EDID versions to see format evolution:

```bash
# Extract version info from all samples
npx @k67/kaitai-struct-ts examples/edid/edid.ksy examples/edid/edid-1.0.bin --field edid_version_major
npx @k67/kaitai-struct-ts examples/edid/edid.ksy examples/edid/edid-1.1.bin --field edid_version_major
npx @k67/kaitai-struct-ts examples/edid/edid.ksy examples/edid/edid-1.2.bin --field edid_version_major
```
