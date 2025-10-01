/**
 * @fileoverview Type interpreter for executing Kaitai Struct schemas
 * @module interpreter/TypeInterpreter
 * @author Fabiano Pinto
 * @license MIT
 */

import { KaitaiStream } from '../stream'
import { ParseError, ValidationError, NotImplementedError } from '../utils/errors'
import type {
  KsySchema,
  AttributeSpec,
  Endianness,
} from '../parser/schema'
import {
  isBuiltinType,
  getTypeEndianness,
  getBaseType,
  isIntegerType,
  isFloatType,
  isStringType,
} from '../parser/schema'
import { Context } from './Context'
// import { evaluateExpression } from '../expression' // TODO: Integrate expression evaluation

/**
 * Interprets Kaitai Struct schemas and parses binary data.
 * Executes schema definitions against binary streams to produce structured objects.
 *
 * @class TypeInterpreter
 * @example
 * ```typescript
 * const interpreter = new TypeInterpreter(schema)
 * const stream = new KaitaiStream(buffer)
 * const result = interpreter.parse(stream)
 * ```
 */
export class TypeInterpreter {
  /**
   * Create a new type interpreter.
   *
   * @param schema - Kaitai Struct schema to interpret
   * @param parentMeta - Parent schema's meta (for nested types)
   */
  constructor(
    private schema: KsySchema,
    private parentMeta?: { id: string; endian?: Endianness | object; encoding?: string }
  ) {
    // For root schemas, meta.id is required
    // For nested types, we can inherit from parent
    if (!schema.meta && !parentMeta) {
      throw new ParseError('Schema must have meta section')
    }
    if (schema.meta && !schema.meta.id && !parentMeta) {
      throw new ParseError('Root schema must have meta.id')
    }
  }

  /**
   * Parse binary data according to the schema.
   *
   * @param stream - Binary stream to parse
   * @param parent - Parent object (for nested types)
   * @returns Parsed object
   */
  parse(stream: KaitaiStream, parent?: unknown): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    const context = new Context(stream, result, parent)
    context.current = result

    // Parse sequential fields
    if (this.schema.seq) {
      for (const attr of this.schema.seq) {
        const value = this.parseAttribute(attr, context)
        if (attr.id) {
          result[attr.id] = value
        }
      }
    }

    // Note: Instances are lazy-evaluated, so we don't parse them here
    // They will be accessed via getters when needed

