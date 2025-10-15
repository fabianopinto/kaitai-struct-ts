/**
 * @fileoverview Console component for displaying parse events
 * @module debugger/components/Console/Console
 * @author Fabiano Pinto
 * @license MIT
 */

import { useEffect, useRef } from 'react'
import { AlertCircle, CheckCircle, Info, Trash2 } from 'lucide-react'
import { useDebugStore } from '@/store/debugStore'
import type { ParseEvent } from '@/store/debugStore'

/**
 * Console component props
 */
interface ConsoleProps {
  /** Parse events to display */
  events: ParseEvent[]
  /** Whether to auto-scroll to latest event */
  autoScroll?: boolean
}

/**
 * Console component for displaying parse events and logs
 *
 * @param props - Component props
 * @returns Console component
 */
export function Console({ events, autoScroll = true }: ConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { consoleHidden, clearConsoleDisplay } = useDebugStore()

  // Filter events based on consoleHidden flag
  const visibleEvents = consoleHidden ? [] : events

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleEvents, autoScroll])

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
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{events.length} events</span>
          {events.length > 0 && !consoleHidden && (
            <button
              onClick={clearConsoleDisplay}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              title="Clear console display (events kept for debugging)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Console Output */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-2 font-mono text-xs">
        {visibleEvents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No events yet. Parse a file to see output.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {visibleEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-2 px-2 py-1 hover:bg-muted/50 rounded"
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">{getEventIcon(event)}</div>

                {/* Timestamp */}
                <span className="text-muted-foreground flex-shrink-0">
                  {formatTimestamp(event.timestamp)}
                </span>

                {/* Message */}
                <div className={`flex-1 ${getEventColor(event)}`}>
                  {event.type === 'error' ? (
                    <span className="font-semibold">
                      Error: {event.error?.message || 'Unknown error'}
                    </span>
                  ) : event.type === 'complete' ? (
                    <span className="font-semibold">Parsing completed successfully</span>
                  ) : (
                    <div>
                      <span className="font-semibold">{event.fieldName}</span>
                      {event.offset !== undefined && (
                        <span className="text-muted-foreground">
                          {' '}
                          @ 0x{event.offset.toString(16).toUpperCase()}
                        </span>
                      )}
                      {event.size !== undefined && (
                        <span className="text-muted-foreground"> ({event.size} bytes)</span>
                      )}
                      {event.value !== undefined && (
                        <span className="text-muted-foreground">
                          {' '}
                          = {JSON.stringify(event.value)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
