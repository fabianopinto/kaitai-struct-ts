/**
 * @fileoverview Type definitions for Kaitai Struct YAML schema (.ksy files)
 * @module parser/schema
 * @author Fabiano Pinto
 * @license MIT
 */

/**
 * Root schema definition for a Kaitai Struct format.
 * Represents a complete .ksy file structure.
 *
 * @interface KsySchema
 * @example
 * ```typescript
 * const schema: KsySchema = {
 *   meta: {
 *     id: 'my_format',
 *     endian: 'le'
 *   },
 *   seq: [
 *     { id: 'magic', contents: [0x4D, 0x5A] },
 *     { id: 'version', type: 'u2' }
 *   ]
 * }
 * ```
 */
export interface KsySchema {
  /** Metadata about the format */
  meta: MetaSpec

  /** Sequential attributes (fields read in order) */
  seq?: AttributeSpec[]

  /** Named instances (lazy-evaluated fields) */
  instances?: Record<string, InstanceSpec>

  /** Nested type definitions */
  types?: Record<string, KsySchema>

  /** Enum definitions (named integer constants) */
  enums?: Record<string, EnumSpec>

  /** Documentation for this type */
  doc?: string

  /** Reference to documentation */
  'doc-ref'?: string | string[]

  /** Parameters for parametric types */
  params?: ParamSpec[]
}

/**
 * Metadata section of a Kaitai Struct schema.
 * Contains information about the format itself.
 *
 * @interface MetaSpec
 */
export interface MetaSpec {
  /** Identifier for this format (required) */
  id: string

  /** Title/name of the format */
  title?: string

  /** Application that uses this format */
  application?: string | string[]

  /** File extension(s) for this format */
  'file-extension'?: string | string[]

  /** MIME type(s) for this format */
  xref?: Record<string, string | string[]>

  /** License for the format specification */
  license?: string

  /** KS compatibility version */
  'ks-version'?: string | number

  /** Debug mode flag */
  'ks-debug'?: boolean

  /** Opaque types flag */
  'ks-opaque-types'?: boolean

  /** Default endianness for the format */
  endian?: Endianness | EndianExpression

  /** Default encoding for strings */
  encoding?: string

  /** Imported type definitions */
  imports?: string[]

  /** Documentation */
  doc?: string

  /** Reference to documentation */
  'doc-ref'?: string | string[]
}

/**
 * Endianness specification.
 */
export type Endianness = 'le' | 'be'

/**
 * Expression-based endianness (switch on expression).
 *
 * @interface EndianExpression
 */
export interface EndianExpression {
  /** Expression to evaluate */
  'switch-on': string

  /** Cases mapping values to endianness */
  cases: Record<string, Endianness>
}

/**
 * Attribute specification for sequential fields.
 * Describes how to read a single field from the stream.
 *
 * @interface AttributeSpec
 */
export interface AttributeSpec {
  /** Field identifier (name) */
  id?: string

  /** Data type to read */
  type?: string | SwitchType

  /** Arguments for parametric types */
  'type-args'?: Array<string | number | boolean>

  /** Size of the field (in bytes or expression) */
  size?: number | string

  /** Size until specific byte value */
  'size-eos'?: boolean

  /** Repeat specification */
  repeat?: RepeatSpec

  /** Number of repetitions (for repeat: expr) */
  'repeat-expr'?: string | number

  /** Condition for repetition (for repeat: until) */
  'repeat-until'?: string

  /** Conditional parsing */
  if?: string

  /** Expected contents (validation) */
  contents?: number[] | string

  /** String encoding */
  encoding?: string

  /** Pad right to alignment */
  'pad-right'?: number

  /** Terminator byte for strings/arrays */
  terminator?: number

  /** Include terminator in result */
  include?: boolean

  /** Consume terminator from stream */
  consume?: boolean

  /** Throw error if terminator not found */
  'eos-error'?: boolean

  /** Enum type name */
  enum?: string

  /** Absolute position to seek to */
  pos?: number | string

  /** Custom I/O stream */
  io?: string

  /** Processing directive (compression, encryption, etc.) */
  process?: string | ProcessSpec

  /** Documentation */
  doc?: string

  /** Reference to documentation */
  'doc-ref'?: string | string[]

  /** Original field ID (for reference) */
  '-orig-id'?: string
}

/**
 * Instance specification for lazy-evaluated fields.
 * Similar to AttributeSpec but for instances section.
 *
 * @interface InstanceSpec
 */
export interface InstanceSpec extends Omit<AttributeSpec, 'id'> {
  /** Value instance (calculated field) */
  value?: string | number | boolean

  /** Position in stream (for pos instances) */
  pos?: number | string

