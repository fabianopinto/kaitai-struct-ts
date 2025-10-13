/**
 * @fileoverview Streaming Type Interpreter for progressive parsing
 * @module streaming/StreamingTypeInterpreter
 * @author Fabiano Pinto
 * @license MIT
 */

import { KsySchema, AttributeSpec } from '../parser/schema'
import { StreamingKaitaiStream } from '../stream/StreamingKaitaiStream'
import { Context } from '../interpreter/Context'
import { ParseError } from '../utils/errors'
import { evaluateExpression } from '../expression'
import {
  isBuiltinType,
  getBaseType,
  getTypeEndianness,
  isIntegerType,
  isFloatType,
  isStringType,
} from '../parser/schema'

/**
 * Internal parse event for streaming interpreter.
 */
type InternalParseEvent =
  | { type: 'field'; path: string[]; name: string; value: unknown }
  | { type: 'progress' }
  | { type: 'complete'; result: unknown }

/**
 * Streaming Type Interpreter that parses sequentially and emits events.
 *
 * @class StreamingTypeInterpreter
 */
export class StreamingTypeInterpreter {
  private schema: KsySchema
  private stream: StreamingKaitaiStream
  private progressInterval: number
  private yieldInterval: number
  private totalBytes?: number

  constructor(
    schema: KsySchema,
    stream: StreamingKaitaiStream,
    progressInterval = 1024 * 1024,
    yieldInterval = 100,
    totalBytes?: number
  ) {
    this.schema = schema
    this.stream = stream
    this.progressInterval = progressInterval
    this.yieldInterval = yieldInterval
    this.totalBytes = totalBytes
  }

  /**
   * Parse the schema and emit events progressively.
   */
  async *parseStreaming(): AsyncGenerator<InternalParseEvent> {
    const result: Record<string, unknown> = {}
    const context = new Context(result, result, result)

    // Parse sequential fields
    if (this.schema.seq) {
      for (const attr of this.schema.seq) {
        const value = await this.parseAttribute(attr, context, [])
        if (attr.id && value !== undefined) {
          result[attr.id] = value
          // Update context with new field
          context.current = result

          yield {
            type: 'field',
            path: [],
            name: attr.id,
            value,
          }
        }
      }
    }

    yield { type: 'complete', result }
  }

  /**
   * Parse a single attribute.
   *
   * @param attr - Attribute specification
   * @param context - Execution context
   * @param path - Current path for error reporting
   * @returns Parsed value
   * @private
   */
  private async parseAttribute(
    attr: AttributeSpec,
    context: Context,
    path: string[]
  ): Promise<unknown> {
    // Handle repeat
    if (attr.repeat) {
      return this.parseRepeat(attr, context, path)
    }

    // Parse single value
    return this.parseValue(attr, context, path)
  }

  /**
   * Parse repeated values.
   *
   * @param attr - Attribute specification
   * @param context - Execution context
   * @param path - Current path
   * @returns Array of parsed values
   * @private
   */
  private async parseRepeat(
    attr: AttributeSpec,
    context: Context,
    path: string[]
  ): Promise<unknown[]> {
    const result: unknown[] = []

    if (attr.repeat === 'eos') {
      // Repeat until end of stream
      while (!this.stream.isEof) {
        try {
          const value = await this.parseValue(attr, context, path)
          result.push(value)
        } catch (error) {
          // EOF is expected for eos
          if (
            error instanceof Error &&
            error.message.includes('Unexpected end')
          ) {
            break
          }
          throw error
        }
      }
    } else if (attr.repeat === 'expr' && attr['repeat-expr']) {
      // Repeat N times
      const count = this.evaluateExpression(attr['repeat-expr'], context)
      if (typeof count !== 'number') {
        throw new ParseError(
          `repeat-expr must evaluate to number, got ${typeof count}`
        )
      }

      for (let i = 0; i < count; i++) {
        const value = await this.parseValue(attr, context, path)
        result.push(value)
      }
    } else if (attr.repeat === 'until' && attr['repeat-until']) {
      // Repeat until condition
      while (true) {
        const value = await this.parseValue(attr, context, path)
        result.push(value)

        // Check condition with current value as _
        const condContext = new Context(context.root, context.parent, value)
        const shouldStop = this.evaluateExpression(
          attr['repeat-until'],
          condContext
        )
        if (shouldStop) {
          break
        }
      }
    }

    return result
  }

