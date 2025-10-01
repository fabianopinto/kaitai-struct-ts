/**
 * @fileoverview Lexer for Kaitai Struct expression language
 * @module expression/Lexer
 * @author Fabiano Pinto
 * @license MIT
 */

import { ParseError } from '../utils/errors'
import { Token, TokenType, createToken } from './Token'

/**
 * Lexer for tokenizing Kaitai Struct expressions.
 * Converts expression strings into a stream of tokens.
 *
 * @class Lexer
 * @example
 * ```typescript
 * const lexer = new Lexer('field1 + field2 * 2')
 * const tokens = lexer.tokenize()
 * ```
 */
export class Lexer {
  private input: string
  private position: number = 0
  private current: string | null = null

  /**
   * Create a new lexer.
   *
   * @param input - Expression string to tokenize
   */
  constructor(input: string) {
    this.input = input
    this.current = input.length > 0 ? input[0] : null
  }

  /**
   * Tokenize the entire input string.
   *
   * @returns Array of tokens
   * @throws {ParseError} If invalid syntax is encountered
   */
  tokenize(): Token[] {
    const tokens: Token[] = []

    while (this.current !== null) {
      // Skip whitespace
      if (this.isWhitespace(this.current)) {
        this.skipWhitespace()
        continue
      }

      // Numbers
      if (this.isDigit(this.current)) {
        tokens.push(this.readNumber())
        continue
      }

      // Identifiers and keywords
      if (this.isIdentifierStart(this.current)) {
        tokens.push(this.readIdentifierOrKeyword())
        continue
      }

      // Strings
      if (this.current === '"' || this.current === "'") {
        tokens.push(this.readString())
        continue
      }

      // Operators and punctuation
      const token = this.readOperator()
      if (token) {
        tokens.push(token)
        continue
      }

      throw new ParseError(
        `Unexpected character: ${this.current}`,
        this.position
      )
    }

    tokens.push(createToken(TokenType.EOF, null, this.position))
    return tokens
  }

  /**
   * Advance to the next character.
   * @private
   */
  private advance(): void {
    this.position++
    this.current =
      this.position < this.input.length ? this.input[this.position] : null
  }

  /**
   * Peek at the next character without advancing.
   * @private
   */
  private peek(offset: number = 1): string | null {
    const pos = this.position + offset
    return pos < this.input.length ? this.input[pos] : null
  }

  /**
   * Check if character is whitespace.
   * @private
   */
  private isWhitespace(char: string): boolean {
    return /\s/.test(char)
  }

  /**
   * Check if character is a digit.
   * @private
   */
  private isDigit(char: string): boolean {
    return /[0-9]/.test(char)
  }

  /**
   * Check if character can start an identifier.
   * @private
   */
  private isIdentifierStart(char: string): boolean {
    return /[a-zA-Z_]/.test(char)
  }

