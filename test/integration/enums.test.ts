/**
 * @fileoverview Integration tests for enum support
 */

import { describe, it, expect } from 'vitest'
import { parse } from '../../src'

describe('Enum Integration Tests', () => {
  describe('basic enum mapping', () => {
    it('should keep enum values as integers', () => {
      const ksy = `
meta:
  id: enum_test
  endian: le
enums:
  file_type:
    0: unknown
    1: text
    2: binary
seq:
  - id: type
    type: u1
    enum: file_type
`
      const buffer = new Uint8Array([1])
      const result = parse(ksy, buffer)

      // Values are kept as integers for expression compatibility
      expect(result.type).toBe(1)
    })

    it('should handle multiple enum values', () => {
      const ksy = `
meta:
  id: multi_enum_test
  endian: le
enums:
  status:
    0: inactive
    1: active
    2: pending
    3: error
seq:
  - id: status1
    type: u1
    enum: status
  - id: status2
    type: u1
    enum: status
`
      const buffer = new Uint8Array([0, 2])
      const result = parse(ksy, buffer)

      expect(result.status1).toBe(0)
      expect(result.status2).toBe(2)
    })

    it('should keep unmapped values as integers', () => {
      const ksy = `
meta:
  id: enum_missing_test
  endian: le
enums:
  status:
    0: inactive
    1: active
seq:
  - id: status
    type: u1
    enum: status
`
      const buffer = new Uint8Array([99])
      const result = parse(ksy, buffer)

      expect(result.status).toBe(99)
    })
  })

  describe('enum in expressions', () => {
    it('should use enum values in if conditions', () => {
      const ksy = `
meta:
  id: enum_condition_test
  endian: le
enums:
  file_type:
    0: unknown
    1: text
    2: binary
seq:
  - id: type
    type: u1
    enum: file_type
  - id: text_data
    type: u4
    if: type == file_type::text
  - id: binary_data
    type: u4
    if: type == file_type::binary
`
      const buffer = new Uint8Array([1, 0x0a, 0x0b, 0x0c, 0x0d])
      const result = parse(ksy, buffer)

      expect(result.type).toBe(1)
      expect(result.text_data).toBe(0x0d0c0b0a)
      expect(result.binary_data).toBeUndefined()
    })

    it('should support enum access in repeat-until', () => {
      const ksy = `
meta:
  id: enum_until_test
  endian: le
enums:
  marker:
    0: continue
    1: stop
seq:
  - id: values
    type: u1
    enum: marker
    repeat: until
    repeat-until: _ == marker::stop
`
      const buffer = new Uint8Array([0, 0, 0, 1, 99])
      const result = parse(ksy, buffer)

      expect(result.values).toEqual([0, 0, 0, 1])
    })
  })

  describe('enum with arrays', () => {
    it('should keep enum values as integers in arrays', () => {
      const ksy = `
meta:
  id: enum_array_test
  endian: le
enums:
  color:
    0: red
    1: green
    2: blue
seq:
  - id: count
    type: u1
  - id: colors
    type: u1
    enum: color
    repeat: expr
    repeat-expr: count
`
      const buffer = new Uint8Array([3, 0, 2, 1])
      const result = parse(ksy, buffer)

      expect(result.count).toBe(3)
      expect(result.colors).toEqual([0, 2, 1])
    })
  })

  describe('multiple enums', () => {
    it('should handle multiple enum definitions', () => {
      const ksy = `
meta:
  id: multi_enum_def_test
  endian: le
enums:
  file_type:
    0: unknown
    1: text
    2: binary
  compression:
    0: none
    1: gzip
    2: bzip2
seq:
  - id: type
    type: u1
    enum: file_type
  - id: compression
    type: u1
    enum: compression
`
      const buffer = new Uint8Array([1, 2])
      const result = parse(ksy, buffer)

      expect(result.type).toBe(1)
      expect(result.compression).toBe(2)
    })
  })

  describe('enum with different integer sizes', () => {
    it('should work with u2 values', () => {
      const ksy = `
meta:
  id: enum_u2_test
  endian: le
enums:
  large_enum:
    0: zero
    256: large_value
    1000: very_large
seq:
  - id: value
    type: u2
    enum: large_enum
`
      const buffer = new Uint8Array([0x00, 0x01]) // 256 in little-endian
      const result = parse(ksy, buffer)

      expect(result.value).toBe(256)
    })

    it('should work with u4 values', () => {
      const ksy = `
meta:
  id: enum_u4_test
  endian: le
enums:
  status_code:
    200: ok
    404: not_found
    500: server_error
seq:
  - id: code
    type: u4
    enum: status_code
`
      const buffer = new Uint8Array([0x94, 0x01, 0x00, 0x00]) // 404 in little-endian
      const result = parse(ksy, buffer)

      expect(result.code).toBe(404)
    })
  })
})
