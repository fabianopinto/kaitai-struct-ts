/**
 * @fileoverview Integration tests for basic parsing functionality
 */

import { describe, it, expect } from 'vitest'
import { parse } from '../../src'

describe('Basic Parsing Integration', () => {
  describe('simple fixed-size structure', () => {
    it('should parse a simple struct with integers', () => {
      const ksy = `
meta:
  id: simple_struct
  endian: le
seq:
  - id: magic
    contents: [0x4D, 0x5A]
  - id: version
    type: u2
  - id: count
    type: u4
`

      const buffer = new Uint8Array([
        0x4d,
        0x5a, // magic "MZ"
        0x01,
        0x00, // version = 1
        0x0a,
        0x00,
        0x00,
        0x00, // count = 10
      ])

      const result = parse(ksy, buffer)

      expect(result.magic).toBeInstanceOf(Uint8Array)
      expect(Array.from(result.magic as Uint8Array)).toEqual([0x4d, 0x5a])
      expect(result.version).toBe(1)
      expect(result.count).toBe(10)
    })

    it('should parse with big-endian', () => {
      const ksy = `
meta:
  id: big_endian_struct
  endian: be
seq:
  - id: value1
    type: u2
  - id: value2
    type: u4
`

      const buffer = new Uint8Array([
        0x12,
        0x34, // value1 = 0x1234
        0x56,
        0x78,
        0x9a,
        0xbc, // value2 = 0x56789abc
      ])

      const result = parse(ksy, buffer)

      expect(result.value1).toBe(0x1234)
      expect(result.value2).toBe(0x56789abc)
    })

    it('should parse signed integers', () => {
      const ksy = `
meta:
  id: signed_struct
  endian: le
seq:
  - id: byte_val
    type: s1
  - id: short_val
    type: s2
  - id: int_val
    type: s4
`

      const buffer = new Uint8Array([
        0xff, // -1
        0xff,
        0xff, // -1
        0xff,
        0xff,
        0xff,
        0xff, // -1
      ])

      const result = parse(ksy, buffer)

      expect(result.byte_val).toBe(-1)
      expect(result.short_val).toBe(-1)
      expect(result.int_val).toBe(-1)
    })

    it('should parse floating point numbers', () => {
      const ksy = `
meta:
  id: float_struct
  endian: le
seq:
  - id: float_val
    type: f4
  - id: double_val
    type: f8
`

      const buffer = new ArrayBuffer(12)
      const view = new DataView(buffer)
      view.setFloat32(0, 3.14, true) // little-endian
      view.setFloat64(4, 2.718281828, true) // little-endian

      const result = parse(ksy, new Uint8Array(buffer))

      expect(result.float_val).toBeCloseTo(3.14, 2)
      expect(result.double_val).toBeCloseTo(2.718281828, 6)
    })
  })

  describe('strings', () => {
    it('should parse fixed-size string', () => {
      const ksy = `
meta:
  id: string_struct
  endian: le
seq:
  - id: name
    type: str
    size: 5
    encoding: UTF-8
`

      const buffer = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]) // "Hello"

      const result = parse(ksy, buffer)

      expect(result.name).toBe('Hello')
    })

    it('should parse string with different encoding', () => {
      const ksy = `
meta:
  id: ascii_struct
  endian: le
seq:
  - id: text
    type: str
    size: 3
    encoding: ASCII
`

      const buffer = new Uint8Array([0x41, 0x42, 0x43]) // "ABC"

      const result = parse(ksy, buffer)

      expect(result.text).toBe('ABC')
    })
  })

  describe('raw bytes', () => {
    it('should parse fixed-size byte array', () => {
      const ksy = `
meta:
  id: bytes_struct
  endian: le
seq:
  - id: data
    size: 4
`

      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04])

      const result = parse(ksy, buffer)

      expect(result.data).toBeInstanceOf(Uint8Array)
      expect(Array.from(result.data as Uint8Array)).toEqual([1, 2, 3, 4])
    })

    it('should read all remaining bytes with size-eos', () => {
      const ksy = `
meta:
  id: eos_struct
  endian: le
seq:
  - id: header
    type: u2
  - id: rest
    size-eos: true
`

      const buffer = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a])

      const result = parse(ksy, buffer)

      expect(result.header).toBe(0x3412)
      expect(result.rest).toBeInstanceOf(Uint8Array)
      expect(Array.from(result.rest as Uint8Array)).toEqual([0x56, 0x78, 0x9a])
    })
  })

  describe('repetitions', () => {
    it('should parse repeat-expr', () => {
      const ksy = `
meta:
  id: repeat_struct
  endian: le
seq:
  - id: count
    type: u1
  - id: values
    type: u2
    repeat: expr
    repeat-expr: 3
`

      const buffer = new Uint8Array([
        0x03, // count
        0x01,
        0x00, // values[0] = 1
        0x02,
        0x00, // values[1] = 2
        0x03,
        0x00, // values[2] = 3
      ])

      const result = parse(ksy, buffer)

      expect(result.count).toBe(3)
      expect(Array.isArray(result.values)).toBe(true)
      expect(result.values).toEqual([1, 2, 3])
    })

    it('should parse repeat-eos', () => {
      const ksy = `
meta:
  id: repeat_eos_struct
  endian: le
seq:
  - id: values
    type: u1
    repeat: eos
`

      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])

      const result = parse(ksy, buffer)

      expect(Array.isArray(result.values)).toBe(true)
      expect(result.values).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('nested types', () => {
    it('should parse nested user-defined types', () => {
      const ksy = `
meta:
  id: nested_struct
  endian: le
seq:
  - id: header
    type: header_type
types:
  header_type:
    seq:
      - id: magic
        type: u2
      - id: version
        type: u2
`

      const buffer = new Uint8Array([
        0x4d,
        0x5a, // magic
        0x01,
        0x00, // version
      ])

      const result = parse(ksy, buffer)

      expect(result.header).toBeDefined()
      expect(typeof result.header).toBe('object')
      const header = result.header as Record<string, unknown>
      expect(header.magic).toBe(0x5a4d)
      expect(header.version).toBe(1)
    })
  })

  describe('validation', () => {
    it('should validate contents match', () => {
      const ksy = `
meta:
  id: validated_struct
  endian: le
seq:
  - id: magic
    contents: [0x4D, 0x5A]
  - id: data
    type: u2
`

      const buffer = new Uint8Array([0x4d, 0x5a, 0x12, 0x34])

      const result = parse(ksy, buffer)

      expect(result.magic).toBeInstanceOf(Uint8Array)
      expect(result.data).toBe(0x3412)
    })

    it('should throw on contents mismatch', () => {
      const ksy = `
meta:
  id: validated_struct
  endian: le
seq:
  - id: magic
    contents: [0x4D, 0x5A]
`

      const buffer = new Uint8Array([0x4d, 0x5b]) // Wrong second byte

      expect(() => parse(ksy, buffer)).toThrow()
    })
  })

  describe('error handling', () => {
    it('should throw on invalid YAML', () => {
      const ksy = `
meta:
  id: invalid
  invalid yaml here
`

      const buffer = new Uint8Array([0x01])

      expect(() => parse(ksy, buffer)).toThrow()
    })

    it('should throw on missing meta.id', () => {
      const ksy = `
meta:
  endian: le
seq:
  - id: value
    type: u1
`

      const buffer = new Uint8Array([0x01])

      expect(() => parse(ksy, buffer)).toThrow()
    })

    it('should throw on EOF', () => {
      const ksy = `
meta:
  id: eof_test
  endian: le
seq:
  - id: value1
    type: u4
  - id: value2
    type: u4
`

      const buffer = new Uint8Array([0x01, 0x02, 0x03]) // Only 3 bytes, need 8

      expect(() => parse(ksy, buffer)).toThrow()
    })
  })
})
