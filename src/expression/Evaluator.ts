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

      case 'ArrayLiteral':
        return this.evaluateArrayLiteral(n.elements, context)

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
        return this.bitwiseOp(leftVal, rightVal, (a, b) => a << b)
      case '>>':
        return this.bitwiseOp(leftVal, rightVal, (a, b) => a >> b)
      case '&':
        return this.bitwiseOp(leftVal, rightVal, (a, b) => a & b)
      case '|':
        return this.bitwiseOp(leftVal, rightVal, (a, b) => a | b)
      case '^':
        return this.bitwiseOp(leftVal, rightVal, (a, b) => a ^ b)

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

    // Handle special Kaitai Struct pseudo-properties that act like methods
    if (property === 'to_i') {
      // Convert to integer (works for numbers, strings, etc.)
      if (typeof obj === 'number') return Math.floor(obj)
      if (typeof obj === 'bigint') return Number(obj)
      if (typeof obj === 'string') return parseInt(obj, 10)
      if (typeof obj === 'boolean') return obj ? 1 : 0
      return this.toInt(obj)
    }

    if (property === 'to_s') {
      return String(obj)
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
    args: ASTNode[],
    context: Context
  ): unknown {
    const obj = this.evaluate(object, context)
    const evalArgs = args.map((arg) => this.evaluate(arg, context))

    // Array/String length
    if (method === 'length' || method === 'size') {
      if (Array.isArray(obj)) return obj.length
      if (obj instanceof Uint8Array) return obj.length
      if (typeof obj === 'string') return obj.length
      throw new ParseError(`Object does not have a ${method} property`)
    }

    // Type conversions
    if (method === 'to_i') {
      const base = evalArgs.length > 0 ? this.toInt(evalArgs[0]) : 10
      if (typeof obj === 'string') {
        return parseInt(obj, base)
      }
      return this.toInt(obj)
    }

    if (method === 'to_s') {
      return String(obj)
    }

    // String methods
    if (typeof obj === 'string') {
      return this.evaluateStringMethod(obj, method, evalArgs)
    }

    // Array methods
    if (Array.isArray(obj) || obj instanceof Uint8Array) {
      return this.evaluateArrayMethod(obj, method, evalArgs)
    }

    throw new ParseError(`Unknown method: ${method}`)
  }

  /**
   * Evaluate string methods.
   * @private
   */
  private evaluateStringMethod(
    str: string,
    method: string,
    args: unknown[]
  ): unknown {
    switch (method) {
      case 'substring': {
        const start = args.length > 0 ? this.toInt(args[0]) : 0
        const end = args.length > 1 ? this.toInt(args[1]) : undefined
        return str.substring(start, end)
      }

      case 'substr': {
        const start = args.length > 0 ? this.toInt(args[0]) : 0
        const length = args.length > 1 ? this.toInt(args[1]) : undefined
        return str.substr(start, length)
      }

      case 'reverse':
        return str.split('').reverse().join('')

      case 'to_i': {
        const base = args.length > 0 ? this.toInt(args[0]) : 10
        return parseInt(str, base)
      }

      case 'length':
      case 'size':
        return str.length

      // Ruby-style string methods used in Kaitai
      case 'upcase':
      case 'to_upper':
        return str.toUpperCase()

      case 'downcase':
      case 'to_lower':
        return str.toLowerCase()

      case 'capitalize':
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

      case 'strip':
      case 'trim':
        return str.trim()

      case 'lstrip':
      case 'trim_start':
        return str.trimStart()

      case 'rstrip':
      case 'trim_end':
        return str.trimEnd()

      case 'starts_with':
      case 'startsWith': {
        if (args.length === 0) {
          throw new ParseError('starts_with requires 1 argument')
        }
        return str.startsWith(String(args[0]))
      }

      case 'ends_with':
      case 'endsWith': {
        if (args.length === 0) {
          throw new ParseError('ends_with requires 1 argument')
        }
        return str.endsWith(String(args[0]))
      }

      case 'includes':
      case 'contains': {
        if (args.length === 0) {
          throw new ParseError('includes requires 1 argument')
        }
        return str.includes(String(args[0]))
      }

      case 'index_of':
      case 'indexOf': {
        if (args.length === 0) {
          throw new ParseError('index_of requires 1 argument')
        }
        return str.indexOf(String(args[0]))
      }

      case 'split': {
        if (args.length === 0) {
          throw new ParseError('split requires 1 argument')
        }
        return str.split(String(args[0]))
      }

      case 'replace': {
        if (args.length < 2) {
          throw new ParseError('replace requires 2 arguments')
        }
        return str.replace(String(args[0]), String(args[1]))
      }

      case 'replace_all':
      case 'replaceAll': {
        if (args.length < 2) {
          throw new ParseError('replace_all requires 2 arguments')
        }
        const search = String(args[0])
        const replace = String(args[1])
        // Use split/join for compatibility with older targets
        return str.split(search).join(replace)
      }

      case 'pad_left':
      case 'padStart': {
        if (args.length === 0) {
          throw new ParseError('pad_left requires at least 1 argument')
        }
        const length = this.toInt(args[0])
        const fillString = args.length > 1 ? String(args[1]) : ' '
        return str.padStart(length, fillString)
      }

      case 'pad_right':
      case 'padEnd': {
        if (args.length === 0) {
          throw new ParseError('pad_right requires at least 1 argument')
        }
        const length = this.toInt(args[0])
        const fillString = args.length > 1 ? String(args[1]) : ' '
        return str.padEnd(length, fillString)
      }

      default:
        throw new ParseError(`Unknown string method: ${method}`)
    }
  }

  /**
   * Evaluate array methods.
   * @private
   */
  private evaluateArrayMethod(
    arr: unknown[] | Uint8Array,
    method: string,
    args: unknown[]
  ): unknown {
    const array = Array.isArray(arr) ? arr : Array.from(arr)

    switch (method) {
      case 'length':
      case 'size':
        return array.length

      case 'first':
        return array[0]

      case 'last':
        return array[array.length - 1]

      case 'min':
        return Math.min(...array.map((v) => this.toNumber(v)))

      case 'max':
        return Math.max(...array.map((v) => this.toNumber(v)))

      case 'reverse':
        return [...array].reverse()

      case 'sort':
        return [...array].sort((a, b) => this.compare(a, b))

      case 'includes':
      case 'contains': {
        if (args.length === 0) {
          throw new ParseError('includes requires 1 argument')
        }
        return array.some((item) => this.equals(item, args[0]))
      }

      case 'index_of':
      case 'indexOf': {
        if (args.length === 0) {
          throw new ParseError('index_of requires 1 argument')
        }
        return array.findIndex((item) => this.equals(item, args[0]))
      }

      case 'slice': {
        const start = args.length > 0 ? this.toInt(args[0]) : 0
        const end = args.length > 1 ? this.toInt(args[1]) : undefined
        return array.slice(start, end)
      }

      default:
        throw new ParseError(`Unknown array method: ${method}`)
    }
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
      throw new ParseError(`Enum value "${enumName}::${valueName}" not found`)
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
   * Helper: Bitwise operation with BigInt support.
   * JavaScript bitwise operators work on 32-bit integers, but Kaitai
   * may use 64-bit values. For values that fit in 32 bits, use native ops.
   * For larger values, convert to BigInt (with limitations).
   * @private
   */
  private bitwiseOp(
    left: unknown,
    right: unknown,
    op: (a: number, b: number) => number
  ): number | bigint {
    // Check if we're dealing with BigInt values
    if (typeof left === 'bigint' || typeof right === 'bigint') {
      // Convert to BigInt and perform operation
      const leftBig = typeof left === 'bigint' ? left : BigInt(left as number)
      const rightBig =
        typeof right === 'bigint' ? right : BigInt(right as number)

      // BigInt bitwise operations
      // Note: Shift operations require the right operand to be a regular number
      if (op.toString().includes('<<')) {
        return leftBig << BigInt(Number(rightBig))
      }
      if (op.toString().includes('>>')) {
        return leftBig >> BigInt(Number(rightBig))
      }
      if (op.toString().includes('&')) {
        return leftBig & rightBig
      }
      if (op.toString().includes('|')) {
        return leftBig | rightBig
      }
      if (op.toString().includes('^')) {
        return leftBig ^ rightBig
      }
    }

    // Handle undefined/null values
    if (
      left === undefined ||
      left === null ||
      right === undefined ||
      right === null
    ) {
      throw new ParseError('Cannot perform bitwise operation on null/undefined')
    }

    // For regular numbers, use 32-bit operations
    return op(this.toInt(left), this.toInt(right))
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

    // Sequence equality: support number[] and Uint8Array
    const toArray = (v: unknown): number[] | null => {
      if (Array.isArray(v))
        return v.map((x) => (typeof x === 'bigint' ? Number(x) : (x as number)))
      if (v instanceof Uint8Array) return Array.from(v)
      return null
    }

    const leftArr = toArray(left)
    const rightArr = toArray(right)
    if (leftArr && rightArr) {
      if (leftArr.length !== rightArr.length) return false
      for (let i = 0; i < leftArr.length; i++) {
        if (leftArr[i] !== rightArr[i]) return false
      }
      return true
    }

    return left === right
  }

  /**
   * Evaluate an array literal.
   * @private
   */
  private evaluateArrayLiteral(
    elements: ASTNode[],
    context: Context
  ): unknown[] {
    return elements.map((e) => this.evaluate(e, context))
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
