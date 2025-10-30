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

// Import KsySchema for internal use
import type { KsySchema } from './parser/schema'

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
 * Compiled schema representation for reuse across multiple parsing operations.
 * Pre-compiling schemas eliminates redundant YAML parsing and validation overhead.
 *
 * @interface CompiledSchema
 * @example
 * ```typescript
 * const compiled = compileSchema(ksyYaml)
 * const result1 = parseWithSchema(compiled, data1)
 * const result2 = parseWithSchema(compiled, data2)
 * ```
 */
export interface CompiledSchema {
  /** Internal schema representation */
  readonly schema: KsySchema

  /** Metadata about compilation */
  readonly meta: {
    id: string
    compiledAt: Date
    validated: boolean
  }

  /** Type guard marker */
  readonly __compiled: true
}

/**
 * Options for compiling .ksy schemas.
 *
 * @interface CompileOptions
 */
export interface CompileOptions {
  /** Whether to validate the schema (default: true) */
  validate?: boolean

  /** Whether to treat warnings as errors (default: false) */
  strict?: boolean

  /** Map of import names to their YAML content */
  imports?: Map<string, string>
}

/**
 * Compile a Kaitai Struct schema for reuse across multiple parsing operations.
 * Pre-compiling eliminates redundant YAML parsing and validation overhead,
 * improving performance when parsing multiple binary files with the same schema.
 *
 * @param ksyYaml - YAML string containing the .ksy definition
 * @param options - Compilation options
 * @returns Compiled schema ready for parsing
 * @throws {ParseError} If YAML parsing fails
 * @throws {ValidationError} If schema validation fails
 *
 * @example
 * ```typescript
 * // Compile once
 * const compiled = compileSchema(ksyYaml, { validate: true })
 *
 * // Reuse for multiple files
 * const result1 = parseWithSchema(compiled, binaryData1)
 * const result2 = parseWithSchema(compiled, binaryData2)
 * ```
 */
export function compileSchema(
  ksyYaml: string,
  options: CompileOptions = {}
): CompiledSchema {
  const { validate = true, strict = false, imports } = options

  const parser = new KsyParser()
  const schema =
    imports && imports.size > 0
      ? parser.parseWithImports(ksyYaml, imports, { validate, strict })
      : parser.parse(ksyYaml, { validate, strict })

  return {
    schema,
    meta: {
      id: schema.meta.id,
      compiledAt: new Date(),
      validated: validate,
    },
    __compiled: true,
  }
}

/**
 * Parse binary data using a pre-compiled schema.
 * This function provides optimal performance when parsing multiple files
 * with the same schema by eliminating redundant compilation overhead.
 *
 * @param compiledSchema - Pre-compiled schema from compileSchema()
 * @param buffer - Binary data to parse (ArrayBuffer or Uint8Array)
 * @returns Parsed object with fields defined in the schema
 * @throws {EOFError} If unexpected end of stream is reached
 *
 * @example
 * ```typescript
 * const compiled = compileSchema(ksyYaml)
 * const result = parseWithSchema(compiled, binaryData)
 * console.log(result.fieldName)
 * ```
 */
export function parseWithSchema(
  compiledSchema: CompiledSchema,
  buffer: ArrayBuffer | Uint8Array
): Record<string, unknown> {
  const stream = new KaitaiStream(buffer)
  const interpreter = new TypeInterpreter(compiledSchema.schema)
  return interpreter.parse(stream)
}

/**
 * Type guard to check if a value is a compiled schema.
 *
 * @param value - Value to check
 * @returns True if value is a CompiledSchema
 */
function isCompiledSchema(value: unknown): value is CompiledSchema {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__compiled' in value &&
    'schema' in value
  )
}

/**
 * Parse binary data using a Kaitai Struct definition.
 * This is the main convenience function for parsing.
 *
 * Accepts either a YAML string or a pre-compiled schema for flexibility.
 * For optimal performance when parsing multiple files with the same schema,
 * use compileSchema() once and pass the result here, or use parseWithSchema().
 *
 * @param schemaOrYaml - YAML string or pre-compiled schema
 * @param buffer - Binary data to parse (ArrayBuffer or Uint8Array)
 * @param options - Parsing options (only used when schemaOrYaml is a string)
 * @returns Parsed object with fields defined in the .ksy file
 * @throws {ParseError} If YAML parsing fails
 * @throws {ValidationError} If schema validation fails
 * @throws {EOFError} If unexpected end of stream is reached
 *
 * @example
 * ```typescript
 * // Simple usage with YAML string
 * const result = parse(ksyYaml, binaryData)
 *
 * // Optimized usage with compiled schema
 * const compiled = compileSchema(ksyYaml)
 * const result = parse(compiled, binaryData)
 * ```
 */
export function parse(
  schemaOrYaml: string | CompiledSchema,
  buffer: ArrayBuffer | Uint8Array,
  options: ParseOptions = {}
): Record<string, unknown> {
  let schema: KsySchema

  if (isCompiledSchema(schemaOrYaml)) {
    // Use pre-compiled schema
    schema = schemaOrYaml.schema
  } else {
    // Parse YAML string
    const { validate = true, strict = false } = options
    const parser = new KsyParser()
    schema = parser.parse(schemaOrYaml, { validate, strict })
  }

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
