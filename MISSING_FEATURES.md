# Missing Features & Improvements

This document tracks features that are not yet implemented, known limitations, and potential improvements for `@k67/kaitai-struct-ts`.

**Last Updated:** 2025-10-13

---

## 🚧 Not Yet Implemented

### 1. Expression-Based Endianness

**Status:** ⚠️ Partially Supported  
**Priority:** Medium  
**Location:** `src/interpreter/TypeInterpreter.ts:801`

Currently, endianness can only be specified as a static string (`'le'` or `'be'`). Expression-based endianness (switch-on) is not supported.

**Example (not working):**
```yaml
meta:
  endian:
    switch-on: some_field
    cases:
      0: le
      1: be
```

**Workaround:** Use switch types to parse different endianness variants.

---

### 2. ROL/ROR with Group Size > 1

**Status:** ⚠️ Limited  
**Priority:** Low  
**Location:** `src/utils/process.ts:180, 217`

Bit rotation (ROL/ROR) only supports single-byte operations. Multi-byte group rotation is not implemented.

**Current Support:**
- ✅ `rol(amount: 1-7)` - Single byte rotation
- ✅ `ror(amount: 1-7)` - Single byte rotation
- ❌ `rol(amount: N, group: 2+)` - Multi-byte rotation

**Example (not working):**
```yaml
process:
  algorithm: rol
  amount: 3
  group: 4  # Not supported
```

---

### 3. Generic Cast Syntax (`.as<type>`)

**Status:** ⚠️ Stripped  
**Priority:** Low  
**Location:** `src/expression/index.ts:37-39`

Generic cast syntax like `.as<bytes>` is stripped from expressions as a no-op. Type inference is done dynamically.

**Example (stripped):**
```yaml
instances:
  data_bytes:
    value: some_field.as<bytes>  # .as<bytes> is removed
```

**Impact:** Minimal - type inference works without explicit casts.

---

### 4. Additional Process Algorithms

**Status:** ❌ Not Implemented  
**Priority:** Low

The following process algorithms are not implemented:

- **AES encryption/decryption** - Would require crypto library
- **Custom compression** - Beyond zlib/bzip2
- **Other hash algorithms** - SHA-3, BLAKE2, etc.

**Current Support:**
- ✅ zlib (deflate/inflate)
- ✅ xor (single/multi-byte key)
- ✅ rol/ror (bit rotation, single byte)
- ✅ bswap2/4/8/16 (byte order reversal)

---

## 🔧 Known Limitations

### 1. Encoding Support

**Status:** ✅ Mostly Complete  
**Location:** `src/utils/encoding.ts`

All encodings supported by the browser's `TextDecoder` API are available. Unsupported encodings throw an error.

**Supported:**
- ✅ UTF-8, UTF-16LE, UTF-16BE
- ✅ ASCII, ISO-8859-* family
- ✅ Windows-125* family
- ✅ Most common encodings

**Not Supported:**
- ❌ Exotic/legacy encodings not in TextDecoder
- ❌ Custom encoding tables

---

### 2. Validation Constraints

**Status:** ✅ Basic Support  
**Priority:** Medium

Validation is implemented but could be enhanced:

**Current:**
- ✅ `valid: { eq: value }` - Equality check
- ✅ `valid: { any-of: [values] }` - Enum check
- ✅ `valid: { min: N, max: N }` - Range check

**Potential Enhancements:**
- ⚠️ Custom validation expressions
- ⚠️ Cross-field validation
- ⚠️ Regex validation for strings
- ⚠️ Better error messages with context

---

### 3. Performance Optimizations

**Status:** ⚠️ Room for Improvement  
**Priority:** Low (optimize when needed)

**Potential Improvements:**
- Stream buffering for large files
- Lazy instance memoization (currently implemented)
- Expression AST caching
- Type schema compilation
- WebAssembly for hot paths (process algorithms)

---

## 💡 Potential Improvements

### 1. Better Error Messages

**Priority:** High

**Current Issues:**
- Error positions not always accurate
- Stack traces can be verbose
- Limited context in parse errors

**Improvements:**
- Add byte offset to all errors
- Show surrounding context (hex dump)
- Clearer error messages for common mistakes
- Validation error aggregation

---

### 2. Streaming API

**Priority:** Medium

**Current:** All data must fit in memory  
**Proposed:** Stream large files chunk by chunk

**Use Cases:**
- Parsing multi-GB files
- Network streams
- Progressive parsing

**Challenges:**
- Requires significant architecture changes
- Instances and forward references complicate streaming
- Would need separate streaming API

---

### 3. Schema Compilation

**Priority:** Low

