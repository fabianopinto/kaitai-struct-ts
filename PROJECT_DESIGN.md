# Kaitai Struct TypeScript - Project Design Document

**Project Name:** kaitai-struct-ts
**Repository:** github.com/fabianopinto/kaitai-struct-ts
**NPM Package:** @fabianopinto/kaitai-struct-ts (or kaitai-struct-ts if available)
**Author:** Fabiano Pinto
**License:** MIT
**Created:** 2025-10-01

---

## 1. Project Goals

### Primary Goal
Create a **runtime interpreter** for Kaitai Struct definitions in TypeScript that can:
- Parse `.ksy` (YAML) format definitions at runtime
- Interpret binary data according to those definitions
- Return structured JavaScript/TypeScript objects
- Work in both Node.js and browser environments

### Secondary Goals
- Provide excellent TypeScript type definitions
- Maintain high code quality and test coverage
- Follow modern TypeScript best practices
- Be performant for typical use cases
- Have comprehensive documentation
- Be easy to use and integrate

---

## 2. Requirements

### Functional Requirements

#### Phase 1 - MVP (Minimum Viable Product)
1. **KaitaiStream** - Binary data reader
   - Read bytes, integers (signed/unsigned, various sizes)
   - Support big-endian and little-endian
   - Read strings with encoding support
   - Seek/position management
   - EOF detection

2. **KSY Parser** - Parse YAML definitions
   - Parse `.ksy` YAML files
   - Validate structure
   - Build internal representation (AST)

3. **Basic Type System**
   - Primitive types: u1, u2, u4, u8, s1, s2, s4, s8
   - Floating point: f4, f8
   - Strings with encoding
   - Raw byte arrays
   - Fixed-size fields

4. **Basic Struct Parsing**
   - Sequential field reading (seq)
   - Nested types
   - Meta information (id, endian)

#### Phase 2 - Core Features
1. **Expression Evaluator**
   - Arithmetic operators (+, -, *, /, %)
   - Relational operators (<, <=, >, >=, ==, !=)
   - Bitwise operators (<<, >>, &, |, ^)
   - Logical operators (and, or, not)
   - Ternary operator (? :)
   - Field references (_root, _parent, _io)

2. **Conditionals and Control Flow**
   - if conditions
   - Enums (named constants)
   - Switch/case (type switching)

3. **Repetitions**
   - repeat: expr (fixed count)
   - repeat: eos (until end of stream)
   - repeat: until (conditional)

4. **Instances**
   - Lazy evaluation
   - pos (positioning)
   - value instances (calculated fields)

#### Phase 3 - Advanced Features
1. **Substreams and Processing**
   - size limits
   - io (custom streams)
   - process (compression, encryption)

2. **Advanced Types**
   - Bit-sized integers
   - Parametric types
   - Type casting

3. **Imports and Modularity**
   - Import types from other .ksy files
   - Opaque types

### Non-Functional Requirements

1. **Performance**
   - Handle files up to 100MB efficiently
   - Lazy evaluation where possible
   - Minimal memory overhead

2. **Compatibility**
   - Node.js 18+
   - Modern browsers (ES2020+)
   - TypeScript 5.0+

3. **Code Quality**
   - 80%+ test coverage
   - ESLint compliance
   - Prettier formatting
   - Comprehensive JSDoc comments

4. **Developer Experience**
   - Clear error messages
   - TypeScript type safety
   - Good documentation
   - Examples and tutorials

---

## 3. Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Application                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Public API Layer                     │
│  - parse(ksy, buffer) → object                          │
│  - KaitaiStream class                                   │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
┌──────────────────┐              ┌──────────────────────┐
│   KSY Parser     │              │   Binary Parser      │
│  (YAML → AST)    │              │  (Stream Reader)     │
└──────────────────┘              └──────────────────────┘
        │                                     │
        ▼                                     ▼
┌──────────────────┐              ┌──────────────────────┐
│  Type Registry   │◄────────────►│   Type Interpreter   │
│  (Schema Store)  │              │  (Execute Schema)    │
└──────────────────┘              └──────────────────────┘
        │                                     │
        ▼                                     ▼
