/**
 * @fileoverview Integration tests for switch/case type selection
 */

import { describe, it, expect } from 'vitest'
import { parse } from '../../src'

describe('Switch/Case Integration Tests', () => {
  describe('basic switch type selection', () => {
    it('should select type based on switch-on expression', () => {
      const ksy = `
meta:
  id: switch_test
  endian: le
seq:
  - id: type_code
    type: u1
  - id: data
    type:
      switch-on: type_code
      cases:
        1: type_a
        2: type_b
types:
  type_a:
    seq:
      - id: value_a
        type: u2
  type_b:
    seq:
      - id: value_b
        type: u4
`
      const buffer = new Uint8Array([1, 0x0a, 0x0b])
      const result = parse(ksy, buffer)

      expect(result.type_code).toBe(1)
      expect(result.data).toHaveProperty('value_a')
      expect((result.data as { value_a: number }).value_a).toBe(0x0b0a)
    })

    it('should handle different switch values', () => {
      const ksy = `
meta:
  id: switch_multi_test
  endian: le
seq:
  - id: type_code
    type: u1
  - id: data
    type:
      switch-on: type_code
      cases:
        1: type_a
        2: type_b
types:
  type_a:
    seq:
      - id: value_a
        type: u2
  type_b:
    seq:
      - id: value_b
        type: u4
`
      const buffer = new Uint8Array([2, 0x01, 0x02, 0x03, 0x04])
      const result = parse(ksy, buffer)

      expect(result.type_code).toBe(2)
      expect(result.data).toHaveProperty('value_b')
      expect((result.data as { value_b: number }).value_b).toBe(0x04030201)
    })
  })

  describe('switch with default', () => {
    it('should use default type when no case matches', () => {
      const ksy = `
meta:
  id: switch_default_test
  endian: le
seq:
  - id: type_code
    type: u1
  - id: data
    type:
      switch-on: type_code
      cases:
        1: type_a
        2: type_b
      default: type_default
types:
  type_a:
    seq:
      - id: value_a
        type: u2
  type_b:
    seq:
      - id: value_b
        type: u4
  type_default:
    seq:
      - id: value_default
        type: u1
`
      const buffer = new Uint8Array([99, 0xff])
      const result = parse(ksy, buffer)

      expect(result.type_code).toBe(99)
      expect(result.data).toHaveProperty('value_default')
      expect((result.data as { value_default: number }).value_default).toBe(
        0xff
      )
    })
  })

  describe('switch with expressions', () => {
    it('should evaluate complex switch-on expressions', () => {
      const ksy = `
meta:
  id: switch_expr_test
  endian: le
seq:
  - id: base
    type: u1
  - id: multiplier
    type: u1
  - id: data
    type:
      switch-on: base * multiplier
      cases:
        4: type_small
        8: type_medium
        12: type_large
types:
  type_small:
    seq:
      - id: value
        type: u1
  type_medium:
    seq:
      - id: value
        type: u2
  type_large:
    seq:
      - id: value
        type: u4
`
      const buffer = new Uint8Array([2, 4, 0x01, 0x02])
      const result = parse(ksy, buffer)

      expect(result.base).toBe(2)
      expect(result.multiplier).toBe(4)
      // 2 * 4 = 8, so type_medium is selected (u2)
      expect((result.data as { value: number }).value).toBe(0x0201)
    })
  })

  describe('switch with enums', () => {
    it('should use enum values in switch-on', () => {
      const ksy = `
meta:
  id: switch_enum_test
  endian: le
enums:
  data_type:
    1: text
    2: binary
    3: compressed
seq:
  - id: type_code
    type: u1
    enum: data_type
  - id: data
    type:
      switch-on: type_code
      cases:
        1: text_data
        2: binary_data
types:
  text_data:
    seq:
      - id: length
        type: u1
  binary_data:
    seq:
      - id: size
        type: u2
`
      const buffer = new Uint8Array([1, 0x0a])
      const result = parse(ksy, buffer)

      expect(result.type_code).toBe(1)
      expect(result.data).toHaveProperty('length')
      expect((result.data as { length: number }).length).toBe(0x0a)
    })
  })

  describe('nested switch types', () => {
    it('should handle switch types within switch types', () => {
      const ksy = `
meta:
  id: nested_switch_test
  endian: le
seq:
  - id: category
    type: u1
  - id: subtype
    type: u1
  - id: data
    type:
      switch-on: category
      cases:
        1: category_a
types:
  category_a:
    seq:
      - id: inner_data
        type:
          switch-on: _parent.subtype
          cases:
            1: inner_type_a
            2: inner_type_b
  inner_type_a:
    seq:
      - id: value_a
        type: u1
  inner_type_b:
    seq:
      - id: value_b
        type: u2
`
      const buffer = new Uint8Array([1, 2, 0x0a, 0x0b])
      const result = parse(ksy, buffer)

      expect(result.category).toBe(1)
      expect(result.subtype).toBe(2)
      expect(result.data).toHaveProperty('inner_data')
      const dataWithInner = result.data as { inner_data: { value_b: number } }
      expect(dataWithInner.inner_data).toHaveProperty('value_b')
      expect(dataWithInner.inner_data.value_b).toBe(0x0b0a)
    })
  })

  describe('switch with built-in types', () => {
    it('should allow built-in types in switch cases', () => {
      const ksy = `
meta:
  id: switch_builtin_test
  endian: le
seq:
  - id: size_code
    type: u1
  - id: value
    type:
      switch-on: size_code
      cases:
        1: u1
        2: u2
        4: u4
`
      const buffer = new Uint8Array([2, 0x0a, 0x0b])
      const result = parse(ksy, buffer)

      expect(result.size_code).toBe(2)
      expect(result.value).toBe(0x0b0a)
    })
  })
})
