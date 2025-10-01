/**
 * @fileoverview Binary stream reader for Kaitai Struct
 * @module stream/KaitaiStream
 * @author Fabiano Pinto
 * @license MIT
 */

import { EOFError } from '../utils/errors'
import { decodeString } from '../utils/encoding'

/**
 * KaitaiStream provides methods for reading binary data with proper type handling
 * and endianness support. It's the core class for parsing binary formats.
 * 
 * Supports reading:
 * - Unsigned integers (u1, u2, u4, u8) in both little and big endian
 * - Signed integers (s1, s2, s4, s8) in both little and big endian
 * - Floating point numbers (f4, f8) in both little and big endian
 * - Byte arrays (fixed length, until terminator, or all remaining)
 * - Strings with various encodings
 * - Bit-level data
 * 
 * @class KaitaiStream
 * @example
 * ```typescript
 * const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04])
 * const stream = new KaitaiStream(buffer)
 * 
 * const byte = stream.readU1()           // Read 1 byte
 * const word = stream.readU2le()         // Read 2 bytes little-endian
 * const str = stream.readStr(5, 'UTF-8') // Read 5-byte string
 * ```
 */
export class KaitaiStream {
  private buffer: Uint8Array
  private view: DataView
  private _pos: number = 0
  private _bits: number = 0
  private _bitsLeft: number = 0

  /**
   * Create a new KaitaiStream from a buffer
   * @param buffer - ArrayBuffer or Uint8Array containing the binary data
   */
  constructor(buffer: ArrayBuffer | Uint8Array) {
    if (buffer instanceof ArrayBuffer) {
      this.buffer = new Uint8Array(buffer)
      this.view = new DataView(buffer)
    } else {
      this.buffer = buffer
      this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    }
  }

  /**
   * Current position in the stream
   */
  get pos(): number {
    return this._pos
  }

  set pos(value: number) {
    this._pos = value
    this._bitsLeft = 0 // Reset bit reading when seeking
  }

  /**
   * Total size of the stream in bytes
   */
  get size(): number {
    return this.buffer.length
  }

  /**
   * Check if we've reached the end of the stream
   */
  isEof(): boolean {
    return this._pos >= this.buffer.length
  }

  /**
   * Seek to a specific position in the stream
   * @param pos - Position to seek to
   */
  seek(pos: number): void {
    if (pos < 0 || pos > this.buffer.length) {
      throw new Error(`Invalid seek position: ${pos}`)
    }
    this.pos = pos
  }

  /**
   * Ensure we have enough bytes available
   * @param count - Number of bytes needed
   */
  private ensureBytes(count: number): void {
    if (this._pos + count > this.buffer.length) {
      throw new EOFError(
        `Requested ${count} bytes at position ${this._pos}, but only ${
          this.buffer.length - this._pos
        } bytes available`,
        this._pos
      )
    }
  }

  // ==================== Unsigned Integers ====================

  /**
   * Read 1-byte unsigned integer (0 to 255)
   */
  readU1(): number {
    this.ensureBytes(1)
    return this.buffer[this._pos++]
  }

  /**
   * Read 2-byte unsigned integer, little-endian
   */
  readU2le(): number {
    this.ensureBytes(2)
    const value = this.view.getUint16(this._pos, true)
    this._pos += 2
    return value
  }

  /**
   * Read 2-byte unsigned integer, big-endian
   */
  readU2be(): number {
    this.ensureBytes(2)
    const value = this.view.getUint16(this._pos, false)
    this._pos += 2
    return value
  }

  /**
   * Read 4-byte unsigned integer, little-endian
   */
  readU4le(): number {
    this.ensureBytes(4)
    const value = this.view.getUint32(this._pos, true)
    this._pos += 4
    return value
  }

  /**
   * Read 4-byte unsigned integer, big-endian
   */
  readU4be(): number {
    this.ensureBytes(4)
    const value = this.view.getUint32(this._pos, false)
    this._pos += 4
    return value
  }