  /**
   * Parse a single value.
   *
   * @param attr - Attribute specification
   * @param context - Execution context
   * @param path - Current path
   * @returns Parsed value
   * @private
   */
  private async parseValue(
    attr: AttributeSpec,
    context: Context,
    path: string[]
  ): Promise<unknown> {
    // Check if condition
    if (attr.if) {
      const condition = this.evaluateExpression(attr.if, context)
      if (!condition) {
        return undefined
      }
    }

    // Get type
    const type = attr.type

    if (!type) {
      throw new ParseError(`Missing type for attribute at ${path.join('.')}`)
    }

    // Parse by type
    if (typeof type === 'string') {
      if (isBuiltinType(type)) {
        return this.parseBuiltinType(type, context)
      } else {
        // User-defined type - not supported in streaming yet
        throw new ParseError(
          `User-defined types not yet supported in streaming: ${type}`
        )
      }
    }

    throw new ParseError(`Unsupported type at ${path.join('.')}`)
  }

  /**
   * Parse a built-in type.
   *
   * @param type - Type name
   * @param context - Execution context
   * @returns Parsed value
   * @private
   */
  private async parseBuiltinType(
    type: string,
    context: Context
  ): Promise<unknown> {
    const base = getBaseType(type)
    const typeEndian = getTypeEndianness(type)

    // Get endianness: type-specific > meta > default
    const metaEndian = this.schema.meta?.endian
    const endian =
      typeEndian || (typeof metaEndian === 'string' ? metaEndian : 'le')

    // Integer types
    if (isIntegerType(type)) {
      return this.readInteger(base, endian)
    }

    // Float types
    if (isFloatType(type)) {
      return this.readFloat(base, endian)
    }

    // String types
    if (isStringType(type)) {
      throw new ParseError(
        'String types require size/terminator - not yet implemented'
      )
    }

    throw new ParseError(`Unknown built-in type: ${type}`)
  }

  /**
   * Read integer value.
   *
   * @param base - Base type (u1, u2, etc.)
   * @param endian - Endianness
   * @returns Integer value
   * @private
   */
  private async readInteger(
    base: string,
    endian: string
  ): Promise<number | bigint> {
    switch (base) {
      case 'u1':
        return this.stream.readU1()
      case 's1':
        return this.stream.readS1()
      case 'u2':
        return endian === 'le' ? this.stream.readU2le() : this.stream.readU2be()
      case 's2':
        return endian === 'le' ? this.stream.readS2le() : this.stream.readS2be()
      case 'u4':
        return endian === 'le' ? this.stream.readU4le() : this.stream.readU4be()
      case 's4':
        return endian === 'le' ? this.stream.readS4le() : this.stream.readS4be()
      case 'u8':
        return endian === 'le' ? this.stream.readU8le() : this.stream.readU8be()
      default:
        throw new ParseError(`Unknown integer type: ${base}`)
    }
  }

  /**
   * Read float value.
   *
   * @param base - Base type (f4, f8)
   * @param endian - Endianness
   * @returns Float value
   * @private
   */
  private async readFloat(base: string, endian: string): Promise<number> {
    switch (base) {
      case 'f4':
        return endian === 'le' ? this.stream.readF4le() : this.stream.readF4be()
      case 'f8':
        return endian === 'le' ? this.stream.readF8le() : this.stream.readF8be()
      default:
        throw new ParseError(`Unknown float type: ${base}`)
    }
  }

  /**
   * Evaluate an expression.
   *
   * @param expr - Expression string
   * @param context - Execution context
   * @returns Evaluated result
   * @private
   */
  private evaluateExpression(expr: string, context: Context): unknown {
    try {
      return evaluateExpression(expr, context)
    } catch (error) {
      throw new ParseError(
        `Failed to evaluate expression "${expr}": ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