  /** Custom I/O stream */
  io?: string
}

/**
 * Repeat specification types.
 */
export type RepeatSpec = 'expr' | 'eos' | 'until'

/**
 * Switch-based type selection.
 * Allows different types based on an expression value.
 *
 * @interface SwitchType
 */
export interface SwitchType {
  /** Expression to evaluate for switching */
  'switch-on': string

  /** Cases mapping values to types */
  cases: Record<string, string>

  /** Default type if no case matches */
  default?: string
}

/**
 * Processing specification for data transformation.
 *
 * @type ProcessSpec
 */
export type ProcessSpec = string | ProcessObject

/**
 * Processing object with algorithm and parameters.
 *
 * @interface ProcessObject
 */
export interface ProcessObject {
  /** Processing algorithm */
  algorithm: string

  /** Algorithm parameters */
  [key: string]: unknown
}

/**
 * Enum specification (named integer constants).
 *
 * @type EnumSpec
 */
export type EnumSpec = Record<string | number, string | number>

/**
 * Parameter specification for parametric types.
 *
 * @interface ParamSpec
 */
export interface ParamSpec {
  /** Parameter identifier */
  id: string

  /** Parameter type */
  type?: string

  /** Documentation */
  doc?: string

  /** Reference to documentation */
  'doc-ref'?: string | string[]
}

/**
 * Validation result for schema validation.
 *
 * @interface ValidationResult
 */
export interface ValidationResult {
  /** Whether the schema is valid */
  valid: boolean

  /** Validation errors */
  errors: ValidationError[]

  /** Validation warnings */
  warnings: ValidationWarning[]
}

/**
 * Validation error.
 *
 * @interface ValidationError
 */
export interface ValidationError {
  /** Error message */
  message: string

  /** Path to the error in the schema */
  path: string[]

  /** Error code */
  code: string
}

/**
 * Validation warning.
 *
 * @interface ValidationWarning
 */
export interface ValidationWarning {
  /** Warning message */
  message: string

  /** Path to the warning in the schema */
  path: string[]

  /** Warning code */
  code: string
}

/**
 * Built-in Kaitai Struct types.
 */
export const BUILTIN_TYPES = [
  // Unsigned integers
  'u1',
  'u2',
  'u2le',
  'u2be',
  'u4',
  'u4le',
  'u4be',
  'u8',
  'u8le',
  'u8be',
  // Signed integers
  's1',
  's2',
  's2le',
  's2be',
  's4',
  's4le',
  's4be',
  's8',
  's8le',
  's8be',
  // Floating point
  'f4',
  'f4le',
  'f4be',
  'f8',
  'f8le',
  'f8be',
  // String
  'str',
  'strz',
] as const

/**
 * Type guard to check if a type is a built-in type.
 *
 * @param type - Type name to check
 * @returns True if the type is built-in
 */
export function isBuiltinType(type: string): boolean {
  if ((BUILTIN_TYPES as readonly string[]).includes(type)) return true
  // Bit field types: b1, b2, ..., b64
  if (/^b\d+$/.test(type)) return true
  return false
}

/**
 * Get the default endianness for a type.
 * Returns the endianness suffix if present, otherwise undefined.
 *
 * @param type - Type name
 * @returns Endianness ('le', 'be', or undefined for default)
 */
export function getTypeEndianness(type: string): Endianness | undefined {
  if (type.endsWith('le')) return 'le'
  if (type.endsWith('be')) return 'be'
  return undefined
}

/**
 * Get the base type without endianness suffix.
 *
 * @param type - Type name
 * @returns Base type name
 * @example
 * ```typescript
 * getBaseType('u4le') // returns 'u4'
 * getBaseType('s2be') // returns 's2'
 * getBaseType('str')  // returns 'str'
 * ```
 */
export function getBaseType(type: string): string {
  if (type.endsWith('le') || type.endsWith('be')) {
    return type.slice(0, -2)
  }
  return type
}

/**
 * Check if a type is an integer type.
 *
 * @param type - Type name
 * @returns True if the type is an integer
 */
export function isIntegerType(type: string): boolean {
  const base = getBaseType(type)
  return /^[us][1248]$/.test(base)
}

/**
 * Check if a type is a floating point type.
 *
 * @param type - Type name
 * @returns True if the type is a float
 */
export function isFloatType(type: string): boolean {
  const base = getBaseType(type)
  return /^f[48]$/.test(base)
}

/**
 * Check if a type is a string type.
 *
 * @param type - Type name
 * @returns True if the type is a string
 */
export function isStringType(type: string): boolean {
  return type === 'str' || type === 'strz'
}
