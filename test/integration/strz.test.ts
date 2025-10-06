import { describe, it, expect } from 'vitest'
import { parse } from '../../src/index'

describe('strz type', () => {
  it('should parse null-terminated string', () => {
    const ksy = `
meta:
  id: test_strz
  endian: le
seq:
  - id: name
    type: strz
  - id: value
    type: u2
`
    // "Hello\0" + 0x2A00 (42 in little-endian)
    const data = new Uint8Array([
      0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, // "Hello\0"
      0x2a, 0x00, // 42
    ])

    const result = parse(ksy, data) as Record<string, unknown>

    expect(result.name).toBe('Hello')
    expect(result.value).toBe(42)
  })

  it('should parse multiple null-terminated strings', () => {
    const ksy = `
meta:
  id: test_multiple_strz
  endian: le
seq:
  - id: first
    type: strz
  - id: second
    type: strz
  - id: third
    type: strz
`
    // "foo\0bar\0baz\0"
    const data = new Uint8Array([
      0x66, 0x6f, 0x6f, 0x00, // "foo\0"
      0x62, 0x61, 0x72, 0x00, // "bar\0"
      0x62, 0x61, 0x7a, 0x00, // "baz\0"
    ])

    const result = parse(ksy, data) as Record<string, unknown>

    expect(result.first).toBe('foo')
    expect(result.second).toBe('bar')
    expect(result.third).toBe('baz')
  })

  it('should parse empty null-terminated string', () => {
    const ksy = `
meta:
  id: test_empty_strz
seq:
  - id: empty
    type: strz
  - id: after
    type: u1
`
    // "\0" + 0xFF
    const data = new Uint8Array([0x00, 0xff])

    const result = parse(ksy, data) as Record<string, unknown>

    expect(result.empty).toBe('')
    expect(result.after).toBe(255)
  })

  it('should respect encoding', () => {
    const ksy = `
meta:
  id: test_strz_encoding
  encoding: ASCII
seq:
  - id: text
    type: strz
`
    // "test\0"
    const data = new Uint8Array([0x74, 0x65, 0x73, 0x74, 0x00])

    const result = parse(ksy, data) as Record<string, unknown>

    expect(result.text).toBe('test')
  })
})
