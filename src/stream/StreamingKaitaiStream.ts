/**
 * @fileoverview Streaming Kaitai Stream for parsing large files without loading everything into memory
 * @module stream/StreamingKaitaiStream
 * @author Fabiano Pinto
 * @license MIT
 */

import { EOFError } from '../utils/errors'

/**
 * Streaming Kaitai Stream that reads data progressively from an async source.
 * Supports forward-only reading with configurable buffering.
 *
 * @class StreamingKaitaiStream
 * @example
 * ```typescript
 * const stream = new StreamingKaitaiStream(readableStream)
 * const value = await stream.readU4le()
 * ```
 */
export class StreamingKaitaiStream {
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null // eslint-disable-line no-undef
  private iterator: AsyncIterator<Uint8Array> | null = null
  private buffer: Uint8Array = new Uint8Array(0)
  private bufferOffset = 0
  private _pos = 0
  private _isEof = false
  private chunkSize: number
  private maxBufferSize: number

  /**
   * Create a streaming Kaitai Stream.
   *
   * @param source - ReadableStream or AsyncIterable source of binary data
   * @param options - Configuration options
   */
  constructor(
    source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>, // eslint-disable-line no-undef
    options: {
      chunkSize?: number
      maxBufferSize?: number
    } = {}
  ) {
    this.chunkSize = options.chunkSize ?? 64 * 1024 // 64KB default
    this.maxBufferSize = options.maxBufferSize ?? 10 * 1024 * 1024 // 10MB default

    if ('getReader' in source) {
      // ReadableStream
      this.reader = source.getReader()
    } else {
      // AsyncIterable
      this.iterator = source[Symbol.asyncIterator]()
    }
  }

  /**
   * Current position in the stream.
   */
  get pos(): number {
    return this._pos
  }

  /**
   * Whether end of stream has been reached.
   */
  get isEof(): boolean {
    // EOF if source is exhausted and buffer is empty
    return this._isEof && this.bufferOffset >= this.buffer.length
  }

  /**
   * Check if we're at EOF by trying to ensure 1 byte.
   * This is more accurate than the isEof getter.
   * @private
   */
  private async checkEof(): Promise<boolean> {
    try {
      await this.ensureBytes(1)
      return false
    } catch (error) {
      if (error instanceof EOFError) {
        return true
      }
      throw error
    }
  }

  /**
   * Ensure at least `bytes` are available in the buffer.
   * Reads from source if necessary.
   *
   * @param bytes - Number of bytes needed
   * @throws {EOFError} If not enough bytes available
   * @private
   */
  private async ensureBytes(bytes: number): Promise<void> {
    const available = this.buffer.length - this.bufferOffset

    if (available >= bytes) {
      return // Already have enough
    }

    // Need to read more data
    while (!this._isEof && this.buffer.length - this.bufferOffset < bytes) {
      const chunk = await this.readChunk()
      if (!chunk) {
        this._isEof = true
        break
      }

      // Append chunk to buffer
      const newBuffer = new Uint8Array(
        this.buffer.length - this.bufferOffset + chunk.length
      )
      newBuffer.set(this.buffer.subarray(this.bufferOffset))
      newBuffer.set(chunk, this.buffer.length - this.bufferOffset)
      this.buffer = newBuffer
      this.bufferOffset = 0

      // Check buffer size limit
      if (this.buffer.length > this.maxBufferSize) {
        throw new Error(
          `Buffer size exceeded maximum (${this.maxBufferSize} bytes)`
        )
      }
    }

    // Check if we have enough bytes
    if (this.buffer.length - this.bufferOffset < bytes) {
      throw new EOFError(
        `Unexpected end of stream: needed ${bytes} bytes, got ${this.buffer.length - this.bufferOffset}`,
        this._pos
      )
    }
  }

  /**
   * Read next chunk from source.
   *
   * @returns Chunk data or null if EOF
   * @private
   */
  private async readChunk(): Promise<Uint8Array | null> {
    if (this.reader) {
      const { done, value } = await this.reader.read()
      return done ? null : value
    } else if (this.iterator) {
      const { done, value } = await this.iterator.next()
      return done ? null : value
    }
    return null
  }

