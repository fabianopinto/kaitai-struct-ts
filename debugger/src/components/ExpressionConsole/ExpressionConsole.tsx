/**
 * @fileoverview Expression console/REPL component
 * @module debugger/components/ExpressionConsole
 * @author Fabiano Pinto
 * @license MIT
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Play, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import type { ConsoleOutput } from '@/lib/expression-evaluator'
import { formatValue } from '@/lib/expression-evaluator'

interface ExpressionConsoleProps {
  /** Console output history */
  outputs: ConsoleOutput[]
  /** Callback to evaluate expression */
  onEvaluate: (expression: string) => void
  /** Callback to clear console */
  onClear: () => void
}

/**
 * Expression console component for evaluating expressions against parsed data
 */
export function ExpressionConsole({ outputs, onEvaluate, onClear }: ExpressionConsoleProps) {
  const [input, setInput] = useState('')
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [outputs])

  // Build history from outputs
  const history = outputs.map((o) => o.expression)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Execute on Enter (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) {
        onEvaluate(input.trim())
        setInput('')
        setHistoryIndex(-1)
      }
    }

    // Navigate history with up/down arrows
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex])
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  return (
    <div className="h-full flex flex-col border border-border rounded-lg bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">Expression Console</span>
        <button
          onClick={onClear}
          disabled={outputs.length === 0}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear console"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Output Area */}
      <div ref={outputRef} className="flex-1 overflow-auto p-2 font-mono text-xs space-y-2">
        {outputs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">Evaluate expressions against parsed data</p>
              <p className="text-xs">
                Try: <code className="bg-muted px-1 rounded">root</code>,{' '}
                <code className="bg-muted px-1 rounded">hex(42)</code>, or{' '}
                <code className="bg-muted px-1 rounded">bytes(0, 16)</code>
              </p>
            </div>
          </div>
        ) : (
          outputs.map((output) => (
            <div key={output.id} className="space-y-1">
              {/* Expression */}
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">&gt;</span>
                <span className="flex-1 text-foreground">{output.expression}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {output.executionTime.toFixed(1)}ms
                </span>
              </div>

              {/* Result or Error */}
              {output.error ? (
                <div className="flex items-start gap-2 pl-4 text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold">{output.error.name}</div>
                    <div>{output.error.message}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 pl-4">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                  <div className="flex-1 text-muted-foreground break-all">
                    {formatValue(output.result)}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-muted/30 p-2">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 mt-2">&gt;</span>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter expression... (Enter to execute, Shift+Enter for new line)"
            className="flex-1 bg-transparent border-none outline-none resize-none font-mono text-sm min-h-[24px] max-h-[120px]"
            rows={1}
          />
          <button
            onClick={() => {
              if (input.trim()) {
                onEvaluate(input.trim())
                setInput('')
                setHistoryIndex(-1)
              }
            }}
            disabled={!input.trim()}
            className="p-1.5 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            title="Execute (Enter)"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