**Current:** Schema parsed and interpreted at runtime  
**Proposed:** Pre-compile schemas to TypeScript/JavaScript

**Benefits:**
- Faster parsing (no interpretation overhead)
- Type safety (generated TypeScript types)
- Better IDE support
- Smaller runtime bundle

**Challenges:**
- Complex code generation
- Dynamic features harder to compile
- Maintenance of two code paths

---

### 4. Browser Bundle Optimization

**Priority:** Medium

**Current:** Works in browser but not optimized  
**Proposed:** Separate browser build with tree-shaking

**Improvements:**
- Remove Node.js-specific code
- Smaller bundle size
- Better tree-shaking
- CDN-friendly builds

---

### 5. Visual Debugger/Inspector

**Priority:** Low (nice to have)

**Proposed Features:**
- Hex viewer with field overlays
- Interactive schema exploration
- Step-through parsing
- Field value inspection
- Export to various formats

**Similar Tools:**
- Kaitai Struct Web IDE
- 010 Editor templates
- ImHex patterns

---

## ✅ Recently Completed

These features were recently implemented:

### Expression Language (v0.9.0)
- ✅ Method calls with arguments
- ✅ 20+ string methods
- ✅ Array methods
- ✅ Property-style `.to_i` and `.to_s`

### Process Algorithms (v0.9.0)
- ✅ Zlib decompression
- ✅ XOR encryption/decryption
- ✅ ROL/ROR bit rotation
- ✅ Byte swapping (bswap2/4/8/16)

### Type Parameterization (v0.9.0)
- ✅ Parameterized type syntax
- ✅ Expression arguments
- ✅ Nested parameter passing

### Runtime Features (v0.9.0)
- ✅ `_sizeof` tracking
- ✅ `_root` references
- ✅ Instance-based repeat expressions
- ✅ Safe JSON serialization

---

## 📊 Feature Completeness

### Core Features

| Feature                  | Status | Notes                           |
| ------------------------ | ------ | ------------------------------- |
| Basic types (u1-u8, etc) | ✅     | All integer/float types         |
| Bit fields (b1-b64)      | ✅     | Full support                    |
| Strings (str, strz)      | ✅     | With encoding support           |
| Custom types             | ✅     | User-defined structures         |
| Switch types             | ✅     | Type selection                  |
| Enums                    | ✅     | Named constants                 |
| Instances                | ✅     | Lazy evaluation                 |
| Conditional parsing (if) | ✅     | Expression-based                |
| Repeats                  | ✅     | expr, until, eos                |
| Positioned reads (pos)   | ✅     | Absolute positioning            |
| Custom IO streams        | ✅     | Substreams                      |
| Imports                  | ✅     | Module system                   |
| Parameters               | ✅     | Type parameterization           |
| Process algorithms       | ✅     | zlib, xor, rol, ror, bswap      |
| Expression evaluation    | ✅     | Full operator support           |
| _sizeof tracking         | ✅     | Byte consumption                |
| _root references         | ✅     | Root object access              |

### Advanced Features

| Feature                  | Status | Notes                           |
| ------------------------ | ------ | ------------------------------- |
| Expression-based endian  | ❌     | Switch-on endianness            |
| ROL/ROR group size > 1   | ❌     | Multi-byte rotation             |
| Generic cast syntax      | ⚠️     | Stripped (not needed)           |
| AES/advanced crypto      | ❌     | Would need external lib         |
| Streaming API            | ❌     | Future enhancement              |
| Schema compilation       | ❌     | Code generation                 |
| Visual debugger          | ❌     | Separate tool                   |

**Legend:**
- ✅ Fully implemented
- ⚠️ Partially implemented or has limitations
- ❌ Not implemented

---

## 🎯 Recommended Priorities

### High Priority
1. **Better error messages** - Improve developer experience
2. **Expression-based endianness** - Complete feature parity

### Medium Priority
3. **Browser bundle optimization** - Reduce bundle size
4. **Streaming API design** - Plan architecture
5. **Enhanced validation** - Better constraints

### Low Priority
6. **ROL/ROR group size** - Rare use case
7. **Schema compilation** - Performance optimization
8. **Visual debugger** - Nice to have

---

## 🤝 Contributing

If you'd like to implement any of these features:

1. Check this document for current status
2. Open an issue to discuss the approach
3. Reference the feature in your PR
4. Update this document when complete

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

---

## 📝 Notes

- This library prioritizes **runtime interpretation** over code generation
- Features are implemented based on **real-world format needs**
- **Test coverage** is maintained for all implemented features
- **Backward compatibility** is preserved across versions

For questions or suggestions, please open an issue on GitHub.
