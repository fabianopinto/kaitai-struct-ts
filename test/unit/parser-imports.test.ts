/**
 * @fileoverview Tests for KsyParser import resolution
 */

import { describe, it, expect } from 'vitest'
import { KsyParser } from '../../src/parser/KsyParser'
import { ParseError } from '../../src/utils/errors'

describe('KsyParser - Import Resolution', () => {
  const parser = new KsyParser()

  describe('parseWithImports', () => {
    it('should parse schema without imports', () => {
      const ksy = `
meta:
  id: simple
  endian: le
seq:
  - id: value
    type: u4
`
      const schema = parser.parseWithImports(ksy, new Map())
      expect(schema.meta.id).toBe('simple')
      expect(schema.seq).toHaveLength(1)
    })

    it('should resolve single import', () => {
      const baseKsy = `
meta:
  id: base_type
  endian: le
seq:
  - id: magic
    type: u4
types:
  header:
    seq:
      - id: version
        type: u2
`

      const mainKsy = `
meta:
  id: main_format
  imports:
    - /common/base_type
  endian: le
seq:
  - id: data
    type: base_type::header
`

      const imports = new Map([['/common/base_type', baseKsy]])
      const schema = parser.parseWithImports(mainKsy, imports)

      expect(schema.meta.id).toBe('main_format')
      expect(schema.types).toHaveProperty('base_type')
      expect(schema.types).toHaveProperty('base_type::header')
    })

    it('should resolve multiple imports', () => {
      const type1Ksy = `
meta:
  id: type1
  endian: le
types:
  data_a:
    seq:
      - id: value_a
        type: u2
`

      const type2Ksy = `
meta:
  id: type2
  endian: le
types:
  data_b:
    seq:
      - id: value_b
        type: u4
`

      const mainKsy = `
meta:
  id: main_format
  imports:
    - /common/type1
    - /common/type2
  endian: le
seq:
  - id: field1
    type: type1::data_a
  - id: field2
    type: type2::data_b
`

      const imports = new Map([
        ['/common/type1', type1Ksy],
        ['/common/type2', type2Ksy],
      ])

      const schema = parser.parseWithImports(mainKsy, imports)

      expect(schema.types).toHaveProperty('type1')
      expect(schema.types).toHaveProperty('type1::data_a')
      expect(schema.types).toHaveProperty('type2')
      expect(schema.types).toHaveProperty('type2::data_b')
    })

    it('should merge enums from imported schemas', () => {
      const baseKsy = `
meta:
  id: base_type
  endian: le
enums:
  status:
    0: ok
    1: error
`

      const mainKsy = `
meta:
  id: main_format
  imports:
    - /common/base_type
  endian: le
seq:
  - id: status_code
    type: u1
    enum: base_type::status
`

      const imports = new Map([['/common/base_type', baseKsy]])
      const schema = parser.parseWithImports(mainKsy, imports)

      expect(schema.enums).toHaveProperty('base_type::status')
      expect(schema.enums!['base_type::status']).toEqual({
        0: 'ok',
        1: 'error',
      })
    })

    it('should throw error for missing import', () => {
      const mainKsy = `
meta:
  id: main_format
  imports:
    - /common/missing_type
  endian: le
seq:
  - id: data
    type: u4
`

      expect(() => {
        parser.parseWithImports(mainKsy, new Map())
      }).toThrow(ParseError)

      expect(() => {
        parser.parseWithImports(mainKsy, new Map())
      }).toThrow(/Import not found: \/common\/missing_type/)
    })

    it('should extract namespace correctly from import paths', () => {
      const testCases = [
        { path: '/common/riff', expected: 'riff' },
        { path: 'common/riff', expected: 'riff' },
        { path: '/formats/media/wav', expected: 'wav' },
        { path: 'single', expected: 'single' },
      ]

      for (const { path, expected } of testCases) {
        const baseKsy = `
meta:
  id: ${expected}
  endian: le
types:
  test_type:
    seq:
      - id: value
        type: u1
`

        const mainKsy = `
meta:
  id: main
  imports:
    - ${path}
  endian: le
seq:
  - id: data
    type: ${expected}::test_type
`

        const imports = new Map([[path, baseKsy]])
        const schema = parser.parseWithImports(mainKsy, imports)

        expect(schema.types).toHaveProperty(expected)
        expect(schema.types).toHaveProperty(`${expected}::test_type`)
      }
    })

    it('should preserve main schema types when merging imports', () => {
      const baseKsy = `
meta:
  id: base_type
  endian: le
types:
  imported_type:
    seq:
      - id: value
        type: u2
`

      const mainKsy = `
meta:
  id: main_format
  imports:
    - /common/base_type
  endian: le
types:
  local_type:
    seq:
      - id: data
        type: u4
seq:
  - id: field1
    type: base_type::imported_type
  - id: field2
    type: local_type
`

      const imports = new Map([['/common/base_type', baseKsy]])
      const schema = parser.parseWithImports(mainKsy, imports)

      // Both imported and local types should be present
      expect(schema.types).toHaveProperty('base_type')
      expect(schema.types).toHaveProperty('base_type::imported_type')
      expect(schema.types).toHaveProperty('local_type')
    })

    it('should handle nested types in imported schemas', () => {
      const baseKsy = `
meta:
  id: base_type
  endian: le
types:
  outer:
    seq:
      - id: inner_field
        type: inner
    types:
      inner:
        seq:
          - id: value
            type: u1
`

      const mainKsy = `
meta:
  id: main_format
  imports:
    - /common/base_type
  endian: le
seq:
  - id: data
    type: base_type::outer
`

      const imports = new Map([['/common/base_type', baseKsy]])
      const schema = parser.parseWithImports(mainKsy, imports)

      expect(schema.types).toHaveProperty('base_type')
      expect(schema.types).toHaveProperty('base_type::outer')
      
      // Check that nested types are preserved
      const outerType = schema.types!['base_type::outer']
      expect(outerType.types).toHaveProperty('inner')
    })

    it('should handle imports with instances', () => {
      const baseKsy = `
meta:
  id: base_type
  endian: le
seq:
  - id: raw_value
    type: u2
instances:
  calculated_value:
    value: raw_value * 2
`

      const mainKsy = `
meta:
  id: main_format
  imports:
    - /common/base_type
  endian: le
seq:
  - id: data
    type: base_type
`

      const imports = new Map([['/common/base_type', baseKsy]])
      const schema = parser.parseWithImports(mainKsy, imports)

      expect(schema.types).toHaveProperty('base_type')
      const baseType = schema.types!['base_type']
      expect(baseType.instances).toHaveProperty('calculated_value')
    })
  })
})
