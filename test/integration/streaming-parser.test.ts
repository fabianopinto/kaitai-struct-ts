/**
 * @fileoverview Integration tests for streaming parser
 * @module test/integration/streaming-parser
 */

import { describe, it, expect } from 'vitest'
import { parseStreaming, parseStreamingSimple } from '../../src/streaming'

// Helper to create a ReadableStream from Uint8Array
function createStream(data: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(data)
      controller.close()
    },
  })
}

describe('Streaming Parser', () => {
  describe('parseStreaming', () => {
    it('should parse simple format with events', async () => {
      const schema = `
meta:
  id: simple_format
  endian: le
seq:
  - id: magic
    type: u4
  - id: version
    type: u2
  - id: count
    type: u2
`
      const data = new Uint8Array([
        0x4b,
        0x53,
        0x54,
        0x53, // magic: 0x5354534B
        0x01,
        0x00, // version: 1
        0x03,
        0x00, // count: 3
      ])

      const events = []
      for await (const event of parseStreaming(schema, createStream(data))) {
        events.push(event)
      }

      // Check event types
      expect(events[0].type).toBe('start')
      expect(events[1].type).toBe('field')
      expect(events[1].name).toBe('magic')
      expect(events[1].value).toBe(0x5354534b) // "KSTS" in little-endian
      expect(events[2].type).toBe('field')
      expect(events[2].name).toBe('version')
      expect(events[2].value).toBe(1)
      expect(events[3].type).toBe('field')
      expect(events[3].name).toBe('count')
      expect(events[3].value).toBe(3)
      expect(events[4].type).toBe('complete')
    })

    it('should parse with repeat-expr', async () => {
      const schema = `
meta:
  id: repeat_format
  endian: le
seq:
  - id: count
    type: u2
  - id: values
    type: u4
    repeat: expr
    repeat-expr: count
`
      const data = new Uint8Array([
        0x03,
        0x00, // count: 3
        0x0a,
        0x00,
        0x00,
        0x00, // value 1: 10
        0x14,
        0x00,
        0x00,
        0x00, // value 2: 20
        0x1e,
        0x00,
        0x00,
        0x00, // value 3: 30
      ])

      const events = []
      for await (const event of parseStreaming(schema, createStream(data))) {
        if (event.type === 'field') {
          events.push(event)
        }
      }

      expect(events[0].name).toBe('count')
      expect(events[0].value).toBe(3)
      expect(events[1].name).toBe('values')
      expect(events[1].value).toEqual([10, 20, 30])
    })

    it('should parse with repeat-eos', async () => {
      const schema = `
meta:
  id: eos_format
seq:
  - id: bytes
    type: u1
    repeat: eos
`
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])

      const events = []
      for await (const event of parseStreaming(schema, createStream(data))) {
        if (event.type === 'field') {
          events.push(event)
        }
      }

      expect(events[0].name).toBe('bytes')
      expect(events[0].value).toEqual([1, 2, 3, 4, 5])
    })

    it('should parse with conditional fields', async () => {
      const schema = `
meta:
  id: conditional_format
  endian: le
seq:
  - id: has_extra
    type: u1
  - id: value
    type: u2
  - id: extra
    type: u2
    if: has_extra != 0
`
      const data1 = new Uint8Array([
        0x01, // has_extra: 1
        0x34,
        0x12, // value: 0x1234
        0x78,
        0x56, // extra: 0x5678
      ])

      const events1 = []
      for await (const event of parseStreaming(schema, createStream(data1))) {
        if (event.type === 'field') {
          events1.push(event)
        }
      }

      expect(events1.length).toBe(3)
      expect(events1[2].name).toBe('extra')
      expect(events1[2].value).toBe(0x5678)

      // Without extra field
      const data2 = new Uint8Array([
        0x00, // has_extra: 0
        0x34,
        0x12, // value: 0x1234
      ])

      const events2 = []
      for await (const event of parseStreaming(schema, createStream(data2))) {
        if (event.type === 'field') {
          events2.push(event)
        }
      }

      expect(events2.length).toBe(2)
      expect(events2[1].name).toBe('value')
    })

    it('should emit progress events', async () => {
      const schema = `
meta:
  id: large_format
seq:
  - id: data
    type: u1
    repeat: eos
`
      const data = new Uint8Array(2000).fill(0x42)

      const progressEvents = []
      for await (const event of parseStreaming(schema, createStream(data), {
        progressInterval: 500,
      })) {
        if (event.type === 'progress') {
          progressEvents.push(event)
        }
      }

      expect(progressEvents.length).toBeGreaterThan(0)
      expect(progressEvents[progressEvents.length - 1].bytesRead).toBe(2000)
    })

    it('should handle errors', async () => {
      const schema = `
meta:
  id: error_format
seq:
  - id: value
    type: u4
`
      const data = new Uint8Array([0x01, 0x02]) // Too short

      const events = []
      for await (const event of parseStreaming(schema, createStream(data))) {
        events.push(event)
        if (event.type === 'error') {
          break
        }
      }

      const errorEvent = events.find((e) => e.type === 'error')
      expect(errorEvent).toBeDefined()
      expect(errorEvent.error).toBeInstanceOf(Error)
    })
  })

  describe('parseStreamingSimple', () => {
    it('should return final result', async () => {
      const schema = `
meta:
  id: simple_format
  endian: le
seq:
  - id: value1
    type: u2
  - id: value2
    type: u2
`
      const data = new Uint8Array([0x34, 0x12, 0x78, 0x56])

      const result = await parseStreamingSimple(schema, createStream(data))

      expect(result).toEqual({
        value1: 0x1234,
        value2: 0x5678,
      })
    })

    it('should throw on error', async () => {
      const schema = `
meta:
  id: error_format
seq:
  - id: value
    type: u4
`
      const data = new Uint8Array([0x01]) // Too short

      await expect(
        parseStreamingSimple(schema, createStream(data))
      ).rejects.toThrow()
    })
  })

  describe('Different endianness', () => {
    it('should parse big-endian', async () => {
      const schema = `
meta:
  id: be_format
  endian: be
seq:
  - id: value
    type: u4
`
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])

      const result = await parseStreamingSimple(schema, createStream(data))
      expect(result.value).toBe(0x12345678)
    })

    it('should parse mixed endianness', async () => {
      const schema = `
meta:
  id: mixed_format
  endian: le
seq:
  - id: le_value
    type: u4
  - id: be_value
    type: u4be
`
      const data = new Uint8Array([
        0x78,
        0x56,
        0x34,
        0x12, // LE: 0x12345678
        0x12,
        0x34,
        0x56,
        0x78, // BE: 0x12345678
      ])

      const result = await parseStreamingSimple(schema, createStream(data))
      expect(result.le_value).toBe(0x12345678)
      expect(result.be_value).toBe(0x12345678)
    })
  })

  describe('Float types', () => {
    it('should parse floats', async () => {
      const schema = `
meta:
  id: float_format
  endian: le
seq:
  - id: float_value
    type: f4
  - id: double_value
    type: f8
`
      const data = new Uint8Array([
        0x00,
        0x00,
        0x80,
        0x3f, // f4: 1.0
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0xf0,
        0x3f, // f8: 1.0
      ])

      const result = await parseStreamingSimple(schema, createStream(data))
      expect(result.float_value).toBeCloseTo(1.0, 5)
      expect(result.double_value).toBeCloseTo(1.0, 10)
    })
  })

  describe('BigInt types', () => {
    it('should parse u8', async () => {
      const schema = `
meta:
  id: bigint_format
  endian: le
seq:
  - id: big_value
    type: u8
`
      const data = new Uint8Array([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      ])

      const result = await parseStreamingSimple(schema, createStream(data))
      expect(result.big_value).toBe(0xffffffffffffffffn)
    })
  })
})
