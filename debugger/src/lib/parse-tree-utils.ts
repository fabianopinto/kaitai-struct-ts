/**
 * @fileoverview Utility functions for parse tree manipulation
 * @module debugger/lib/parse-tree-utils
 * @author Fabiano Pinto
 * @license MIT
 */

import type { ParseTreeNode } from '@/types'

/**
 * Convert a parsed result to a tree structure
 *
 * @param obj - Parsed object to convert
 * @param name - Node name (default: 'root')
 * @param path - Current path for nested nodes
 * @returns Parse tree node with children
 */
export function resultToTree(obj: unknown, name = 'root', path = ''): ParseTreeNode {
  // Don't add dot before array indices (e.g., [0], [1])
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
    // For primitive fields, we can't get individual field offsets
    // The parser doesn't track them. We'll return without offset/size
    // and rely on parent object highlighting instead.
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
  const objRecord = obj as Record<string, unknown>

  // Extract metadata from parsed object
  let offset: number | undefined
  let size: number | undefined

  // Get start position from _startPos (added by TypeInterpreter)
  if (typeof objRecord['_startPos'] === 'number') {
    offset = objRecord['_startPos']
  }

  // Get size from _sizeof
  if (typeof objRecord['_sizeof'] === 'number') {
    size = objRecord['_sizeof']
  }

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
    offset,
    size,
    children,
  }
}

/**
 * Get a human-readable type name
 *
 * @param value - Value to get type name for
 * @returns Human-readable type name
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
 *
 * @param value - Value to format
 * @returns Formatted string representation
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
 *
 * @param type - Node type (object, array, string, etc.)
 * @returns Emoji icon for the type
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

/**
 * Find a node in the tree by its path
 *
 * @param tree - Root tree node
 * @param path - Dot-separated path (e.g., "root.header.magic")
 * @returns Found node or undefined
 */
export function findNodeByPath(tree: ParseTreeNode, path: string): ParseTreeNode | undefined {
  if (!path) return undefined

  const parts = path.split('.')
  let current: ParseTreeNode | undefined = tree

  // Skip the first part if it matches the root node name
  const startIndex = parts[0] === tree.name ? 1 : 0

  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i]
    if (!current || !current.children) return undefined
    current = current.children.find((child) => child.name === part)
    if (!current) return undefined
  }

  return current
}
