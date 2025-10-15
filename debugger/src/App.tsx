/**
 * @fileoverview Main application component
 * @module debugger/App
 * @author Fabiano Pinto
 * @license MIT
 */

import { useState, useMemo, useEffect } from 'react'
import { FileUp, Play, AlertCircle, Info, X, RefreshCw } from 'lucide-react'
import { HexViewer } from './components/HexViewer'
import { ParseTree } from './components/ParseTree'
import { SchemaEditor } from './components/SchemaEditor'
import { Console } from './components/Console'
import { ExpressionConsole } from './components/ExpressionConsole'
import { DebugControls } from './components/DebugControls'
import { ExampleSelector } from './components/ExampleSelector/ExampleSelector'
import { useFileLoader } from './hooks/useFileLoader'
import { useDebugger } from './hooks/useDebugger'
import { useStepDebugger } from './hooks/useStepDebugger'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useDebugStore } from './store/debugStore'
import { resultToTree, findNodeByPath } from './lib/parse-tree-utils'
import { createEvaluationContext, evaluateExpression } from './lib/expression-evaluator'
import type { FieldHighlight } from './types'

/**
 * Main application component with two views: welcome and debugger
 *
 * @returns Application component
 */
function App() {
  const [view, setView] = useState<'welcome' | 'debugger'>('welcome')
  const [error, setError] = useState<string | null>(null)
  const [consoleTab, setConsoleTab] = useState<'events' | 'expression'>('events')
  const { loadSchemaFile, loadBinaryFile } = useFileLoader()
  const { parseData, isReady } = useDebugger()
  const { play, pause, stepForward, stepBack, reset, currentStep, totalSteps, isPlaying } =
    useStepDebugger()
  const {
    schemaContent,
    binaryData,
    parseResult,
    setSchemaContent,
    setBinaryData,
    selectedField,
    setSelectedField,
    parseEvents,
    hexViewOffset,
    setHexViewOffset,
    consoleOutputs,
    addConsoleOutput,
    clearConsoleOutputs,
  } = useDebugStore()

  // Keyboard shortcuts (only active in debugger view)
  useKeyboardShortcuts(
    view === 'debugger'
      ? {
          onPlay: isPlaying ? pause : play,
          onStepForward: stepForward,
          onStepBack: stepBack,
          onReset: reset,
          onEscape: () => setSelectedField(null),
        }
      : {}
  )

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

  // Create field highlights for hex viewer based on selected field
  const fieldHighlights = useMemo((): FieldHighlight[] => {
    if (!selectedField || !parseResult) return []

    const tree = resultToTree(parseResult, 'root')
    let node = findNodeByPath(tree, selectedField)

    // If node doesn't have offset/size (primitive field), try parent
    // Note: Parser only tracks positions for objects, not individual fields
    if (node && (node.offset === undefined || node.size === undefined)) {
      const parts = selectedField.split('.')
      if (parts.length > 1) {
        const parentPath = parts.slice(0, -1).join('.')
        const parentNode = findNodeByPath(tree, parentPath)
        if (parentNode && parentNode.offset !== undefined && parentNode.size !== undefined) {
          node = parentNode
        }
      }
    }

    if (!node || node.offset === undefined || node.size === undefined) {
      return []
    }

    return [
      {
        offset: node.offset,
        size: node.size,
        fieldName: selectedField, // Use full path instead of just node.name
        value: node.value,
        color: 'bg-yellow-200/80 dark:bg-yellow-600/40',
      },
    ]
  }, [selectedField, parseResult])

  // Update hex view offset when field highlights change (scroll to field)
  useEffect(() => {
    if (fieldHighlights.length > 0) {
      setHexViewOffset(fieldHighlights[0].offset)
    }
  }, [fieldHighlights, setHexViewOffset])

  const handleReparse = async () => {
    try {
      setError(null)
      // Reset debug state before re-parsing
      reset()
      await parseData()
    } catch (err) {
      setError(`Parse error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleEvaluateExpression = async (expression: string) => {
    const tree = parseResult ? resultToTree(parseResult, 'root') : null
    const selectedNode = selectedField && tree ? findNodeByPath(tree, selectedField) : null

    const context = createEvaluationContext(
      parseResult,
      selectedNode?.value,
      binaryData,
      (path: string) => {
        if (!tree) return null
        const node = findNodeByPath(tree, path)
        return node ? { offset: node.offset, size: node.size } : null
      }
    )

    const output = await evaluateExpression(expression, context)
    addConsoleOutput(output)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleSchemaDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (file) {
      try {
        await loadSchemaFile(file)
        setError(null)
      } catch (err) {
        setError(`Failed to load schema: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  }

  const handleBinaryDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (file) {
      try {
        await loadBinaryFile(file)
        setError(null)
      } catch (err) {
        setError(`Failed to load binary: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  }

  if (view === 'welcome') {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="logo.png" alt="Kaitai Struct" className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">Kaitai Struct Debugger</h1>
                <p className="text-sm text-muted-foreground">
                  Visual binary format debugger v0.6.0
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
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleSchemaDrop}
              >
                <label htmlFor="schema-upload" className="cursor-pointer block">
                  <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-2">Upload Schema (.ksy)</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {schemaContent ? '✓ Schema loaded' : 'Click or drag & drop'}
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
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleBinaryDrop}
              >
                <label htmlFor="binary-upload" className="cursor-pointer block">
                  <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-2">Upload Binary File</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {binaryData ? `✓ ${binaryData.length} bytes loaded` : 'Click or drag & drop'}
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

            {/* Example Selector */}
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-3">Or try an example</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Load a pre-configured example to see the debugger in action
              </p>
              <ExampleSelector />
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
            <img src="logo.png" alt="Kaitai Struct" className="w-6 h-6" />
            <h1 className="text-lg font-bold">Kaitai Struct Debugger</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReparse}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
              title="Re-parse with current schema"
            >
              <RefreshCw className="w-4 h-4" />
              Re-parse
            </button>
            <span className="text-xs text-muted-foreground">
              {binaryData?.length.toLocaleString()} bytes
            </span>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Parse Error</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-destructive hover:text-destructive/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Debug Controls */}
      <DebugControls
        isPlaying={isPlaying}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPlay={play}
        onPause={pause}
        onStepForward={stepForward}
        onStepBack={stepBack}
        onReset={reset}
      />

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
            highlights={fieldHighlights}
            currentOffset={hexViewOffset}
            onOffsetClick={(offset) => setHexViewOffset(offset)}
            onDataChange={(newData) => {
              setBinaryData(newData)
              // Automatically re-parse with new data
              handleReparse()
            }}
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

        {/* Bottom Right: Console with Tabs */}
        <div className="overflow-hidden flex flex-col">
          {/* Tab Headers */}
          <div className="flex border-b border-border bg-muted/30">
            <button
              onClick={() => setConsoleTab('events')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                consoleTab === 'events'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Parse Events
            </button>
            <button
              onClick={() => setConsoleTab('expression')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                consoleTab === 'expression'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Expression Console
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {consoleTab === 'events' ? (
              <Console events={parseEvents} />
            ) : (
              <ExpressionConsole
                outputs={consoleOutputs}
                onEvaluate={handleEvaluateExpression}
                onClear={clearConsoleOutputs}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