  /**
   * Read 8-byte unsigned integer, little-endian
   * Returns BigInt for values > Number.MAX_SAFE_INTEGER
   */
  readU8le(): bigint {
    this.ensureBytes(8)
    const value = this.view.getBigUint64(this._pos, true)
    this._pos += 8
    return value
  }

  /**
   * Read 8-byte unsigned integer, big-endian
   * Returns BigInt for values > Number.MAX_SAFE_INTEGER
   */
  readU8be(): bigint {
    this.ensureBytes(8)
    const value = this.view.getBigUint64(this._pos, false)
    this._pos += 8
    return value
  }

  // ==================== Signed Integers ====================

  /**
   * Read 1-byte signed integer (-128 to 127)
   */
  readS1(): number {
    this.ensureBytes(1)
    return this.view.getInt8(this._pos++)
  }

  /**
   * Read 2-byte signed integer, little-endian
   */
  readS2le(): number {
    this.ensureBytes(2)
    const value = this.view.getInt16(this._pos, true)
    this._pos += 2
    return value
  }

  /**
   * Read 2-byte signed integer, big-endian
   */
  readS2be(): number {
    this.ensureBytes(2)
    const value = this.view.getInt16(this._pos, false)
    this._pos += 2
    return value
  }

  /**
   * Read 4-byte signed integer, little-endian
   */
  readS4le(): number {
    this.ensureBytes(4)
    const value = this.view.getInt32(this._pos, true)
    this._pos += 4
    return value
  }

  /**
   * Read 4-byte signed integer, big-endian
   */
  readS4be(): number {
    this.ensureBytes(4)
    const value = this.view.getInt32(this._pos, false)
    this._pos += 4
    return value
  }

  /**
   * Read 8-byte signed integer, little-endian
   * Returns BigInt for values outside Number.MAX_SAFE_INTEGER range
   */
  readS8le(): bigint {
    this.ensureBytes(8)
    const value = this.view.getBigInt64(this._pos, true)
    this._pos += 8
    return value
  }

  /**
   * Read 8-byte signed integer, big-endian
   * Returns BigInt for values outside Number.MAX_SAFE_INTEGER range
   */
  readS8be(): bigint {
    this.ensureBytes(8)
    const value = this.view.getBigInt64(this._pos, false)
    this._pos += 8
    return value
  }

  // ==================== Floating Point ====================

  /**
   * Read 4-byte IEEE 754 single-precision float, little-endian
   */
  readF4le(): number {
    this.ensureBytes(4)
    const value = this.view.getFloat32(this._pos, true)
    this._pos += 4
    return value
  }

  /**
   * Read 4-byte IEEE 754 single-precision float, big-endian
   */
  readF4be(): number {
    this.ensureBytes(4)
    const value = this.view.getFloat32(this._pos, false)
    this._pos += 4
    return value
  }

  /**
   * Read 8-byte IEEE 754 double-precision float, little-endian
   */
  readF8le(): number {
    this.ensureBytes(8)
    const value = this.view.getFloat64(this._pos, true)
    this._pos += 8
    return value
  }

  /**
   * Read 8-byte IEEE 754 double-precision float, big-endian
   */
  readF8be(): number {
    this.ensureBytes(8)
    const value = this.view.getFloat64(this._pos, false)
    this._pos += 8
    return value
  }

  // ==================== Byte Arrays ====================

  /**
   * Read a fixed number of bytes
   * @param length - Number of bytes to read
   */
  readBytes(length: number): Uint8Array {
    this.ensureBytes(length)
    const bytes = this.buffer.slice(this._pos, this._pos + length)
    this._pos += length
    return bytes
  }

  /**
   * Read all remaining bytes until end of stream
   */
  readBytesFull(): Uint8Array {
    const bytes = this.buffer.slice(this._pos)
    this._pos = this.buffer.length
    return bytes
  }

