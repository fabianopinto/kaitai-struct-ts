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
    public position?: number,
    public context?: Uint8Array
  ) {
    super(KaitaiError.formatMessage(message, position, context))
    this.name = 'KaitaiError'
    Object.setPrototypeOf(this, KaitaiError.prototype)
  }

  /**
   * Format error message with position and context.
   * @private
   */
  private static formatMessage(
    message: string,
    position?: number,
    context?: Uint8Array
  ): string {
    let formatted = message

    if (position !== undefined) {
      formatted += ` (at byte offset 0x${position.toString(16).toUpperCase()})`
    }

    if (context && context.length > 0) {
      const hexContext = KaitaiError.formatHexContext(context, position)
      formatted += `\n${hexContext}`
    }

    return formatted
  }

  /**
   * Format hex dump context around error position.
   * @private
   */
  private static formatHexContext(data: Uint8Array, position?: number): string {
    const contextSize = 16 // Show 16 bytes before and after
    const start = Math.max(0, (position ?? 0) - contextSize)
    const end = Math.min(data.length, (position ?? 0) + contextSize)
    const chunk = data.slice(start, end)

    const lines: string[] = ['Context:']
    let offset = start

    for (let i = 0; i < chunk.length; i += 16) {
      const lineBytes = chunk.slice(i, i + 16)
      const hex = Array.from(lineBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ')
      const ascii = Array.from(lineBytes)
        .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
        .join('')

      const offsetStr = `  ${(offset + i).toString(16).padStart(8, '0')}`
      const marker =
        position !== undefined &&
        position >= offset + i &&
        position < offset + i + lineBytes.length
          ? ' <--'
          : ''

      lines.push(`${offsetStr}: ${hex.padEnd(48, ' ')} | ${ascii}${marker}`)
    }

    return lines.join('\n')
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
  constructor(message: string, position?: number, context?: Uint8Array) {
    super(message, position, context)
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
  constructor(message: string, position?: number, context?: Uint8Array) {
    super(message, position, context)
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
  constructor(
    message: string = 'Unexpected end of stream',
    position?: number,
    context?: Uint8Array
  ) {
    super(message, position, context)
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
