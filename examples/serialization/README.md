# Chrome PAK Serialization Format Example

This example demonstrates parsing Chrome PAK (Package) files using `@k67/kaitai-struct-ts`.

## 📄 Files

- **`chrome_pak.ksy`** - Kaitai Struct format definition for Chrome PAK files
- **`pak/`** - Sample PAK files
  - `v4.pak` - PAK format version 4
  - `v5.pak` - PAK format version 5 (UTF-8)
  - `v5-utf16.pak` - PAK format version 5 (UTF-16)

## 📖 About Chrome PAK Format

Chrome PAK is a serialization format used by Google Chrome and various Android apps to store resources such as:

- **Translated strings** - Localized UI text
- **Help messages** - Documentation and tooltips
- **Images** - Icons and graphics
- **Binary resources** - Any application data

The format features:

- **Compact storage** - Efficient resource packing
- **Fast lookup** - Index-based access
- **Version support** - Backward compatibility (v4, v5)
- **Encoding options** - Binary, UTF-8, UTF-16
- **Resource aliasing** - Multiple IDs pointing to same data

## 🎯 Features Demonstrated

This example showcases:

- ✅ **Version-specific parsing** - Conditional fields based on version
- ✅ **Instances** - Computed fields (num_resources, num_aliases)
- ✅ **Parameterized types** - Passing index and flags to resources
- ✅ **Repeat expressions** - Dynamic array sizes from instances
- ✅ **Forward references** - Resources referencing next element
- ✅ **Safe serialization** - Handling unavailable lazy properties
- ✅ **Enumerations** - Text encoding types
- ✅ **Validation** - Format version and value constraints

## 🚀 Usage

### CLI

```bash
# Parse PAK v4
npx @k67/kaitai-struct-ts examples/serialization/chrome_pak.ksy examples/serialization/pak/v4.pak

# Parse PAK v5
npx @k67/kaitai-struct-ts examples/serialization/chrome_pak.ksy examples/serialization/pak/v5.pak

# Parse PAK v5 UTF-16
npx @k67/kaitai-struct-ts examples/serialization/chrome_pak.ksy examples/serialization/pak/v5-utf16.pak

# Save to JSON file
npx @k67/kaitai-struct-ts examples/serialization/chrome_pak.ksy examples/serialization/pak/v4.pak -o output.json

# Extract specific resource
npx @k67/kaitai-struct-ts examples/serialization/chrome_pak.ksy examples/serialization/pak/v4.pak --field resources
```

### Library

```typescript
import { parse } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

// Load format and data
const ksy = readFileSync('examples/serialization/chrome_pak.ksy', 'utf-8')
const data = readFileSync('examples/serialization/pak/v4.pak')

// Parse
const pak = parse(ksy, data)

// Access parsed data
console.log('Version:', pak.version)
console.log('Encoding:', pak.encoding)
console.log('Number of resources:', pak.num_resources)
console.log('Number of aliases:', pak.num_aliases)

// Access resources
pak.resources.forEach((resource, index) => {
  if (resource.has_body) {
    console.log(`Resource ${resource.id}:`)
    console.log('  Offset:', resource.ofs_body)
    console.log('  Length:', resource.len_body)

    // Convert body to string if it's text
    if (pak.encoding === 1) {
      // UTF-8
      const text = new TextDecoder('utf-8').decode(
        new Uint8Array(resource.body)
      )
      console.log('  Content:', text)
    }
  }
})

// Access aliases
pak.aliases.forEach((alias) => {
  console.log(`Alias ${alias.id} -> Resource ${alias.resource_idx}`)
})
```

## 📊 Expected Output Structure

```json
{
  "version": 4,
  "num_resources_v4": 4,
  "encoding": 1,
  "num_resources": 4,
  "num_aliases": 0,
  "resources": [
    {
      "id": 1,
      "ofs_body": 39,
      "len_body": 0,
      "body": [],
      "idx": 0,
      "has_body": true,
      "_sizeof": 6
    },
    {
      "id": 4,
      "ofs_body": 39,
      "len_body": 12,
      "body": [116, 104, 105, 115, 32, 105, 115, 32, 105, 100, 32, 52],
      "idx": 1,
      "has_body": true,
      "_sizeof": 6
    }
  ],
  "aliases": [],
  "_sizeof": 39
}
```

