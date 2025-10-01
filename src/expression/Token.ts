/**
 * @fileoverview Token types for Kaitai Struct expression language
 * @module expression/Token
 * @author Fabiano Pinto
 * @license MIT
 */

/**
 * Token types in the expression language.
 */
export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  IDENTIFIER = 'IDENTIFIER',

  // Operators
  PLUS = 'PLUS',           // +
  MINUS = 'MINUS',         // -
  STAR = 'STAR',           // *
  SLASH = 'SLASH',         // /
  PERCENT = 'PERCENT',     // %

  // Comparison
  LT = 'LT',               // <
  LE = 'LE',               // <=
  GT = 'GT',               // >
  GE = 'GE',               // >=
  EQ = 'EQ',               // ==
  NE = 'NE',               // !=

  // Bitwise
  LSHIFT = 'LSHIFT',       // <<
  RSHIFT = 'RSHIFT',       // >>
  AMPERSAND = 'AMPERSAND', // &
  PIPE = 'PIPE',           // |
  CARET = 'CARET',         // ^

  // Logical
  AND = 'AND',             // and
  OR = 'OR',               // or
  NOT = 'NOT',             // not

  // Ternary
  QUESTION = 'QUESTION',   // ?
  COLON = 'COLON',         // :

  // Grouping
  LPAREN = 'LPAREN',       // (
  RPAREN = 'RPAREN',       // )
  LBRACKET = 'LBRACKET',   // [
  RBRACKET = 'RBRACKET',   // ]

  // Access
  DOT = 'DOT',             // .
  DOUBLE_COLON = 'DOUBLE_COLON', // ::
  COMMA = 'COMMA',         // ,

  // Special
  EOF = 'EOF',
}

/**
 * Token in the expression language.
 *
 * @interface Token
 */
export interface Token {
  /** Token type */
  type: TokenType

  /** Token value (for literals and identifiers) */
  value: string | number | boolean | null

  /** Position in the source string */
  position: number
}

/**
 * Create a token.
 *
 * @param type - Token type
 * @param value - Token value
 * @param position - Position in source
 * @returns Token object
 */
export function createToken(
  type: TokenType,
  value: string | number | boolean | null = null,
  position: number = 0
): Token {
  return { type, value, position }
}
