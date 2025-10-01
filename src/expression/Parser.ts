/**
 * @fileoverview Parser for Kaitai Struct expression language
 * @module expression/Parser
 * @author Fabiano Pinto
 * @license MIT
 */

import { ParseError } from '../utils/errors'
import { Token, TokenType } from './Token'
import type { ASTNode } from './AST'
import {
  createLiteral,
  createIdentifier,
  createBinaryOp,
  createUnaryOp,
  createTernary,
  createMemberAccess,
  createIndexAccess,
  createMethodCall,
  createEnumAccess,
} from './AST'

/**
 * Parser for Kaitai Struct expressions.
 * Converts tokens into an Abstract Syntax Tree (AST).
 *
 * @class ExpressionParser
 * @example
 * ```typescript
 * const lexer = new Lexer('field1 + field2 * 2')
 * const tokens = lexer.tokenize()
 * const parser = new ExpressionParser(tokens)
 * const ast = parser.parse()
 * ```
 */
export class ExpressionParser {
  private tokens: Token[]
  private position: number = 0

  /**
   * Create a new expression parser.
   *
   * @param tokens - Array of tokens to parse
   */
  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  /**
   * Parse the tokens into an AST.
   *
   * @returns Root AST node
   * @throws {ParseError} If invalid syntax is encountered
   */
  parse(): ASTNode {
    const expr = this.parseTernary()
    if (!this.isAtEnd()) {
      throw new ParseError(
        `Unexpected token: ${this.current().type}`,
        this.current().position
      )
    }
    return expr
  }

  /**
   * Get the current token.
   * @private
   */
  private current(): Token {
    return this.tokens[this.position]
  }

  /**
   * Check if we're at the end of tokens.
   * @private
   */
  private isAtEnd(): boolean {
    return this.current().type === TokenType.EOF
  }

  /**
   * Advance to the next token.
   * @private
   */
  private advance(): Token {
    if (!this.isAtEnd()) {
      this.position++
    }
    return this.tokens[this.position - 1]
  }

