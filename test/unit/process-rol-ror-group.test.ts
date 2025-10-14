/**
 * @fileoverview Tests for ROL/ROR with group size > 1
 * @module test/unit/process-rol-ror-group
 */

import { describe, it, expect } from 'vitest'
import { applyProcess } from '../../src/utils/process'

describe('ROL/ROR with Group Size > 1', () => {
  describe('ROL (Rotate Left) with multi-byte groups', () => {
    it('should rotate 2-byte groups left by 1 bit', () => {
      // Input: [0x12, 0x34] = 0001_0010 0011_0100
      // ROL 1: [0x24, 0x68] = 0010_0100 0110_1000
      const input = new Uint8Array([0x12, 0x34])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 1,
        group: 2,
      })
      expect(result).toEqual(new Uint8Array([0x24, 0x68]))
    })

    it('should rotate 2-byte groups left by 4 bits', () => {
      // Input: [0x12, 0x34] = 0001_0010 0011_0100
      // ROL 4: [0x23, 0x41] = 0010_0011 0100_0001
      const input = new Uint8Array([0x12, 0x34])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 4,
        group: 2,
      })
      expect(result).toEqual(new Uint8Array([0x23, 0x41]))
    })

    it('should rotate 2-byte groups left by 8 bits (full byte)', () => {
      // Input: [0x12, 0x34] = 0001_0010 0011_0100
      // ROL 8: [0x34, 0x12] = 0011_0100 0001_0010 (bytes swapped)
      const input = new Uint8Array([0x12, 0x34])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 8,
        group: 2,
      })
      expect(result).toEqual(new Uint8Array([0x34, 0x12]))
    })

    it('should rotate 4-byte groups left by 1 bit', () => {
      // Input: [0x12, 0x34, 0x56, 0x78]
      const input = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 1,
        group: 4,
      })
      // ROL 1: shift all bits left by 1, wrapping the MSB to LSB
      expect(result).toEqual(new Uint8Array([0x24, 0x68, 0xac, 0xf0]))
    })

    it('should handle multiple groups', () => {
      // Two 2-byte groups
      const input = new Uint8Array([0x12, 0x34, 0xab, 0xcd])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 4,
        group: 2,
      })
      expect(result).toEqual(new Uint8Array([0x23, 0x41, 0xbc, 0xda]))
    })

    it('should normalize rotation amount > group bit size', () => {
      // 2 bytes = 16 bits, ROL 17 = ROL 1
      const input = new Uint8Array([0x12, 0x34])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 17,
        group: 2,
      })
      const expected = applyProcess(input, {
        algorithm: 'rol',
        amount: 1,
        group: 2,
      })
      expect(result).toEqual(expected)
    })

    it('should handle ROL by 0 (no change)', () => {
      const input = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 0,
        group: 2,
      })
      expect(result).toEqual(input)
    })
  })

  describe('ROR (Rotate Right) with multi-byte groups', () => {
    it('should rotate 2-byte groups right by 1 bit', () => {
      // Input: [0x12, 0x34] = 0001_0010 0011_0100
      // ROR 1: [0x09, 0x1a] = 0000_1001 0001_1010
      const input = new Uint8Array([0x12, 0x34])
      const result = applyProcess(input, {
        algorithm: 'ror',
        amount: 1,
        group: 2,
      })
      expect(result).toEqual(new Uint8Array([0x09, 0x1a]))
    })

    it('should rotate 2-byte groups right by 4 bits', () => {
      // Input: [0x12, 0x34] = 0001_0010 0011_0100
      // ROR 4: [0x41, 0x23] = 0100_0001 0010_0011
      const input = new Uint8Array([0x12, 0x34])
      const result = applyProcess(input, {
        algorithm: 'ror',
        amount: 4,
        group: 2,
      })
      expect(result).toEqual(new Uint8Array([0x41, 0x23]))
    })

    it('should rotate 2-byte groups right by 8 bits (full byte)', () => {
      // Input: [0x12, 0x34] = 0001_0010 0011_0100
      // ROR 8: [0x34, 0x12] = 0011_0100 0001_0010 (bytes swapped)
      const input = new Uint8Array([0x12, 0x34])
      const result = applyProcess(input, {
        algorithm: 'ror',
        amount: 8,
        group: 2,
      })
      expect(result).toEqual(new Uint8Array([0x34, 0x12]))
    })

    it('should rotate 4-byte groups right by 1 bit', () => {
      // Input: [0x12, 0x34, 0x56, 0x78]
      const input = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const result = applyProcess(input, {
        algorithm: 'ror',
        amount: 1,
        group: 4,
      })
      // ROR 1: shift all bits right by 1, wrapping the LSB to MSB
      expect(result).toEqual(new Uint8Array([0x09, 0x1a, 0x2b, 0x3c]))
    })

    it('should handle multiple groups', () => {
      // Two 2-byte groups
      const input = new Uint8Array([0x12, 0x34, 0xab, 0xcd])
      const result = applyProcess(input, {
        algorithm: 'ror',
        amount: 4,
        group: 2,
      })
      expect(result).toEqual(new Uint8Array([0x41, 0x23, 0xda, 0xbc]))
    })

    it('should normalize rotation amount > group bit size', () => {
      // 2 bytes = 16 bits, ROR 17 = ROR 1
      const input = new Uint8Array([0x12, 0x34])
      const result = applyProcess(input, {
        algorithm: 'ror',
        amount: 17,
        group: 2,
      })
      const expected = applyProcess(input, {
        algorithm: 'ror',
        amount: 1,
        group: 2,
      })
      expect(result).toEqual(expected)
    })

    it('should handle ROR by 0 (no change)', () => {
      const input = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const result = applyProcess(input, {
        algorithm: 'ror',
        amount: 0,
        group: 2,
      })
      expect(result).toEqual(input)
    })
  })

  describe('ROL/ROR relationship', () => {
    it('should satisfy: ROL(n) = ROR(group_bits - n)', () => {
      const input = new Uint8Array([0x12, 0x34])
      // const groupBits = 16 // 2 bytes * 8 bits

      const rol4 = applyProcess(input, {
        algorithm: 'rol',
        amount: 4,
        group: 2,
      })
      const ror12 = applyProcess(input, {
        algorithm: 'ror',
        amount: 12,
        group: 2,
      })

      expect(rol4).toEqual(ror12)
    })

    it('should be reversible: ROR(ROL(data, n), n) = data', () => {
      const input = new Uint8Array([0x12, 0x34, 0x56, 0x78])

      const rotated = applyProcess(input, {
        algorithm: 'rol',
        amount: 5,
        group: 2,
      })
      const restored = applyProcess(rotated, {
        algorithm: 'ror',
        amount: 5,
        group: 2,
      })

      expect(restored).toEqual(input)
    })
  })

  describe('Error handling', () => {
    it('should throw error if data length not aligned to group size', () => {
      const input = new Uint8Array([0x12, 0x34, 0x56]) // 3 bytes, not aligned to 2
      expect(() =>
        applyProcess(input, { algorithm: 'rol', amount: 1, group: 2 })
      ).toThrow('Data length 3 is not aligned to group size 2')
    })

    it('should throw error for negative rotation amount', () => {
      const input = new Uint8Array([0x12, 0x34])
      expect(() =>
        applyProcess(input, { algorithm: 'rol', amount: -1, group: 2 })
      ).toThrow('ROL amount must be non-negative')
    })

    it('should throw error for invalid group size', () => {
      const input = new Uint8Array([0x12, 0x34])
      expect(() =>
        applyProcess(input, { algorithm: 'rol', amount: 1, group: 0 })
      ).toThrow('ROL group size must be at least 1')
    })
  })

  describe('Edge cases', () => {
    it('should handle single-byte data with group size 1', () => {
      const input = new Uint8Array([0xff])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 1,
        group: 1,
      })
      expect(result).toEqual(new Uint8Array([0xff])) // All 1s, rotation doesn't change
    })

    it('should handle all zeros', () => {
      const input = new Uint8Array([0x00, 0x00, 0x00, 0x00])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 5,
        group: 2,
      })
      expect(result).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00]))
    })

    it('should handle all ones', () => {
      const input = new Uint8Array([0xff, 0xff])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 3,
        group: 2,
      })
      expect(result).toEqual(new Uint8Array([0xff, 0xff]))
    })

    it('should handle large group sizes', () => {
      const input = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      ])
      const result = applyProcess(input, {
        algorithm: 'rol',
        amount: 8,
        group: 8,
      })
      // ROL by 8 bits should shift all bytes left by 1 position
      expect(result).toEqual(
        new Uint8Array([0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x01])
      )
    })
  })
})