## ⚠️ Current Status

> **Note:** This example is fully supported and demonstrates:
>
> - ✅ Version-specific conditional parsing
> - ✅ Instance-based repeat expressions
> - ✅ Parameterized types with index tracking
> - ✅ Forward references in lazy evaluation
> - ✅ Safe JSON serialization with error handling
> - ✅ Validation constraints

All features work correctly with this format.

## 🔗 References

- **Chromium Source:** https://chromium.googlesource.com/chromium/src/tools/grit/
- **Format Documentation (v4):** https://web.archive.org/web/20220126211447/https://dev.chromium.org/developers/design-documents/linuxresourcesandlocalizedstrings
- **Format Implementation (v4):** https://chromium.googlesource.com/chromium/src/tools/grit/+/3c36f27/grit/format/data_pack.py
- **Format Implementation (v5):** https://chromium.googlesource.com/chromium/src/tools/grit/+/8a23eae/grit/format/data_pack.py
- **Kaitai Struct Gallery:** https://formats.kaitai.io/chrome_pak/

## 📝 Format Details

### Version Differences

#### Version 4

- 4-byte version field
- 4-byte resource count
- 1-byte encoding
- Resources immediately follow

#### Version 5

- 4-byte version field
- 1-byte encoding
- 3-byte padding
- 2-byte resource count
- 2-byte alias count
- Resources and aliases follow

### Encoding Types

| Code | Encoding | Description                         |
| ---- | -------- | ----------------------------------- |
| 0    | Binary   | File contains only binary resources |
| 1    | UTF-8    | Text resources encoded in UTF-8     |
| 2    | UTF-16   | Text resources encoded in UTF-16    |

### Resource Structure

Each resource entry contains:

- **ID** (2 bytes) - Resource identifier
- **Offset** (4 bytes) - Offset to resource data

The length is calculated by looking at the next resource's offset:

```
length = next_resource.offset - current_resource.offset
```

A sentinel entry (ID=0) marks the end of resources.

### Alias Structure (v5 only)

Each alias entry contains:

- **ID** (2 bytes) - Alias identifier
- **Resource Index** (2 bytes) - Index into resources array

## 🧪 Testing

Test parsing with different PAK versions:

```bash
# Test all versions
for file in examples/serialization/pak/*.pak; do
  echo "Parsing $file..."
  npx @k67/kaitai-struct-ts examples/serialization/chrome_pak.ksy "$file"
done
```

## 🔍 Extracting Resources

Extract and decode text resources:

```bash
# Parse and save to JSON
npx @k67/kaitai-struct-ts examples/serialization/chrome_pak.ksy \
  examples/serialization/pak/v4.pak -o pak.json

# Use jq to extract resource bodies
jq '.resources[] | select(.has_body) | .body' pak.json
```

## 💡 Advanced Features

This example demonstrates several advanced Kaitai Struct features:

### Instance-Based Repeat

```yaml
instances:
  num_resources:
    value: 'version == 5 ? v5_part.num_resources : num_resources_v4'

seq:
  - id: resources
    repeat: expr
    repeat-expr: num_resources + 1 # Uses instance in expression
```

### Parameterized Types

```yaml
- id: resources
  type: resource(_index, _index < num_resources)
  repeat: expr
  repeat-expr: num_resources + 1

types:
  resource:
    params:
      - id: idx
        type: s4
      - id: has_body
        type: bool
```

### Forward References

```yaml
instances:
  len_body:
    value: _parent.resources[idx + 1].ofs_body - ofs_body
    if: has_body
    doc: MUST NOT be accessed until the next resource is parsed
```

### Version-Specific Parsing

```yaml
- id: num_resources_v4
  type: u4
  if: version == 4

- id: v5_part
  type: header_v5_part
  if: version == 5
```
