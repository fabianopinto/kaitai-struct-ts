/**
 * @fileoverview Tests for data processing utilities
 * @module test/unit/process
 */

import { describe, it, expect } from 'vitest'
import { applyProcess } from '../../src/utils/process'
import { deflate } from 'pako'

describe('Process Utilities', () => {
  describe('XOR Processing', () => {
    it('should XOR with single byte key', () => {
      const data = new Uint8Array([0x00, 0x11, 0x22, 0x33])
      const result = applyProcess(data, { algorithm: 'xor', key: 0xff })
      expect(result).toEqual(new Uint8Array([0xff, 0xee, 0xdd, 0xcc]))
    })

    it('should XOR with multi-byte key', () => {
      const data = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44])
      const result = applyProcess(data, { algorithm: 'xor', key: [0xaa, 0xbb] })
      expect(result).toEqual(new Uint8Array([0xaa, 0xaa, 0x88, 0x88, 0xee]))
    })

    it('should throw if XOR key is missing', () => {
      const data = new Uint8Array([0x00])
      expect(() => applyProcess(data, { algorithm: 'xor' })).toThrow(
        'XOR process requires a key parameter'
      )
    })

    it('should throw if XOR key is empty array', () => {
      const data = new Uint8Array([0x00])
      expect(() => applyProcess(data, { algorithm: 'xor', key: [] })).toThrow(
        'XOR key cannot be empty'
      )
    })

    it('should handle XOR with string algorithm', () => {
      // When using string format, key must be provided separately
      const data = new Uint8Array([0x00, 0xff])
      expect(() => applyProcess(data, 'xor')).toThrow(
        'XOR process requires a key parameter'
      )
    })
  })

  describe('ROL (Rotate Left)', () => {
    it('should rotate left by 1 bit', () => {
      const data = new Uint8Array([0b10000001, 0b01000000])
      const result = applyProcess(data, { algorithm: 'rol', amount: 1 })
      expect(result).toEqual(new Uint8Array([0b00000011, 0b10000000]))
    })

    it('should rotate left by 3 bits', () => {
      const data = new Uint8Array([0b10000001])
      const result = applyProcess(data, { algorithm: 'rol', amount: 3 })
      expect(result).toEqual(new Uint8Array([0b00001100]))
    })

    it('should rotate left by 7 bits', () => {
      const data = new Uint8Array([0b10000001])
      const result = applyProcess(data, { algorithm: 'rol', amount: 7 })
      expect(result).toEqual(new Uint8Array([0b11000000]))
    })

    it('should default to 1 bit rotation', () => {
      const data = new Uint8Array([0b10000001])
      const result = applyProcess(data, 'rol')
      expect(result).toEqual(new Uint8Array([0b00000011]))
    })

    it('should normalize rotation amount > 8 for single-byte groups', () => {
      // ROL 8 on single byte = ROL 0 (no change)
      const data = new Uint8Array([0b10101010])
      const result = applyProcess(data, { algorithm: 'rol', amount: 8 })
      expect(result).toEqual(new Uint8Array([0b10101010]))
    })

    it('should throw on negative rotation amount', () => {
      const data = new Uint8Array([0x00])
      expect(() =>
        applyProcess(data, { algorithm: 'rol', amount: -1 })
      ).toThrow('ROL amount must be non-negative')
    })
  })

  describe('ROR (Rotate Right)', () => {
    it('should rotate right by 1 bit', () => {
      const data = new Uint8Array([0b10000001, 0b00000010])
      const result = applyProcess(data, { algorithm: 'ror', amount: 1 })
      expect(result).toEqual(new Uint8Array([0b11000000, 0b00000001]))
    })

    it('should rotate right by 3 bits', () => {
      const data = new Uint8Array([0b10000001])
      const result = applyProcess(data, { algorithm: 'ror', amount: 3 })
      expect(result).toEqual(new Uint8Array([0b00110000]))
    })

    it('should default to 1 bit rotation', () => {
      const data = new Uint8Array([0b10000001])
      const result = applyProcess(data, 'ror')
      expect(result).toEqual(new Uint8Array([0b11000000]))
    })

    it('should throw on negative rotation amount', () => {
      const data = new Uint8Array([0x00])
      expect(() =>
        applyProcess(data, { algorithm: 'ror', amount: -1 })
      ).toThrow('ROR amount must be non-negative')
    })
  })

  describe('Byte Swap', () => {
    it('should swap 2-byte groups (bswap2)', () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const result = applyProcess(data, 'bswap2')
      expect(result).toEqual(new Uint8Array([0x34, 0x12, 0x78, 0x56]))
    })

    it('should swap 4-byte groups (bswap4)', () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const result = applyProcess(data, 'bswap4')
      expect(result).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]))
    })

    it('should swap 8-byte groups (bswap8)', () => {
      const data = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      ])
      const result = applyProcess(data, 'bswap8')
      expect(result).toEqual(
        new Uint8Array([0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01])
      )
    })

    it('should swap 16-byte groups (bswap16)', () => {
      const data = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
        0x0d, 0x0e, 0x0f, 0x10,
      ])
      const result = applyProcess(data, 'bswap16')
      expect(result).toEqual(
        new Uint8Array([
          0x10, 0x0f, 0x0e, 0x0d, 0x0c, 0x0b, 0x0a, 0x09, 0x08, 0x07, 0x06,
          0x05, 0x04, 0x03, 0x02, 0x01,
        ])
      )
    })

    it('should throw if data length is not aligned', () => {
      const data = new Uint8Array([0x12, 0x34, 0x56])
      expect(() => applyProcess(data, 'bswap2')).toThrow(
        'Data length 3 is not aligned to group size 2'
      )
    })
  })

  describe('Zlib Decompression', () => {
    it('should decompress zlib data', () => {
      const original = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]) // "Hello"
      const compressed = deflate(original)
      const result = applyProcess(compressed, 'zlib')
      expect(result).toEqual(original)
    })

    it('should decompress larger zlib data', () => {
      const original = new Uint8Array(1000).fill(0x42)
      const compressed = deflate(original)
      const result = applyProcess(compressed, 'zlib')
      expect(result).toEqual(original)
    })

    it('should throw on invalid zlib data', () => {
      const invalid = new Uint8Array([0x00, 0x01, 0x02])
      expect(() => applyProcess(invalid, 'zlib')).toThrow(
        'Zlib decompression failed'
      )
    })
  })

  describe('Error Handling', () => {
    it('should throw on unknown algorithm', () => {
      const data = new Uint8Array([0x00])
      expect(() => applyProcess(data, 'unknown')).toThrow(
        'Unknown process algorithm: unknown'
      )
    })

    it('should throw on missing algorithm in object spec', () => {
      const data = new Uint8Array([0x00])
      expect(() => applyProcess(data, {})).toThrow(
        'Process specification missing algorithm'
      )
    })
  })

  describe('Real-World Scenarios', () => {
    it('should handle encrypted and compressed data', () => {
      // Simulate: compress -> XOR encrypt
      const original = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])
      const compressed = deflate(original)
      const encrypted = applyProcess(compressed, {
        algorithm: 'xor',
        key: 0xaa,
      })

      // Decrypt -> decompress
      const decrypted = applyProcess(encrypted, { algorithm: 'xor', key: 0xaa })
      const decompressed = applyProcess(decrypted, 'zlib')

      expect(decompressed).toEqual(original)
    })

    it('should handle byte-swapped data', () => {
      // Little-endian to big-endian conversion
      const leData = new Uint8Array([0x78, 0x56, 0x34, 0x12]) // 0x12345678 in LE
      const beData = applyProcess(leData, 'bswap4')
      expect(beData).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]))
    })

    it('should handle rotated obfuscated data', () => {
      const obfuscated = new Uint8Array([0b11000000, 0b10100000])
      const deobfuscated = applyProcess(obfuscated, {
        algorithm: 'ror',
        amount: 2,
      })
      expect(deobfuscated).toEqual(new Uint8Array([0b00110000, 0b00101000]))
    })
  })
})
