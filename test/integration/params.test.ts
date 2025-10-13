/**
 * @fileoverview Tests for type parameterization
 * @module test/integration/params
 */

import { describe, it, expect } from 'vitest'
import { parse } from '../../src'

describe('Type Parameterization', () => {
  describe('Basic Parameters', () => {
    it('should pass integer parameter to custom type', () => {
      const schema = `
meta:
  id: test_params
seq:
  - id: header
    type: sized_block(10)
types:
  sized_block:
    params:
      - id: block_size
        type: u4
    seq:
      - id: data
        size: block_size
`
      const buffer = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
      ])

      const result = parse(schema, buffer) as Record<string, unknown>
      expect(result.header).toBeDefined()
      const header = result.header as Record<string, unknown>
      expect(header.data).toBeInstanceOf(Uint8Array)
      expect((header.data as Uint8Array).length).toBe(10)
    })

    it('should pass expression as parameter', () => {
      const schema = `
meta:
  id: test_expr_param
seq:
  - id: count
    type: u1
  - id: block
    type: sized_block(count * 2)
types:
  sized_block:
    params:
      - id: size
        type: u4
    seq:
      - id: data
        size: size
`
      const buffer = new Uint8Array([
        0x03, // count = 3
        0x01,
        0x02,
        0x03,
        0x04,
        0x05,
        0x06, // data (3 * 2 = 6 bytes)
      ])

      const result = parse(schema, buffer) as Record<string, unknown>
      expect(result.count).toBe(3)
      const block = result.block as Record<string, unknown>
      expect((block.data as Uint8Array).length).toBe(6)
    })

    it('should pass multiple parameters', () => {
      const schema = `
meta:
  id: test_multi_params
seq:
  - id: block
    type: multi_param_block(5, 3)
types:
  multi_param_block:
    params:
      - id: width
        type: u4
      - id: height
        type: u4
    seq:
      - id: data
        size: width * height
    instances:
      size:
        value: width * height
`
      const buffer = new Uint8Array(15).fill(0x42)

      const result = parse(schema, buffer) as Record<string, unknown>
      const block = result.block as Record<string, unknown>
      expect(block.size).toBe(15)
      expect((block.data as Uint8Array).length).toBe(15)
    })
  })

  describe('Parameters in Expressions', () => {
    it('should use parameters in size expressions', () => {
      const schema = `
meta:
  id: test_param_expr
seq:
  - id: item
    type: dynamic_item(8)
types:
  dynamic_item:
    params:
      - id: len
        type: u4
    seq:
      - id: header
        size: 2
      - id: body
        size: len - 2
`
      const buffer = new Uint8Array([
        0xaa, 0xbb, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
      ])

      const result = parse(schema, buffer) as Record<string, unknown>
      const item = result.item as Record<string, unknown>
      expect((item.header as Uint8Array).length).toBe(2)
      expect((item.body as Uint8Array).length).toBe(6)
    })

    it('should use parameters in conditional expressions', () => {
      const schema = `
meta:
  id: test_param_if
seq:
  - id: item
    type: conditional_item(true)
  - id: item2
    type: conditional_item(false)
types:
  conditional_item:
    params:
      - id: include_optional
        type: bool
    seq:
      - id: required
        type: u1
      - id: optional
        type: u1
        if: include_optional
`
      const buffer = new Uint8Array([0x01, 0x02, 0x03])

      const result = parse(schema, buffer) as Record<string, unknown>
      const item = result.item as Record<string, unknown>
      expect(item.required).toBe(1)
      expect(item.optional).toBe(2)

      const item2 = result.item2 as Record<string, unknown>
      expect(item2.required).toBe(3)
      expect(item2.optional).toBeUndefined()
    })

    it('should use parameters in repeat expressions', () => {
      const schema = `
meta:
  id: test_param_repeat
seq:
  - id: block
    type: repeated_block(3)
types:
  repeated_block:
    params:
      - id: count
        type: u4
    seq:
      - id: items
        type: u1
        repeat: expr
        repeat-expr: count
`
      const buffer = new Uint8Array([0x10, 0x20, 0x30])

      const result = parse(schema, buffer) as Record<string, unknown>
      const block = result.block as Record<string, unknown>
      expect(block.items).toEqual([0x10, 0x20, 0x30])
    })
  })

  describe('Nested Parameterized Types', () => {
    it('should pass parameters through nested types', () => {
      const schema = `
meta:
  id: test_nested_params
seq:
  - id: outer
    type: outer_type(4)
types:
  outer_type:
    params:
      - id: size
        type: u4
    seq:
      - id: inner
        type: inner_type(size)
  inner_type:
    params:
      - id: data_size
        type: u4
    seq:
      - id: data
        size: data_size
`
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04])

      const result = parse(schema, buffer) as Record<string, unknown>
      const outer = result.outer as Record<string, unknown>
      const inner = outer.inner as Record<string, unknown>
      expect((inner.data as Uint8Array).length).toBe(4)
    })

    it('should handle complex parameter expressions in nested types', () => {
      const schema = `
meta:
  id: test_complex_nested
seq:
  - id: container
    type: container_type(10, 2)
types:
  container_type:
    params:
      - id: total_size
        type: u4
      - id: header_size
        type: u4
    seq:
      - id: header
        size: header_size
      - id: body
        type: body_type(total_size - header_size)
  body_type:
    params:
      - id: body_size
        type: u4
    seq:
      - id: content
        size: body_size
`
      const buffer = new Uint8Array(10).fill(0x42)

      const result = parse(schema, buffer) as Record<string, unknown>
      const container = result.container as Record<string, unknown>
      expect((container.header as Uint8Array).length).toBe(2)
      const body = container.body as Record<string, unknown>
      expect((body.content as Uint8Array).length).toBe(8)
    })
  })

  describe('Parameters with Different Types', () => {
    it('should handle boolean parameters', () => {
      const schema = `
meta:
  id: test_bool_param
seq:
  - id: with_flag
    type: flagged_item(true)
  - id: without_flag
    type: flagged_item(false)
types:
  flagged_item:
    params:
      - id: has_flag
        type: bool
    seq:
      - id: value
        type: u1
      - id: flag
        type: u1
        if: has_flag
`
      const buffer = new Uint8Array([0x01, 0x02, 0x03])

      const result = parse(schema, buffer) as Record<string, unknown>
      const withFlag = result.with_flag as Record<string, unknown>
      expect(withFlag.value).toBe(1)
      expect(withFlag.flag).toBe(2)

      const withoutFlag = result.without_flag as Record<string, unknown>
      expect(withoutFlag.value).toBe(3)
      expect(withoutFlag.flag).toBeUndefined()
    })

    it('should handle string parameters', () => {
      const schema = `
meta:
  id: test_string_param
  encoding: UTF-8
seq:
  - id: item
    type: typed_item(5)
types:
  typed_item:
    params:
      - id: text_len
        type: u4
    seq:
      - id: text
        type: str
        size: text_len
        encoding: UTF-8
`
      const buffer = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]) // "Hello"

      const result = parse(schema, buffer) as Record<string, unknown>
      const item = result.item as Record<string, unknown>
      expect(item.text).toBe('Hello')
    })
  })

  describe('Parameters in Instances', () => {
    it('should use parameters in instance calculations', () => {
      const schema = `
meta:
  id: test_param_instance
seq:
  - id: block
    type: block_with_instance(100)
types:
  block_with_instance:
    params:
      - id: base_value
        type: u4
    seq:
      - id: offset
        type: u1
    instances:
      calculated:
        value: base_value + offset
`
      const buffer = new Uint8Array([0x05])

      const result = parse(schema, buffer) as Record<string, unknown>
      const block = result.block as Record<string, unknown>
      expect(block.offset).toBe(5)
      expect(block.calculated).toBe(105)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing parameters gracefully', () => {
      const schema = `
meta:
  id: test_missing_param
seq:
  - id: item
    type: param_type
types:
  param_type:
    params:
      - id: required_param
        type: u4
    seq:
      - id: data
        size: required_param
`
      const buffer = new Uint8Array([0x01, 0x02])

      // When no parameters are provided, param is undefined
      // This will cause an error when trying to use it as size
      const result = parse(schema, buffer) as Record<string, unknown>
      const item = result.item as Record<string, unknown>
      // undefined size results in reading 0 bytes
      expect(item.data).toBeDefined()
    })

    it('should handle parameter type mismatches', () => {
      const schema = `
meta:
  id: test_type_mismatch
seq:
  - id: item
    type: param_type("not_a_number")
types:
  param_type:
    params:
      - id: numeric_param
        type: u4
    seq:
      - id: data
        size: numeric_param
`
      const buffer = new Uint8Array([0x01, 0x02])

      // Should handle type conversion or throw appropriate error
      const result = parse(schema, buffer) as Record<string, unknown>
      expect(result).toBeDefined()
    })
  })

  describe('Real-World Scenarios', () => {
    it('should handle TLV (Type-Length-Value) with parameterized value type', () => {
      const schema = `
meta:
  id: tlv_container
seq:
  - id: items
    type: tlv_item
    repeat: eos
types:
  tlv_item:
    seq:
      - id: type_code
        type: u1
      - id: length
        type: u1
      - id: value
        type: tlv_value(length)
  tlv_value:
    params:
      - id: size
        type: u4
    seq:
      - id: data
        size: size
`
      const buffer = new Uint8Array([
        0x01,
        0x03,
        0xaa,
        0xbb,
        0xcc, // TLV 1: type=1, len=3, data=AA BB CC
        0x02,
        0x02,
        0xdd,
        0xee, // TLV 2: type=2, len=2, data=DD EE
      ])

      const result = parse(schema, buffer) as Record<string, unknown>
      const items = result.items as Array<Record<string, unknown>>
      expect(items).toHaveLength(2)
      expect(items[0].type_code).toBe(1)
      expect(items[0].length).toBe(3)
      const value1 = items[0].value as Record<string, unknown>
      expect((value1.data as Uint8Array).length).toBe(3)

      expect(items[1].type_code).toBe(2)
      expect(items[1].length).toBe(2)
      const value2 = items[1].value as Record<string, unknown>
      expect((value2.data as Uint8Array).length).toBe(2)
    })

    it('should handle matrix/grid with parameterized dimensions', () => {
      const schema = `
meta:
  id: matrix
seq:
  - id: width
    type: u1
  - id: height
    type: u1
  - id: grid
    type: grid_data(width, height)
types:
  grid_data:
    params:
      - id: w
        type: u4
      - id: h
        type: u4
    seq:
      - id: cells
        type: u1
        repeat: expr
        repeat-expr: w * h
`
      const buffer = new Uint8Array([
        0x03,
        0x02, // 3x2 grid
        0x01,
        0x02,
        0x03,
        0x04,
        0x05,
        0x06, // 6 cells
      ])

      const result = parse(schema, buffer) as Record<string, unknown>
      expect(result.width).toBe(3)
      expect(result.height).toBe(2)
      const grid = result.grid as Record<string, unknown>
      expect(grid.cells).toEqual([1, 2, 3, 4, 5, 6])
    })
  })
})