  /**
   * Read bytes until a terminator byte is found
   * @param term - Terminator byte value
   * @param include - Include terminator in result
   * @param consume - Consume terminator from stream
   * @param eosError - Throw error if EOS reached before terminator
   */
  readBytesterm(
    term: number,
    include: boolean = false,
    consume: boolean = true,
    eosError: boolean = true
  ): Uint8Array {
    const start = this._pos
    let end = start

    // Find terminator
    while (end < this.buffer.length && this.buffer[end] !== term) {
      end++
    }

    // Check if we found the terminator
    const foundTerm = end < this.buffer.length

    if (!foundTerm && eosError) {
      throw new EOFError(
        `Terminator byte ${term} not found before end of stream`,
        this._pos
      )
    }

    // Extract bytes
    const includeEnd = include && foundTerm ? end + 1 : end
    const bytes = this.buffer.slice(start, includeEnd)

    // Update position
    if (foundTerm && consume) {
      this._pos = end + 1
    } else {
      this._pos = end
    }

    return bytes
  }

  // ==================== Strings ====================

  /**
   * Read a fixed-length string
   * @param length - Number of bytes to read
   * @param encoding - Character encoding (default: UTF-8)
   */
  readStr(length: number, encoding: string = 'UTF-8'): string {
    const bytes = this.readBytes(length)
    return decodeString(bytes, encoding)
  }

  /**
   * Read a null-terminated string
   * @param encoding - Character encoding (default: UTF-8)
   * @param term - Terminator byte (default: 0)
   * @param include - Include terminator in result
   * @param consume - Consume terminator from stream
   * @param eosError - Throw error if EOS reached before terminator
   */
  readStrz(
    encoding: string = 'UTF-8',
    term: number = 0,
    include: boolean = false,
    consume: boolean = true,
    eosError: boolean = true
  ): string {
    const bytes = this.readBytesterm(term, include, consume, eosError)
    return decodeString(bytes, encoding)
  }

  // ==================== Bit-level Reading ====================

  /**
   * Align bit reading to byte boundary
   */
  alignToByte(): void {
    this._bitsLeft = 0
  }

  /**
   * Read specified number of bits as unsigned integer (big-endian)
   * @param n - Number of bits to read (1-64)
   */
  readBitsIntBe(n: number): bigint {
    if (n < 1 || n > 64) {
      throw new Error(`Invalid bit count: ${n}. Must be between 1 and 64`)
    }

    let result = 0n

    for (let bitsNeeded = n; bitsNeeded > 0; ) {
      if (this._bitsLeft === 0) {
        this._bits = this.readU1()
        this._bitsLeft = 8
      }

      const bitsToRead = Math.min(bitsNeeded, this._bitsLeft)
      const mask = (1 << bitsToRead) - 1
      const shift = this._bitsLeft - bitsToRead

      result = (result << BigInt(bitsToRead)) | BigInt((this._bits >> shift) & mask)

      this._bitsLeft -= bitsToRead
      bitsNeeded -= bitsToRead
    }

    return result
  }

  /**
   * Read specified number of bits as unsigned integer (little-endian)
   * @param n - Number of bits to read (1-64)
   */
  readBitsIntLe(n: number): bigint {
    if (n < 1 || n > 64) {
      throw new Error(`Invalid bit count: ${n}. Must be between 1 and 64`)
    }

    let result = 0n
    let bitPos = 0

    for (let bitsNeeded = n; bitsNeeded > 0; ) {
      if (this._bitsLeft === 0) {
        this._bits = this.readU1()
        this._bitsLeft = 8
      }

      const bitsToRead = Math.min(bitsNeeded, this._bitsLeft)
      const mask = (1 << bitsToRead) - 1

      result |= BigInt(this._bits & mask) << BigInt(bitPos)

      this._bits >>= bitsToRead
      this._bitsLeft -= bitsToRead
      bitsNeeded -= bitsToRead
      bitPos += bitsToRead
    }

    return result
  }

  // ==================== Utility Methods ====================

  /**
   * Get the underlying buffer
   */
  getBuffer(): Uint8Array {
    return this.buffer
  }

  /**
   * Create a substream from current position with specified size
   * @param size - Size of the substream in bytes
   */
  substream(size: number): KaitaiStream {
    this.ensureBytes(size)
    const subBuffer = this.buffer.slice(this._pos, this._pos + size)
    this._pos += size
    return new KaitaiStream(subBuffer)
  }
}
