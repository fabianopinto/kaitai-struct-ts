/**
 * @fileoverview Schema editor component with Monaco
 * @module debugger/components/SchemaEditor/SchemaEditor
 * @author Fabiano Pinto
 * @license MIT
 */

import { Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'

const Monaco = lazy(() => import('@monaco-editor/react'))

interface SchemaEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function SchemaEditor({ value, onChange, readOnly = false }: SchemaEditorProps) {
  return (
    <div className="h-full border border-border rounded-lg bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">Schema Editor</span>
        <span className="text-xs text-muted-foreground">.ksy (YAML)</span>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading editor...</span>
              </div>
            </div>
          }
        >
          <Monaco
            height="100%"
            defaultLanguage="yaml"
            value={value}
            onChange={(newValue) => onChange(newValue || '')}
            theme="vs-dark"
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
          />
        </Suspense>
      </div>
    </div>
  )
}
