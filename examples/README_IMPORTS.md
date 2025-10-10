# Testing Import Resolution

This document explains how to test the import resolution feature with the WAV format example.

## Overview

The WAV format (`media/wav.ksy`) imports the RIFF format (`common/riff.ksy`). This demonstrates how to parse formats that depend on other format definitions.

## Files

- **`test-imports.ts`** - TypeScript test script (requires ts-node)
- **`test-imports.mjs`** - JavaScript ES Module test script (runs with Node.js)
- **`media/wav.ksy`** - WAV format definition (imports RIFF)
- **`common/riff.ksy`** - RIFF container format definition
- **`media/wav/small.wav`** - Sample WAV file for testing

## Quick Start

### Option 1: Using the Built Distribution (Recommended)

```bash
# From the project root:

# 1. Build the project
pnpm build

# 2. Run the test script
node examples/test-imports.mjs
```

### Option 2: Using TypeScript Directly

```bash
# From the project root:

# 1. Install ts-node if not already installed
pnpm add -D ts-node

# 2. Run the TypeScript test script
npx ts-node examples/test-imports.ts
```

## Expected Output

The test script will:

1. ✅ Load the WAV and RIFF KSY definitions
2. ✅ Load the binary WAV file
3. ✅ Parse the KSY with import resolution
4. ✅ Show resolved types (including imported `riff::*` types)
5. ✅ Parse the binary data
6. ✅ Display the parsed result as JSON
7. ✅ Show parsing statistics

Example output:

```
============================================================
WAV Format Parsing with Import Resolution
============================================================

📖 Reading KSY definitions...
  - WAV:  /path/to/examples/media/wav.ksy
  - RIFF: /path/to/examples/common/riff.ksy
  ✅ KSY files loaded

📖 Reading binary data...
  - File: /path/to/examples/media/wav/small.wav
  ✅ Loaded 1024 bytes

🔧 Parsing KSY with import resolution...
  - Resolving imports: /common/riff
  ✅ Schema parsed successfully
  - Resolved types: 15
  - Imported types:
    • riff
    • riff::chunk
    • riff::parent_chunk_data
    • riff::chunk_type
    • riff::list_chunk_data

🔍 Parsing binary data...
  ✅ Binary data parsed successfully

📊 Parsed Result:
============================================================
{
  "chunk": {
    "id": "RIFF",
    "len": 1016,
    "data_slot": {},
    ...
  }
}
============================================================

📈 Statistics:
  - Bytes consumed: 1024/1024
  - Fields parsed: 5

✅ Test completed successfully!
```

## How It Works

### 1. Import Declaration

In `wav.ksy`:
```yaml
meta:
  id: wav
  imports:
    - /common/riff  # Import path
```

### 2. Using Imported Types

In `wav.ksy`:
```yaml
seq:
  - id: chunk
    type: 'riff::chunk'  # Namespace-qualified type
```

### 3. Programmatic Usage

```typescript
import { KsyParser, TypeInterpreter, KaitaiStream } from '@k67/kaitai-struct-ts'

// Load KSY files
const wavKsy = readFileSync('examples/media/wav.ksy', 'utf-8')
const riffKsy = readFileSync('examples/common/riff.ksy', 'utf-8')

// Parse with imports
const parser = new KsyParser()
const imports = new Map([['/common/riff', riffKsy]])
const schema = parser.parseWithImports(wavKsy, imports)

// Parse binary data
const stream = new KaitaiStream(binaryData)
const interpreter = new TypeInterpreter(schema)
const result = interpreter.parse(stream)
```

## Import Resolution Details

### Namespace Mapping

Import paths are converted to namespaces:

| Import Path | Namespace | Example Type |
|-------------|-----------|--------------|
| `/common/riff` | `riff` | `riff::chunk` |
| `/formats/media/wav` | `wav` | `wav::format_chunk` |
| `utils/helpers` | `helpers` | `helpers::util_type` |

### Type Resolution

When an import is resolved:

1. **Root type** - The imported schema itself becomes a type
   - Import: `/common/riff` → Type: `riff`

2. **Nested types** - All types in the imported schema get namespaced
   - Import: `/common/riff` with type `chunk` → Type: `riff::chunk`

3. **Enums** - Enums are also namespaced
   - Import: `/common/riff` with enum `fourcc` → Enum: `riff::fourcc`

## Troubleshooting

### Error: "Import not found"

**Cause:** The import path in the KSY doesn't match the key in the imports Map.

**Solution:** Ensure the import path matches exactly:
```typescript
// In KSY: imports: ['/common/riff']
// In code:
const imports = new Map([['/common/riff', riffKsy]]) // ✅ Correct
const imports = new Map([['common/riff', riffKsy]])  // ❌ Wrong (missing /)
```

### Error: "Unknown type: riff::chunk"

**Cause:** The import wasn't resolved, or the type doesn't exist in the imported schema.

**Solution:** 
1. Check that the import is provided in the Map
2. Verify the type exists in the imported schema
3. Check the namespace is correct

### Error: "Cannot read property of undefined"

**Cause:** The binary data might not match the format, or there's a parsing error.

**Solution:**
1. Verify the binary file is a valid WAV file
2. Check the console output for more specific error messages
3. Try with a different WAV file

## Next Steps

### CLI Support (Coming Soon)

The CLI will be enhanced to automatically detect and load imports:

```bash
# Future usage (not yet implemented)
kaitai examples/media/wav.ksy examples/media/wav/small.wav
# Will automatically load examples/common/riff.ksy based on the import path
```

### Custom Import Loaders

You can implement custom import resolution:

```typescript
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { parse as parseYaml } from 'yaml'

function loadImports(ksyPath: string): Map<string, string> {
  const imports = new Map()
  const dir = dirname(ksyPath)
  
  // Read the KSY to find imports
  const ksy = readFileSync(ksyPath, 'utf-8')
  const schema = parseYaml(ksy)
  
  // Load each import relative to the examples folder
  for (const importPath of schema.meta?.imports || []) {
    // Convert '/common/riff' to 'examples/common/riff.ksy'
    const fullPath = resolve(dir, '..', 'examples', importPath.slice(1) + '.ksy')
    const content = readFileSync(fullPath, 'utf-8')
    imports.set(importPath, content)
  }
  
  return imports
}
```

## See Also

- [KsyParser API Documentation](../src/parser/KsyParser.ts)
- [Import Resolution Tests](../test/unit/parser-imports.test.ts)
- [WAV Format Example](./media/wav.ksy)
- [RIFF Format Example](./common/riff.ksy)
