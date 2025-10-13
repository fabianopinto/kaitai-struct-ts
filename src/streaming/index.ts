/**
 * @fileoverview Streaming parser for Kaitai Struct with progressive parsing
 * @module streaming
 * @author Fabiano Pinto
 * @license MIT
 */

import { KsyParser } from '../parser/KsyParser'
import { KsySchema } from '../parser/schema'
import { StreamingKaitaiStream } from '../stream/StreamingKaitaiStream'
import { StreamingTypeInterpreter } from './StreamingTypeInterpreter'

/**
 * Parse event types emitted during streaming parsing.
 */
export type ParseEvent =
  | { type: 'start'; schema: KsySchema }
  | { type: 'field'; path: string[]; name: string; value: unknown }
  | { type: 'progress'; bytesRead: number; totalBytes?: number }
  | { type: 'complete'; result: unknown }
  | { type: 'error'; error: Error; path?: string[] }

/**
 * Options for streaming parsing.
 */
export interface StreamingParseOptions {
  /** Chunk size for reading from source (default: 64KB) */
  chunkSize?: number

  /** Maximum buffer size (default: 10MB) */
  maxBufferSize?: number

  /** Emit progress events every N bytes (default: 1MB) */
  progressInterval?: number

  /** Yield control every N fields (default: 100) */
  yieldInterval?: number

  /** Total size of data if known (for progress reporting) */
  totalBytes?: number
}

/**
 * Parse binary data from a stream using Kaitai Struct schema.
 * Emits events as parsing progresses.
 *
 * @param schema - KSY schema (YAML string or parsed object)
 * @param source - ReadableStream or AsyncIterable of binary data
 * @param options - Parsing options
 * @yields Parse events
 *
 * @example
 * ```typescript
 * const schema = `
 * meta:
 *   id: my_format
 * seq:
 *   - id: header
 *     type: u4
 *   - id: data
 *     type: u1
 *     repeat: eos
 * `
 *
 * const stream = createReadStream('file.bin')
 * for await (const event of parseStreaming(schema, stream)) {
 *   if (event.type === 'field') {
 *     console.log(`${event.name}: ${event.value}`)
 *   }
 *   if (event.type === 'complete') {
 *     console.log('Done:', event.result)
 *   }
 * }
 * ```
 */
export async function* parseStreaming(
  schema: string | KsySchema,
  source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  options: StreamingParseOptions = {}
): AsyncGenerator<ParseEvent> {
  const {
    chunkSize = 64 * 1024,
    maxBufferSize = 10 * 1024 * 1024,
    progressInterval = 1024 * 1024,
    yieldInterval = 100,
    totalBytes,
  } = options

  try {
    // Parse schema if string
    const parsedSchema =
      typeof schema === 'string' ? new KsyParser().parse(schema) : schema

    yield { type: 'start', schema: parsedSchema }

    // Create streaming stream
    const stream = new StreamingKaitaiStream(source, {
      chunkSize,
      maxBufferSize,
    })

    // Create streaming interpreter
    const interpreter = new StreamingTypeInterpreter(
      parsedSchema,
      stream,
      progressInterval,
      yieldInterval,
      totalBytes
    )

    // Parse and emit events
    let fieldCount = 0
    let lastProgress = 0

    for await (const event of interpreter.parseStreaming()) {
      // Emit field events
      if (event.type === 'field') {
        yield event
        fieldCount++

        // Yield control periodically
        if (fieldCount % yieldInterval === 0) {
          await new Promise((resolve) => setImmediate(resolve))
        }
      }

      // Emit progress events
      if (event.type === 'progress') {
        const currentPos = stream.pos
        if (currentPos - lastProgress >= progressInterval) {
          yield {
            type: 'progress',
            bytesRead: currentPos,
            totalBytes,
          }
          lastProgress = currentPos
        }
      }

      // Emit complete event
      if (event.type === 'complete') {
        yield event
      }
    }

    // Final progress
    yield {
      type: 'progress',
      bytesRead: stream.pos,
      totalBytes,
    }

    // Cleanup
    await stream.close()
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Simplified streaming parse that returns only the final result.
 * Useful when you don't need progress events.
 *
 * @param schema - KSY schema
 * @param source - Data source
 * @param options - Parsing options
 * @returns Parsed result
 *
 * @example
 * ```typescript
 * const result = await parseStreamingSimple(schema, stream)
 * console.log(result)
 * ```
 */
export async function parseStreamingSimple(
  schema: string | KsySchema,
  source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  options: StreamingParseOptions = {}
): Promise<unknown> {
  for await (const event of parseStreaming(schema, source, options)) {
    if (event.type === 'complete') {
      return event.result
    }
    if (event.type === 'error') {
      throw event.error
    }
  }
  throw new Error('Parsing completed without result')
}
