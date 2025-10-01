import { describe, it, expect, beforeEach } from 'vitest'
import { KaitaiStream } from '../../src/stream/KaitaiStream'
import { EOFError } from '../../src/utils/errors'

describe('KaitaiStream', () => {
  describe('constructor and basic properties', () => {
    it('should create from ArrayBuffer', () => {
      const buffer = new ArrayBuffer(10)
      const stream = new KaitaiStream(buffer)
      expect(stream.size).toBe(10)
      expect(stream.pos).toBe(0)
      expect(stream.isEof()).toBe(false)
    })

    it('should create from Uint8Array', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5])
      const stream = new KaitaiStream(buffer)
      expect(stream.size).toBe(5)
      expect(stream.pos).toBe(0)
    })

    it('should detect EOF', () => {
      const buffer = new Uint8Array([1, 2, 3])
      const stream = new KaitaiStream(buffer)
      stream.pos = 3
      expect(stream.isEof()).toBe(true)
    })
  })

  describe('position management', () => {
    let stream: KaitaiStream

    beforeEach(() => {
      stream = new KaitaiStream(new Uint8Array(10))
    })

    it('should seek to position', () => {
      stream.seek(5)
      expect(stream.pos).toBe(5)
    })

    it('should throw on invalid seek', () => {
      expect(() => stream.seek(-1)).toThrow()
      expect(() => stream.seek(11)).toThrow()
    })

    it('should update position after reads', () => {
      const buffer = new Uint8Array([1, 2, 3, 4])
      stream = new KaitaiStream(buffer)
      stream.readU1()
      expect(stream.pos).toBe(1)
      stream.readU1()
      expect(stream.pos).toBe(2)
    })
  })

  describe('unsigned integers', () => {
    it('should read u1', () => {
      const buffer = new Uint8Array([0, 127, 255])
      const stream = new KaitaiStream(buffer)
      expect(stream.readU1()).toBe(0)
      expect(stream.readU1()).toBe(127)
      expect(stream.readU1()).toBe(255)
    })

    it('should read u2le (little-endian)', () => {
      const buffer = new Uint8Array([0x34, 0x12, 0xff, 0xff])
      const stream = new KaitaiStream(buffer)
      expect(stream.readU2le()).toBe(0x1234)
      expect(stream.readU2le()).toBe(0xffff)
    })

    it('should read u2be (big-endian)', () => {
      const buffer = new Uint8Array([0x12, 0x34, 0xff, 0xff])
      const stream = new KaitaiStream(buffer)
      expect(stream.readU2be()).toBe(0x1234)
      expect(stream.readU2be()).toBe(0xffff)
    })

    it('should read u4le (little-endian)', () => {
      const buffer = new Uint8Array([0x78, 0x56, 0x34, 0x12])
      const stream = new KaitaiStream(buffer)
      expect(stream.readU4le()).toBe(0x12345678)
    })

    it('should read u4be (big-endian)', () => {
      const buffer = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const stream = new KaitaiStream(buffer)
      expect(stream.readU4be()).toBe(0x12345678)
    })

    it('should read u8le (little-endian)', () => {
      const buffer = new Uint8Array([
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ])
      const stream = new KaitaiStream(buffer)
      expect(stream.readU8le()).toBe(1n)
    })

    it('should read u8be (big-endian)', () => {
      const buffer = new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
      ])
      const stream = new KaitaiStream(buffer)
      expect(stream.readU8be()).toBe(1n)
    })
  })

  describe('signed integers', () => {
    it('should read s1', () => {
      const buffer = new Uint8Array([0, 127, 128, 255])
      const stream = new KaitaiStream(buffer)
      expect(stream.readS1()).toBe(0)
      expect(stream.readS1()).toBe(127)
      expect(stream.readS1()).toBe(-128)
      expect(stream.readS1()).toBe(-1)
    })

    it('should read s2le (little-endian)', () => {
      const buffer = new Uint8Array([0xff, 0xff, 0x00, 0x80])
      const stream = new KaitaiStream(buffer)
      expect(stream.readS2le()).toBe(-1)
      expect(stream.readS2le()).toBe(-32768)
    })

    it('should read s2be (big-endian)', () => {
      const buffer = new Uint8Array([0xff, 0xff, 0x80, 0x00])
      const stream = new KaitaiStream(buffer)
      expect(stream.readS2be()).toBe(-1)
      expect(stream.readS2be()).toBe(-32768)
    })

    it('should read s4le (little-endian)', () => {
      const buffer = new Uint8Array([0xff, 0xff, 0xff, 0xff])
      const stream = new KaitaiStream(buffer)
      expect(stream.readS4le()).toBe(-1)
    })

    it('should read s4be (big-endian)', () => {
      const buffer = new Uint8Array([0xff, 0xff, 0xff, 0xff])
      const stream = new KaitaiStream(buffer)
      expect(stream.readS4be()).toBe(-1)
    })

    it('should read s8le (little-endian)', () => {
      const buffer = new Uint8Array([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      ])
      const stream = new KaitaiStream(buffer)
      expect(stream.readS8le()).toBe(-1n)
    })

    it('should read s8be (big-endian)', () => {
      const buffer = new Uint8Array([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      ])
      const stream = new KaitaiStream(buffer)
      expect(stream.readS8be()).toBe(-1n)
    })
  })

  describe('floating point', () => {
    it('should read f4le (little-endian)', () => {
      const buffer = new Uint8Array([0x00, 0x00, 0x80, 0x3f]) // 1.0
      const stream = new KaitaiStream(buffer)
      expect(stream.readF4le()).toBeCloseTo(1.0)
    })

    it('should read f4be (big-endian)', () => {
      const buffer = new Uint8Array([0x3f, 0x80, 0x00, 0x00]) // 1.0
      const stream = new KaitaiStream(buffer)
      expect(stream.readF4be()).toBeCloseTo(1.0)
    })

    it('should read f8le (little-endian)', () => {
      const buffer = new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x3f,
      ]) // 1.0
      const stream = new KaitaiStream(buffer)
      expect(stream.readF8le()).toBeCloseTo(1.0)
    })

    it('should read f8be (big-endian)', () => {
      const buffer = new Uint8Array([
        0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]) // 1.0
      const stream = new KaitaiStream(buffer)
      expect(stream.readF8be()).toBeCloseTo(1.0)
    })
  })

  describe('byte arrays', () => {
    it('should read fixed bytes', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5])
      const stream = new KaitaiStream(buffer)
      const bytes = stream.readBytes(3)
      expect(bytes).toEqual(new Uint8Array([1, 2, 3]))
      expect(stream.pos).toBe(3)
    })

    it('should read all bytes', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5])
      const stream = new KaitaiStream(buffer)
      stream.readU1() // Skip first byte
      const bytes = stream.readBytesFull()
      expect(bytes).toEqual(new Uint8Array([2, 3, 4, 5]))
      expect(stream.isEof()).toBe(true)
    })

    it('should read bytes until terminator', () => {
      const buffer = new Uint8Array([1, 2, 3, 0, 4, 5])
      const stream = new KaitaiStream(buffer)
      const bytes = stream.readBytesterm(0, false, true, true)
      expect(bytes).toEqual(new Uint8Array([1, 2, 3]))
      expect(stream.pos).toBe(4) // After terminator
    })

    it('should include terminator if requested', () => {
      const buffer = new Uint8Array([1, 2, 3, 0, 4, 5])
      const stream = new KaitaiStream(buffer)
      const bytes = stream.readBytesterm(0, true, true, true)
      expect(bytes).toEqual(new Uint8Array([1, 2, 3, 0]))
    })

    it('should not consume terminator if requested', () => {
      const buffer = new Uint8Array([1, 2, 3, 0, 4, 5])
      const stream = new KaitaiStream(buffer)
      const bytes = stream.readBytesterm(0, false, false, true)
      expect(bytes).toEqual(new Uint8Array([1, 2, 3]))
      expect(stream.pos).toBe(3) // Before terminator
    })

    it('should throw on missing terminator if eosError is true', () => {
      const buffer = new Uint8Array([1, 2, 3])
      const stream = new KaitaiStream(buffer)
      expect(() => stream.readBytesterm(0, false, true, true)).toThrow(EOFError)
    })

    it('should not throw on missing terminator if eosError is false', () => {
      const buffer = new Uint8Array([1, 2, 3])
      const stream = new KaitaiStream(buffer)
      const bytes = stream.readBytesterm(0, false, true, false)
      expect(bytes).toEqual(new Uint8Array([1, 2, 3]))
    })
  })

  describe('strings', () => {
    it('should read fixed-length UTF-8 string', () => {
      const buffer = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]) // "Hello"
      const stream = new KaitaiStream(buffer)
      const str = stream.readStr(5, 'UTF-8')
      expect(str).toBe('Hello')
    })

    it('should read null-terminated string', () => {
      const buffer = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x57]) // "Hello\0W"
      const stream = new KaitaiStream(buffer)
      const str = stream.readStrz('UTF-8')
      expect(str).toBe('Hello')
      expect(stream.pos).toBe(6) // After null terminator
    })

    it('should read ASCII string', () => {
      const buffer = new Uint8Array([0x41, 0x42, 0x43]) // "ABC"
      const stream = new KaitaiStream(buffer)
      const str = stream.readStr(3, 'ASCII')
      expect(str).toBe('ABC')
    })
  })

  describe('bit-level reading', () => {
    it('should read bits big-endian', () => {
      const buffer = new Uint8Array([0b10110011]) // 179
      const stream = new KaitaiStream(buffer)
      expect(stream.readBitsIntBe(1)).toBe(1n) // 1
      expect(stream.readBitsIntBe(3)).toBe(0b011n) // 3
      expect(stream.readBitsIntBe(4)).toBe(0b0011n) // 3
    })

    it('should read bits little-endian', () => {
      const buffer = new Uint8Array([0b10110011]) // 179
      const stream = new KaitaiStream(buffer)
      expect(stream.readBitsIntLe(1)).toBe(1n) // 1
      expect(stream.readBitsIntLe(3)).toBe(0b001n) // 1
      expect(stream.readBitsIntLe(4)).toBe(0b1011n) // 11
    })

    it('should align to byte boundary', () => {
      const buffer = new Uint8Array([0xff, 0xaa])
      const stream = new KaitaiStream(buffer)
      stream.readBitsIntBe(4)
      stream.alignToByte()
      expect(stream.readU1()).toBe(0xaa)
    })

    it('should throw on invalid bit count', () => {
      const buffer = new Uint8Array([0xff])
      const stream = new KaitaiStream(buffer)
      expect(() => stream.readBitsIntBe(0)).toThrow()
      expect(() => stream.readBitsIntBe(65)).toThrow()
    })
  })

  describe('error handling', () => {
    it('should throw EOFError when reading past end', () => {
      const buffer = new Uint8Array([1, 2])
      const stream = new KaitaiStream(buffer)
      stream.readU1()
      stream.readU1()
      expect(() => stream.readU1()).toThrow(EOFError)
    })

    it('should throw EOFError with position info', () => {
      const buffer = new Uint8Array([1, 2])
      const stream = new KaitaiStream(buffer)
      try {
        stream.readU4le()
      } catch (e) {
        expect(e).toBeInstanceOf(EOFError)
        expect((e as EOFError).position).toBe(0)
      }
    })
  })

  describe('utility methods', () => {
    it('should get underlying buffer', () => {
      const buffer = new Uint8Array([1, 2, 3])
      const stream = new KaitaiStream(buffer)
      expect(stream.getBuffer()).toBe(buffer)
    })

    it('should create substream', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5])
      const stream = new KaitaiStream(buffer)
      stream.readU1() // Skip first byte
      const substream = stream.substream(2)
      expect(substream.size).toBe(2)
      expect(substream.readU1()).toBe(2)
      expect(substream.readU1()).toBe(3)
      expect(stream.pos).toBe(3)
    })
  })
})
