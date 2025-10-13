/**
 * @fileoverview Expression evaluation module
 * @module expression
 * @author Fabiano Pinto
 * @license MIT
 */

import { Lexer } from './Lexer'
import { ExpressionParser } from './Parser'
import { Evaluator } from './Evaluator'
import type { Context } from '../interpreter/Context'

export * from './Token'
export * from './AST'
export * from './Lexer'
export * from './Parser'
export * from './Evaluator'

/**
 * Evaluate a Kaitai Struct expression string.
 * Convenience function that combines lexing, parsing, and evaluation.
 *
 * @param expression - Expression string to evaluate
 * @param context - Execution context
 * @returns Evaluated value
 * @throws {ParseError} If parsing or evaluation fails
 *
 * @example
 * ```typescript
 * const result = evaluateExpression('field1 + field2 * 2', context)
 * ```
 */
export function evaluateExpression(
  expression: string,
  context: Context
): unknown {
  // Strip unsupported generic cast syntax like .as<bytes>
  // This is a no-op for our evaluator since we infer types dynamically.
  const preprocessed = expression.replace(/\.as<[^>]+>/g, '')
  // Lexical analysis
  const lexer = new Lexer(preprocessed)
  const tokens = lexer.tokenize()

  // Parsing
  const parser = new ExpressionParser(tokens)
  const ast = parser.parse()

  // Evaluation
  const evaluator = new Evaluator()
  return evaluator.evaluate(ast, context)
}
