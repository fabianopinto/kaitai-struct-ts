/**
 * @fileoverview Console component for displaying parse events
 * @module debugger/components/Console/Console
 * @author Fabiano Pinto
 * @license MIT
 */

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { AlertCircle, CheckCircle, Info, Play, Clock } from 'lucide-react'
import type { ParseEvent } from '@/store/debugStore'
import type { ConsoleOutput } from '@/lib/expression-evaluator'
import { formatValue } from '@/lib/expression-evaluator'

/**
 * Unified console entry (parse event or expression output)
 */
type ConsoleEntry =
  | { type: 'event'; data: ParseEvent }
  | { type: 'expression'; data: ConsoleOutput }

/**
 * Console component props
 */
interface ConsoleProps {
  /** Parse events to display */
  events: ParseEvent[]
  /** Expression outputs to display */
  outputs: ConsoleOutput[]
  /** Callback to evaluate expression */
  onEvaluate: (expression: string) => void
  /** Whether to auto-scroll to latest event */
  autoScroll?: boolean
}

/**
 * Console component for displaying parse events and logs
 *
 * @param props - Component props
 * @returns Console component
 */
export function Console({ events, outputs, onEvaluate, autoScroll = true }: ConsoleProps) {
  const [input, setInput] = useState('')
  const [historyIndex, setHistoryIndex] = useState(-1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Merge and sort entries by timestamp
  const entries: ConsoleEntry[] = [
    ...events.map((e) => ({ type: 'event' as const, data: e })),
    ...outputs.map((o) => ({ type: 'expression' as const, data: o })),
  ].sort((a, b) => {
    const timeA = a.type === 'event' ? a.data.timestamp : a.data.timestamp
    const timeB = b.type === 'event' ? b.data.timestamp : b.data.timestamp
    return timeA - timeB
  })

  // Build history from outputs
  const history = outputs.map((o) => o.expression)

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries.length, autoScroll])

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

  const getEventIcon = (event: ParseEvent) => {
    switch (event.type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  const getEventColor = (event: ParseEvent) => {
    switch (event.type) {
      case 'error':
        return 'text-destructive'
      case 'complete':
        return 'text-green-600'
      default:
        return 'text-foreground'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const time = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const ms = date.getMilliseconds().toString().padStart(3, '0')
    return `${time}.${ms}`
  }

  return (
    <div className="h-full border border-border rounded-lg bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">Console</span>
        <span className="text-xs text-muted-foreground">{entries.length} entries</span>
      </div>

      {/* Console Output */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-2 font-mono text-xs space-y-2">
        {entries.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">Parse a file or evaluate expressions</p>
              <p className="text-xs">
                Try: <code className="bg-muted px-1 rounded">root</code>,{' '}
                <code className="bg-muted px-1 rounded">hex(42)</code>
              </p>
            </div>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={index}>
              {entry.type === 'event' ? (
                // Parse Event
                <div className="flex items-start gap-2 px-2 py-1 hover:bg-muted/50 rounded">
                  <div className="flex-shrink-0 mt-0.5">{getEventIcon(entry.data)}</div>
                  <span className="text-muted-foreground flex-shrink-0">
                    {formatTimestamp(entry.data.timestamp)}
                  </span>
                  <span className={`flex-1 ${getEventColor(entry.data)}`}>
                    {entry.data.type === 'complete' ? (
                      <span className="font-semibold">Parsing completed successfully</span>
                    ) : entry.data.type === 'error' ? (
                      <span className="text-destructive">
                        Error: {entry.data.error?.message || 'Unknown error'}
                      </span>
                    ) : entry.data.fieldName ? (
                      <>
                        <span className="font-semibold">{entry.data.fieldName}</span>
                        {entry.data.offset !== undefined && (
                          <span className="text-muted-foreground">
                            {' '}
                            @ 0x{entry.data.offset.toString(16).toUpperCase()}
                          </span>
                        )}
                        {entry.data.size !== undefined && (
                          <span className="text-muted-foreground"> ({entry.data.size} bytes)</span>
                        )}
                        {entry.data.value !== undefined && (
                          <span className="text-muted-foreground">
                            {' '}
                            = {JSON.stringify(entry.data.value)}
                          </span>
                        )}
                      </>
                    ) : null}
                  </span>
                </div>
              ) : (
                // Expression Output
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">&gt;</span>
                    <span className="flex-1 text-foreground">{entry.data.expression}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {entry.data.executionTime.toFixed(1)}ms
                    </span>
                  </div>
                  {entry.data.error ? (
                    <div className="flex items-start gap-2 pl-4 text-destructive">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold">{entry.data.error.name}</div>
                        <div>{entry.data.error.message}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 pl-4">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                      <div className="flex-1 text-muted-foreground break-all">
                        {formatValue(entry.data.result)}
                      </div>
                    </div>
                  )}
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
            placeholder="Enter expression... (Enter to execute, ↑↓ for history)"
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