  /**
   * Consume bytes from buffer.
   *
   * @param count - Number of bytes to consume
   * @returns Consumed bytes
   * @private
   */
  private consumeBytes(count: number): Uint8Array {
    const bytes = this.buffer.slice(
      this.bufferOffset,
      this.bufferOffset + count
    )
    this.bufferOffset += count
    this._pos += count

    // Compact buffer if offset is large
    if (this.bufferOffset > this.chunkSize) {
      this.buffer = this.buffer.slice(this.bufferOffset)
      this.bufferOffset = 0
    }

    return bytes
  }

  /**
   * Read unsigned 8-bit integer.
   */
  async readU1(): Promise<number> {
    await this.ensureBytes(1)
    return this.consumeBytes(1)[0]
  }

  /**
   * Read signed 8-bit integer.
   */
  async readS1(): Promise<number> {
    const value = await this.readU1()
    return value > 127 ? value - 256 : value
  }

  /**
   * Read unsigned 16-bit integer (little-endian).
   */
  async readU2le(): Promise<number> {
    await this.ensureBytes(2)
    const bytes = this.consumeBytes(2)
    return bytes[0] | (bytes[1] << 8)
  }

  /**
   * Read unsigned 16-bit integer (big-endian).
   */
  async readU2be(): Promise<number> {
    await this.ensureBytes(2)
    const bytes = this.consumeBytes(2)
    return (bytes[0] << 8) | bytes[1]
  }

  /**
   * Read signed 16-bit integer (little-endian).
   */
  async readS2le(): Promise<number> {
    const value = await this.readU2le()
    return value > 32767 ? value - 65536 : value
  }

  /**
   * Read signed 16-bit integer (big-endian).
   */
  async readS2be(): Promise<number> {
    const value = await this.readU2be()
    return value > 32767 ? value - 65536 : value
  }