  /**
   * Check if current token matches any of the given types.
   * @private
   */
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.current().type === type) {
        this.advance()
        return true
      }
    }
    return false
  }

  /**
   * Expect a specific token type and advance.
   * @private
   */
  private expect(type: TokenType, message: string): Token {
    if (this.current().type !== type) {
      throw new ParseError(message, this.current().position)
    }
    return this.advance()
  }

  /**
   * Parse ternary conditional (lowest precedence).
   * condition ? ifTrue : ifFalse
   * @private
   */
  private parseTernary(): ASTNode {
    let expr = this.parseLogicalOr()

    if (this.match(TokenType.QUESTION)) {
      const ifTrue = this.parseTernary()
      this.expect(TokenType.COLON, 'Expected : in ternary expression')
      const ifFalse = this.parseTernary()
      return createTernary(expr, ifTrue, ifFalse)
    }

    return expr
  }

  /**
   * Parse logical OR.
   * @private
   */
  private parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd()

    while (this.match(TokenType.OR)) {
      const operator = 'or'
      const right = this.parseLogicalAnd()
      left = createBinaryOp(operator, left, right)
    }

    return left
  }

  /**
   * Parse logical AND.
   * @private
   */
  private parseLogicalAnd(): ASTNode {
    let left = this.parseBitwiseOr()

    while (this.match(TokenType.AND)) {
      const operator = 'and'
      const right = this.parseBitwiseOr()
      left = createBinaryOp(operator, left, right)
    }

    return left
  }

  /**
   * Parse bitwise OR.
   * @private
   */
  private parseBitwiseOr(): ASTNode {
    let left = this.parseBitwiseXor()

    while (this.match(TokenType.PIPE)) {
      const operator = '|'
      const right = this.parseBitwiseXor()
      left = createBinaryOp(operator, left, right)
    }

    return left
  }

  /**
   * Parse bitwise XOR.
   * @private
   */
  private parseBitwiseXor(): ASTNode {
    let left = this.parseBitwiseAnd()

    while (this.match(TokenType.CARET)) {
      const operator = '^'
      const right = this.parseBitwiseAnd()
      left = createBinaryOp(operator, left, right)
    }

    return left
  }

  /**
   * Parse bitwise AND.
   * @private
   */
  private parseBitwiseAnd(): ASTNode {
    let left = this.parseEquality()

    while (this.match(TokenType.AMPERSAND)) {
      const operator = '&'
      const right = this.parseEquality()
      left = createBinaryOp(operator, left, right)
    }

    return left
  }

  /**
   * Parse equality operators (==, !=).
   * @private
   */
  private parseEquality(): ASTNode {
    let left = this.parseRelational()

    while (this.match(TokenType.EQ, TokenType.NE)) {
      const operator = this.tokens[this.position - 1].value as string
      const right = this.parseRelational()
      left = createBinaryOp(operator, left, right)
    }

    return left
  }

  /**
   * Parse relational operators (<, <=, >, >=).
   * @private
   */
  private parseRelational(): ASTNode {
    let left = this.parseBitShift()

    while (this.match(TokenType.LT, TokenType.LE, TokenType.GT, TokenType.GE)) {
      const operator = this.tokens[this.position - 1].value as string
      const right = this.parseBitShift()
      left = createBinaryOp(operator, left, right)
    }

    return left
  }

  /**
   * Parse bit shift operators (<<, >>).
   * @private
   */
  private parseBitShift(): ASTNode {
    let left = this.parseAdditive()

    while (this.match(TokenType.LSHIFT, TokenType.RSHIFT)) {
      const operator = this.tokens[this.position - 1].value as string
      const right = this.parseAdditive()
      left = createBinaryOp(operator, left, right)
    }

    return left
  }

  /**
   * Parse additive operators (+, -).
   * @private
   */
  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative()

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.tokens[this.position - 1].value as string
      const right = this.parseMultiplicative()
      left = createBinaryOp(operator, left, right)
    }

    return left
  }

  /**
   * Parse multiplicative operators (*, /, %).
   * @private
   */
  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary()

    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const operator = this.tokens[this.position - 1].value as string
      const right = this.parseUnary()
      left = createBinaryOp(operator, left, right)
    }

    return left
  }

  /**
   * Parse unary operators (-, not).
   * @private
   */
  private parseUnary(): ASTNode {
    if (this.match(TokenType.MINUS, TokenType.NOT)) {
      const operator = this.tokens[this.position - 1].value as string
      const operand = this.parseUnary()
      return createUnaryOp(operator, operand)
    }

    return this.parsePostfix()
  }

  /**
   * Parse postfix operators (., [], ()).
   * @private
   */
  private parsePostfix(): ASTNode {
    let expr = this.parsePrimary()

    while (true) {
      if (this.match(TokenType.DOT)) {
        const property = this.expect(
          TokenType.IDENTIFIER,
          'Expected property name after .'
        )
        expr = createMemberAccess(expr, property.value as string)
      } else if (this.match(TokenType.LBRACKET)) {
        const index = this.parseTernary()
        this.expect(TokenType.RBRACKET, 'Expected ] after array index')
        expr = createIndexAccess(expr, index)
      } else if (this.current().type === TokenType.LPAREN) {
        // Method call (only if expr is a member access)
        if (expr.kind === 'MemberAccess') {
          this.advance() // consume (
          const args: ASTNode[] = []
          
          if (this.current().type !== TokenType.RPAREN) {
            args.push(this.parseTernary())
            while (this.match(TokenType.COMMA)) {
              args.push(this.parseTernary())
            }
          }
          
          this.expect(TokenType.RPAREN, 'Expected ) after arguments')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const memberExpr = expr as any
          expr = createMethodCall(
            memberExpr.object,
            memberExpr.property,
            args
          )
        } else {
          break
        }
      } else {
        break
      }
    }

    return expr
  }

  /**
   * Parse primary expressions (literals, identifiers, grouping).
   * @private
   */
  private parsePrimary(): ASTNode {
    // Literals
    if (this.match(TokenType.NUMBER, TokenType.STRING, TokenType.BOOLEAN)) {
      const token = this.tokens[this.position - 1]
      return createLiteral(token.value as number | string | boolean)
    }

    // Identifiers and enum access
    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.tokens[this.position - 1].value as string
      
      // Check for enum access (EnumName::value)
      if (this.match(TokenType.DOUBLE_COLON)) {
        const value = this.expect(
          TokenType.IDENTIFIER,
          'Expected enum value after ::'
        )
        return createEnumAccess(name, value.value as string)
      }
      
      return createIdentifier(name)
    }

    // Grouping
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseTernary()
      this.expect(TokenType.RPAREN, 'Expected ) after expression')
      return expr
    }

    throw new ParseError(
      `Unexpected token: ${this.current().type}`,
      this.current().position
    )
  }
}
