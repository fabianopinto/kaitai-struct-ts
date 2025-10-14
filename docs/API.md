# API Documentation

**Version:** 0.10.0  
**Last Updated:** 2025-10-14

Complete API reference for kaitai-struct-ts library.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Functions](#core-functions)
- [Classes](#classes)
- [Types](#types)
- [Error Classes](#error-classes)
- [Streaming API](#streaming-api)
- [Utilities](#utilities)

---

## Quick Start

```typescript
import {
  parse,
  KaitaiStream,
  KsyParser,
  TypeInterpreter,
} from '@k67/kaitai-struct-ts'

// Simple parsing
const result = parse(ksyYaml, binaryData)

// Advanced usage
const parser = new KsyParser()
const schema = parser.parse(ksyYaml)
const stream = new KaitaiStream(binaryData)
const interpreter = new TypeInterpreter(schema)
const result = interpreter.parse(stream)
```

---

## Core Functions

### `parse()`

Parse binary data using a Kaitai Struct definition. This is the main convenience function.

**Signature:**

```typescript
function parse(
  ksyYaml: string,
  buffer: ArrayBuffer | Uint8Array,
  options?: ParseOptions
): Record<string, unknown>
```

**Parameters:**

- `ksyYaml` (string) - YAML string containing the `.ksy` definition
- `buffer` (ArrayBuffer | Uint8Array) - Binary data to parse
- `options` (ParseOptions, optional) - Parsing options

**Returns:** Parsed object with fields defined in the `.ksy` file

**Throws:**

- `ParseError` - If YAML parsing fails
- `ValidationError` - If schema validation fails
- `EOFError` - If unexpected end of stream is reached

**Example:**

```typescript
import { parse } from '@k67/kaitai-struct-ts'

const ksyYaml = `
meta:
  id: gif
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

const buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]) // "GIF89a"
const result = parse(ksyYaml, buffer)

console.log(result.header) // "GIF"
console.log(result.version) // "89a"
```

**Options:**

```typescript
interface ParseOptions {
  /** Whether to validate the schema (default: true) */
  validate?: boolean

  /** Whether to treat warnings as errors (default: false) */
  strict?: boolean
}
```

---

## Classes

### `KaitaiStream`

Binary stream reader with support for various data types and endianness.

**Constructor:**

```typescript
new KaitaiStream(buffer: ArrayBuffer | Uint8Array)
```

**Properties:**

- `pos` (number) - Current position in the stream
- `size` (number) - Total size of the stream in bytes

**Methods:**

#### Integer Reading

```typescript
// Unsigned integers
readU1(): number                    // 1 byte (0-255)
readU2le(): number                  // 2 bytes, little-endian
readU2be(): number                  // 2 bytes, big-endian
readU4le(): number                  // 4 bytes, little-endian
readU4be(): number                  // 4 bytes, big-endian
readU8le(): bigint                  // 8 bytes, little-endian
readU8be(): bigint                  // 8 bytes, big-endian

// Signed integers
readS1(): number                    // 1 byte (-128 to 127)
readS2le(): number                  // 2 bytes, little-endian
readS2be(): number                  // 2 bytes, big-endian
readS4le(): number                  // 4 bytes, little-endian
readS4be(): number                  // 4 bytes, big-endian
readS8le(): bigint                  // 8 bytes, little-endian
readS8be(): bigint                  // 8 bytes, big-endian
```

#### Floating Point

```typescript
readF4le(): number                  // 4-byte float, little-endian
readF4be(): number                  // 4-byte float, big-endian
readF8le(): number                  // 8-byte double, little-endian
readF8be(): number                  // 8-byte double, big-endian
```

#### Byte Arrays

```typescript
readBytes(length: number): Uint8Array
readBytesFull(): Uint8Array
readBytesTerm(term: number, include: boolean, consume: boolean, eosError: boolean): Uint8Array
```

#### Strings

```typescript
readStr(length: number, encoding: string): string
readStrEos(encoding: string): string
readStrz(encoding: string, term: number, include: boolean, consume: boolean, eosError: boolean): string
```

#### Bit-Level Reading

```typescript
readBitsIntBe(n: number): number    // Read n bits, big-endian
readBitsIntLe(n: number): number    // Read n bits, little-endian
alignToByte(): void                 // Align to byte boundary
```

#### Position Management

```typescript
seek(pos: number): void             // Seek to position
isEof(): boolean                    // Check if at end of stream
```

**Example:**

```typescript
import { KaitaiStream } from '@k67/kaitai-struct-ts'

const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04])
const stream = new KaitaiStream(buffer)

const byte = stream.readU1() // 1
const word = stream.readU2le() // 0x0302 = 770
console.log(stream.pos) // 3
console.log(stream.isEof()) // false
```

---

### `KsyParser`

Parser for Kaitai Struct YAML definitions.

**Constructor:**

```typescript
new KsyParser()
```

**Methods:**

#### `parse()`

Parse a `.ksy` YAML string into a typed schema object.

```typescript
parse(yaml: string, options?: ParseOptions): KsySchema
```

**Parameters:**

- `yaml` (string) - YAML string containing the `.ksy` definition
- `options` (ParseOptions, optional) - Parsing options

**Returns:** Parsed and validated schema object

**Throws:**

- `ParseError` - If YAML parsing fails
- `ValidationError` - If schema validation fails

**Example:**

```typescript
import { KsyParser } from '@k67/kaitai-struct-ts'

const parser = new KsyParser()
const schema = parser.parse(ksyYaml, { validate: true, strict: false })
```

#### `parseWithImports()`

Parse a schema with support for imports.

```typescript
parseWithImports(
  yaml: string,
  imports: Map<string, string>,
  options?: ParseOptions
): KsySchema
```

**Parameters:**

- `yaml` (string) - Main schema YAML
- `imports` (Map<string, string>) - Map of import paths to YAML content
- `options` (ParseOptions, optional) - Parsing options

**Example:**

```typescript
const imports = new Map([
  ['/common/riff', riffKsyContent],
  ['/image/png', pngKsyContent],
])

const schema = parser.parseWithImports(wavKsy, imports)
```

---

### `TypeInterpreter`

Interprets and executes Kaitai Struct schemas against binary data.

**Constructor:**

```typescript
new TypeInterpreter(schema: KsySchema)
```

**Methods:**

#### `parse()`

Parse binary data according to the schema.

```typescript
parse(stream: KaitaiStream, parent?: unknown, root?: unknown): Record<string, unknown>
```

**Parameters:**

- `stream` (KaitaiStream) - Binary stream to read from
- `parent` (unknown, optional) - Parent object for nested types
- `root` (unknown, optional) - Root object for `_root` references

**Returns:** Parsed object with fields from the schema

**Example:**

```typescript
import { KsyParser, TypeInterpreter, KaitaiStream } from '@k67/kaitai-struct-ts'

const parser = new KsyParser()
const schema = parser.parse(ksyYaml)
const stream = new KaitaiStream(binaryData)
const interpreter = new TypeInterpreter(schema)
const result = interpreter.parse(stream)
```

---

### `Context`

Execution context for expression evaluation.

**Constructor:**

```typescript
new Context(
  stream: KaitaiStream,
  root: unknown,
  parent: unknown,
  current: unknown
)
```

**Properties:**

- `_io` (KaitaiStream) - Current stream
- `_root` (unknown) - Root object
- `_parent` (unknown) - Parent object
- `_` (unknown) - Current object (for array elements)

**Example:**

```typescript
import { Context, KaitaiStream } from '@k67/kaitai-struct-ts'

const stream = new KaitaiStream(buffer)
const context = new Context(stream, rootObj, parentObj, currentObj)
```

---

## Types

### Schema Types

```typescript
interface KsySchema {
  meta: MetaSpec
  seq?: AttributeSpec[]
  types?: Record<string, TypeSpec>
  instances?: Record<string, InstanceSpec>
  enums?: Record<string, EnumSpec>
  params?: ParamSpec[]
}

interface MetaSpec {
  id: string
  title?: string
  license?: string
  endian?: Endianness | EndianExpression
  encoding?: string
  imports?: string[]
  'ks-version'?: string
  'ks-debug'?: boolean
  'ks-opaque-types'?: boolean
}

interface AttributeSpec {
  id?: string
  type?: string | SwitchType
  size?: number | string
  'size-eos'?: boolean
  repeat?: RepeatSpec
  'repeat-expr'?: string | number
  'repeat-until'?: string
  if?: string
  contents?: number[] | string
  encoding?: string
  terminator?: number
  consume?: boolean
  include?: boolean
  'eos-error'?: boolean
  pos?: string | number
  io?: string
  process?: string | ProcessObject
  enum?: string
  doc?: string
  'doc-ref'?: string
}

interface InstanceSpec extends Omit<AttributeSpec, 'id'> {
  value?: string | number | boolean
  pos?: string | number
}

type Endianness = 'le' | 'be'

interface EndianExpression {
  'switch-on': string
  cases: Record<string | number, Endianness>
}

type RepeatSpec = 'expr' | 'eos' | 'until'

interface SwitchType {
  'switch-on': string
  cases: Record<string | number, string>
}

interface EnumSpec {
  [key: number]: string
}

interface ParamSpec {
  id: string
  type?: string
  enum?: string
  doc?: string
}

interface ProcessObject {
  algorithm: string
  key?: number | number[]
}
```

### Error Types

```typescript
class KaitaiError extends Error {
  constructor(message: string)
}

class EOFError extends KaitaiError {
  position: number
  constructor(message: string, position: number)
}

class ParseError extends KaitaiError {
  line?: number
  column?: number
  constructor(message: string, line?: number, column?: number)
}

class ValidationError extends KaitaiError {
  errors: string[]
  warnings: string[]
  constructor(message: string, errors: string[], warnings: string[])
}

class NotImplementedError extends KaitaiError {
  feature: string
  constructor(feature: string, message?: string)
}
```

---

## Streaming API

### `parseStreaming()`

Parse binary data from a stream with progressive events.

**Signature:**

```typescript
async function* parseStreaming(
  schema: string | KsySchema,
  source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  options?: StreamingParseOptions
): AsyncGenerator<ParseEvent>
```

**Parameters:**

- `schema` (string | KsySchema) - Schema definition
- `source` (ReadableStream | AsyncIterable) - Data source
- `options` (StreamingParseOptions, optional) - Streaming options

**Yields:** Parse events

**Example:**

```typescript
import { parseStreaming } from '@k67/kaitai-struct-ts/streaming'
import { createReadStream } from 'fs'

const schema = `
meta:
  id: my_format
seq:
  - id: header
    type: u4
  - id: data
    type: u1
    repeat: eos
`

const stream = createReadStream('large-file.bin')

for await (const event of parseStreaming(schema, stream)) {
  if (event.type === 'field') {
    console.log(`${event.name}: ${event.value}`)
  }
  if (event.type === 'progress') {
    console.log(`Progress: ${event.bytesRead} bytes`)
  }
  if (event.type === 'complete') {
    console.log('Done:', event.result)
  }
}
```

**Event Types:**

```typescript
type ParseEvent =
  | { type: 'start'; schema: KsySchema }
  | { type: 'field'; path: string[]; name: string; value: unknown }
  | { type: 'progress'; bytesRead: number; totalBytes?: number }
  | { type: 'complete'; result: unknown }
  | { type: 'error'; error: Error; path?: string[] }
```

**Options:**

```typescript
interface StreamingParseOptions {
  /** Chunk size for reading from source (default: 64KB) */
  chunkSize?: number

  /** Maximum buffer size (default: 10MB) */
  maxBufferSize?: number

  /** Emit progress events every N bytes (default: 1MB) */
  progressInterval?: number

  /** Yield control every N fields (default: 100) */
  yieldInterval?: number

  /** Total size of data if known (for progress reporting) */
  totalBytes?: number
}
```

### `parseStreamingSimple()`

Simplified streaming parse that returns only the final result.

**Signature:**

```typescript
async function parseStreamingSimple(
  schema: string | KsySchema,
  source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  options?: StreamingParseOptions
): Promise<unknown>
```

**Example:**

```typescript
import { parseStreamingSimple } from '@k67/kaitai-struct-ts/streaming'

const result = await parseStreamingSimple(schema, stream)
console.log(result)
```

### `StreamingKaitaiStream`

Forward-only stream reader for large files.

**Constructor:**

```typescript
new StreamingKaitaiStream(
  source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  options?: {
    chunkSize?: number
    maxBufferSize?: number
  }
)
```

**Methods:**

```typescript
// Async versions of KaitaiStream methods
async readU1(): Promise<number>
async readU2le(): Promise<number>
async readU4be(): Promise<number>
async readStr(length: number, encoding: string): Promise<string>
// ... all KaitaiStream methods with async versions

// Stream management
async close(): Promise<void>
```

**Example:**

```typescript
import { StreamingKaitaiStream } from '@k67/kaitai-struct-ts/streaming'
import { createReadStream } from 'fs'

const stream = new StreamingKaitaiStream(createReadStream('file.bin'), {
  chunkSize: 64 * 1024,
  maxBufferSize: 10 * 1024 * 1024,
})

const magic = await stream.readU4le()
const version = await stream.readU2le()
await stream.close()
```

---

## Utilities

### Expression Evaluation

```typescript
import { evaluateExpression, Context } from '@k67/kaitai-struct-ts'

const result = evaluateExpression('field1 + field2 * 2', context)
```

### String Encoding

```typescript
import { decodeString } from '@k67/kaitai-struct-ts'

const str = decodeString(bytes, 'UTF-8')
```

### Type Utilities

```typescript
import {
  BUILTIN_TYPES,
  isBuiltinType,
  getTypeEndianness,
  getBaseType,
  isIntegerType,
  isFloatType,
  isStringType,
} from '@k67/kaitai-struct-ts'

// Check if type is built-in
if (isBuiltinType('u4le')) {
  // ...
}

// Get endianness from type name
const endian = getTypeEndianness('u4le') // 'le'

// Get base type without endianness
const base = getBaseType('u4le') // 'u4'
```

---

## Error Handling

### Best Practices

```typescript
import {
  parse,
  EOFError,
  ParseError,
  ValidationError,
} from '@k67/kaitai-struct-ts'

try {
  const result = parse(ksyYaml, binaryData)
} catch (error) {
  if (error instanceof EOFError) {
    console.error(`Unexpected end of file at position ${error.position}`)
  } else if (error instanceof ParseError) {
    console.error(`Parse error at line ${error.line}: ${error.message}`)
  } else if (error instanceof ValidationError) {
    console.error('Schema validation failed:')
    error.errors.forEach((err) => console.error(`  - ${err}`))
  } else {
    console.error('Unknown error:', error)
  }
}
```

---

## Advanced Usage

### Custom Types with Imports

```typescript
import { KsyParser, TypeInterpreter, KaitaiStream } from '@k67/kaitai-struct-ts'

const wavKsy = `
meta:
  id: wav
  imports:
    - /common/riff
seq:
  - id: chunk
    type: riff
`

const riffKsy = `
meta:
  id: riff
seq:
  - id: magic
    contents: "RIFF"
  - id: size
    type: u4le
`

const parser = new KsyParser()
const imports = new Map([['/common/riff', riffKsy]])
const schema = parser.parseWithImports(wavKsy, imports)

const stream = new KaitaiStream(wavData)
const interpreter = new TypeInterpreter(schema)
const result = interpreter.parse(stream)
```

### Parametric Types

```typescript
const schema = `
meta:
  id: my_format
types:
  chunk:
    params:
      - id: chunk_size
        type: u4
    seq:
      - id: data
        size: chunk_size
seq:
  - id: size
    type: u4
  - id: chunk
    type: chunk(size)
`
```

### Instances (Lazy Evaluation)

```typescript
const schema = `
meta:
  id: my_format
seq:
  - id: ofs_footer
    type: u4
instances:
  footer:
    pos: ofs_footer
    type: footer_type
  is_valid:
    value: footer.magic == 0x1234
`

const result = parse(schema, data)
console.log(result.footer) // Computed on first access
console.log(result.footer) // Returns cached value
console.log(result.is_valid) // Computed from footer
```

---

## See Also

- [Main README](../README.md) - Project overview
- [Examples](../EXAMPLES.md) - Usage examples
- [CLI Documentation](./CLI.md) - Command-line usage
- [Streaming API](./STREAMING.md) - Large file parsing
- [Architecture](./ARCHITECTURE.md) - System design

---

## Version History

- **0.10.0** - Added Streaming API
- **0.9.0** - Added expression-based endianness, CLI improvements
- **0.8.0** - Initial production release

For complete changelog, see [CHANGELOG.md](../CHANGELOG.md).
