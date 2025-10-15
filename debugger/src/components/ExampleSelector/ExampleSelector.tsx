/**
 * @fileoverview Example selector component for quick loading of example files
 * @module debugger/components/ExampleSelector
 */

import { useState } from 'react'
import { EXAMPLES, type Example } from '@/data/examples'
import { useDebugStore } from '@/store/debugStore'

export function ExampleSelector() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedExample, setSelectedExample] = useState<string>('')
  const { setSchemaContent, setBinaryData, setParseResult } = useDebugStore()

  const loadExample = async (example: Example) => {
    setIsLoading(true)
    // Clear previous parse state
    setParseResult(null)

    try {
      // Load schema file
      const schemaResponse = await fetch(example.schemaPath)
      if (!schemaResponse.ok) {
        throw new Error(`Failed to load schema: ${schemaResponse.statusText}`)
      }
      const schemaText = await schemaResponse.text()
      setSchemaContent(schemaText)

      // Load binary file
      const binaryResponse = await fetch(example.binaryPath)
      if (!binaryResponse.ok) {
        throw new Error(`Failed to load binary: ${binaryResponse.statusText}`)
      }
      const binaryBuffer = await binaryResponse.arrayBuffer()
      setBinaryData(new Uint8Array(binaryBuffer))

      setSelectedExample(example.id)
    } catch (error) {
      console.error('Failed to load example:', error)
      alert(`Failed to load example: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="example-select" className="text-sm font-medium text-gray-700">
        Examples:
      </label>
      <select
        id="example-select"
        value={selectedExample}
        onChange={(e) => {
          const example = EXAMPLES.find((ex) => ex.id === e.target.value)
          if (example) {
            loadExample(example)
          }
        }}
        disabled={isLoading}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select an example...</option>
        {EXAMPLES.map((example) => (
          <option key={example.id} value={example.id}>
            {example.icon} {example.name}
          </option>
        ))}
      </select>
      {isLoading && (
        <span className="text-sm text-gray-500">Loading...</span>
      )}
    </div>
  )
}