  /**
   * Check if character can be part of an identifier.
   * @private
   */
  private isIdentifierPart(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char)
  }

  /**
   * Skip whitespace characters.
   * @private
   */
  private skipWhitespace(): void {
    while (this.current !== null && this.isWhitespace(this.current)) {
      this.advance()
    }
  }

  /**
   * Read a number token.
   * @private
   */
  private readNumber(): Token {
    const start = this.position
    let value = ''

    // Handle hex numbers (0x...)
    if (this.current === '0' && this.peek() === 'x') {
      value += this.current
      this.advance()
      value += this.current
      this.advance()

      while (this.current !== null && /[0-9a-fA-F]/.test(this.current)) {
        value += this.current
        this.advance()
      }

      return createToken(TokenType.NUMBER, parseInt(value, 16), start)
    }

    // Regular decimal number
    while (this.current !== null && this.isDigit(this.current)) {
      value += this.current
      this.advance()
    }

    // Handle decimal point
    if (this.current === '.' && this.peek() && this.isDigit(this.peek()!)) {
      value += this.current
      this.advance()

      while (this.current !== null && this.isDigit(this.current)) {
        value += this.current
        this.advance()
      }

      return createToken(TokenType.NUMBER, parseFloat(value), start)
    }

    return createToken(TokenType.NUMBER, parseInt(value, 10), start)
  }

  /**
   * Read an identifier or keyword token.
   * @private
   */
  private readIdentifierOrKeyword(): Token {
    const start = this.position
    let value = ''

    while (
      this.current !== null &&
      this.isIdentifierPart(this.current)
    ) {
      value += this.current
      this.advance()
    }

    // Check for keywords
    switch (value) {
      case 'true':
        return createToken(TokenType.BOOLEAN, true, start)
      case 'false':
        return createToken(TokenType.BOOLEAN, false, start)
      case 'and':
        return createToken(TokenType.AND, value, start)
      case 'or':
        return createToken(TokenType.OR, value, start)
      case 'not':
        return createToken(TokenType.NOT, value, start)
      default:
        return createToken(TokenType.IDENTIFIER, value, start)
    }
  }

  /**
   * Read a string token.
   * @private
   */
  private readString(): Token {
    const start = this.position
    const quote = this.current
    let value = ''

    this.advance() // Skip opening quote

    while (this.current !== null && this.current !== quote) {
      if (this.current === '\\') {
        this.advance()
        if (this.current === null) {
          throw new ParseError('Unterminated string', start)
        }
        // Handle escape sequences
        const escaped = this.current
        switch (escaped) {
          case 'n':
            value += '\n'
            break
          case 't':
            value += '\t'
            break
          case 'r':
            value += '\r'
            break
          case '\\':
            value += '\\'
            break
          case '"':
            value += '"'
            break
          case "'":
            value += "'"
            break
          default:
            value += escaped
        }
      } else {
        value += this.current
      }
      this.advance()
    }

    if (this.current === null) {
      throw new ParseError('Unterminated string', start)
    }

    this.advance() // Skip closing quote

    return createToken(TokenType.STRING, value, start)
  }

  /**
   * Read an operator or punctuation token.
   * @private
   */
  private readOperator(): Token | null {
    const start = this.position
    const char = this.current!

    switch (char) {
      case '+':
        this.advance()
        return createToken(TokenType.PLUS, char, start)

      case '-':
        this.advance()
        return createToken(TokenType.MINUS, char, start)

      case '*':
        this.advance()
        return createToken(TokenType.STAR, char, start)

      case '/':
        this.advance()
        return createToken(TokenType.SLASH, char, start)

      case '%':
        this.advance()
        return createToken(TokenType.PERCENT, char, start)

      case '<':
        this.advance()
        if (this.current === '=') {
          this.advance()
          return createToken(TokenType.LE, '<=', start)
        } else if (this.current === '<') {
          this.advance()
          return createToken(TokenType.LSHIFT, '<<', start)
        }
        return createToken(TokenType.LT, '<', start)

      case '>':
        this.advance()
        if (this.current === '=') {
          this.advance()
          return createToken(TokenType.GE, '>=', start)
        } else if (this.current === '>') {
          this.advance()
          return createToken(TokenType.RSHIFT, '>>', start)
        }
        return createToken(TokenType.GT, '>', start)

      case '=':
        this.advance()
        if (this.current === '=') {
          this.advance()
          return createToken(TokenType.EQ, '==', start)
        }
        throw new ParseError('Expected == for equality', start)

      case '!':
        this.advance()
        if (this.current === '=') {
          this.advance()
          return createToken(TokenType.NE, '!=', start)
        }
        throw new ParseError('Expected != for inequality', start)

      case '&':
        this.advance()
        return createToken(TokenType.AMPERSAND, char, start)

      case '|':
        this.advance()
        return createToken(TokenType.PIPE, char, start)

      case '^':
        this.advance()
        return createToken(TokenType.CARET, char, start)

      case '?':
        this.advance()
        return createToken(TokenType.QUESTION, char, start)

      case ':':
        this.advance()
        if (this.current === ':') {
          this.advance()
          return createToken(TokenType.DOUBLE_COLON, '::', start)
        }
        return createToken(TokenType.COLON, char, start)

      case '(':
        this.advance()
        return createToken(TokenType.LPAREN, char, start)

      case ')':
        this.advance()
        return createToken(TokenType.RPAREN, char, start)

      case '[':
        this.advance()
        return createToken(TokenType.LBRACKET, char, start)

      case ']':
        this.advance()
        return createToken(TokenType.RBRACKET, char, start)

      case '.':
        this.advance()
        return createToken(TokenType.DOT, char, start)

      case ',':
        this.advance()
        return createToken(TokenType.COMMA, char, start)

      default:
        return null
    }
  }
}
