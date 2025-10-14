/**
 * Utility functions for parse tree manipulation
 */

import type { ParseTreeNode } from '@/types'

/**
 * Convert a parsed result to a tree structure
 */
export function resultToTree(obj: unknown, name = 'root', path = ''): ParseTreeNode {
  const currentPath = path ? `${path}.${name}` : name

  if (obj === null || obj === undefined) {
    return {
      name,
      value: obj,
      type: typeof obj,
      children: [],
    }
  }

  if (typeof obj !== 'object') {
    return {
      name,
      value: obj,
      type: typeof obj,
      children: [],
    }
  }

  if (Array.isArray(obj)) {
    return {
      name,
      value: `Array[${obj.length}]`,
      type: 'array',
      children: obj.map((item, index) => resultToTree(item, `[${index}]`, currentPath)),
    }
  }

  // Handle Uint8Array and other typed arrays
  if (ArrayBuffer.isView(obj)) {
    const arr = obj as Uint8Array
    return {
      name,
      value: `Uint8Array[${arr.length}]`,
      type: 'bytes',
      children: [],
    }
  }

  // Regular object
  const children: ParseTreeNode[] = []
  for (const [key, value] of Object.entries(obj)) {
    // Skip private/internal properties
    if (key.startsWith('_')) continue
    children.push(resultToTree(value, key, currentPath))
  }

  return {
    name,
    value: `Object{${children.length}}`,
    type: 'object',
    children,
  }
}

/**
 * Get a human-readable type name
 */
export function getTypeName(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  if (ArrayBuffer.isView(value)) return 'bytes'
  if (typeof value === 'object') return 'object'
  return typeof value
}

/**
 * Format a value for display
 */
export function formatValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value.toString()
  if (Array.isArray(value)) return `Array[${value.length}]`
  if (ArrayBuffer.isView(value)) {
    const arr = value as Uint8Array
    return `Uint8Array[${arr.length}]`
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value).filter((k) => !k.startsWith('_'))
    return `{${keys.length} fields}`
  }
  return String(value)
}

/**
 * Get an icon for a node type
 */
export function getNodeIcon(type: string): string {
  const icons: Record<string, string> = {
    object: '📦',
    array: '📋',
    string: '📝',
    number: '🔢',
    boolean: '✓',
    bytes: '💾',
    null: '∅',
    undefined: '?',
  }
  return icons[type] || '•'
}