  /**
   * Read unsigned 32-bit integer (little-endian).
   */
  async readU4le(): Promise<number> {
    await this.ensureBytes(4)
    const bytes = this.consumeBytes(4)
    return (
      (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)) >>> 0
    )
  }

  /**
   * Read unsigned 32-bit integer (big-endian).
   */
  async readU4be(): Promise<number> {
    await this.ensureBytes(4)
    const bytes = this.consumeBytes(4)
    return (
      ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0
    )
  }

  /**
   * Read signed 32-bit integer (little-endian).
   */
  async readS4le(): Promise<number> {
    const value = await this.readU4le()
    return value | 0 // Convert to signed
  }

  /**
   * Read signed 32-bit integer (big-endian).
   */
  async readS4be(): Promise<number> {
    const value = await this.readU4be()
    return value | 0 // Convert to signed
  }

  /**
   * Read unsigned 64-bit integer (little-endian) as BigInt.
   */
  async readU8le(): Promise<bigint> {
    await this.ensureBytes(8)
    const bytes = this.consumeBytes(8)
    return (
      BigInt(bytes[0]) |
      (BigInt(bytes[1]) << 8n) |
      (BigInt(bytes[2]) << 16n) |
      (BigInt(bytes[3]) << 24n) |
      (BigInt(bytes[4]) << 32n) |
      (BigInt(bytes[5]) << 40n) |
      (BigInt(bytes[6]) << 48n) |
      (BigInt(bytes[7]) << 56n)
    )
  }

  /**
   * Read unsigned 64-bit integer (big-endian) as BigInt.
   */
  async readU8be(): Promise<bigint> {
    await this.ensureBytes(8)
    const bytes = this.consumeBytes(8)
    return (
      (BigInt(bytes[0]) << 56n) |
      (BigInt(bytes[1]) << 48n) |
      (BigInt(bytes[2]) << 40n) |
      (BigInt(bytes[3]) << 32n) |
      (BigInt(bytes[4]) << 24n) |
      (BigInt(bytes[5]) << 16n) |
      (BigInt(bytes[6]) << 8n) |
      BigInt(bytes[7])
    )
  }

  /**
   * Read 32-bit float (little-endian).
   */
  async readF4le(): Promise<number> {
    await this.ensureBytes(4)
    const bytes = this.consumeBytes(4)
    const view = new DataView(bytes.buffer, bytes.byteOffset, 4)
    return view.getFloat32(0, true)
  }

  /**
   * Read 32-bit float (big-endian).
   */
  async readF4be(): Promise<number> {
    await this.ensureBytes(4)
    const bytes = this.consumeBytes(4)
    const view = new DataView(bytes.buffer, bytes.byteOffset, 4)
    return view.getFloat32(0, false)
  }

  /**
   * Read 64-bit float (little-endian).
   */
  async readF8le(): Promise<number> {
    await this.ensureBytes(8)
    const bytes = this.consumeBytes(8)
    const view = new DataView(bytes.buffer, bytes.byteOffset, 8)
    return view.getFloat64(0, true)
  }

  /**
   * Read 64-bit float (big-endian).
   */
  async readF8be(): Promise<number> {
    await this.ensureBytes(8)
    const bytes = this.consumeBytes(8)
    const view = new DataView(bytes.buffer, bytes.byteOffset, 8)
    return view.getFloat64(0, false)
  }

  /**
   * Read fixed number of bytes.
   *
   * @param length - Number of bytes to read
   * @returns Byte array
   */
  async readBytes(length: number): Promise<Uint8Array> {
    await this.ensureBytes(length)
    return this.consumeBytes(length)
  }

  /**
   * Read string with specified length and encoding.
   *
   * @param length - String length in bytes
   * @param encoding - Character encoding
   * @returns Decoded string
   */
  async readStr(length: number, encoding: string): Promise<string> {
    const bytes = await this.readBytes(length)
    const decoder = new TextDecoder(encoding) // eslint-disable-line no-undef
    return decoder.decode(bytes)
  }

  /**
   * Read null-terminated string.
   *
   * @param encoding - Character encoding
   * @param terminator - Terminator byte (default: 0)
   * @param includeTerminator - Include terminator in result
   * @param consumeTerminator - Consume terminator from stream
   * @param eosError - Throw error if no terminator found
   * @returns Decoded string
   */
  async readStrz(
    encoding: string,
    terminator = 0,
    includeTerminator = false,
    consumeTerminator = true,
    eosError = true
  ): Promise<string> {
    const bytes: number[] = []

    while (true) {
      // Check if we can read more
      try {
        await this.ensureBytes(1)
      } catch (error) {
        // EOF reached
        if (error instanceof EOFError) {
          if (eosError) {
            throw new EOFError('No terminator found before EOF', this._pos)
          }
          break
        }
        throw error
      }

      const byte = await this.readU1()

      if (byte === terminator) {
        if (includeTerminator) {
          bytes.push(byte)
        }
        if (!consumeTerminator) {
          // Would need to "unread" - not supported in streaming
          throw new Error('consumeTerminator=false not supported in streaming')
        }
        break
      }

      bytes.push(byte)
    }

    const decoder = new TextDecoder(encoding) // eslint-disable-line no-undef
    return decoder.decode(new Uint8Array(bytes))
  }

  /**
   * Read all remaining bytes until EOF.
   *
   * @returns All remaining bytes
   */
  async readBytesFull(): Promise<Uint8Array> {
    const chunks: Uint8Array[] = []

    // Add current buffer
    if (this.bufferOffset < this.buffer.length) {
      chunks.push(this.buffer.slice(this.bufferOffset))
      this._pos += this.buffer.length - this.bufferOffset
      this.bufferOffset = this.buffer.length
    }

    // Read remaining chunks
    while (!this._isEof) {
      const chunk = await this.readChunk()
      if (!chunk) {
        this._isEof = true
        break
      }
      chunks.push(chunk)
      this._pos += chunk.length
    }

    // Concatenate all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return result
  }

  /**
   * Close the stream and release resources.
   */
  async close(): Promise<void> {
    if (this.reader) {
      await this.reader.cancel()
      this.reader = null
    }
    this.iterator = null
    this.buffer = new Uint8Array(0)
    this.bufferOffset = 0
    this._isEof = true // Mark as EOF after closing
  }
}
