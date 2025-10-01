/**
 * @fileoverview Integration tests for instances (lazy-evaluated fields)
 */

import { describe, it, expect } from 'vitest'
import { parse } from '../../src'

describe('Instances Integration Tests', () => {
  describe('value instances', () => {
    it('should evaluate value instances as calculated fields', () => {
      const ksy = `
meta:
  id: value_instance_test
  endian: le
seq:
  - id: width
    type: u2
  - id: height
    type: u2
instances:
  area:
    value: width * height
`
      const buffer = new Uint8Array([0x0a, 0x00, 0x14, 0x00])
      const result = parse(ksy, buffer)

      expect(result.width).toBe(10)
      expect(result.height).toBe(20)
      expect(result.area).toBe(200)
    })

    it('should support complex expressions in value instances', () => {
      const ksy = `
meta:
  id: complex_value_test
  endian: le
seq:
  - id: a
    type: u1
  - id: b
    type: u1
  - id: c
    type: u1
instances:
  sum:
    value: a + b + c
  average:
    value: (a + b + c) / 3
  is_even_sum:
    value: (a + b + c) % 2 == 0
`
      const buffer = new Uint8Array([10, 20, 30])
      const result = parse(ksy, buffer)

      expect(result.a).toBe(10)
      expect(result.b).toBe(20)
      expect(result.c).toBe(30)
      expect(result.sum).toBe(60)
      expect(result.average).toBe(20)
      expect(result.is_even_sum).toBe(true)
    })
  })

  describe('pos instances', () => {
    it('should read from absolute position', () => {
      const ksy = `
meta:
  id: pos_instance_test
  endian: le
seq:
  - id: header_size
    type: u1
  - id: data_offset
    type: u1
instances:
  footer:
    pos: 10
    type: u2
`
      const buffer = new Uint8Array([4, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0xab, 0xcd])
      const result = parse(ksy, buffer)

      expect(result.header_size).toBe(4)
      expect(result.data_offset).toBe(8)
      expect(result.footer).toBe(0xcdab)
    })

    it('should use expression for pos', () => {
      const ksy = `
meta:
  id: pos_expr_test
  endian: le
seq:
  - id: offset
    type: u1
instances:
  data_at_offset:
    pos: offset
    type: u4
`
      const buffer = new Uint8Array([5, 0, 0, 0, 0, 0x01, 0x02, 0x03, 0x04])
      const result = parse(ksy, buffer)

      expect(result.offset).toBe(5)
      expect(result.data_at_offset).toBe(0x04030201)
    })

    it('should restore stream position after reading', () => {
      const ksy = `
meta:
  id: pos_restore_test
  endian: le
seq:
  - id: first
    type: u1
  - id: second
    type: u1
instances:
  at_position_5:
    pos: 5
    type: u1
`
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0xff])
      const result = parse(ksy, buffer)

      expect(result.first).toBe(0x01)
      expect(result.second).toBe(0x02)
      expect(result.at_position_5).toBe(0xff)
    })
  })

  describe('lazy evaluation', () => {
    it('should only evaluate instances when accessed', () => {
      const ksy = `
meta:
  id: lazy_test
  endian: le
seq:
  - id: value
    type: u1
instances:
  doubled:
    value: value * 2
  tripled:
    value: value * 3
`
      const buffer = new Uint8Array([10])
      const result = parse(ksy, buffer)

      expect(result.value).toBe(10)

      // Access doubled
      expect(result.doubled).toBe(20)

      // Access tripled
      expect(result.tripled).toBe(30)
    })

    it('should cache instance values', () => {
      const ksy = `
meta:
  id: cache_test
  endian: le
seq:
  - id: base
    type: u1
instances:
  calculated:
    value: base * 100
`
      const buffer = new Uint8Array([5])
      const result = parse(ksy, buffer)

      // First access
      const first = result.calculated
      expect(first).toBe(500)

      // Second access should return cached value
      const second = result.calculated
      expect(second).toBe(500)
      expect(second).toBe(first)
    })
  })

  describe('instances with types', () => {
    it('should parse complex types in instances', () => {
      const ksy = `
meta:
  id: instance_type_test
  endian: le
seq:
  - id: header_offset
    type: u1
instances:
  header:
    pos: header_offset
    type: header_type
types:
  header_type:
    seq:
      - id: magic
        type: u2
      - id: version
        type: u1
`
      const buffer = new Uint8Array([5, 0, 0, 0, 0, 0x4d, 0x5a, 0x01])
      const result = parse(ksy, buffer)

      expect(result.header_offset).toBe(5)
      expect(result.header).toHaveProperty('magic')
      expect((result.header as any).magic).toBe(0x5a4d)
      expect((result.header as any).version).toBe(0x01)
    })
  })

  describe('instances with size', () => {
    it('should read sized data in instances', () => {
      const ksy = `
meta:
  id: instance_size_test
  endian: le
seq:
  - id: data_size
    type: u1
instances:
  data:
    pos: 5
    size: data_size
`
      const buffer = new Uint8Array([3, 0, 0, 0, 0, 0xaa, 0xbb, 0xcc, 0xdd])
      const result = parse(ksy, buffer)

      expect(result.data_size).toBe(3)
      expect(result.data).toEqual(new Uint8Array([0xaa, 0xbb, 0xcc]))
    })
  })

  describe('instances with conditionals', () => {
    it('should support if conditions in instances', () => {
      const ksy = `
meta:
  id: instance_if_test
  endian: le
seq:
  - id: has_footer
    type: u1
instances:
  footer:
    pos: 10
    type: u2
    if: has_footer == 1
`
      const buffer1 = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xab, 0xcd])
      const result1 = parse(ksy, buffer1)
      expect(result1.footer).toBe(0xcdab)

      const buffer2 = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xab, 0xcd])
      const result2 = parse(ksy, buffer2)
      expect(result2.footer).toBeUndefined()
    })
  })

  describe('multiple instances', () => {
    it('should handle multiple instances', () => {
      const ksy = `
meta:
  id: multi_instance_test
  endian: le
seq:
  - id: base
    type: u1
instances:
  double:
    value: base * 2
  triple:
    value: base * 3
  quadruple:
    value: base * 4
  at_pos_10:
    pos: 10
    type: u1
`
      const buffer = new Uint8Array([5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff])
      const result = parse(ksy, buffer)

      expect(result.base).toBe(5)
      expect(result.double).toBe(10)
      expect(result.triple).toBe(15)
      expect(result.quadruple).toBe(20)
      expect(result.at_pos_10).toBe(0xff)
    })
  })
})
