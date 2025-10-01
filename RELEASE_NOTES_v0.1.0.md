# Release Notes - v0.1.0

**Release Date:** 2025-10-01  
**Phase:** 1 - Foundation (MVP)  
**Status:** ✅ Complete

---

## 🎉 Welcome to kaitai-struct-ts v0.1.0!

This is the initial release of **kaitai-struct-ts**, a TypeScript runtime interpreter for Kaitai Struct binary format definitions. This release establishes a solid foundation with a complete binary stream reader and comprehensive project infrastructure.

## 🌟 Highlights

### Complete Binary Stream Reader
The `KaitaiStream` class provides everything needed to read binary data:
- **All integer types** with both endianness
- **IEEE 754 floating point** numbers
- **Flexible byte reading** (fixed, terminated, full)
- **Multi-encoding strings** (UTF-8, ASCII, Latin-1, UTF-16)
- **Bit-level operations** for compact data
- **Position management** for complex formats

### Production-Ready Infrastructure
- **TypeScript 5.9.3** with strict mode for maximum type safety
- **Modern build system** (tsup) generating ESM + CJS
- **Comprehensive testing** with vitest (100+ test cases)
- **Code quality tools** (eslint + prettier)
- **Version management** with changesets

### Exceptional Documentation
- **Complete JSDoc** on all public APIs with examples
- **12 Mermaid diagrams** visualizing architecture
- **Multiple documentation levels** (quick start, detailed design, reference)
- **Contributing guidelines** with clear workflows

## 📦 What's Included

### Core Classes

#### KaitaiStream
```typescript
import { KaitaiStream } from 'kaitai-struct-ts'

const buffer = new Uint8Array([...])
const stream = new KaitaiStream(buffer)

// Read various types
const byte = stream.readU1()
const word = stream.readU2le()
const float = stream.readF4be()
const str = stream.readStr(10, 'UTF-8')
```

#### Error Classes
```typescript
import { EOFError, ParseError, ValidationError } from 'kaitai-struct-ts'

try {
  stream.readU4le()
} catch (e) {
  if (e instanceof EOFError) {
    console.log('End of stream at position:', e.position)
  }
}
```

## 📊 Statistics

```
Source Files: 8
Test Files: 1
Test Cases: 100+
Documentation Files: 8
Mermaid Diagrams: 12
Lines of Code: ~2,500+
```

## 🎯 Phase 1 Completion

### ✅ Completed Goals
- [x] Project infrastructure setup
- [x] KaitaiStream implementation
- [x] Error handling system
- [x] String encoding utilities
- [x] Comprehensive test suite
- [x] Complete documentation
- [x] Build and development tooling

### 📈 Quality Metrics
- **Type Safety:** 100% (strict TypeScript)
- **Test Coverage:** High (all KaitaiStream functionality)
- **Documentation:** Complete (JSDoc + guides)
- **Code Quality:** Enforced (eslint + prettier)

## 🚀 Getting Started

### Installation

```bash
npm install kaitai-struct-ts
# or
pnpm add kaitai-struct-ts
# or
yarn add kaitai-struct-ts
```

### Quick Example

```typescript
import { KaitaiStream } from 'kaitai-struct-ts'

// Create a stream from binary data
const data = new Uint8Array([
  0x4D, 0x5A,           // Magic bytes "MZ"
  0x90, 0x00,           // Bytes on last page
  0x03, 0x00, 0x00, 0x00 // Pages in file
])

const stream = new KaitaiStream(data)

// Read the data
const magic = stream.readBytes(2)     // [0x4D, 0x5A]
const lastPage = stream.readU2le()    // 144
const pages = stream.readU4le()       // 3
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Quick start and overview |
| [PROJECT_DESIGN.md](./PROJECT_DESIGN.md) | Complete design specification |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Architecture with Mermaid diagrams |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development guidelines |
| [QUICKREF.md](./QUICKREF.md) | Quick reference guide |
| [API Docs](./src/) | JSDoc in source files |

## 🔮 What's Next - Phase 2

The next release (v0.2.0) will add core parsing functionality:

### Planned Features
- **KSY Parser** - Parse YAML .ksy format definitions
- **Type Interpreter** - Execute schemas against binary data
- **Expression Evaluator** - Support Kaitai Struct expression language
- **Conditionals** - if, enums, switch/case
- **Repetitions** - repeat: expr, eos, until
- **Instances** - Lazy evaluation and calculated fields

### Timeline
Expected release: ~4-6 weeks from v0.1.0

## 🛠️ Technical Details

### Supported Platforms
- **Node.js:** 18.0.0 or higher
- **Browsers:** Modern browsers with ES2020 support
- **Package Formats:** ESM and CommonJS

### Dependencies
- **Runtime:** `yaml` (for future KSY parsing)
- **Development:** TypeScript, tsup, vitest, eslint, prettier, changesets

### TypeScript Support
Full TypeScript support with:
- Complete type definitions (.d.ts files)
- Strict mode compliance
- IntelliSense support in IDEs

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Coding standards
- Testing guidelines
- Pull request process

## 📄 License

MIT © Fabiano Pinto

## 🔗 Links

- **Repository:** https://github.com/fabianopinto/kaitai-struct-ts
- **NPM Package:** https://www.npmjs.com/package/kaitai-struct-ts
- **Issues:** https://github.com/fabianopinto/kaitai-struct-ts/issues
- **Kaitai Struct:** https://kaitai.io/

## 🙏 Acknowledgments

This project implements the [Kaitai Struct specification](https://doc.kaitai.io/) created by the Kaitai Struct team. Special thanks to the Kaitai Struct community for creating such an elegant solution for binary format parsing.

## 📝 Breaking Changes

None - this is the initial release.

## 🐛 Known Issues

None at this time. Please report any issues on GitHub.

## 💬 Feedback

We'd love to hear your feedback! Please:
- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Submit a PR for contributions

---

**Thank you for using kaitai-struct-ts!** 🎉

We're excited to continue building this library and making binary format parsing easier for the TypeScript community.
