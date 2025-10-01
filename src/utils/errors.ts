/**
 * @fileoverview Custom error classes for Kaitai Struct parsing and validation
 * @module utils/errors
 * @author Fabiano Pinto
 * @license MIT
 */

/**
 * Base error class for all Kaitai Struct errors.
 * All custom errors in this library extend from this class.
 *
 * @class KaitaiError
 * @extends Error
 * @example
 * ```typescript
 * throw new KaitaiError('Something went wrong', 42)
 * ```
 */
export class KaitaiError extends Error {
  constructor(
    message: string,
    public position?: number
  ) {
    super(message)
    this.name = 'KaitaiError'
    Object.setPrototypeOf(this, KaitaiError.prototype)
  }
}

/**
 * Error thrown when validation fails.
 * Used when parsed data doesn't match expected constraints.
 *
 * @class ValidationError
 * @extends KaitaiError
 * @example
 * ```typescript
 * throw new ValidationError('Magic bytes mismatch', 0)
 * ```
 */
export class ValidationError extends KaitaiError {
  constructor(message: string, position?: number) {
    super(message, position)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Error thrown when parsing fails.
 * Used for general parsing errors that don't fit other categories.
 *
 * @class ParseError
 * @extends KaitaiError
 * @example
 * ```typescript
 * throw new ParseError('Invalid format structure', 100)
 * ```
 */
export class ParseError extends KaitaiError {
  constructor(message: string, position?: number) {
    super(message, position)
    this.name = 'ParseError'
    Object.setPrototypeOf(this, ParseError.prototype)
  }
}

/**
 * Error thrown when end of stream is reached unexpectedly.
 * Indicates an attempt to read beyond available data.
 *
 * @class EOFError
 * @extends KaitaiError
 * @example
 * ```typescript
 * throw new EOFError('Unexpected end of stream', 1024)
 * ```
 */
export class EOFError extends KaitaiError {
  constructor(message: string = 'Unexpected end of stream', position?: number) {
    super(message, position)
    this.name = 'EOFError'
    Object.setPrototypeOf(this, EOFError.prototype)
  }
}

/**
 * Error thrown when a required feature is not yet implemented.
 * Used during development to mark incomplete functionality.
 *
 * @class NotImplementedError
 * @extends KaitaiError
 * @example
 * ```typescript
 * throw new NotImplementedError('Custom processing')
 * ```
 */
export class NotImplementedError extends KaitaiError {
  constructor(feature: string) {
    super(`Feature not yet implemented: ${feature}`)
    this.name = 'NotImplementedError'
    Object.setPrototypeOf(this, NotImplementedError.prototype)
  }
}
