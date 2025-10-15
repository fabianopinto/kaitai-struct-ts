/**
 * @fileoverview Expression evaluator for REPL console
 * @module debugger/lib/expression-evaluator
 * @author Fabiano Pinto
 * @license MIT
 */

/**
 * Evaluation context with helper functions
 */
export interface EvaluationContext {
  /** Parsed result root */
  root: unknown
  /** Alias for root */
  $: unknown
  /** Currently selected field */
  _: unknown
  /** Binary data */
  data: Uint8Array | null
  /** Helper functions */
  hex: (n: number) => string
  bin: (n: number) => string
  bytes: (offset: number, length: number) => Uint8Array | null
  sizeof: (path: string) => number | null
  offsetof: (path: string) => number | null
}

/**
 * Console output entry
 */
export interface ConsoleOutput {
  id: string
  expression: string
  result?: unknown
  error?: Error
  timestamp: number
  executionTime: number
}

/**
 * Convert number to hex string
 */
function hex(n: number): string {
  return '0x' + n.toString(16).toUpperCase()
}

/**
 * Convert number to binary string
 */
function bin(n: number): string {
  return '0b' + n.toString(2)
}

/**
 * Create evaluation context
 */
export function createEvaluationContext(
  parseResult: unknown,
  selectedField: unknown,
  binaryData: Uint8Array | null,
  getFieldInfo: (path: string) => { offset?: number; size?: number } | null
): EvaluationContext {
  return {
    root: parseResult,
    $: parseResult,
    _: selectedField,
    data: binaryData,
    hex,
    bin,
    bytes: (offset: number, length: number) => {
      if (!binaryData || offset < 0 || offset + length > binaryData.length) {
        return null
      }
      return binaryData.slice(offset, offset + length)
    },
    sizeof: (path: string) => {
      const info = getFieldInfo(path)
      return info?.size ?? null
    },
    offsetof: (path: string) => {
      const info = getFieldInfo(path)
      return info?.offset ?? null
    },
  }
}

/**
 * Evaluate expression in context
 */
export async function evaluateExpression(
  expression: string,
  context: EvaluationContext,
  timeout = 5000
): Promise<ConsoleOutput> {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
  const timestamp = Date.now()
  const startTime = performance.now()

  try {
    // Create function with context variables
    const contextKeys = Object.keys(context)
    const contextValues = Object.values(context)

    // Wrap in async function to support await
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    const fn = new AsyncFunction(...contextKeys, `return (${expression})`)

    // Execute with timeout
    const result = await Promise.race([
      fn(...contextValues),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Expression timeout (5s)')), timeout)
      ),
    ])

    const executionTime = performance.now() - startTime

    return {
      id,
      expression,
      result,
      timestamp,
      executionTime,
    }
  } catch (error) {
    const executionTime = performance.now() - startTime

    return {
      id,
      expression,
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp,
      executionTime,
    }
  }
}

/**
 * Format value for display
 */
export function formatValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'

  if (typeof value === 'string') {
    return `"${value}"`
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return String(value)
  }

  if (value instanceof Uint8Array) {
    const hex = Array.from(value.slice(0, 16))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
    const suffix = value.length > 16 ? ` ... (${value.length} bytes)` : ''
    return `Uint8Array [${hex}${suffix}]`
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    if (value.length <= 5) {
      return `[${value.map(formatValue).join(', ')}]`
    }
    return `Array(${value.length}) [${value.slice(0, 3).map(formatValue).join(', ')}, ...]`
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) return '{}'
    if (keys.length <= 3) {
      return `{ ${keys.map((k) => `${k}: ${formatValue((value as any)[k])}`).join(', ')} }`
    }
    return `{ ${keys
      .slice(0, 2)
      .map((k) => `${k}: ${formatValue((value as any)[k])}`)
      .join(', ')}, ... (${keys.length} keys) }`
  }

  return String(value)
}
