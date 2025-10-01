/**
 * @fileoverview Integration tests for expression evaluation
 */

import { describe, it, expect } from 'vitest'
import { parse } from '../../src'

describe('Expression Integration Tests', () => {
  describe('if conditions', () => {
    it('should parse field conditionally based on expression', () => {
      const ksy = `
meta:
  id: conditional_test
  endian: le
seq:
  - id: flag
    type: u1
  - id: optional_value
    type: u4
    if: flag == 1
  - id: another_value
    type: u4
    if: flag != 1
`
      const buffer = new Uint8Array([1, 0x0a, 0x0b, 0x0c, 0x0d])
      const result = parse(ksy, buffer)

      expect(result.flag).toBe(1)
      expect(result.optional_value).toBe(0x0d0c0b0a)
      expect(result.another_value).toBeUndefined()
    })

    it('should skip field when condition is false', () => {
      const ksy = `
meta:
  id: conditional_test
  endian: le
seq:
  - id: flag
    type: u1
  - id: optional_value
    type: u4
    if: flag == 1
`
      const buffer = new Uint8Array([0, 0x0a, 0x0b, 0x0c, 0x0d])
      const result = parse(ksy, buffer)

      expect(result.flag).toBe(0)
      expect(result.optional_value).toBeUndefined()
    })
  })

  describe('repeat-expr', () => {
    it('should repeat based on expression result', () => {
      const ksy = `
meta:
  id: repeat_expr_test
  endian: le
seq:
  - id: count
    type: u1
  - id: values
    type: u2
    repeat: expr
    repeat-expr: count
`
      const buffer = new Uint8Array([3, 0x01, 0x00, 0x02, 0x00, 0x03, 0x00])
      const result = parse(ksy, buffer)

      expect(result.count).toBe(3)
      expect(result.values).toEqual([1, 2, 3])
    })

    it('should support expressions in repeat-expr', () => {
      const ksy = `
meta:
  id: repeat_expr_calc
  endian: le
seq:
  - id: base
    type: u1
  - id: values
    type: u1
    repeat: expr
    repeat-expr: base * 2
`
      const buffer = new Uint8Array([2, 10, 20, 30, 40])
      const result = parse(ksy, buffer)

      expect(result.base).toBe(2)
      expect(result.values).toEqual([10, 20, 30, 40])
    })
  })

  describe('repeat-until', () => {
    it('should repeat until condition is true', () => {
      const ksy = `
meta:
  id: repeat_until_test
  endian: le
seq:
  - id: values
    type: u1
    repeat: until
    repeat-until: _ == 0
`
      const buffer = new Uint8Array([1, 2, 3, 0, 99, 99])
      const result = parse(ksy, buffer)

      expect(result.values).toEqual([1, 2, 3, 0])
    })

    it('should support complex until conditions', () => {
      const ksy = `
meta:
  id: repeat_until_complex
  endian: le
seq:
  - id: values
    type: u1
    repeat: until
    repeat-until: _ > 100
`
      const buffer = new Uint8Array([10, 20, 30, 150, 99])
      const result = parse(ksy, buffer)

      expect(result.values).toEqual([10, 20, 30, 150])
    })
  })

  describe('calculated sizes', () => {
    it('should use expression for size', () => {
      const ksy = `
meta:
  id: sized_test
  endian: le
seq:
  - id: data_size
    type: u1
  - id: data
    size: data_size
`
      const buffer = new Uint8Array([4, 0x0a, 0x0b, 0x0c, 0x0d, 0xff])
      const result = parse(ksy, buffer)

      expect(result.data_size).toBe(4)
      expect(result.data).toEqual(new Uint8Array([0x0a, 0x0b, 0x0c, 0x0d]))
    })

    it('should support calculated sizes with expressions', () => {
      const ksy = `
meta:
  id: calc_size_test
  endian: le
seq:
  - id: base_size
    type: u1
  - id: data
    size: base_size * 2
`
      const buffer = new Uint8Array([3, 1, 2, 3, 4, 5, 6, 7])
      const result = parse(ksy, buffer)

      expect(result.base_size).toBe(3)
      expect(result.data).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]))
    })
  })

  describe('calculated positions', () => {
    it('should seek to calculated position', () => {
      const ksy = `
meta:
  id: pos_test
  endian: le
seq:
  - id: offset
    type: u1
  - id: value
    type: u4
    pos: offset
`
      const buffer = new Uint8Array([5, 0, 0, 0, 0, 0x0a, 0x0b, 0x0c, 0x0d])
      const result = parse(ksy, buffer)

      expect(result.offset).toBe(5)
      expect(result.value).toBe(0x0d0c0b0a)
    })

    it('should support expressions in pos', () => {
      const ksy = `
meta:
  id: pos_expr_test
  endian: le
seq:
  - id: base
    type: u1
  - id: value
    type: u2
    pos: base + 2
`
      const buffer = new Uint8Array([2, 0, 0, 0, 0x0a, 0x0b])
      const result = parse(ksy, buffer)

      expect(result.base).toBe(2)
      expect(result.value).toBe(0x0b0a)
    })
  })

  describe('complex expressions', () => {
    it('should handle arithmetic in expressions', () => {
      const ksy = `
meta:
  id: arithmetic_test
  endian: le
seq:
  - id: a
    type: u1
  - id: b
    type: u1
  - id: values
    type: u1
    repeat: expr
    repeat-expr: (a + b) * 2
`
      const buffer = new Uint8Array([2, 3, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const result = parse(ksy, buffer)

      expect(result.a).toBe(2)
      expect(result.b).toBe(3)
      expect(result.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })

    it('should handle comparison in expressions', () => {
      const ksy = `
meta:
  id: comparison_test
  endian: le
seq:
  - id: threshold
    type: u1
  - id: value
    type: u1
  - id: result
    type: u1
    if: value > threshold
`
      const buffer = new Uint8Array([5, 10, 99])
      const result = parse(ksy, buffer)

      expect(result.threshold).toBe(5)
      expect(result.value).toBe(10)
      expect(result.result).toBe(99)
    })

    it('should handle logical operators', () => {
      const ksy = `
meta:
  id: logical_test
  endian: le
seq:
  - id: flag1
    type: u1
  - id: flag2
    type: u1
  - id: value
    type: u1
    if: flag1 == 1 and flag2 == 1
`
      const buffer = new Uint8Array([1, 1, 99])
      const result = parse(ksy, buffer)

      expect(result.flag1).toBe(1)
      expect(result.flag2).toBe(1)
      expect(result.value).toBe(99)
    })
  })
})
