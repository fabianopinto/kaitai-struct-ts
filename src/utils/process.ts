/**
 * @fileoverview Data processing utilities for Kaitai Struct
 * @module utils/process
 * @author Fabiano Pinto
 * @license MIT
 */

import { ParseError } from './errors'
import { inflate } from 'pako'

/**
 * Process algorithms supported by Kaitai Struct.
 * These transform data before parsing (decompression, decryption, etc.)
 */
export type ProcessAlgorithm =
  | 'zlib'
  | 'xor'
  | 'rol'
  | 'ror'
  | 'bswap2'
  | 'bswap4'
  | 'bswap8'
  | 'bswap16'

/**
 * Process specification - can be a string or object with parameters.
 */
export interface ProcessSpec {
  /** Algorithm name */
  algorithm?: string
  /** XOR key (for xor algorithm) */
  key?: number | number[]
  /** Rotation amount (for rol/ror algorithms) */
  amount?: number
  /** Group size (for rol/ror algorithms) */
  group?: number
}

/**
 * Apply processing transformation to data.
 *
 * @param data - Input data to process
 * @param process - Processing specification (string or object)
 * @returns Processed data
 * @throws {ParseError} If processing fails or algorithm is unknown
 *
 * @example
 * ```typescript
 * // XOR with single byte key
 * const decrypted = applyProcess(encrypted, { algorithm: 'xor', key: 0xFF })
 *
 * // Zlib decompression
 * const decompressed = applyProcess(compressed, 'zlib')
 *
 * // Rotate left by 3 bits
 * const rotated = applyProcess(data, { algorithm: 'rol', amount: 3 })
 * ```
 */
export function applyProcess(
  data: Uint8Array,
  process: string | ProcessSpec
): Uint8Array {
  // Parse process specification
  const spec: ProcessSpec =
    typeof process === 'string' ? { algorithm: process } : process

  const algorithm = spec.algorithm

  if (!algorithm) {
    throw new ParseError('Process specification missing algorithm')
  }

  switch (algorithm) {
    case 'zlib':
      return processZlib(data)

    case 'xor':
      return processXor(data, spec.key)

    case 'rol':
      return processRol(data, spec.amount, spec.group)

    case 'ror':
      return processRor(data, spec.amount, spec.group)

    case 'bswap2':
      return processByteswap(data, 2)

    case 'bswap4':
      return processByteswap(data, 4)

    case 'bswap8':
      return processByteswap(data, 8)

    case 'bswap16':
      return processByteswap(data, 16)

    default:
      throw new ParseError(
        `Unknown process algorithm: ${algorithm}. ` +
          `Supported: zlib, xor, rol, ror, bswap2, bswap4, bswap8, bswap16`
      )
  }
}

/**
 * Decompress data using zlib/deflate algorithm.
 *
 * @param data - Compressed data
 * @returns Decompressed data
 * @throws {ParseError} If decompression fails
 * @private
 */
