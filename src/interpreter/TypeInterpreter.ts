/**
 * @fileoverview Type interpreter for executing Kaitai Struct schemas
 * @module interpreter/TypeInterpreter
 * @author Fabiano Pinto
 * @license MIT
 */

import { KaitaiStream } from '../stream/KaitaiStream'
import {
  KsySchema,
  AttributeSpec,
  Endianness,
  isBuiltinType,
  getBaseType,
  getTypeEndianness,
  isIntegerType,
  isFloatType,
  isStringType,
} from '../parser/schema'
import { Context } from './Context'
import { evaluateExpression } from '../expression'
import { ParseError, ValidationError } from '../utils/errors'
import { applyProcess } from '../utils/process'

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
    private parentMeta?: {
      id: string
      endian?: Endianness | object
      encoding?: string
    }
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
   * Safely extract a KaitaiStream from an object that may expose `_io`.
   * Avoids using `any` casts to satisfy linting.
   */
  private static getKaitaiIO(val: unknown): KaitaiStream | null {
    if (val && typeof val === 'object') {
      const rec = val as Record<string, unknown>
      const maybe = rec['_io']
      if (maybe instanceof KaitaiStream) return maybe
    }
    return null
  }

  /**
   * Parse binary data according to the schema.
   *
   * @param stream - Binary stream to parse
   * @param parent - Parent object (for nested types)
   * @param typeArgs - Arguments for parametric types
   * @param root - Root object of the parse tree (for nested types)
   * @returns Parsed object
   */
  parse(
    stream: KaitaiStream,
    parent?: unknown,
    typeArgs?: Array<string | number | boolean>,
    root?: unknown
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    
    // For top-level parse, result is the root; for nested, use provided root
    const actualRoot = root || result
    const context = new Context(stream, actualRoot, parent, this.schema.enums)
    context.current = result

    // Track starting position for _sizeof calculation
    const startPos = stream.pos

    // Expose current stream for use in expressions (e.g., slot._io)
    ;(result as Record<string, unknown>)['_io'] = stream
    
    // Expose root for nested types
    if (root) {
      ;(result as Record<string, unknown>)['_root'] = root
    }

    // Set parameters in context if this is a parametric type
    if (typeArgs && this.schema.params) {
      for (
        let i = 0;
        i < this.schema.params.length && i < typeArgs.length;
        i++
      ) {
        const param = this.schema.params[i]
        const argValue = typeArgs[i]
        // Evaluate the argument if it's a string expression
        const evaluatedArg =
          typeof argValue === 'string'
            ? this.evaluateValue(argValue, context)
            : argValue
        context.set(param.id, evaluatedArg)
      }
    }

    // Parse sequential fields
    if (this.schema.seq) {
      for (const attr of this.schema.seq) {
        const value = this.parseAttribute(attr, context)
        if (attr.id) {
          result[attr.id] = value
        }
      }
    }

    // Calculate and store _sizeof (number of bytes consumed)
    const endPos = stream.pos
    ;(result as Record<string, unknown>)['_sizeof'] = endPos - startPos

    // Set up lazy-evaluated instances
    if (this.schema.instances) {
      this.setupInstances(result, stream, context)
    }

    return result
  }

  /**
   * Set up lazy-evaluated instance getters.
   * Instances are computed on first access and cached.
   *
   * @param result - Result object to add getters to
   * @param stream - Stream for parsing
   * @param context - Execution context
   * @private
   */
  private setupInstances(
    result: Record<string, unknown>,
    stream: KaitaiStream,
    context: Context
  ): void {
    if (!this.schema.instances) return

    for (const [name, instance] of Object.entries(this.schema.instances)) {
      // Cache for lazy evaluation
      let cached: unknown = undefined
      let evaluated = false

      Object.defineProperty(result, name, {
        get: () => {
          if (!evaluated) {
            cached = this.parseInstance(
              instance as Record<string, unknown>,
              stream,
              context
            )
            evaluated = true
          }
          return cached
        },
        enumerable: true,
        configurable: true,
      })
    }
  }

  /**
   * Parse an instance (lazy-evaluated field).
   *
   * @param instance - Instance specification
   * @param stream - Stream to read from
   * @param context - Execution context
   * @returns Parsed or calculated value
   * @private
   */
  private parseInstance(
    instance: AttributeSpec & { value?: string | number | boolean },
    stream: KaitaiStream,
    context: Context
  ): unknown {
    // Handle value instances (calculated fields)
    if ('value' in instance) {
      return this.evaluateValue(
        instance.value as string | number | boolean | undefined,
        context
      )
    }

    // Save current position
    const savedPos = stream.pos

    try {
      // Handle pos attribute for positioned reads
      if (instance.pos !== undefined) {
        const pos = this.evaluateValue(
          instance.pos as string | number | boolean | undefined,
          context
        )
        if (typeof pos === 'number') {
          stream.seek(pos)
        } else if (typeof pos === 'bigint') {
          stream.seek(Number(pos))
        } else {
          throw new ParseError(
            `pos must evaluate to a number, got ${typeof pos}`
          )
        }
      }

      // Parse as a regular attribute
      const value = this.parseAttribute(instance, context)
      return value
    } finally {
      // Restore position if pos was used
      if (instance.pos !== undefined) {
        stream.seek(savedPos)
      }
    }
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
    // Determine the stream to use (support custom I/O via attr.io)
    let stream: KaitaiStream = context.io
    if (attr.io !== undefined) {
      const ioVal = this.evaluateValue(attr.io, context)
      if (ioVal instanceof KaitaiStream) {
        stream = ioVal
      } else {
        const kio = TypeInterpreter.getKaitaiIO(ioVal)
        if (kio) {
          stream = kio
        } else {
          throw new ParseError(
            'io must evaluate to a KaitaiStream or an object with _io'
          )
        }
      }
    }

    // Handle conditional parsing
    if (attr.if) {
      const condition = this.evaluateValue(attr.if, context)
      // If condition is false or falsy, skip this attribute
      if (!condition) {
        return undefined
      }
    }

    // Handle absolute positioning
    if (attr.pos !== undefined) {
      const pos = this.evaluateValue(attr.pos, context)
      if (typeof pos === 'number') {
        stream.seek(pos)
      } else if (typeof pos === 'bigint') {
        stream.seek(Number(pos))
      } else {
        throw new ParseError(`pos must evaluate to a number, got ${typeof pos}`)
      }
    }

    // Custom I/O handled above by selecting stream

    // Handle repetition
    if (attr.repeat) {
      return this.parseRepeated(attr, context)
    }

    // Handle contents validation
    if (attr.contents) {
      return this.parseContents(attr, context)
    }

    // Parse single value
    const value = this.parseValue(attr, context)

    // Note: We don't apply enum mapping here to keep values as integers
    // This allows enum comparisons in expressions to work correctly
    // Enum mapping should be done at the presentation layer if needed

    return value
  }

  /**
   * Parse a repeated attribute.
   *
   * @param attr - Attribute specification with repeat
   * @param context - Execution context
   * @returns Array of parsed values
   * @private
   */
  private parseRepeated(attr: AttributeSpec, context: Context): unknown[] {
    const stream = context.io
    const result: unknown[] = []

    switch (attr.repeat) {
      case 'expr': {
        // Fixed number of repetitions
        const countValue = this.evaluateValue(attr['repeat-expr'], context)
        const count =
          typeof countValue === 'number'
            ? countValue
            : typeof countValue === 'bigint'
              ? Number(countValue)
              : 0

        if (count < 0) {
          throw new ParseError(`repeat-expr must be non-negative, got ${count}`)
        }

        for (let i = 0; i < count; i++) {
          // Set _index for expressions
          context.set('_index', i)
          const value = this.parseAttribute(
            { ...attr, repeat: undefined, 'repeat-expr': undefined },
            context
          )
          result.push(value)
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

        let index = 0
        while (true) {
          context.set('_index', index)

          // Parse the value first
          const value = this.parseAttribute(
            { ...attr, repeat: undefined, 'repeat-until': undefined },
            context
          )
          result.push(value)

          // Set _ to the last parsed value for the condition
          context.set('_', value)

          // Evaluate the condition
          const condition = this.evaluateValue(attr['repeat-until'], context)

          // Break if condition is true
          if (condition) {
            break
          }

          // Check for EOF to prevent infinite loops
          if (stream.isEof()) {
            break
          }

          index++
        }
        break
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
      const encoding =
        attr.encoding ||
        this.schema.meta?.encoding ||
        this.parentMeta?.encoding ||
        'UTF-8'
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
      const sizeValue = this.evaluateValue(attr.size, context)
      const size =
        typeof sizeValue === 'number'
          ? sizeValue
          : typeof sizeValue === 'bigint'
            ? Number(sizeValue)
            : 0

      if (size < 0) {
        throw new ParseError(`size must be non-negative, got ${size}`)
      }

      if (type === 'str' || !type) {
        // String or raw bytes
        const encoding =
          attr.encoding ||
          this.schema.meta?.encoding ||
          this.parentMeta?.encoding ||
          'UTF-8'
        let data: Uint8Array
        if (type === 'str') {
          data = stream.readBytes(size)
          // Apply processing if specified
          if (attr.process) {
            data = this.applyProcessing(data, attr.process)
          }
          // eslint-disable-next-line no-undef
          return new TextDecoder(encoding).decode(data)
        } else {
          data = stream.readBytes(size)
          // Apply processing if specified
          if (attr.process) {
            data = this.applyProcessing(data, attr.process)
          }
          return data
        }
      } else {
        // Sized substream for complex type
        let data = stream.readBytes(size)
        // Apply processing if specified
        if (attr.process) {
          data = this.applyProcessing(data, attr.process)
        }
        const substream = new KaitaiStream(data)
        return this.parseType(type, substream, context, attr['type-args'])
      }
    }

    // Handle size-eos
    if (attr['size-eos']) {
      if (type === 'str') {
        const encoding =
          attr.encoding ||
          this.schema.meta?.encoding ||
          this.parentMeta?.encoding ||
          'UTF-8'
        const bytes = stream.readBytesFull()
        // eslint-disable-next-line no-undef
        return new TextDecoder(encoding).decode(bytes)
      } else {
        let bytes = stream.readBytesFull()
        // Apply processing if specified
        if (attr.process) {
          bytes = this.applyProcessing(bytes, attr.process)
        }
        if (type) {
          const sub = new KaitaiStream(bytes)
          return this.parseType(type, sub, context, attr['type-args'])
        }
        return bytes
      }
    }

    // Handle type-based parsing
    if (!type) {
      throw new ParseError('Attribute must have either type, size, or contents')
    }

    return this.parseType(type, stream, context, attr['type-args'])
  }

  /**
   * Parse a value of a specific type.
   *
   * @param type - Type name or switch specification
   * @param stream - Stream to read from
   * @param context - Execution context
   * @param typeArgs - Arguments for parametric types
   * @returns Parsed value
   * @private
   */
  private parseType(
    type: string | object,
    stream: KaitaiStream,
    context: Context,
    typeArgs?: Array<string | number | boolean>
  ): unknown {
    // Handle switch types
    if (typeof type === 'object') {
      return this.parseSwitchType(
        type as Record<string, unknown>,
        stream,
        context
      )
    }

    // Parse parameterized type syntax: type_name(arg1, arg2, ...)
    const { typeName, args } = this.parseParameterizedType(type, context)
    const effectiveArgs = args.length > 0 ? args : typeArgs

    // Handle built-in types
    if (isBuiltinType(typeName)) {
      return this.parseBuiltinType(typeName, stream, context)
    }

    // Handle user-defined types
    if (this.schema.types && typeName in this.schema.types) {
      const typeSchema = this.schema.types[typeName]
      // Pass parent meta for nested types
      const meta = this.schema.meta || this.parentMeta

      // Inherit parent enums if nested type doesn't have its own
      if (this.schema.enums && !typeSchema.enums) {
        typeSchema.enums = this.schema.enums
      }

      // Inherit parent types if nested type doesn't have its own
      if (this.schema.types && !typeSchema.types) {
        typeSchema.types = this.schema.types
      }

      const interpreter = new TypeInterpreter(typeSchema, meta)
      return interpreter.parse(stream, context.current, effectiveArgs, context.root)
    }

    throw new ParseError(`Unknown type: ${typeName}`)
  }

  /**
   * Parse parameterized type syntax and extract type name and arguments.
   * Supports: type_name(arg1, arg2, ...) or just type_name
   *
   * @param typeSpec - Type specification string
   * @param context - Execution context for evaluating argument expressions
   * @returns Object with typeName and evaluated args
   * @private
   */
  private parseParameterizedType(
    typeSpec: string,
    context: Context
  ): { typeName: string; args: Array<string | number | boolean> } {
    // Check if type has parameters: type_name(...)
    const match = typeSpec.match(/^([a-z_][a-z0-9_]*)\((.*)\)$/i)

    if (!match) {
      // No parameters, return as-is
      return { typeName: typeSpec, args: [] }
    }

    const typeName = match[1]
    const argsString = match[2].trim()

    if (!argsString) {
      // Empty parameters: type_name()
      return { typeName, args: [] }
    }

    // Parse arguments - handle strings, numbers, booleans, and expressions
    const args: Array<string | number | boolean> = []
    let current = ''
    let inString = false
    let stringChar = ''
    let parenDepth = 0

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i]

      if (inString) {
        current += char
        if (char === stringChar && argsString[i - 1] !== '\\') {
          inString = false
        }
      } else if (char === '"' || char === "'") {
        inString = true
        stringChar = char
        current += char
      } else if (char === '(') {
        parenDepth++
        current += char
      } else if (char === ')') {
        parenDepth--
        current += char
      } else if (char === ',' && parenDepth === 0) {
        // Argument separator
        args.push(this.parseArgument(current.trim(), context))
        current = ''
      } else {
        current += char
      }
    }

    // Add last argument
    if (current.trim()) {
      args.push(this.parseArgument(current.trim(), context))
    }

    return { typeName, args }
  }

  /**
   * Parse and evaluate a single type argument.
   *
   * @param arg - Argument string
   * @param context - Execution context
   * @returns Evaluated argument value
   * @private
   */
  private parseArgument(
    arg: string,
    context: Context
  ): string | number | boolean {
    // Boolean literals
    if (arg === 'true') return true
    if (arg === 'false') return false

    // String literals
    if (
      (arg.startsWith('"') && arg.endsWith('"')) ||
      (arg.startsWith("'") && arg.endsWith("'"))
    ) {
      return arg.slice(1, -1)
    }

    // Numeric literals
    if (/^-?\d+$/.test(arg)) {
      return parseInt(arg, 10)
    }
    if (/^-?\d+\.\d+$/.test(arg)) {
      return parseFloat(arg)
    }
    if (/^0x[0-9a-f]+$/i.test(arg)) {
      return parseInt(arg, 16)
    }

    // Expression - evaluate in context
    try {
      const result = this.evaluateValue(arg, context)
      // Convert to primitive types
      if (
        typeof result === 'string' ||
        typeof result === 'number' ||
        typeof result === 'boolean'
      ) {
        return result
      }
      // For other types, convert to number if possible
      return Number(result)
    } catch {
      // If evaluation fails, treat as string
      return arg
    }
  }

  /**
   * Parse a switch type (type selection based on expression).
   *
   * @param switchType - Switch type specification
   * @param stream - Stream to read from
   * @param context - Execution context
   * @returns Parsed value
   * @private
   */
  private parseSwitchType(
    switchType: Record<string, unknown>,
    stream: KaitaiStream,
    context: Context
  ): unknown {
    const switchOn = switchType['switch-on']
    const cases = switchType['cases'] as Record<string, string> | undefined
    const defaultType = switchType['default'] as string | undefined

    if (!switchOn || typeof switchOn !== 'string') {
      throw new ParseError('switch-on expression is required for switch types')
    }

    if (!cases) {
      throw new ParseError('cases are required for switch types')
    }

    // Evaluate the switch expression
    const switchValue = this.evaluateValue(switchOn, context)

    // Convert switch value to string for case matching
    const switchKey = String(switchValue)

    // Find matching case
    let selectedType: string | undefined = cases[switchKey]

    // Use default if no case matches
    if (selectedType === undefined && defaultType) {
      selectedType = defaultType
    }

    if (selectedType === undefined) {
      throw new ParseError(
        `No matching case for switch value "${switchKey}" and no default type specified`
      )
    }

    // Parse using the selected type
    return this.parseType(selectedType, stream, context)
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
    const endian: Endianness =
      typeEndian || (typeof metaEndian === 'string' ? metaEndian : 'le')

    // Integer types
    if (isIntegerType(type)) {
      return this.readInteger(base, endian, stream)
    }

    // Float types
    if (isFloatType(type)) {
      return this.readFloat(base, endian, stream)
    }

    // Bit field types: b1, b2, ..., b64 (default bit-endian: BE)
    if (/^b\d+$/.test(type)) {
      const n = parseInt(type.slice(1), 10)
      const val = stream.readBitsIntBe(n)
      // Return number when safely representable, else BigInt
      const maxSafe = BigInt(Number.MAX_SAFE_INTEGER)
      return val <= maxSafe ? Number(val) : val
    }

    // String types
    if (isStringType(type)) {
      const encoding = this.schema.meta?.encoding || 'UTF-8'

      if (type === 'strz') {
        // Null-terminated string with default parameters
        return stream.readStrz(encoding, 0, false, true, true)
      } else if (type === 'str') {
        // str type requires size, size-eos, or terminator
        throw new ParseError(
          'str type requires size, size-eos, or terminator attribute'
        )
      }
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

  /**
   * Apply processing transformation to data.
   * Delegates to the process utility module.
   *
   * @param data - Data to process
   * @param process - Processing specification
   * @returns Processed data
   * @private
   */
  private applyProcessing(
    data: Uint8Array,
    process: string | Record<string, unknown>
  ): Uint8Array {
    return applyProcess(data, process)
  }

  /**
   * Evaluate a value that can be an expression or literal.
   *
   * @param value - Value to evaluate (expression string, number, or boolean)
   * @param context - Execution context
   * @returns Evaluated result
   * @private
   */
  private evaluateValue(
    value: string | number | boolean | undefined,
    context: Context
  ): unknown {
    if (value === undefined) {
      return undefined
    }

    // If it's a number or boolean, return as-is
    if (typeof value === 'number' || typeof value === 'boolean') {
      return value
    }

    // If it's a string, evaluate as expression
    if (typeof value === 'string') {
      try {
        return evaluateExpression(value, context)
      } catch (error) {
        throw new ParseError(
          `Failed to evaluate expression "${value}": ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    return value
  }
}
