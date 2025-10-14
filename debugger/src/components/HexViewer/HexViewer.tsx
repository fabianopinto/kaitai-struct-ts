/**
 * @fileoverview Hex viewer component with virtual scrolling
 * @module debugger/components/HexViewer/HexViewer
 * @author Fabiano Pinto
 * @license MIT
 */

import { useMemo } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { HexRow } from './HexRow.tsx'
import { calculateRowCount } from '@/lib/hex-utils'
import type { FieldHighlight } from '@/types'

/**
 * Hex viewer component props
 */
interface HexViewerProps {
  /** Binary data to display */
  data: Uint8Array | null
  /** Field highlights */
  highlights?: FieldHighlight[]
  /** Current offset to highlight */
  currentOffset?: number
  /** Callback when offset is clicked */
  onOffsetClick?: (offset: number) => void
  /** Number of bytes per row (default: 16) */
  bytesPerRow?: number
}

/**
 * Hex viewer component with virtual scrolling for efficient rendering of large files
 *
 * @param props - Component props
 * @returns Hex viewer component
 */
export function HexViewer({
  data,
  highlights = [],
  currentOffset,
  onOffsetClick,
  bytesPerRow = 16,
}: HexViewerProps) {
  const rowCount = useMemo(() => {
    return data ? calculateRowCount(data.length, bytesPerRow) : 0
  }, [data, bytesPerRow])

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center border border-border rounded-lg bg-muted/20">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No binary data loaded</p>
          <p className="text-sm text-muted-foreground">Upload a binary file to view hex data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full border border-border rounded-lg bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Hex Viewer</span>
          <span className="text-xs text-muted-foreground">
            {data.length.toLocaleString()} bytes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Bytes per row:</span>
          <span className="text-xs font-mono">{bytesPerRow}</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="border-b border-border bg-muted/30 px-4 py-1 font-mono text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span className="w-20">Offset</span>
          <span className="flex-1 flex gap-1">
            {Array.from({ length: bytesPerRow }, (_, i) => (
              <span key={i} className="w-6 text-center">
                {i.toString(16).toUpperCase()}
              </span>
            ))}
          </span>
          <span className="w-32">ASCII</span>
        </div>
      </div>

      {/* Hex Data (Virtualized) */}
      <div className="flex-1 overflow-hidden">
        <Virtuoso
          totalCount={rowCount}
          itemContent={(index) => (
            <HexRow
              data={data}
              rowIndex={index}
              bytesPerRow={bytesPerRow}
              highlights={highlights}
              currentOffset={currentOffset}
              onOffsetClick={onOffsetClick}
            />
          )}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}
