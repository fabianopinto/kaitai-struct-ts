import { describe, it, expect } from 'vitest'
import { parse } from '../../src/index'

describe('BigInt (u8/s8) types', () => {
  it('should parse u8 (unsigned 64-bit) values', () => {
    const ksy = `
meta:
  id: test_u8
  endian: le
seq:
  - id: small_value
    type: u8
  - id: large_value
    type: u8
`
    // Small value: 42, Large value: 9223372036854775807 (max safe int + 1)
    const data = new Uint8Array([
      0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 42
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f, // 9223372036854775807
    ])

    const result = parse(ksy, data) as Record<string, unknown>

    expect(result.small_value).toBe(42n)
    expect(result.large_value).toBe(9223372036854775807n)
    expect(typeof result.small_value).toBe('bigint')
    expect(typeof result.large_value).toBe('bigint')
  })

  it('should parse s8 (signed 64-bit) values', () => {
    const ksy = `
meta:
  id: test_s8
  endian: le
seq:
  - id: positive
    type: s8
  - id: negative
    type: s8
  - id: zero
    type: s8
`
    const data = new Uint8Array([
      0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 42
      0xd6, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, // -42
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 0
    ])

    const result = parse(ksy, data) as Record<string, unknown>

    expect(result.positive).toBe(42n)
    expect(result.negative).toBe(-42n)
    expect(result.zero).toBe(0n)
  })

  it('should handle u8 big-endian', () => {
    const ksy = `
meta:
  id: test_u8_be
  endian: be
seq:
  - id: value
    type: u8
`
    // 0x0102030405060708 in big-endian
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])

    const result = parse(ksy, data) as Record<string, unknown>

    expect(result.value).toBe(0x0102030405060708n)
  })

  it('should handle maximum u8 value', () => {
    const ksy = `
meta:
  id: test_u8_max
  endian: le
seq:
  - id: max_value
    type: u8
`
    // Maximum u8 value: 18446744073709551615 (2^64 - 1)
    const data = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])

    const result = parse(ksy, data) as Record<string, unknown>

    expect(result.max_value).toBe(18446744073709551615n)
  })

  it('should handle minimum s8 value', () => {
    const ksy = `
meta:
  id: test_s8_min
  endian: le
seq:
  - id: min_value
    type: s8
`
    // Minimum s8 value: -9223372036854775808 (-2^63)
    const data = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80])

    const result = parse(ksy, data) as Record<string, unknown>

    expect(result.min_value).toBe(-9223372036854775808n)
  })

  it('should serialize BigInt values to JSON strings', () => {
    const ksy = `
meta:
  id: test_bigint_json
  endian: le
seq:
  - id: value
    type: u8
`
    const data = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])

    const result = parse(ksy, data) as Record<string, unknown>

    // Test that JSON.stringify works with custom replacer
    const jsonReplacer = (_key: string, value: unknown): unknown => {
      if (typeof value === 'bigint') {
        return value.toString()
      }
      return value
    }

    const json = JSON.stringify(result, jsonReplacer)
    expect(json).toContain('"value":"18446744073709551615"')
    
    // Verify it doesn't throw
    expect(() => JSON.stringify(result, jsonReplacer)).not.toThrow()
  })
})
