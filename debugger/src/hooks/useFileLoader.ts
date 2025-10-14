import { useCallback } from 'react'
import { readFileAsText, readFileAsBytes } from '@/lib/file-utils'
import { useDebugStore } from '@/store/debugStore'

export function useFileLoader() {
  const { setSchemaContent, setBinaryData } = useDebugStore()

  const loadSchemaFile = useCallback(
    async (file: File) => {
      try {
        const content = await readFileAsText(file)
        setSchemaContent(content)
        return content
      } catch (error) {
        console.error('Failed to load schema file:', error)
        throw error
      }
    },
    [setSchemaContent]
  )

  const loadBinaryFile = useCallback(
    async (file: File) => {
      try {
        const data = await readFileAsBytes(file)
        setBinaryData(data)
        return data
      } catch (error) {
        console.error('Failed to load binary file:', error)
        throw error
      }
    },
    [setBinaryData]
  )

  return {
    loadSchemaFile,
    loadBinaryFile,
  }
}