    return result
  }

  /**
   * Parse a single attribute according to its specification.
   *
   * @param attr - Attribute specification
   * @param context - Execution context
   * @returns Parsed value
   * @private
   */
  private parseAttribute(attr: AttributeSpec, context: Context): unknown {
    const stream = context.io

    // Handle conditional parsing
    if (attr.if) {
      // TODO: Evaluate condition
      // For now, we'll skip conditional parsing
      throw new NotImplementedError('Conditional parsing (if)')
    }

    // Handle absolute positioning
    if (attr.pos !== undefined) {
      const pos = typeof attr.pos === 'number' ? attr.pos : 0 // TODO: Evaluate expression
      stream.seek(pos)
    }

    // Handle custom I/O
    if (attr.io) {
      throw new NotImplementedError('Custom I/O streams')
    }

    // Handle repetition
    if (attr.repeat) {
      return this.parseRepeated(attr, context)
    }

    // Handle contents validation
    if (attr.contents) {
      return this.parseContents(attr, context)
    }

    // Parse single value
    return this.parseValue(attr, context)
  }

  /**
   * Parse a repeated attribute.
   *
   * @param attr - Attribute specification with repeat
   * @param context - Execution context
   * @returns Array of parsed values
   * @private
   */
  private parseRepeated(
    attr: AttributeSpec,
    context: Context
  ): unknown[] {
    const result: unknown[] = []
    const stream = context.io

    switch (attr.repeat) {
      case 'expr': {
        // Fixed number of repetitions
        const count =
          typeof attr['repeat-expr'] === 'number'
            ? attr['repeat-expr']
            : 0 // TODO: Evaluate expression
        for (let i = 0; i < count; i++) {
          // Set _index for expressions
          context.set('_index', i)
          result.push(this.parseValue(attr, context))
        }
        break
      }

      case 'eos': {
        // Repeat until end of stream
        while (!stream.isEof()) {
          context.set('_index', result.length)
          result.push(this.parseValue(attr, context))
        }
        break
      }

      case 'until': {
        // Repeat until condition is true
        if (!attr['repeat-until']) {
          throw new ParseError('repeat-until expression is required')
        }
        // TODO: Evaluate condition
        throw new NotImplementedError('repeat-until')
      }

      default:
        throw new ParseError(`Unknown repeat type: ${attr.repeat}`)
    }

    return result
  }

  /**
   * Parse and validate contents.
   *
   * @param attr - Attribute specification with contents
   * @param context - Execution context
   * @returns The validated contents
   * @private
   */
  private parseContents(
    attr: AttributeSpec,
    context: Context
  ): Uint8Array | string {
    const stream = context.io
    const expected = attr.contents!

    if (Array.isArray(expected)) {
      // Byte array contents
      const bytes = stream.readBytes(expected.length)
      for (let i = 0; i < expected.length; i++) {
        if (bytes[i] !== expected[i]) {
          throw new ValidationError(
            `Contents mismatch at byte ${i}: expected ${expected[i]}, got ${bytes[i]}`,
            stream.pos - expected.length + i
          )
        }
      }
      return bytes
    } else {
      // String contents
      const encoding = attr.encoding || this.schema.meta.encoding || 'UTF-8'
      const str = stream.readStr(expected.length, encoding)
      if (str !== expected) {
        throw new ValidationError(
          `Contents mismatch: expected "${expected}", got "${str}"`,
          stream.pos - expected.length
        )
      }
      return str
    }
  }

  /**
   * Parse a single value according to its type.
   *
   * @param attr - Attribute specification
   * @param context - Execution context
   * @returns Parsed value
   * @private
   */
  private parseValue(attr: AttributeSpec, context: Context): unknown {
    const stream = context.io
    const type = attr.type

    // Handle sized reads
    if (attr.size !== undefined) {
      const size = typeof attr.size === 'number' ? attr.size : 0 // TODO: Evaluate expression

      if (type === 'str' || !type) {
        // String or raw bytes
        const encoding = attr.encoding || this.schema.meta.encoding || 'UTF-8'
        if (type === 'str') {
          return stream.readStr(size, encoding)
        } else {
          return stream.readBytes(size)
        }
      } else {
        // Sized substream for complex type
        const substream = stream.substream(size)
        return this.parseType(type, substream, context)
      }
    }

    // Handle size-eos
    if (attr['size-eos']) {
      if (type === 'str') {
        const encoding = attr.encoding || this.schema.meta.encoding || 'UTF-8'
        const bytes = stream.readBytesFull()
        // eslint-disable-next-line no-undef
        return new TextDecoder(encoding).decode(bytes)
      } else {
        return stream.readBytesFull()
      }
    }

    // Handle type-based parsing
    if (!type) {
      throw new ParseError('Attribute must have either type, size, or contents')
    }

    return this.parseType(type, stream, context)
  }

  /**
   * Parse a value of a specific type.
   *
   * @param type - Type name or switch specification
   * @param stream - Stream to read from
   * @param context - Execution context
   * @returns Parsed value
   * @private
   */
  private parseType(
    type: string | object,
    stream: KaitaiStream,
    context: Context
  ): unknown {
    // Handle switch types
    if (typeof type === 'object') {
      throw new NotImplementedError('Switch types')
    }

    // Handle built-in types
    if (isBuiltinType(type)) {
      return this.parseBuiltinType(type, stream, context)
    }

    // Handle user-defined types
    if (this.schema.types && type in this.schema.types) {
      const typeSchema = this.schema.types[type]
      // Pass parent meta for nested types
      const meta = this.schema.meta || this.parentMeta
      const interpreter = new TypeInterpreter(typeSchema, meta)
      return interpreter.parse(stream, context.current)
    }

    throw new ParseError(`Unknown type: ${type}`)
  }

  /**
   * Parse a built-in type.
   *
   * @param type - Built-in type name
   * @param stream - Stream to read from
   * @param context - Execution context
   * @returns Parsed value
   * @private
   */
  private parseBuiltinType(
    type: string,
    stream: KaitaiStream,
    _context: Context
  ): unknown {
    const base = getBaseType(type)
    const typeEndian = getTypeEndianness(type)
    // Get endianness from schema or parent
    const meta = this.schema.meta || this.parentMeta
    const metaEndian = meta?.endian
    // Handle expression-based endianness (not yet implemented)
    const endian: Endianness = typeEndian || (typeof metaEndian === 'string' ? metaEndian : 'le')

    // Integer types
    if (isIntegerType(type)) {
      return this.readInteger(base, endian, stream)
    }

    // Float types
    if (isFloatType(type)) {
      return this.readFloat(base, endian, stream)
    }

    // String types
    if (isStringType(type)) {
      throw new ParseError(
        'String types require size, size-eos, or terminator'
      )
    }

    throw new ParseError(`Unknown built-in type: ${type}`)
  }

  /**
   * Read an integer value.
   *
   * @param type - Integer type (u1, u2, u4, u8, s1, s2, s4, s8)
   * @param endian - Endianness
   * @param stream - Stream to read from
   * @returns Integer value
   * @private
   */
  private readInteger(
    type: string,
    endian: Endianness,
    stream: KaitaiStream
  ): number | bigint {
    switch (type) {
      case 'u1':
        return stream.readU1()
      case 'u2':
        return endian === 'le' ? stream.readU2le() : stream.readU2be()
      case 'u4':
        return endian === 'le' ? stream.readU4le() : stream.readU4be()
      case 'u8':
        return endian === 'le' ? stream.readU8le() : stream.readU8be()
      case 's1':
        return stream.readS1()
      case 's2':
        return endian === 'le' ? stream.readS2le() : stream.readS2be()
      case 's4':
        return endian === 'le' ? stream.readS4le() : stream.readS4be()
      case 's8':
        return endian === 'le' ? stream.readS8le() : stream.readS8be()
      default:
        throw new ParseError(`Unknown integer type: ${type}`)
    }
  }

  /**
   * Read a floating point value.
   *
   * @param type - Float type (f4, f8)
   * @param endian - Endianness
   * @param stream - Stream to read from
   * @returns Float value
   * @private
   */
  private readFloat(
    type: string,
    endian: Endianness,
    stream: KaitaiStream
  ): number {
    switch (type) {
      case 'f4':
        return endian === 'le' ? stream.readF4le() : stream.readF4be()
      case 'f8':
        return endian === 'le' ? stream.readF8le() : stream.readF8be()
      default:
        throw new ParseError(`Unknown float type: ${type}`)
    }
  }
}