function processZlib(data: Uint8Array): Uint8Array {
  try {
    return inflate(data)
  } catch (error) {
    throw new ParseError(
      `Zlib decompression failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * XOR data with a key.
 * Supports single-byte key or multi-byte key (repeated cyclically).
 *
 * @param data - Input data
 * @param key - XOR key (number or array of numbers)
 * @returns XORed data
 * @throws {ParseError} If key is invalid
 * @private
 */
function processXor(
  data: Uint8Array,
  key: number | number[] | undefined
): Uint8Array {
  if (key === undefined) {
    throw new ParseError('XOR process requires a key parameter')
  }

  const result = new Uint8Array(data.length)
  const keyBytes = Array.isArray(key) ? key : [key]

  if (keyBytes.length === 0) {
    throw new ParseError('XOR key cannot be empty')
  }

  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length]
  }

  return result
}

/**
 * Rotate bits left (ROL).
 * Rotates each byte or group of bytes left by the specified amount.
 *
 * @param data - Input data
 * @param amount - Number of bits to rotate (default: 1)
 * @param group - Group size in bytes (default: 1)
 * @returns Rotated data
 * @throws {ParseError} If parameters are invalid
 * @private
 */
function processRol(
  data: Uint8Array,
  amount: number | undefined,
  group: number | undefined
): Uint8Array {
  const bits = amount ?? 1
  const groupSize = group ?? 1

  if (bits < 0) {
    throw new ParseError('ROL amount must be non-negative')
  }

  if (groupSize < 1) {
    throw new ParseError('ROL group size must be at least 1')
  }

  if (data.length % groupSize !== 0) {
    throw new ParseError(
      `Data length ${data.length} is not aligned to group size ${groupSize}`
    )
  }

  const result = new Uint8Array(data.length)

  // For single-byte groups, use optimized byte-level rotation
  if (groupSize === 1) {
    const normalizedBits = bits % 8
    for (let i = 0; i < data.length; i++) {
      const byte = data[i]
      result[i] =
        ((byte << normalizedBits) | (byte >> (8 - normalizedBits))) & 0xff
    }
    return result
  }

  // For multi-byte groups, rotate bits across the entire group
  const totalBits = groupSize * 8
  const normalizedBits = bits % totalBits

  for (let groupStart = 0; groupStart < data.length; groupStart += groupSize) {
    // Read the group as a big integer (bit array)
    const groupBits: number[] = []
    for (let i = 0; i < groupSize; i++) {
      const byte = data[groupStart + i]
      for (let bit = 7; bit >= 0; bit--) {
        groupBits.push((byte >> bit) & 1)
      }
    }

    // Rotate the bits
    const rotatedBits = [
      ...groupBits.slice(normalizedBits),
      ...groupBits.slice(0, normalizedBits),
    ]

    // Write back to result
    for (let i = 0; i < groupSize; i++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        byte = (byte << 1) | rotatedBits[i * 8 + bit]
      }
      result[groupStart + i] = byte
    }
  }

  return result
}

/**
 * Rotate bits right (ROR).
 * Rotates each byte or group of bytes right by the specified amount.
 *
 * @param data - Input data
 * @param amount - Number of bits to rotate (default: 1)
 * @param group - Group size in bytes (default: 1)
 * @returns Rotated data
 * @throws {ParseError} If parameters are invalid
 * @private
 */
function processRor(
  data: Uint8Array,
  amount: number | undefined,
  group: number | undefined
): Uint8Array {
  const bits = amount ?? 1
  const groupSize = group ?? 1

  if (bits < 0) {
    throw new ParseError('ROR amount must be non-negative')
  }

  if (groupSize < 1) {
    throw new ParseError('ROR group size must be at least 1')
  }

  if (data.length % groupSize !== 0) {
    throw new ParseError(
      `Data length ${data.length} is not aligned to group size ${groupSize}`
    )
  }

  const result = new Uint8Array(data.length)

  // For single-byte groups, use optimized byte-level rotation
  if (groupSize === 1) {
    const normalizedBits = bits % 8
    for (let i = 0; i < data.length; i++) {
      const byte = data[i]
      result[i] =
        ((byte >> normalizedBits) | (byte << (8 - normalizedBits))) & 0xff
    }
    return result
  }

  // For multi-byte groups, rotate bits across the entire group
  const totalBits = groupSize * 8
  const normalizedBits = bits % totalBits

  for (let groupStart = 0; groupStart < data.length; groupStart += groupSize) {
    // Read the group as a big integer (bit array)
    const groupBits: number[] = []
    for (let i = 0; i < groupSize; i++) {
      const byte = data[groupStart + i]
      for (let bit = 7; bit >= 0; bit--) {
        groupBits.push((byte >> bit) & 1)
      }
    }

    // Rotate the bits (right rotation = move bits from end to start)
    const rotatedBits = [
      ...groupBits.slice(totalBits - normalizedBits),
      ...groupBits.slice(0, totalBits - normalizedBits),
    ]

    // Write back to result
    for (let i = 0; i < groupSize; i++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        byte = (byte << 1) | rotatedBits[i * 8 + bit]
      }
      result[groupStart + i] = byte
    }
  }

  return result
}

/**
 * Byte swap (reverse byte order in groups).
 * Swaps bytes within groups of the specified size.
 *
 * @param data - Input data
 * @param groupSize - Size of groups to swap (2, 4, 8, or 16 bytes)
 * @returns Byte-swapped data
 * @throws {ParseError} If group size is invalid or data length is not aligned
 * @private
 */
function processByteswap(data: Uint8Array, groupSize: number): Uint8Array {
  if (![2, 4, 8, 16].includes(groupSize)) {
    throw new ParseError(
      `Invalid byteswap group size: ${groupSize}. Must be 2, 4, 8, or 16`
    )
  }

  if (data.length % groupSize !== 0) {
    throw new ParseError(
      `Data length ${data.length} is not aligned to group size ${groupSize}`
    )
  }

  const result = new Uint8Array(data.length)

  for (let i = 0; i < data.length; i += groupSize) {
    for (let j = 0; j < groupSize; j++) {
      result[i + j] = data[i + groupSize - 1 - j]
    }
  }

  return result
}
