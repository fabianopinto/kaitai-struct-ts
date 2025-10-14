# Streaming API Design

**Status:** 🚧 In Progress
**Version:** 0.11.0 (Planned)
**Author:** Fabiano Pinto
**Date:** 2025-10-13

---

## 📋 Overview

The Streaming API enables parsing large binary files without loading the entire file into memory. This is essential for:

- Files larger than available RAM (multi-GB files)
- Network streams (WebSocket, HTTP streaming)
- Real-time data processing
- Memory-constrained environments

---

## 🎯 Goals

### Primary Goals

1. **Memory Efficiency** - Parse files larger than RAM
2. **Progressive Parsing** - Start processing before entire file is loaded
3. **Backward Compatibility** - Existing API continues to work
4. **Minimal Overhead** - Low performance impact for small files

### Non-Goals

1. **Seeking in Streams** - Streams are forward-only (no random access)
2. **Parallel Parsing** - Single-threaded, sequential processing
3. **Automatic Chunking** - User controls chunk boundaries

---

## 🏗️ Architecture

### Current Architecture (In-Memory)

```
┌─────────────┐
│   Binary    │
│    File     │
└──────┬──────┘
       │ Load entire file
       ▼
┌─────────────┐
│ Uint8Array  │
│  (Memory)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ KaitaiStream│
│   (Random   │
│   Access)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Parsed    │
│   Object    │
└─────────────┘
```

### Streaming Architecture (Proposed)

```
┌─────────────┐
│   Binary    │
│    File     │
└──────┬──────┘
       │ Read chunks
       ▼
┌─────────────┐
│  Chunk      │
│  Buffer     │  ◄─── Sliding window
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ StreamingKS │
│ (Forward    │
│  Only)      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Partial    │
│  Results    │  ◄─── Progressive output
└─────────────┘
```

---

## 🔧 API Design

### 1. StreamingKaitaiStream

A forward-only stream that reads data in chunks.

```typescript
class StreamingKaitaiStream {
  constructor(source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>)

  // Core reading methods
  async readU1(): Promise<number>
  async readU2le(): Promise<number>
  async readU2be(): Promise<number>
  async readU4le(): Promise<number>
  async readU4be(): Promise<number>
  async readU8le(): Promise<bigint>
  async readU8be(): Promise<bigint>

  // String reading
  async readStr(length: number, encoding: string): Promise<string>
  async readStrz(encoding: string, terminator: number): Promise<string>

  // Byte reading
  async readBytes(length: number): Promise<Uint8Array>
  async readBytesFull(): Promise<Uint8Array>

  // Position tracking
  get pos(): number
  get isEof(): boolean

  // Buffering control
  setBufferSize(size: number): void
  async prefetch(bytes: number): Promise<void>
}
```

### 2. Streaming Parse Function

```typescript
async function* parseStreaming(
  schema: string | KsySchema,
  stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  options?: StreamingParseOptions
): AsyncGenerator<ParseEvent>

interface StreamingParseOptions {
  chunkSize?: number        // Default: 64KB
  maxBufferSize?: number    // Default: 10MB
  yieldInterval?: number    // Yield every N fields
}

type ParseEvent =
  | { type: 'field', path: string[], value: unknown }
  | { type: 'progress', bytesRead: number, totalBytes?: number }
  | { type: 'complete', result: unknown }
  | { type: 'error', error: Error }
```

### 3. Usage Examples

#### Example 1: Parse Large File

```typescript
import { parseStreaming } from '@k67/kaitai-struct-ts/streaming'
import { createReadStream } from 'fs'

const schema = `
meta:
  id: large_format
seq:
  - id: header
    type: header_type
  - id: records
    type: record
    repeat: eos
`

// Node.js file stream
const fileStream = createReadStream('large-file.bin')

for await (const event of parseStreaming(schema, fileStream)) {
  if (event.type === 'field') {
    console.log(`Parsed ${event.path.join('.')}: ${event.value}`)
  }
  if (event.type === 'progress') {
    console.log(`Progress: ${event.bytesRead} bytes`)
  }
  if (event.type === 'complete') {
    console.log('Parsing complete:', event.result)
  }
}
```

#### Example 2: Network Stream

```typescript
// Fetch API with streaming
const response = await fetch('https://example.com/data.bin')
const stream = response.body!

for await (const event of parseStreaming(schema, stream)) {
  // Process events as they arrive
  handleEvent(event)
}
```

#### Example 3: WebSocket Stream

```typescript
// WebSocket to AsyncIterable
async function* websocketToStream(ws: WebSocket) {
  const queue: Uint8Array[] = []
  let resolve: ((value: Uint8Array) => void) | null = null

  ws.onmessage = (event) => {
    const data = new Uint8Array(event.data)
    if (resolve) {
      resolve(data)
      resolve = null
    } else {
      queue.push(data)
    }
  }

  while (ws.readyState === WebSocket.OPEN) {
    if (queue.length > 0) {
      yield queue.shift()!
    } else {
      yield await new Promise<Uint8Array>((r) => (resolve = r))
    }
  }
}

const ws = new WebSocket('wss://example.com/stream')
for await (const event of parseStreaming(schema, websocketToStream(ws))) {
  processEvent(event)
}
```

