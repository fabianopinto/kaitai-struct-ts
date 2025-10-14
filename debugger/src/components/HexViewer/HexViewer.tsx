/**
 * @fileoverview Hex viewer component with virtual scrolling
 * @module debugger/components/HexViewer/HexViewer
 * @author Fabiano Pinto
 * @license MIT
 */

import { useMemo, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { Edit3, Check } from 'lucide-react'
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
  /** Callback when binary data is edited */
  onDataChange?: (newData: Uint8Array) => void
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
  onDataChange,
  bytesPerRow = 16,
}: HexViewerProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedData, setEditedData] = useState<Uint8Array | null>(null)

  const currentData = editedData || data

  const rowCount = useMemo(() => {
    return currentData ? calculateRowCount(currentData.length, bytesPerRow) : 0
  }, [currentData, bytesPerRow])

  const handleByteEdit = (offset: number, newValue: number) => {
    if (!currentData) return

    const newData = new Uint8Array(currentData)
    newData[offset] = newValue
    setEditedData(newData)
  }

  const handleApplyChanges = () => {
    if (editedData && onDataChange) {
      onDataChange(editedData)
      setEditedData(null)
      setIsEditMode(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedData(null)
    setIsEditMode(false)
  }

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
            {currentData?.length.toLocaleString()} bytes
          </span>
          {editedData && <span className="text-xs text-amber-600 font-medium">• Modified</span>}
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <button
              onClick={() => setIsEditMode(true)}
              className="px-3 py-1 text-xs border border-border rounded hover:bg-accent flex items-center gap-1.5"
              title="Enable edit mode"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyChanges}
                disabled={!editedData}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Apply changes and re-parse"
              >
                <Check className="w-3 h-3" />
                Apply
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-xs border border-border rounded hover:bg-accent"
                title="Cancel editing"
              >
                Cancel
              </button>
            </div>
          )}
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
              data={currentData!}
              rowIndex={index}
              bytesPerRow={bytesPerRow}
              highlights={highlights}
              currentOffset={currentOffset}
              onOffsetClick={onOffsetClick}
              isEditMode={isEditMode}
              onByteEdit={handleByteEdit}
            />
          )}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}