┌──────────────────┐              ┌──────────────────────┐
│ Expression       │              │   Result Builder     │
│ Evaluator        │              │  (Object Creation)   │
└──────────────────┘              └──────────────────────┘
```

### Core Components

#### 1. KaitaiStream
**Purpose:** Low-level binary data reading
**Responsibilities:**
- Manage buffer and position
- Read primitive types (integers, floats, bytes)
- Handle endianness
- String decoding
- Alignment and padding

**Key Methods:**
```typescript
class KaitaiStream {
  constructor(buffer: ArrayBuffer | Uint8Array)

  // Position management
  pos: number
  size: number
  isEof(): boolean
  seek(pos: number): void

  // Reading primitives
  readU1(): number
  readU2le(): number
  readU2be(): number
  readU4le(): number
  readU4be(): number
  readU8le(): bigint
  readU8be(): bigint
  readS1(): number
  readS2le(): number
  readS2be(): number
  readS4le(): number
  readS4be(): number
  readS8le(): bigint
  readS8be(): bigint
  readF4le(): number
  readF4be(): number
  readF8le(): number
  readF8be(): number

  // Reading complex types
  readBytes(length: number): Uint8Array
  readBytesFull(): Uint8Array
  readBytesterm(term: number, include: boolean, consume: boolean, eosError: boolean): Uint8Array
  readStr(length: number, encoding: string): string
  readStrz(encoding: string, term: number, include: boolean, consume: boolean, eosError: boolean): string
}
```

#### 2. KSY Parser
**Purpose:** Parse YAML .ksy files into internal schema representation
**Responsibilities:**
- Load and parse YAML
- Validate schema structure
- Build typed AST
- Resolve references

**Schema AST Structure:**
```typescript
interface KsySchema {
  meta: {
    id: string
    endian?: 'le' | 'be'
    encoding?: string
    imports?: string[]
  }
  seq?: AttributeSpec[]
  instances?: Record<string, AttributeSpec>
  types?: Record<string, KsySchema>
  enums?: Record<string, Record<string, number>>
}

