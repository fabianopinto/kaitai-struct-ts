/**
 * @fileoverview Tests for expression-based endianness
 * @module test/integration/endian-expression
 */

import { describe, it, expect } from 'vitest'
import { parse } from '../../src'

describe('Expression-Based Endianness', () => {
  it('should switch endianness based on flag value', () => {
    const schema = `
meta:
  id: endian_switch_test
  endian:
    switch-on: endian_flag
    cases:
      0: le
      1: be
seq:
  - id: endian_flag
    type: u1
  - id: value
    type: u4
`
    // Little-endian case (flag = 0)
    const bufferLE = new Uint8Array([
      0x00, // flag = 0 (little-endian)
      0x01,
      0x02,
      0x03,
      0x04, // value = 0x04030201 in LE
    ])

    const resultLE = parse(schema, bufferLE) as Record<string, unknown>
    expect(resultLE.endian_flag).toBe(0)
    expect(resultLE.value).toBe(0x04030201)

    // Big-endian case (flag = 1)
    const bufferBE = new Uint8Array([
      0x01, // flag = 1 (big-endian)
      0x01,
      0x02,
      0x03,
      0x04, // value = 0x01020304 in BE
    ])

    const resultBE = parse(schema, bufferBE) as Record<string, unknown>
    expect(resultBE.endian_flag).toBe(1)
    expect(resultBE.value).toBe(0x01020304)
  })

  it('should handle expression-based endianness with enum', () => {
    const schema = `
meta:
  id: endian_enum_test
  endian:
    switch-on: byte_order
    cases:
      0: le
      1: be
enums:
  byte_orders:
    0: little_endian
    1: big_endian
seq:
  - id: byte_order
    type: u1
    enum: byte_orders
  - id: value1
    type: u2
  - id: value2
    type: u4
`
    const bufferLE = new Uint8Array([
      0x00, // little_endian
      0x34,
      0x12, // 0x1234 in LE
      0x78,
      0x56,
      0x34,
      0x12, // 0x12345678 in LE
    ])

    const result = parse(schema, bufferLE) as Record<string, unknown>
    expect(result.byte_order).toBe(0)
    expect(result.value1).toBe(0x1234)
    expect(result.value2).toBe(0x12345678)
  })

  it('should default to little-endian for unmatched case', () => {
    const schema = `
meta:
  id: endian_default_test
  endian:
    switch-on: flag
    cases:
      1: be
      2: be
seq:
  - id: flag
    type: u1
  - id: value
    type: u4
`
    const buffer = new Uint8Array([
      0x99, // flag = 99 (not in cases, defaults to LE)
      0x01,
      0x02,
      0x03,
      0x04,
    ])

    const result = parse(schema, buffer) as Record<string, unknown>
    expect(result.flag).toBe(0x99)
    expect(result.value).toBe(0x04030201) // Interpreted as LE
  })

  it('should work with float types', () => {
    const schema = `
meta:
  id: endian_float_test
  endian:
    switch-on: endian_flag
    cases:
      0: le
      1: be
seq:
  - id: endian_flag
    type: u1
  - id: float_value
    type: f4
`
    // Little-endian float
    const bufferLE = new Uint8Array([
      0x00, // LE flag
      0x00,
      0x00,
      0x80,
      0x3f, // 1.0 in LE (IEEE 754)
    ])

    const resultLE = parse(schema, bufferLE) as Record<string, unknown>
    expect(resultLE.endian_flag).toBe(0)
    expect(resultLE.float_value).toBeCloseTo(1.0, 5)
  })

  it('should override type-specific endianness', () => {
    const schema = `
meta:
  id: endian_override_test
  endian:
    switch-on: flag
    cases:
      0: le
      1: be
seq:
  - id: flag
    type: u1
  - id: value_default
    type: u4
  - id: value_explicit_le
    type: u4le
  - id: value_explicit_be
    type: u4be
`
    const buffer = new Uint8Array([
      0x01, // BE flag
      0x01,
      0x02,
      0x03,
      0x04, // value_default (uses BE from meta)
      0x01,
      0x02,
      0x03,
      0x04, // value_explicit_le (forces LE)
      0x01,
      0x02,
      0x03,
      0x04, // value_explicit_be (forces BE)
    ])

    const result = parse(schema, buffer) as Record<string, unknown>
    expect(result.flag).toBe(1)
    expect(result.value_default).toBe(0x01020304) // BE from meta
    expect(result.value_explicit_le).toBe(0x04030201) // Forced LE
    expect(result.value_explicit_be).toBe(0x01020304) // Forced BE
  })

  it('should work with multiple values in same structure', () => {
    const schema = `
meta:
  id: endian_multiple_test
  endian:
    switch-on: byte_order
    cases:
      0: le
      1: be
seq:
  - id: byte_order
    type: u1
  - id: value1
    type: u2
  - id: value2
    type: u4
  - id: value3
    type: u2
`
    const buffer = new Uint8Array([
      0x01, // byte_order = 1 (BE)
      0x01,
      0x02, // value1 = 0x0102 in BE
      0x01,
      0x02,
      0x03,
      0x04, // value2 = 0x01020304 in BE
      0xab,
      0xcd, // value3 = 0xABCD in BE
    ])

    const result = parse(schema, buffer) as Record<string, unknown>
    expect(result.byte_order).toBe(1)
    expect(result.value1).toBe(0x0102) // BE
    expect(result.value2).toBe(0x01020304) // BE
    expect(result.value3).toBe(0xabcd) // BE
  })

  it('should handle string keys in cases', () => {
    const schema = `
meta:
  id: endian_string_key_test
  endian:
    switch-on: mode
    cases:
      "0": le
      "1": be
seq:
  - id: mode
    type: u1
  - id: value
    type: u2
`
    const buffer = new Uint8Array([
      0x00, // mode = 0
      0x34,
      0x12, // value
    ])

    const result = parse(schema, buffer) as Record<string, unknown>
    expect(result.mode).toBe(0)
    expect(result.value).toBe(0x1234) // LE
  })
})
