/**
 * @fileoverview Tests for StreamingKaitaiStream
 * @module test/unit/streaming
 */

import { describe, it, expect } from 'vitest'
import { StreamingKaitaiStream } from '../../src/stream/StreamingKaitaiStream'
import { EOFError } from '../../src/utils/errors'

// Helper to create a ReadableStream from Uint8Array
function createStream(
  data: Uint8Array,
  chunkSize = 8
  // eslint-disable-next-line no-undef
): ReadableStream<Uint8Array> {
  let offset = 0
  // eslint-disable-next-line no-undef
  return new ReadableStream({
    pull(controller) {
      if (offset >= data.length) {
        controller.close()
        return
      }
      const chunk = data.slice(offset, offset + chunkSize)
      offset += chunkSize
      controller.enqueue(chunk)
    },
  })
}

// Helper to create AsyncIterable from Uint8Array
async function* createAsyncIterable(
  data: Uint8Array,
  chunkSize = 8
): AsyncIterable<Uint8Array> {
  let offset = 0
  while (offset < data.length) {
    yield data.slice(offset, offset + chunkSize)
    offset += chunkSize
  }
}

describe('StreamingKaitaiStream', () => {
  describe('Basic Reading', () => {
    it('should read u1', async () => {
      const data = new Uint8Array([0x42, 0xff, 0x00])
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readU1()).toBe(0x42)
      expect(await stream.readU1()).toBe(0xff)
      expect(await stream.readU1()).toBe(0x00)
    })

    it('should read s1', async () => {
      const data = new Uint8Array([0x7f, 0x80, 0xff])
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readS1()).toBe(127)
      expect(await stream.readS1()).toBe(-128)
      expect(await stream.readS1()).toBe(-1)
    })

    it('should read u2le', async () => {
      const data = new Uint8Array([0x34, 0x12, 0xff, 0xff])
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readU2le()).toBe(0x1234)
      expect(await stream.readU2le()).toBe(0xffff)
    })

    it('should read u2be', async () => {
      const data = new Uint8Array([0x12, 0x34, 0xff, 0xff])
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readU2be()).toBe(0x1234)
      expect(await stream.readU2be()).toBe(0xffff)
    })

    it('should read u4le', async () => {
      const data = new Uint8Array([0x78, 0x56, 0x34, 0x12])
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readU4le()).toBe(0x12345678)
    })

    it('should read u4be', async () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readU4be()).toBe(0x12345678)
    })

    it('should read u8le', async () => {
      const data = new Uint8Array([
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ])
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readU8le()).toBe(1n)
    })

    it('should read u8be', async () => {
      const data = new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
      ])
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readU8be()).toBe(1n)
    })
  })

  describe('Float Reading', () => {
    it('should read f4le', async () => {
      const data = new Uint8Array([0x00, 0x00, 0x80, 0x3f]) // 1.0 in IEEE 754
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readF4le()).toBeCloseTo(1.0, 5)
    })

    it('should read f4be', async () => {
      const data = new Uint8Array([0x3f, 0x80, 0x00, 0x00]) // 1.0 in IEEE 754
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readF4be()).toBeCloseTo(1.0, 5)
    })

    it('should read f8le', async () => {
      const data = new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x3f,
      ])
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(await stream.readF8le()).toBeCloseTo(1.0, 10)
    })
  })

  describe('Byte Reading', () => {
    it('should read fixed bytes', async () => {
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
      const stream = new StreamingKaitaiStream(createStream(data))

      const bytes = await stream.readBytes(3)
      expect(Array.from(bytes)).toEqual([0x01, 0x02, 0x03])
    })

    it('should read all bytes', async () => {
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
      const stream = new StreamingKaitaiStream(createStream(data, 2))

      const bytes = await stream.readBytesFull()
      expect(Array.from(bytes)).toEqual([0x01, 0x02, 0x03, 0x04, 0x05])
    })
  })

  describe('String Reading', () => {
    it('should read fixed-length string', async () => {
      const data = new TextEncoder().encode('Hello') // eslint-disable-line no-undef
      const stream = new StreamingKaitaiStream(createStream(data))

      const str = await stream.readStr(5, 'utf-8')
      expect(str).toBe('Hello')
    })

    it('should read null-terminated string', async () => {
      const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x57])
      const stream = new StreamingKaitaiStream(createStream(data))

      const str = await stream.readStrz('utf-8')
      expect(str).toBe('Hello')
    })

    it('should throw on missing terminator with eosError', async () => {
      const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])
      const stream = new StreamingKaitaiStream(createStream(data))

      await expect(
        stream.readStrz('utf-8', 0, false, true, true)
      ).rejects.toThrow(EOFError)
    })

    it('should not throw on missing terminator without eosError', async () => {
      const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])
      const stream = new StreamingKaitaiStream(createStream(data))

      const str = await stream.readStrz('utf-8', 0, false, true, false)
      expect(str).toBe('Hello')
    })
  })

  describe('Position Tracking', () => {
    it('should track position correctly', async () => {
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04])
      const stream = new StreamingKaitaiStream(createStream(data))

      expect(stream.pos).toBe(0)
      await stream.readU1()
      expect(stream.pos).toBe(1)
      await stream.readU2le()
      expect(stream.pos).toBe(3)
      await stream.readU1()
      expect(stream.pos).toBe(4)
    })

    it('should detect EOF', async () => {
      const data = new Uint8Array([0x01, 0x02])
      const stream = new StreamingKaitaiStream(createStream(data, 1)) // 1-byte chunks

      expect(stream.isEof).toBe(false)
      await stream.readU1()
      expect(stream.isEof).toBe(false)
      await stream.readU1()

      // EOF is only detected after trying to read past the end
      await expect(stream.readU1()).rejects.toThrow(EOFError)
      expect(stream.isEof).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should throw EOFError when reading past end', async () => {
      const data = new Uint8Array([0x01])
      const stream = new StreamingKaitaiStream(createStream(data))

      await stream.readU1()
      await expect(stream.readU1()).rejects.toThrow(EOFError)
    })

    it('should throw EOFError with position', async () => {
      const data = new Uint8Array([0x01, 0x02])
      const stream = new StreamingKaitaiStream(createStream(data))

      await stream.readU1()
      await stream.readU1()

      try {
        await stream.readU4le()
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(EOFError)
        expect((error as EOFError).position).toBe(2)
      }
    })
  })

  describe('AsyncIterable Support', () => {
    it('should work with AsyncIterable', async () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const stream = new StreamingKaitaiStream(createAsyncIterable(data, 2))

      expect(await stream.readU2le()).toBe(0x3412)
      expect(await stream.readU2le()).toBe(0x7856)
    })
  })

  describe('Buffer Management', () => {
    it('should handle small chunks', async () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const stream = new StreamingKaitaiStream(createStream(data, 1))

      expect(await stream.readU4le()).toBe(0x78563412)
    })

    it('should handle exact chunk boundaries', async () => {
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04])
      const stream = new StreamingKaitaiStream(createStream(data, 2))

      expect(await stream.readU2le()).toBe(0x0201)
      expect(await stream.readU2le()).toBe(0x0403)
    })

    it('should respect maxBufferSize', async () => {
      const data = new Uint8Array(1000)
      const stream = new StreamingKaitaiStream(createStream(data, 100), {
        maxBufferSize: 500,
      })

      await expect(stream.readBytes(600)).rejects.toThrow(
        'Buffer size exceeded maximum'
      )
    })
  })

  describe('Resource Cleanup', () => {
    it('should close stream', async () => {
      const data = new Uint8Array([0x01, 0x02])
      const stream = new StreamingKaitaiStream(createStream(data))

      await stream.readU1()
      await stream.close()

      // After close, should not be able to read
      expect(stream.isEof).toBe(true)
    })
  })
})
