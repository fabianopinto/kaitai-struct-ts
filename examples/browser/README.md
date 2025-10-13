# Browser Usage Example

This example demonstrates using `@k67/kaitai-struct-ts` in a browser environment with the optimized browser build.

## 📦 Bundle Size

The browser build is highly optimized:

- **Minified:** 41KB
- **Gzipped:** 11.5KB
- **Reduction:** 55% smaller than Node.js build

## 🚀 Quick Start

### Option 1: Local Development

```bash
# From project root
pnpm build

# Serve the example
npx serve examples/browser

# Open http://localhost:3000
```

### Option 2: Direct HTML

Open `index.html` directly in your browser (may require a local server for ES modules).

## 📝 Usage

### Basic Import

```html
<script type="module">
  import { parse } from '@k67/kaitai-struct-ts'

  const schema = `
meta:
  id: my_format
  endian: le
seq:
  - id: magic
    contents: [0x4B, 0x53]
  - id: value
    type: u4
`

  const data = new Uint8Array([0x4b, 0x53, 0x0a, 0x00, 0x00, 0x00])
  const result = parse(schema, data)

  console.log(result) // { magic: [75, 83], value: 10 }
</script>
```

### With CDN (unpkg)

```html
<script type="module">
  import { parse } from 'https://unpkg.com/@k67/kaitai-struct-ts/dist/browser/index.mjs'

  // Use parse...
</script>
```

### With Build Tools (Vite, Webpack, etc.)

```javascript
import { parse } from '@k67/kaitai-struct-ts'

// The browser build is automatically selected via package.json exports
```

## ✨ Features

### Optimizations Applied

1. **Minification** - Code size reduced
2. **Tree-shaking** - Unused code eliminated
3. **Code splitting** - Modular chunks
4. **Property mangling** - Private properties shortened
5. **Dead code elimination** - Console/debugger statements removed
6. **External exclusions** - Node.js modules excluded

### What Works

- ✅ All parsing features
- ✅ Expression evaluation
- ✅ Type parameterization
- ✅ Process algorithms (zlib via pako)
- ✅ Enums and switches
- ✅ Instances and lazy evaluation
- ✅ Expression-based endianness
- ✅ Enhanced error messages

### Limitations

- ❌ CLI features (Node.js only)
- ❌ File system operations
- ❌ Import resolution from filesystem

## 🎯 Use Cases

### 1. Binary File Viewer

```javascript
// Upload and parse binary files in the browser
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0]
  const buffer = await file.arrayBuffer()
  const data = new Uint8Array(buffer)

  const result = parse(schema, data)
  displayResult(result)
})
```

### 2. Network Protocol Parser

```javascript
// Parse binary data from WebSocket
websocket.addEventListener('message', (event) => {
  const data = new Uint8Array(event.data)
  const message = parse(protocolSchema, data)
  handleMessage(message)
})
```

### 3. Game Asset Parser

```javascript
// Parse game data files
const response = await fetch('/assets/level.dat')
const buffer = await response.arrayBuffer()
const level = parse(levelSchema, new Uint8Array(buffer))
renderLevel(level)
```

### 4. Forensics Tool

```javascript
// Analyze binary files in the browser
const hexViewer = {
  parse(file) {
    const result = parse(formatSchema, file)
    return this.annotate(result, file)
  },
  annotate(result, data) {
    // Highlight parsed regions
    return { result, annotations: this.buildAnnotations(result) }
  },
}
```

## 🔧 Development

### Building

```bash
# Build all targets (including browser)
pnpm build

# Watch mode
pnpm dev
```

### Testing

```bash
# Run tests
pnpm test

# The browser build uses the same code, so all tests apply
```

## 📊 Performance

### Bundle Analysis

```bash
# Analyze bundle composition
npx esbuild-visualizer dist/browser/index.mjs
```

### Benchmark Results

| Operation   | Time (ms) | Notes          |
| ----------- | --------- | -------------- |
| Parse 1KB   | ~0.5      | Simple format  |
| Parse 10KB  | ~2        | Complex nested |
| Parse 100KB | ~15       | Large file     |

_Benchmarks on Chrome 120, M1 Mac_

## 🌐 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Requires ES2020 support (ES modules, BigInt, optional chaining).

## 📚 Examples

See the included `index.html` for a complete working example with:

- Schema definition
- Binary data creation
- Parsing and display
- Error handling
- Interactive demo

## 🔗 Resources

- **Main Documentation:** [../../README.md](../../README.md)
- **API Reference:** [../../docs/](../../docs/)
- **Format Gallery:** https://formats.kaitai.io/
- **Kaitai Struct:** https://kaitai.io/

## 💡 Tips

### 1. Lazy Loading

```javascript
// Load parser only when needed
const { parse } = await import('@k67/kaitai-struct-ts')
```

### 2. Worker Threads

```javascript
// Parse in Web Worker for large files
const worker = new Worker('parser-worker.js', { type: 'module' })
worker.postMessage({ schema, data })
```

### 3. Caching

```javascript
// Cache parsed schemas
const schemaCache = new Map()

function parseWithCache(schemaText, data) {
  if (!schemaCache.has(schemaText)) {
    schemaCache.set(schemaText, compileSchema(schemaText))
  }
  return parse(schemaCache.get(schemaText), data)
}
```

## 🐛 Troubleshooting

### CORS Issues

If loading from CDN, ensure CORS headers are set:

```javascript
fetch(url, { mode: 'cors' })
```

### Module Resolution

Use a bundler (Vite, Webpack) or ensure your server serves ES modules with correct MIME type:

```
Content-Type: application/javascript
```

### Large Files

For files >10MB, consider:

- Streaming parsing (future feature)
- Web Workers
- Chunked processing

## 📄 License

MIT - See [LICENSE](../../LICENSE)
