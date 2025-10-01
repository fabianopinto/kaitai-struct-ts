/**
 * @fileoverview Main entry point for kaitai-struct-ts library
 * @module kaitai-struct-ts
 * @author Fabiano Pinto
 * @license MIT
 * @version 0.2.0
 *
 * @description
 * A runtime interpreter for Kaitai Struct binary format definitions in TypeScript.
 * Parse any binary data format by providing a .ksy (Kaitai Struct YAML) definition file.
 *
 * @example
 * ```typescript
 * import { parse } from 'kaitai-struct-ts'
 *
 * const ksyDefinition = `
 * meta:
 *   id: my_format
 *   endian: le
 * seq:
 *   - id: magic
 *     contents: [0x4D, 0x5A]
 *   - id: version
 *     type: u2
 * `
 *
 * const buffer = new Uint8Array([0x4D, 0x5A, 0x01, 0x00])
 * const result = parse(ksyDefinition, buffer)
 * console.log(result.version) // 1
 * ```
 */

import { KaitaiStream } from './stream'
import { KsyParser } from './parser'
import { TypeInterpreter } from './interpreter'

// Export main classes
export { KaitaiStream } from './stream'
export { KsyParser } from './parser'
export { TypeInterpreter } from './interpreter'
export { Context } from './interpreter'

// Export types from schema
export type {
  KsySchema,
  MetaSpec,
  AttributeSpec,
  InstanceSpec,
  SwitchType,
  EnumSpec,
  ParamSpec,
  Endianness,
  EndianExpression,
  RepeatSpec,
  ProcessSpec,
  ProcessObject,
  ValidationResult,
  ValidationError as SchemaValidationError,
  ValidationWarning,
} from './parser/schema'

export {
  BUILTIN_TYPES,
  isBuiltinType,
  getTypeEndianness,
  getBaseType,
  isIntegerType,
  isFloatType,
  isStringType,
} from './parser/schema'

// Export error classes
export * from './utils/errors'

/**
 * Parse binary data using a Kaitai Struct definition.
 * This is the main convenience function for parsing.
 *
 * @param ksyYaml - YAML string containing the .ksy definition
 * @param buffer - Binary data to parse (ArrayBuffer or Uint8Array)
 * @param options - Parsing options
 * @returns Parsed object with fields defined in the .ksy file
 * @throws {ParseError} If YAML parsing fails
 * @throws {ValidationError} If schema validation fails
 * @throws {EOFError} If unexpected end of stream is reached
 *
 * @example
 * ```typescript
 * const result = parse(ksyYaml, binaryData)
 * console.log(result.fieldName)
 * ```
 */
export function parse(
  ksyYaml: string,
  buffer: ArrayBuffer | Uint8Array,
  options: ParseOptions = {}
): Record<string, unknown> {
  const { validate = true, strict = false } = options

  // Parse the KSY schema
  const parser = new KsyParser()
  const schema = parser.parse(ksyYaml, { validate, strict })

  // Create a stream from the buffer
  const stream = new KaitaiStream(buffer)

  // Create an interpreter and parse
  const interpreter = new TypeInterpreter(schema)
  return interpreter.parse(stream)
}

/**
 * Options for the parse function.
 *
 * @interface ParseOptions
 */
export interface ParseOptions {
  /** Whether to validate the schema (default: true) */
  validate?: boolean

  /** Whether to treat warnings as errors (default: false) */
  strict?: boolean
}
