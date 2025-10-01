/**
 * @fileoverview Parser for Kaitai Struct YAML (.ksy) files
 * @module parser/KsyParser
 * @author Fabiano Pinto
 * @license MIT
 */

import { parse as parseYaml } from 'yaml'
import { ParseError, ValidationError as KaitaiValidationError } from '../utils/errors'
import type {
  KsySchema,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './schema'

/**
 * Parser for Kaitai Struct YAML (.ksy) format definitions.
 * Converts YAML text into typed schema objects and validates them.
 *
 * @class KsyParser
 * @example
 * ```typescript
 * const parser = new KsyParser()
 * const schema = parser.parse(ksyYamlString)
 * ```
 */
export class KsyParser {
  /**
   * Parse a .ksy YAML string into a typed schema object.
   *
   * @param yaml - YAML string containing the .ksy definition
   * @param options - Parsing options
   * @returns Parsed and validated schema
   * @throws {ParseError} If YAML parsing fails
   * @throws {ValidationError} If schema validation fails
   */
  parse(
    yaml: string,
    options: ParseOptions = {}
  ): KsySchema {
    const { validate = true, strict = false } = options

    // Parse YAML
    let parsed: unknown
    try {
      parsed = parseYaml(yaml)
    } catch (error) {
      throw new ParseError(
        `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    // Ensure we have an object
    if (typeof parsed !== 'object' || parsed === null) {
      throw new ParseError('KSY file must contain an object')
    }

    const schema = parsed as KsySchema

    // Validate if requested
    if (validate) {
      const result = this.validate(schema, { strict })
      if (!result.valid) {
        const errorMessages = result.errors.map((e) => e.message).join('; ')
        throw new KaitaiValidationError(
          `Schema validation failed: ${errorMessages}`
        )
      }

      // Log warnings if any
      if (result.warnings.length > 0 && !strict) {
        // eslint-disable-next-line no-console
        console.warn(
          'Schema validation warnings:',
          result.warnings.map((w) => w.message)
        )
      }
    }

    return schema
  }

  /**
   * Validate a schema object.
   *
   * @param schema - Schema to validate
   * @param options - Validation options
   * @returns Validation result with errors and warnings
   */
  validate(
    schema: KsySchema,
    options: ValidationOptions = {}
  ): ValidationResult {
    const { strict = false, isNested = false } = options
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate meta section (required for root schemas, optional for nested)
    if (!schema.meta && !isNested) {
      errors.push({
        message: 'Missing required "meta" section',
        path: [],
        code: 'MISSING_META',
      })
    } else if (schema.meta) {
      // Validate meta.id (required)
      if (!schema.meta.id) {
        errors.push({
          message: 'Missing required "meta.id" field',
          path: ['meta'],
          code: 'MISSING_META_ID',
        })
      } else if (typeof schema.meta.id !== 'string') {
        errors.push({
          message: '"meta.id" must be a string',
          path: ['meta', 'id'],
          code: 'INVALID_META_ID_TYPE',
        })
      } else if (!/^[a-z][a-z0-9_]*$/.test(schema.meta.id)) {
        warnings.push({
          message:
            '"meta.id" should follow snake_case naming convention',
          path: ['meta', 'id'],
          code: 'META_ID_NAMING',
        })
      }

      // Validate endianness
      if (schema.meta.endian) {
        if (
          typeof schema.meta.endian === 'string' &&
          schema.meta.endian !== 'le' &&
          schema.meta.endian !== 'be'
        ) {
          errors.push({
            message: '"meta.endian" must be "le" or "be"',
            path: ['meta', 'endian'],
            code: 'INVALID_ENDIAN',
          })
        }
      }
    }

    // Validate seq section
    if (schema.seq) {
      if (!Array.isArray(schema.seq)) {
        errors.push({
          message: '"seq" must be an array',
          path: ['seq'],
          code: 'INVALID_SEQ_TYPE',
        })
      } else {
        schema.seq.forEach((attr, index) => {
          this.validateAttribute(attr as Record<string, unknown>, ['seq', String(index)], errors, warnings, strict)
        })
      }
    }

    // Validate instances section
    if (schema.instances) {
      if (typeof schema.instances !== 'object') {
        errors.push({
          message: '"instances" must be an object',
          path: ['instances'],
          code: 'INVALID_INSTANCES_TYPE',
        })
      } else {
        Object.entries(schema.instances).forEach(([key, instance]) => {
          this.validateAttribute(instance as Record<string, unknown>, ['instances', key], errors, warnings, strict)
        })
      }
    }

    // Validate types section
    if (schema.types) {
      if (typeof schema.types !== 'object') {
        errors.push({
          message: '"types" must be an object',
          path: ['types'],
          code: 'INVALID_TYPES_TYPE',
        })
      } else {
        Object.entries(schema.types).forEach(([key, type]) => {
          // Nested types don't require meta section
          const typeResult = this.validate(type, { ...options, isNested: true })
          errors.push(
            ...typeResult.errors.map((e) => ({
              ...e,
              path: ['types', key, ...e.path],
            }))
          )
          warnings.push(
            ...typeResult.warnings.map((w) => ({
              ...w,
              path: ['types', key, ...w.path],
            }))
          )
        })
      }
    }

    // Validate enums section
    if (schema.enums) {
      if (typeof schema.enums !== 'object') {
        errors.push({
          message: '"enums" must be an object',
          path: ['enums'],
          code: 'INVALID_ENUMS_TYPE',
        })
      }
    }

    return {
      valid: errors.length === 0 && (strict ? warnings.length === 0 : true),
      errors,
      warnings,
    }
  }

  /**
   * Validate an attribute specification.
   *
   * @param attr - Attribute to validate
   * @param path - Path to this attribute in the schema
   * @param errors - Array to collect errors
   * @param warnings - Array to collect warnings
   * @param strict - Whether to be strict about warnings
   * @private
   */
  private validateAttribute(
    attr: Record<string, unknown>,
    path: string[],
    errors: ValidationError[],
    warnings: ValidationWarning[],
    _strict: boolean
  ): void {
    // Validate id naming
    if (attr.id && typeof attr.id === 'string') {
      if (!/^[a-z][a-z0-9_]*$/.test(attr.id)) {
        warnings.push({
          message: `Field "${attr.id}" should follow snake_case naming convention`,
          path: [...path, 'id'],
          code: 'FIELD_ID_NAMING',
        })
      }
    }

    // Validate repeat
    if (attr.repeat) {
      if (
        attr.repeat !== 'expr' &&
        attr.repeat !== 'eos' &&
        attr.repeat !== 'until'
      ) {
        errors.push({
          message: '"repeat" must be "expr", "eos", or "until"',
          path: [...path, 'repeat'],
          code: 'INVALID_REPEAT',
        })
      }

      // Check for required fields based on repeat type
      if (attr.repeat === 'expr' && !attr['repeat-expr']) {
        errors.push({
          message: '"repeat-expr" is required when repeat is "expr"',
          path: [...path, 'repeat-expr'],
          code: 'MISSING_REPEAT_EXPR',
        })
      }

      if (attr.repeat === 'until' && !attr['repeat-until']) {
        errors.push({
          message: '"repeat-until" is required when repeat is "until"',
          path: [...path, 'repeat-until'],
          code: 'MISSING_REPEAT_UNTIL',
        })
      }
    }

    // Validate size-eos
    if (attr['size-eos'] && attr.size) {
      warnings.push({
        message: '"size-eos" and "size" are mutually exclusive',
        path: [...path],
        code: 'SIZE_EOS_WITH_SIZE',
      })
    }

    // Validate contents
    if (attr.contents) {
      if (
        !Array.isArray(attr.contents) &&
        typeof attr.contents !== 'string'
      ) {
        errors.push({
          message: '"contents" must be an array or string',
          path: [...path, 'contents'],
          code: 'INVALID_CONTENTS_TYPE',
        })
      }
    }
  }

  /**
   * Parse multiple .ksy files and resolve imports.
   *
   * @param mainYaml - Main .ksy file content
   * @param imports - Map of import names to their YAML content
   * @param options - Parsing options
   * @returns Parsed schema with resolved imports
   */
  parseWithImports(
    mainYaml: string,
    _imports: Map<string, string>,
    options: ParseOptions = {}
  ): KsySchema {
    // Parse main schema
    const mainSchema = this.parse(mainYaml, options)

    // TODO: Resolve imports
    // This will be implemented when we add import support

    return mainSchema
  }
}

/**
 * Options for parsing .ksy files.
 *
 * @interface ParseOptions
 */
export interface ParseOptions {
  /** Whether to validate the schema (default: true) */
  validate?: boolean

  /** Whether to treat warnings as errors (default: false) */
  strict?: boolean
}

/**
 * Options for schema validation.
 *
 * @interface ValidationOptions
 */
export interface ValidationOptions {
  /** Whether to treat warnings as errors (default: false) */
  strict?: boolean

  /** Whether this is a nested type (meta section optional) (default: false) */
  isNested?: boolean
}