interface AttributeSpec {
  id: string
  type?: string | SwitchType
  size?: number | string
  repeat?: 'expr' | 'eos' | 'until'
  repeatExpr?: string
  repeatUntil?: string
  if?: string
  encoding?: string
  enum?: string
  pos?: number | string
  io?: string
  process?: string
  contents?: number[] | string
  doc?: string
}
```

#### 3. Type Interpreter
**Purpose:** Execute schema against binary data
**Responsibilities:**
- Traverse schema definition
- Read data using KaitaiStream
- Handle conditionals and repetitions
- Build result objects
- Manage context (_root, _parent, _io)

**Key Methods:**
```typescript
class TypeInterpreter {
  parse(schema: KsySchema, stream: KaitaiStream, root?: any, parent?: any): any
  parseAttribute(attr: AttributeSpec, stream: KaitaiStream, context: Context): any
  parseType(typeName: string, stream: KaitaiStream, context: Context): any
}
```

#### 4. Expression Evaluator
**Purpose:** Evaluate Kaitai Struct expressions
**Responsibilities:**
- Parse expression strings
- Evaluate with context
- Support all operators
- Handle field references

**Expression Grammar:**
```
expression := ternary
ternary := logical ('?' expression ':' expression)?
logical := bitwise (('and' | 'or') bitwise)*
bitwise := relational (('&' | '|' | '^' | '<<' | '>>') relational)*
relational := additive (('<' | '<=' | '>' | '>=' | '==' | '!=') additive)*
additive := multiplicative (('+' | '-') multiplicative)*
multiplicative := unary (('*' | '/' | '%') unary)*
unary := ('not' | '-' | '~') unary | primary
primary := literal | identifier | '(' expression ')' | methodCall
```

---

## 4. Technology Stack

### Core Dependencies
- **yaml** - YAML parsing for .ksy files
- **text-encoding** or **iconv-lite** - String encoding support

### Development Dependencies
- **TypeScript** 5.x - Language
- **tsup** - Build tool (fast, simple)
- **vitest** - Testing framework
- **eslint** - Linting
- **prettier** - Code formatting
- **@types/node** - Node.js types

### Build Configuration

#### tsup.config.ts
```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2020',
  outDir: 'dist',
})
```

#### TypeScript Configuration
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Declaration files generated

---

## 5. Project Structure

```
kaitai-struct-ts/
├── src/
│   ├── index.ts                 # Public API exports
│   ├── stream/
│   │   ├── KaitaiStream.ts      # Binary stream reader
│   │   └── index.ts
│   ├── parser/
│   │   ├── KsyParser.ts         # YAML parser
│   │   ├── schema.ts            # Schema type definitions
│   │   └── index.ts
│   ├── interpreter/
│   │   ├── TypeInterpreter.ts   # Main interpreter
│   │   ├── Context.ts           # Execution context
│   │   └── index.ts
│   ├── expression/
│   │   ├── ExpressionEvaluator.ts
│   │   ├── Lexer.ts
│   │   ├── Parser.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── primitives.ts        # Type readers
│   │   └── index.ts
│   └── utils/
│       ├── encoding.ts          # String encoding
│       ├── errors.ts            # Custom errors
│       └── index.ts
├── test/
│   ├── unit/
│   │   ├── stream.test.ts
│   │   ├── parser.test.ts
│   │   ├── interpreter.test.ts
│   │   └── expression.test.ts
│   ├── integration/
│   │   └── formats.test.ts
│   └── fixtures/
│       ├── formats/              # Sample .ksy files
│       └── data/                 # Sample binary files
├── examples/
│   ├── basic-usage.ts
│   ├── gif-parser.ts
│   └── custom-format.ts
├── docs/
│   ├── api.md
│   ├── getting-started.md
│   └── advanced-usage.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── publish.yml
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .eslintrc.json
├── .prettierrc.json
├── .gitignore
├── README.md
├── LICENSE
├── CHANGELOG.md
└── PROJECT_DESIGN.md            # This file
```

---

## 6. Development Phases

### Phase 1: Foundation (MVP)
**Goal:** Basic parsing capability
**Duration:** ~2-3 weeks
**Deliverables:**
- [x] Project setup and configuration
- [ ] KaitaiStream implementation
- [ ] KSY parser (basic)
- [ ] Type interpreter (basic)
- [ ] Support for fixed-size structures
- [ ] Basic tests
- [ ] Initial documentation

**Success Criteria:**
- Can parse simple .ksy files
- Can read fixed-size binary structures
- 70%+ test coverage
- Documentation exists

### Phase 2: Core Features
**Goal:** Full expression support and control flow
**Duration:** ~3-4 weeks
**Deliverables:**
- [ ] Expression evaluator
- [ ] Conditionals (if)
- [ ] Enums
- [ ] Repetitions (all types)
- [ ] Instances
- [ ] Comprehensive tests
- [ ] Examples

**Success Criteria:**
- Can parse complex formats (GIF, PNG, etc.)
- Expression language fully functional
- 80%+ test coverage
- Multiple working examples

### Phase 3: Advanced Features
**Goal:** Complete spec compliance
**Duration:** ~4-5 weeks
**Deliverables:**
- [ ] Substreams
- [ ] Processing (compression, etc.)
- [ ] Bit-sized integers
- [ ] Imports
- [ ] Performance optimizations
- [ ] Full documentation

**Success Criteria:**
- Can parse any standard .ksy format
- Performance acceptable for typical use cases
- 85%+ test coverage
- Complete API documentation

### Phase 4: Publishing and Maintenance
**Goal:** Public release
**Duration:** Ongoing
**Deliverables:**
- [ ] GitHub repository setup
- [ ] NPM package publishing
- [ ] CI/CD pipeline
- [ ] Community documentation
- [ ] Issue tracking

---

## 7. Testing Strategy

### Unit Tests
- Each component tested in isolation
- Mock dependencies
- Cover edge cases
- Fast execution

### Integration Tests
- Test with real .ksy files from Kaitai format gallery
- Test with real binary data
- Verify output correctness

### Test Formats (Priority Order)
1. Simple fixed structures (custom)
2. GIF (image format)
3. ZIP (archive format)
4. ELF (executable format)
5. PNG (image format)

### Coverage Goals
- Phase 1: 70%+
- Phase 2: 80%+
- Phase 3: 85%+

---

## 8. API Design

### High-Level API

```typescript
import { parse, KaitaiStream } from 'kaitai-struct-ts'

// Simple usage
const result = await parse(ksyDefinition, binaryData)

// Advanced usage
const stream = new KaitaiStream(buffer)
const parser = new KaitaiParser(ksyDefinition)
const result = parser.parse(stream)
```

### Error Handling

```typescript
class KaitaiError extends Error {
  constructor(message: string, public position?: number)
}

