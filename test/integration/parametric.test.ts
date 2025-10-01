/**
 * @fileoverview Integration tests for parametric types
 */

import { describe, it, expect } from 'vitest'
import { parse } from '../../src'

describe('Parametric Types Integration Tests', () => {
  describe('basic parametric types', () => {
    it('should pass parameters to types', () => {
      const ksy = `
meta:
  id: parametric_test
  endian: le
seq:
  - id: count
    type: u1
  - id: data
    type: sized_block(count)
types:
  sized_block:
    params:
      - id: size
        type: u1
    seq:
      - id: values
        type: u1
        repeat: expr
        repeat-expr: size
`
      const buffer = new Uint8Array([3, 10, 20, 30])
      const result = parse(ksy, buffer)

      expect(result.count).toBe(3)
      expect(result.data).toHaveProperty('values')
      expect((result.data as any).values).toEqual([10, 20, 30])
    })

    it('should support multiple parameters', () => {
      const ksy = `
meta:
  id: multi_param_test
  endian: le
seq:
  - id: width
    type: u1
  - id: height
    type: u1
  - id: grid
    type: grid_block(width, height)
types:
  grid_block:
    params:
      - id: w
        type: u1
      - id: h
        type: u1
    seq:
      - id: total_size
        value: w * h
      - id: cells
        type: u1
        repeat: expr
        repeat-expr: w * h
`
      const buffer = new Uint8Array([2, 3, 1, 2, 3, 4, 5, 6])
      const result = parse(ksy, buffer)

      expect(result.width).toBe(2)
      expect(result.height).toBe(3)
      expect((result.data as any).total_size).toBe(6)
      expect((result.data as any).cells).toEqual([1, 2, 3, 4, 5, 6])
    })
  })

  describe('parameters with expressions', () => {
    it('should evaluate expressions in type-args', () => {
      const ksy = `
meta:
  id: expr_param_test
  endian: le
seq:
  - id: base
    type: u1
  - id: data
    type: sized_block(base * 2)
types:
  sized_block:
    params:
      - id: size
        type: u1
    seq:
      - id: values
        type: u1
        repeat: expr
        repeat-expr: size
`
      const buffer = new Uint8Array([2, 10, 20, 30, 40])
      const result = parse(ksy, buffer)

      expect(result.base).toBe(2)
      expect((result.data as any).values).toEqual([10, 20, 30, 40])
    })
  })

  describe('nested parametric types', () => {
    it('should handle parametric types within parametric types', () => {
      const ksy = `
meta:
  id: nested_param_test
  endian: le
seq:
  - id: outer_size
    type: u1
  - id: inner_size
    type: u1
  - id: data
    type: outer_block(outer_size, inner_size)
types:
  outer_block:
    params:
      - id: osize
        type: u1
      - id: isize
        type: u1
    seq:
      - id: blocks
        type: inner_block(isize)
        repeat: expr
        repeat-expr: osize
  inner_block:
    params:
      - id: size
        type: u1
    seq:
      - id: values
        type: u1
        repeat: expr
        repeat-expr: size
`
      const buffer = new Uint8Array([2, 2, 1, 2, 3, 4])
      const result = parse(ksy, buffer)

      expect(result.outer_size).toBe(2)
      expect(result.inner_size).toBe(2)
      expect((result.data as any).blocks).toHaveLength(2)
      expect((result.data as any).blocks[0].values).toEqual([1, 2])
      expect((result.data as any).blocks[1].values).toEqual([3, 4])
    })
  })
})
