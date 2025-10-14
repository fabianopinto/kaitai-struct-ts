/**
 * @fileoverview Main application component
 * @module debugger/App
 * @author Fabiano Pinto
 * @license MIT
 */

import { useState } from 'react'
import { FileUp, Play, AlertCircle, Info, X } from 'lucide-react'
import { HexViewer } from './components/HexViewer'
import { ParseTree } from './components/ParseTree'
import { SchemaEditor } from './components/SchemaEditor'
import { useFileLoader } from './hooks/useFileLoader'
import { useDebugger } from './hooks/useDebugger'
import { useDebugStore } from './store/debugStore'

/**
 * Main application component with two views: welcome and debugger
 *
 * @returns Application component
 */
function App() {
  const [view, setView] = useState<'welcome' | 'debugger'>('welcome')
  const [error, setError] = useState<string | null>(null)
  const { loadSchemaFile, loadBinaryFile } = useFileLoader()
  const { parseData, isReady } = useDebugger()
  const {
    schemaContent,
    binaryData,
    parseResult,
    setSchemaContent,
    selectedField,
    setSelectedField,
  } = useDebugStore()

  const handleSchemaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        await loadSchemaFile(file)
        setError(null)
      } catch (err) {
        setError(`Failed to load schema: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  }

  const handleBinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        await loadBinaryFile(file)
        setError(null)
      } catch (err) {
        setError(`Failed to load binary: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  }

  const handleStartDebugging = async () => {
    try {
      setError(null)
      await parseData()
      setView('debugger')
    } catch (err) {
      setError(`Parse error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleBackToWelcome = () => {
    setView('welcome')
  }

  if (view === 'welcome') {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold">K</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Kaitai Struct Debugger</h1>
                <p className="text-sm text-muted-foreground">
                  Visual binary format debugger v0.1.0
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm border border-border rounded hover:bg-accent">
                <Info className="w-4 h-4 inline mr-2" />
                Help
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Welcome to Kaitai Struct Debugger</h2>
              <p className="text-muted-foreground">
                Upload a .ksy schema file and a binary file to start debugging
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="border border-destructive bg-destructive/10 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="text-sm text-destructive/90 mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Schema File Upload */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <label htmlFor="schema-upload" className="cursor-pointer block">
                  <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-2">Upload Schema (.ksy)</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {schemaContent ? '✓ Schema loaded' : 'Click to browse'}
                  </p>
                  <input
                    id="schema-upload"
                    type="file"
                    accept=".ksy,.yaml,.yml"
                    className="hidden"
                    onChange={handleSchemaUpload}
                  />
                  <span className="text-xs text-muted-foreground">
                    Kaitai Struct definition file
                  </span>
                </label>
              </div>

              {/* Binary File Upload */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <label htmlFor="binary-upload" className="cursor-pointer block">
                  <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-2">Upload Binary File</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {binaryData ? `✓ ${binaryData.length} bytes loaded` : 'Click to browse'}
                  </p>
                  <input
                    id="binary-upload"
                    type="file"
                    className="hidden"
                    onChange={handleBinaryUpload}
                  />
                  <span className="text-xs text-muted-foreground">Any binary file format</span>
                </label>
              </div>
            </div>

            {/* Parse Button */}
            {isReady && (
              <div className="flex justify-center">
                <button
                  onClick={handleStartDebugging}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium"
                >
                  <Play className="w-5 h-5" />
                  Start Debugging
                </button>
              </div>
            )}

            {/* Quick Start */}
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-3">Quick Start</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Upload a Kaitai Struct schema file (.ksy)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Upload a binary file to parse</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Click "Start Debugging" to visualize the parsing process</span>
                </li>
              </ul>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by{' '}
            <a
              href="https://github.com/fabianopinto/kaitai-struct-ts"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              kaitai-struct-ts
            </a>{' '}
            | Built with React + TypeScript + Vite
          </p>
        </footer>
      </div>
    )
  }

  // Debugger View
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToWelcome}
              className="px-3 py-1.5 text-sm border border-border rounded hover:bg-accent"
            >
              ← Back
            </button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-lg font-bold">Kaitai Struct Debugger</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {binaryData?.length.toLocaleString()} bytes
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - 2x2 Grid */}
      <main className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-4 overflow-hidden">
        {/* Top Left: Schema Editor */}
        <div className="overflow-hidden">
          <SchemaEditor value={schemaContent || ''} onChange={setSchemaContent} />
        </div>

        {/* Top Right: Hex Viewer */}
        <div className="overflow-hidden">
          <HexViewer
            data={binaryData}
            onOffsetClick={(offset) => console.log('Clicked offset:', offset)}
          />
        </div>

        {/* Bottom Left: Parse Tree */}
        <div className="overflow-hidden">
          <ParseTree
            data={parseResult}
            selectedField={selectedField}
            onFieldSelect={setSelectedField}
          />
        </div>

        {/* Bottom Right: Console (Placeholder) */}
        <div className="overflow-hidden border border-border rounded-lg bg-background flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Console</p>
            <p className="text-sm">(Coming in Phase 3)</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
