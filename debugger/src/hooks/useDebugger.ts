/**
 * @fileoverview Custom hook for debugger logic
 * @module debugger/hooks/useDebugger
 * @author Fabiano Pinto
 * @license MIT
 */

import { useCallback } from 'react'
import { parse } from '@k67/kaitai-struct-ts'
import { useDebugStore } from '@/store/debugStore'
import { resultToTree } from '@/lib/parse-tree-utils'
import type { ParseTreeNode } from '@/types'

/**
 * Custom hook for debugger logic and parsing
 *
 * @returns Debugger state and actions
 * @example
 * ```typescript
 * const { parseData, isReady, parseResult } = useDebugger()
 * if (isReady) {
 *   await parseData()
 * }
 * ```
 */
export function useDebugger() {
  const { schemaContent, binaryData, parseResult, setParseResult, addParseEvent, reset } =
    useDebugStore()

  // Helper to extract field events from parse tree
  const extractFieldEvents = (node: ParseTreeNode, path = ''): void => {
    const currentPath = path ? `${path}.${node.name}` : node.name

    // Add event for this node if it has offset/size (actual parsed field)
    if (node.offset !== undefined && node.size !== undefined) {
      addParseEvent({
        type: 'field',
        fieldName: currentPath,
        offset: node.offset,
        size: node.size,
        value: node.type === 'object' ? undefined : node.value,
        timestamp: Date.now(),
      })
    }

    // Recursively process children
    if (node.children) {
      for (const child of node.children) {
        extractFieldEvents(child, currentPath)
      }
    }
  }

  const parseData = useCallback(async () => {
    if (!schemaContent || !binaryData) {
      throw new Error('Schema and binary data are required')
    }

    try {
      // Add start event
      addParseEvent({
        type: 'field',
        fieldName: 'root',
        timestamp: Date.now(),
      })

      // Parse the data
      const result = parse(schemaContent, binaryData)

      // Store result
      setParseResult(result)

      // Extract field events from parse tree
      const tree = resultToTree(result, 'root')
      extractFieldEvents(tree)

      // Add complete event
      addParseEvent({
        type: 'complete',
        timestamp: Date.now(),
      })

      return result
    } catch (error) {
      // Add error event
      addParseEvent({
        type: 'error',
        error: error as Error,
        timestamp: Date.now(),
      })

      throw error
    }
  }, [schemaContent, binaryData, setParseResult, addParseEvent])

  const resetDebugger = useCallback(() => {
    reset()
  }, [reset])

  return {
    schemaContent,
    binaryData,
    parseResult,
    parseData,
    resetDebugger,
    isReady: Boolean(schemaContent && binaryData),
  }
}
