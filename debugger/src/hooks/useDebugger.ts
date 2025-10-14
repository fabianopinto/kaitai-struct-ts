import { useCallback } from 'react'
import { parse } from '@k67/kaitai-struct-ts'
import { useDebugStore } from '@/store/debugStore'

export function useDebugger() {
  const {
    schemaContent,
    binaryData,
    parseResult,
    setParseResult,
    addParseEvent,
    reset,
  } = useDebugStore()

  const parseData = useCallback(async () => {
    if (!schemaContent || !binaryData) {
      throw new Error('Schema and binary data are required')
    }

    try {
      // Add start event
      addParseEvent({
        type: 'field',
        timestamp: Date.now(),
      })

      // Parse the data
      const result = parse(schemaContent, binaryData)

      // Store result
      setParseResult(result)

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