class ValidationError extends KaitaiError {}
class ParseError extends KaitaiError {}
class EOFError extends KaitaiError {}
```

---

## 9. Documentation Plan

### README.md
- Project overview
- Quick start
- Installation
- Basic usage example
- Links to detailed docs

### API Documentation
- Generated from JSDoc comments
- All public classes and methods
- Examples for each major feature

### Guides
- Getting Started
- Advanced Usage
- Expression Language Reference
- Type System Reference
- Performance Tips

### Examples
- Basic struct parsing
- Working with enums
- Conditional parsing
- Repetitions
- Custom types

---

## 10. Release Strategy

### Versioning
Follow Semantic Versioning (semver):
- 0.1.0 - Phase 1 complete (MVP)
- 0.2.0 - Phase 2 complete (Core features)
- 1.0.0 - Phase 3 complete (Full spec)

### NPM Publishing
- Package name: `kaitai-struct-ts` or `@fabianopinto/kaitai-struct-ts`
- Public package
- MIT license
- Include: dist/, README.md, LICENSE, CHANGELOG.md
- Exclude: src/, test/, examples/

### GitHub Repository
- Repository: github.com/fabianopinto/kaitai-struct-ts
- Branch strategy: main + develop
- PR reviews required
- CI/CD with GitHub Actions
- Issue templates
- Contributing guidelines

---

## 11. Performance Considerations

### Optimization Strategies
1. **Lazy Evaluation**
   - Only parse instances when accessed
   - Cache computed values

2. **Efficient Buffer Handling**
   - Use TypedArrays (Uint8Array, DataView)
   - Avoid unnecessary copies
   - Reuse buffers where possible

3. **Expression Caching**
   - Parse expressions once
   - Cache evaluation results

4. **Stream Optimization**
   - Minimize seeks
   - Batch reads where possible

### Performance Targets
- Parse 1MB file in < 100ms (simple format)
- Parse 10MB file in < 1s (complex format)
- Memory overhead < 2x file size

---

## 12. Future Enhancements

### Post-1.0 Features
- Code generation (compile .ksy to TypeScript)
- CLI tool
- Browser-optimized bundle
- Streaming support for large files
- WebAssembly acceleration
- Serialization support (write data)
- Schema validation tools
- Visual debugger

---

## 13. References

### Kaitai Struct Resources
- Official Website: https://kaitai.io/
- User Guide: https://doc.kaitai.io/user_guide.html
- Format Gallery: https://formats.kaitai.io/
- GitHub: https://github.com/kaitai-io/kaitai_struct

### Similar Projects
- kaitai-struct-compiler (Java) - Official compiler
- kaitai-struct (JavaScript) - Official runtime
- kaitai-struct-python-runtime (Python) - Official runtime

---

## 14. Decision Log

### 2025-10-01: Initial Design
- **Decision:** Build runtime interpreter instead of code generator
- **Rationale:** Matches project goal of "interpret any definition"
- **Trade-offs:** Slower than compiled, but more flexible

### 2025-10-01: Technology Choices
- **Decision:** Use tsup for building
- **Rationale:** Fast, simple, good DX
- **Alternatives:** tsc, rollup, esbuild

- **Decision:** Use vitest for testing
- **Rationale:** Fast, good TypeScript support, modern
- **Alternatives:** jest, mocha

### 2025-10-01: Architecture
- **Decision:** Separate parser, interpreter, and evaluator
- **Rationale:** Clear separation of concerns, testable
- **Trade-offs:** More complex, but maintainable

---

## 15. Open Questions

1. **String Encoding:** Which encoding library? (text-encoding vs iconv-lite)
   - text-encoding: Lighter, browser-friendly
   - iconv-lite: More encodings, Node.js focused

2. **Expression Parser:** Build custom or use library?
   - Custom: Full control, smaller bundle
   - Library: Faster development, tested

3. **Process Support:** How to handle compression/encryption?
   - Plugin system?
   - Built-in common formats?

4. **Browser Support:** How much to optimize for browser?
   - Separate browser bundle?
   - Polyfills needed?

---

**Document Status:** Living document, updated as project evolves
**Last Updated:** 2025-10-01
**Next Review:** After Phase 1 completion
