/**
 * @fileoverview Integration tests for schema compilation API
 */

import { describe, it, expect } from 'vitest'
import { compileSchema, parseWithSchema, parse } from '../../src'

describe('Schema Compilation API', () => {
  const simpleKsy = `
meta:
  id: simple_format
  endian: le
seq:
  - id: magic
    contents: [0x4D, 0x5A]
  - id: version
    type: u2
  - id: count
    type: u4
`

  const simpleBinary = new Uint8Array([
    0x4d,
    0x5a, // magic "MZ"
    0x01,
    0x00, // version = 1
    0x0a,
    0x00,
    0x00,
    0x00, // count = 10
  ])

  describe('compileSchema', () => {
    it('should compile a valid schema', () => {
      const compiled = compileSchema(simpleKsy)

      expect(compiled).toBeDefined()
      expect(compiled.schema).toBeDefined()
      expect(compiled.meta).toBeDefined()
      expect(compiled.meta.id).toBe('simple_format')
      expect(compiled.meta.validated).toBe(true)
      expect(compiled.meta.compiledAt).toBeInstanceOf(Date)
      expect(compiled.__compiled).toBe(true)
    })

    it('should compile with validation disabled', () => {
      const compiled = compileSchema(simpleKsy, { validate: false })

      expect(compiled.meta.validated).toBe(false)
    })

    it('should compile with strict mode', () => {
      const compiled = compileSchema(simpleKsy, { strict: true })

      expect(compiled).toBeDefined()
      expect(compiled.meta.validated).toBe(true)
    })

    it('should throw on invalid YAML', () => {
      const invalidYaml = 'invalid: [yaml: structure'

      expect(() => compileSchema(invalidYaml)).toThrow()
    })

    it('should throw on invalid schema', () => {
      const invalidSchema = `
meta:
  id: invalid
seq:
  - id: field
    repeat: expr
    # Missing repeat-expr
`

      expect(() => compileSchema(invalidSchema)).toThrow()
    })

    it('should compile schema with imports', () => {
      const mainKsy = `
meta:
  id: main_format
  imports:
    - /common/header
seq:
  - id: header
    type: header
`

      const headerKsy = `
meta:
  id: header
seq:
  - id: magic
    type: u4
`

      const imports = new Map([['/common/header', headerKsy]])
      const compiled = compileSchema(mainKsy, { imports })

      expect(compiled).toBeDefined()
      expect(compiled.meta.id).toBe('main_format')
    })

    it('should preserve schema structure', () => {
      const compiled = compileSchema(simpleKsy)

      expect(compiled.schema.meta).toBeDefined()
      expect(compiled.schema.meta.id).toBe('simple_format')
      expect(compiled.schema.seq).toBeDefined()
      expect(compiled.schema.seq).toHaveLength(3)
    })
  })

  describe('parseWithSchema', () => {
    it('should parse binary data with compiled schema', () => {
      const compiled = compileSchema(simpleKsy)
      const result = parseWithSchema(compiled, simpleBinary)

      expect(result.magic).toBeInstanceOf(Uint8Array)
      expect(Array.from(result.magic as Uint8Array)).toEqual([0x4d, 0x5a])
      expect(result.version).toBe(1)
      expect(result.count).toBe(10)
    })

    it('should parse multiple files with same compiled schema', () => {
      const compiled = compileSchema(simpleKsy)

      const binary1 = new Uint8Array([
        0x4d, 0x5a, 0x01, 0x00, 0x0a, 0x00, 0x00, 0x00,
      ])
      const binary2 = new Uint8Array([
        0x4d, 0x5a, 0x02, 0x00, 0x14, 0x00, 0x00, 0x00,
      ])
      const binary3 = new Uint8Array([
        0x4d, 0x5a, 0x03, 0x00, 0x1e, 0x00, 0x00, 0x00,
      ])

      const result1 = parseWithSchema(compiled, binary1)
      const result2 = parseWithSchema(compiled, binary2)
      const result3 = parseWithSchema(compiled, binary3)

      expect(result1.version).toBe(1)
      expect(result1.count).toBe(10)

      expect(result2.version).toBe(2)
      expect(result2.count).toBe(20)

      expect(result3.version).toBe(3)
      expect(result3.count).toBe(30)
    })

    it('should handle ArrayBuffer input', () => {
      const compiled = compileSchema(simpleKsy)
      const arrayBuffer = simpleBinary.buffer

      const result = parseWithSchema(compiled, arrayBuffer)

      expect(result.version).toBe(1)
      expect(result.count).toBe(10)
    })

    it('should work with complex schemas', () => {
      const complexKsy = `
meta:
  id: complex_format
  endian: le
seq:
  - id: header
    type: header_type
  - id: items
    type: item_type
    repeat: expr
    repeat-expr: header.count
types:
  header_type:
    seq:
      - id: magic
        contents: [0x48, 0x44, 0x52]
      - id: count
        type: u1
  item_type:
    seq:
      - id: value
        type: u2
`

      const complexBinary = new Uint8Array([
        0x48,
        0x44,
        0x52, // magic "HDR"
        0x03, // count = 3
        0x01,
        0x00, // item 1: value = 1
        0x02,
        0x00, // item 2: value = 2
        0x03,
        0x00, // item 3: value = 3
      ])

      const compiled = compileSchema(complexKsy)
      const result = parseWithSchema(compiled, complexBinary)

      expect(result.header).toBeDefined()
      expect((result.header as Record<string, unknown>).count).toBe(3)
      expect(result.items).toBeInstanceOf(Array)
      expect((result.items as unknown[]).length).toBe(3)
    })
  })

  describe('parse with CompiledSchema', () => {
    it('should accept compiled schema in parse function', () => {
      const compiled = compileSchema(simpleKsy)
      const result = parse(compiled, simpleBinary)

      expect(result.magic).toBeInstanceOf(Uint8Array)
      expect(result.version).toBe(1)
      expect(result.count).toBe(10)
    })

    it('should maintain backward compatibility with string input', () => {
      const result = parse(simpleKsy, simpleBinary)

      expect(result.magic).toBeInstanceOf(Uint8Array)
      expect(result.version).toBe(1)
      expect(result.count).toBe(10)
    })

    it('should produce identical results for string and compiled schema', () => {
      const compiled = compileSchema(simpleKsy)

      const resultFromString = parse(simpleKsy, simpleBinary)
      const resultFromCompiled = parse(compiled, simpleBinary)

      expect(resultFromString.version).toBe(resultFromCompiled.version)
      expect(resultFromString.count).toBe(resultFromCompiled.count)
    })

    it('should ignore options when using compiled schema', () => {
      const compiled = compileSchema(simpleKsy, { validate: false })

      // Options should be ignored when compiled schema is provided
      const result = parse(compiled, simpleBinary, {
        validate: true,
        strict: true,
      })

      expect(result.version).toBe(1)
      expect(result.count).toBe(10)
    })
  })

  describe('Performance characteristics', () => {
    it('should reuse compiled schema without re-parsing', () => {
      const compiled = compileSchema(simpleKsy)

      // Verify the schema object is the same instance
      const schema1 = compiled.schema
      const schema2 = compiled.schema

      expect(schema1).toBe(schema2)
    })

    it('should handle multiple concurrent parses', () => {
      const compiled = compileSchema(simpleKsy)

      const binaries = Array.from(
        { length: 10 },
        (_, i) =>
          new Uint8Array([0x4d, 0x5a, i + 1, 0x00, i * 10, 0x00, 0x00, 0x00])
      )

      const results = binaries.map((binary) =>
        parseWithSchema(compiled, binary)
      )

      results.forEach((result, i) => {
        expect(result.version).toBe(i + 1)
        expect(result.count).toBe(i * 10)
      })
    })
  })

  describe('Error handling', () => {
    it('should throw on parsing errors with compiled schema', () => {
      const compiled = compileSchema(simpleKsy)
      const invalidBinary = new Uint8Array([0x00, 0x00]) // Too short

      expect(() => parseWithSchema(compiled, invalidBinary)).toThrow()
    })

    it('should throw on content validation errors', () => {
      const compiled = compileSchema(simpleKsy)
      const wrongMagic = new Uint8Array([
        0x00,
        0x00, // Wrong magic
        0x01,
        0x00,
        0x0a,
        0x00,
        0x00,
        0x00,
      ])

      expect(() => parseWithSchema(compiled, wrongMagic)).toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty binary data', () => {
      const emptyKsy = `
meta:
  id: empty_format
seq: []
`

      const compiled = compileSchema(emptyKsy)
      const result = parseWithSchema(compiled, new Uint8Array([]))

      expect(result).toBeDefined()
      expect(
        Object.keys(result).filter((k) => !k.startsWith('_'))
      ).toHaveLength(0)
    })

    it('should handle schemas with instances', () => {
      const instanceKsy = `
meta:
  id: instance_format
seq:
  - id: value
    type: u1
instances:
  doubled:
    value: value * 2
`

      const compiled = compileSchema(instanceKsy)
      const result = parseWithSchema(compiled, new Uint8Array([5]))

      expect(result.value).toBe(5)
      expect(result.doubled).toBe(10)
    })

    it('should handle schemas with enums', () => {
      const enumKsy = `
meta:
  id: enum_format
seq:
  - id: color
    type: u1
    enum: colors
enums:
  colors:
    0: red
    1: green
    2: blue
`

      const compiled = compileSchema(enumKsy)
      const result = parseWithSchema(compiled, new Uint8Array([1]))

      expect(result.color).toBe(1)
    })

    it('should handle schemas with conditionals', () => {
      const conditionalKsy = `
meta:
  id: conditional_format
seq:
  - id: has_extra
    type: u1
  - id: extra
    type: u2
    if: has_extra != 0
`

      const compiled = compileSchema(conditionalKsy)

      const withExtra = new Uint8Array([1, 0x0a, 0x00])
      const withoutExtra = new Uint8Array([0])

      const result1 = parseWithSchema(compiled, withExtra)
      const result2 = parseWithSchema(compiled, withoutExtra)

      expect(result1.has_extra).toBe(1)
      expect(result1.extra).toBe(10)

      expect(result2.has_extra).toBe(0)
      expect(result2.extra).toBeUndefined()
    })
  })
})
