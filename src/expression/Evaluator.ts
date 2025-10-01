/**
 * @fileoverview Evaluator for Kaitai Struct expression AST
 * @module expression/Evaluator
 * @author Fabiano Pinto
 * @license MIT
 */

import { ParseError } from '../utils/errors'
import type { Context } from '../interpreter/Context'
import type { ASTNode } from './AST'

/**
 * Evaluator for expression AST nodes.
 * Executes expressions in the context of parsed data.
 *
 * @class Evaluator
 * @example
 * ```typescript
 * const evaluator = new Evaluator()
 * const result = evaluator.evaluate(ast, context)
 * ```
 */
export class Evaluator {
  /**
   * Evaluate an AST node in the given context.
   *
   * @param node - AST node to evaluate
   * @param context - Execution context
   * @returns Evaluated value
   * @throws {ParseError} If evaluation fails
   */
  evaluate(node: ASTNode, context: Context): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n = node as any
    switch (node.kind) {
      case 'Literal':
        return n.value

      case 'Identifier':
        return this.evaluateIdentifier(n.name, context)

      case 'BinaryOp':
        return this.evaluateBinaryOp(n.operator, n.left, n.right, context)

      case 'UnaryOp':
        return this.evaluateUnaryOp(n.operator, n.operand, context)

      case 'Ternary':
        return this.evaluateTernary(n.condition, n.ifTrue, n.ifFalse, context)

      case 'MemberAccess':
        return this.evaluateMemberAccess(n.object, n.property, context)

      case 'IndexAccess':
        return this.evaluateIndexAccess(n.object, n.index, context)

      case 'MethodCall':
        return this.evaluateMethodCall(n.object, n.method, n.args, context)

      case 'EnumAccess':
        return this.evaluateEnumAccess(n.enumName, n.value, context)

      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new ParseError(`Unknown AST node kind: ${(node as any).kind}`)
    }
  }

  /**
   * Evaluate an identifier.
   * @private
   */
  private evaluateIdentifier(name: string, context: Context): unknown {
    return context.resolve(name)
  }

  /**
   * Evaluate a binary operation.
   * @private
   */
  private evaluateBinaryOp(
    operator: string,
    left: ASTNode,
    right: ASTNode,
    context: Context
  ): unknown {
    const leftVal = this.evaluate(left, context)
    const rightVal = this.evaluate(right, context)

    switch (operator) {
      // Arithmetic
      case '+':
        return this.add(leftVal, rightVal)
      case '-':
        return this.toNumber(leftVal) - this.toNumber(rightVal)
      case '*':
        return this.toNumber(leftVal) * this.toNumber(rightVal)
      case '/':
        return this.toNumber(leftVal) / this.toNumber(rightVal)
      case '%':
        return this.modulo(this.toNumber(leftVal), this.toNumber(rightVal))

      // Comparison
      case '<':
        return this.compare(leftVal, rightVal) < 0
      case '<=':
        return this.compare(leftVal, rightVal) <= 0
      case '>':
        return this.compare(leftVal, rightVal) > 0
      case '>=':
        return this.compare(leftVal, rightVal) >= 0
      case '==':
        return this.equals(leftVal, rightVal)
      case '!=':
        return !this.equals(leftVal, rightVal)

      // Bitwise
      case '<<':
        return this.toInt(leftVal) << this.toInt(rightVal)
      case '>>':
        return this.toInt(leftVal) >> this.toInt(rightVal)
      case '&':
        return this.toInt(leftVal) & this.toInt(rightVal)
      case '|':
        return this.toInt(leftVal) | this.toInt(rightVal)
      case '^':
        return this.toInt(leftVal) ^ this.toInt(rightVal)

      // Logical
      case 'and':
        return this.toBoolean(leftVal) && this.toBoolean(rightVal)
      case 'or':
        return this.toBoolean(leftVal) || this.toBoolean(rightVal)

      default:
        throw new ParseError(`Unknown binary operator: ${operator}`)
    }
  }

  /**
   * Evaluate a unary operation.
   * @private
   */
  private evaluateUnaryOp(
    operator: string,
    operand: ASTNode,
    context: Context
  ): unknown {
    const value = this.evaluate(operand, context)

    switch (operator) {
      case '-':
        return -this.toNumber(value)
      case 'not':
        return !this.toBoolean(value)
      default:
        throw new ParseError(`Unknown unary operator: ${operator}`)
    }
  }

  /**
   * Evaluate a ternary conditional.
   * @private
   */
  private evaluateTernary(
    condition: ASTNode,
    ifTrue: ASTNode,
    ifFalse: ASTNode,
    context: Context
  ): unknown {
    const condValue = this.evaluate(condition, context)
    return this.toBoolean(condValue)
      ? this.evaluate(ifTrue, context)
      : this.evaluate(ifFalse, context)
  }

  /**
   * Evaluate member access (object.property).
   * @private
   */
  private evaluateMemberAccess(
    object: ASTNode,
    property: string,
    context: Context
  ): unknown {
    const obj = this.evaluate(object, context)

    if (obj === null || obj === undefined) {
      throw new ParseError(
        `Cannot access property ${property} of null/undefined`
      )
    }

    if (typeof obj === 'object') {
      return (obj as Record<string, unknown>)[property]
    }

    throw new ParseError(`Cannot access property ${property} of non-object`)
  }

  /**
   * Evaluate index access (array[index]).
   * @private
   */
  private evaluateIndexAccess(
    object: ASTNode,
    index: ASTNode,
    context: Context
  ): unknown {
    const obj = this.evaluate(object, context)
    const idx = this.evaluate(index, context)

    if (Array.isArray(obj)) {
      const numIdx = this.toInt(idx)
      return obj[numIdx]
    }

    if (obj instanceof Uint8Array) {
      const numIdx = this.toInt(idx)
      return obj[numIdx]
    }

    throw new ParseError('Index access requires an array')
  }

  /**
   * Evaluate method call (object.method()).
   * @private
   */
  private evaluateMethodCall(
    object: ASTNode,
    method: string,
    _args: ASTNode[],
    context: Context
  ): unknown {
    const obj = this.evaluate(object, context)
    // TODO: Use args for method calls that need them
    // const evalArgs = args.map((arg) => this.evaluate(arg, context))

    // Handle common methods
    if (method === 'length' || method === 'size') {
      if (Array.isArray(obj)) return obj.length
      if (obj instanceof Uint8Array) return obj.length
      if (typeof obj === 'string') return obj.length
      throw new ParseError(`Object does not have a ${method} property`)
    }

    if (method === 'to_i') {
      return this.toInt(obj)
    }

    if (method === 'to_s') {
      return String(obj)
    }

    throw new ParseError(`Unknown method: ${method}`)
  }

  /**
   * Evaluate enum access (EnumName::value).
   * @private
   */
  private evaluateEnumAccess(
    enumName: string,
    valueName: string,
    context: Context
  ): unknown {
    const value = context.getEnumValue(enumName, valueName)
    if (value === undefined) {
      throw new ParseError(
        `Enum value "${enumName}::${valueName}" not found`
      )
    }
    return value
  }

  /**
   * Helper: Add two values (handles strings and numbers).
   * @private
   */
  private add(left: unknown, right: unknown): unknown {
    if (typeof left === 'string' || typeof right === 'string') {
      return String(left) + String(right)
    }
    return this.toNumber(left) + this.toNumber(right)
  }

  /**
   * Helper: Modulo operation (Kaitai-style, not remainder).
   * @private
   */
  private modulo(a: number, b: number): number {
    const result = a % b
    return result < 0 ? result + b : result
  }

  /**
   * Helper: Compare two values.
   * @private
   */
  private compare(left: unknown, right: unknown): number {
    if (typeof left === 'string' && typeof right === 'string') {
      return left < right ? -1 : left > right ? 1 : 0
    }
    const leftNum = this.toNumber(left)
    const rightNum = this.toNumber(right)
    return leftNum < rightNum ? -1 : leftNum > rightNum ? 1 : 0
  }

  /**
   * Helper: Check equality.
   * @private
   */
  private equals(left: unknown, right: unknown): boolean {
    // Handle bigint comparison
    if (typeof left === 'bigint' || typeof right === 'bigint') {
      return BigInt(left as number) === BigInt(right as number)
    }
    return left === right
  }

  /**
   * Helper: Convert to number.
   * @private
   */
  private toNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'bigint') return Number(value)
    if (typeof value === 'boolean') return value ? 1 : 0
    if (typeof value === 'string') return parseFloat(value)
    throw new ParseError(`Cannot convert ${typeof value} to number`)
  }

  /**
   * Helper: Convert to integer.
   * @private
   */
  private toInt(value: unknown): number {
    return Math.floor(this.toNumber(value))
  }

  /**
   * Helper: Convert to boolean.
   * @private
   */
  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'bigint') return value !== 0n
    if (typeof value === 'string') return value.length > 0
    if (value === null || value === undefined) return false
    return true
  }
}