---

## 🚧 Limitations

### What Works with Streaming

- ✅ Sequential field parsing
- ✅ Repeat with `eos` (end of stream)
- ✅ Repeat with `expr` (known count)
- ✅ String reading
- ✅ Process algorithms (on chunks)
- ✅ Conditional parsing (`if`)
- ✅ Enums

### What Doesn't Work with Streaming

- ❌ **Instances** - Require random access
- ❌ **`pos` attribute** - Seeking not supported
- ❌ **`_sizeof`** - Requires knowing full size
- ❌ **Repeat `until`** - May need backtracking
- ❌ **Forward references** - Require lookahead
- ❌ **Switch types with position-based keys** - Need random access

### Workarounds

1. **Instances**: Use sequential fields instead
2. **Position**: Structure data sequentially
3. **Sizeof**: Calculate incrementally or use fixed sizes
4. **Until**: Use `expr` with known count or `eos`

---

## 📊 Performance Considerations

### Memory Usage

| Scenario   | In-Memory | Streaming |
| ---------- | --------- | --------- |
| 100MB file | 100MB     | ~10MB     |
| 1GB file   | 1GB       | ~10MB     |
| 10GB file  | ❌ OOM    | ~10MB     |

### Speed

- **Small files (<10MB)**: In-memory is faster (no chunking overhead)
- **Large files (>100MB)**: Streaming is comparable
- **Network streams**: Streaming enables progressive processing

### Buffer Management

```typescript
// Configurable buffer sizes
const options = {
  chunkSize: 64 * 1024, // 64KB chunks from source
  maxBufferSize: 10 * 1024 * 1024, // 10MB max buffer
  yieldInterval: 100, // Yield every 100 fields
}
```

---

## 🔄 Implementation Phases

### Phase 1: Core Streaming (v0.11.0)

- [x] Design document
- [ ] `StreamingKaitaiStream` class
- [ ] Basic read methods (u1, u2, u4, u8)
- [ ] String reading (str, strz)
- [ ] Byte reading
- [ ] Buffer management
- [ ] Tests for streaming primitives

### Phase 2: Parser Integration (v0.11.0)

- [ ] `parseStreaming` function
- [ ] Event emission
- [ ] Sequential field parsing
- [ ] Repeat with `eos` and `expr`
- [ ] Conditional parsing
- [ ] Tests for streaming parser

### Phase 3: Advanced Features (v0.12.0)

- [ ] Process algorithms on streams
- [ ] Chunked compression (zlib)
- [ ] Progress reporting
- [ ] Cancellation support
- [ ] Backpressure handling

### Phase 4: Optimizations (v0.12.0)

- [ ] Adaptive buffer sizing
- [ ] Prefetching
- [ ] Parallel chunk processing (where possible)
- [ ] Performance benchmarks

---

## 🧪 Testing Strategy

### Unit Tests

- Buffer management
- Primitive reading (u1, u2, u4, u8)
- String reading
- EOF handling
- Error conditions

### Integration Tests

- Parse complete files
- Handle network streams
- Process large files (>1GB)
- Memory usage validation
- Performance benchmarks

### Edge Cases

- Empty streams
- Single-byte chunks
- Exact buffer boundaries
- EOF at various positions
- Malformed data

---

## 📚 Documentation

### User Guide

- When to use streaming vs in-memory
- API reference
- Usage examples
- Performance tips
- Troubleshooting

### Migration Guide

- Converting existing code
- Limitations and workarounds
- Performance comparison

---

## 🔮 Future Enhancements

### Possible Future Features

1. **Parallel Processing** - Process independent chunks in parallel
2. **Adaptive Buffering** - Automatically adjust buffer size
3. **Seek Support** - Limited seeking with buffering
4. **Compression Streaming** - Stream through decompression
5. **Multi-source Streams** - Combine multiple streams

### Research Areas

- **Zero-copy parsing** - Avoid buffer copies
- **WASM acceleration** - Fast chunk processing
- **Worker threads** - Offload parsing to workers

---

## 📝 Notes

- Streaming API is **opt-in** - existing API unchanged
- Designed for **Node.js and browser** compatibility
- Uses **Web Streams API** standard
- **AsyncGenerator** for progressive results
- **Memory-safe** with configurable limits

---

## 🔗 References

- [Web Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [Node.js Streams](https://nodejs.org/api/stream.html)
- [AsyncIterator Protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
- [Kaitai Struct Specification](https://doc.kaitai.io/user_guide.html)

---

## ✅ Acceptance Criteria

Streaming API is complete when:

1. ✅ Can parse files larger than available RAM
2. ✅ Progressive results available before completion
3. ✅ Memory usage stays within configured limits
4. ✅ Compatible with Node.js and browser streams
5. ✅ Performance within 20% of in-memory for large files
6. ✅ Comprehensive tests and documentation
7. ✅ Backward compatible with existing API

---

**Status:** Ready for implementation
**Next Step:** Implement `StreamingKaitaiStream` class
