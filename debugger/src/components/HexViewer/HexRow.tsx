/**
 * @fileoverview Hex viewer row component
 * @module debugger/components/HexViewer/HexRow
 * @author Fabiano Pinto
 * @license MIT
 */

import { memo, useState, useRef, useEffect } from 'react'
import { byteToHex, byteToAscii, offsetToHex } from '@/lib/hex-utils'
import type { FieldHighlight } from '@/types'

/**
 * Hex row component props
 */
interface HexRowProps {
  /** Binary data */
  data: Uint8Array
  /** Row index for virtualization */
  rowIndex: number
  /** Number of bytes per row */
  bytesPerRow: number
  /** Field highlights */
  highlights?: FieldHighlight[]
  /** Current offset to highlight */
  currentOffset?: number
  /** Callback when offset is clicked */
  onOffsetClick?: (offset: number) => void
  /** Whether edit mode is enabled */
  isEditMode?: boolean
  /** Callback when byte is edited */
  onByteEdit?: (offset: number, newValue: number) => void
}

/**
 * Editable hex byte component
 */
function EditableHexByte({
  value,
  offset,
  highlight,
  current,
  onEdit,
  onClick,
}: {
  value: number
  offset: number
  highlight?: FieldHighlight
  current: boolean
  onEdit: (newValue: number) => void
  onClick?: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering onClick
    setIsEditing(true)
    setEditValue(byteToHex(value))
  }

  const handleBlur = () => {
    if (editValue) {
      const newValue = parseInt(editValue, 16)
      if (!isNaN(newValue) && newValue >= 0 && newValue <= 255) {
        onEdit(newValue)
      }
    }
    setIsEditing(false)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue('')
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-6 text-center bg-amber-100 border border-amber-400 rounded font-mono text-xs"
        maxLength={2}
      />
    )
  }

  return (
    <span
      className={`
        w-6 text-center cursor-pointer rounded
        ${highlight ? highlight.color || 'bg-accent' : ''}
        ${current ? 'ring-2 ring-primary' : ''}
        hover:bg-accent/50 transition-colors
      `}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      title={
        highlight
          ? `Field: ${highlight.fieldName}\nOffset: 0x${offsetToHex(highlight.offset)}\nSize: ${highlight.size} bytes\n(double-click to edit)`
          : `Offset: 0x${offsetToHex(offset)} (double-click to edit)`
      }
    >
      {byteToHex(value)}
    </span>
  )
}

/**
 * Memoized hex row component for efficient rendering
 *
 * @param props - Component props
 * @returns Hex row component
 */
export const HexRow = memo(function HexRow({
  data,
  rowIndex,
  bytesPerRow,
  highlights = [],
  currentOffset,
  onOffsetClick,
  isEditMode = false,
  onByteEdit,
}: HexRowProps) {
  const offset = rowIndex * bytesPerRow

  // Check which bytes are highlighted
  const getHighlightForOffset = (byteOffset: number): FieldHighlight | undefined => {
    return highlights.find((h) => byteOffset >= h.offset && byteOffset < h.offset + h.size)
  }

  const isCurrent = (byteOffset: number): boolean => {
    return currentOffset !== undefined && byteOffset === currentOffset
  }

  return (
    <div className="px-4 py-1 hover:bg-muted/30 font-mono text-sm border-b border-border/50">
      <div className="flex gap-4">
        {/* Offset */}
        <span className="w-20 text-muted-foreground select-none">{offsetToHex(offset)}</span>

        {/* Hex Bytes */}
        <div className="flex-1 flex gap-1">
          {Array.from({ length: bytesPerRow }, (_, i) => {
            const byteOffset = offset + i
            if (byteOffset >= data.length) {
              return (
                <span key={i} className="w-6 text-center">
                  {' '}
                </span>
              )
            }

            const byte = data[byteOffset]
            const highlight = getHighlightForOffset(byteOffset)
            const current = isCurrent(byteOffset)

            if (isEditMode) {
              return (
                <EditableHexByte
                  key={i}
                  value={byte}
                  offset={byteOffset}
                  highlight={highlight}
                  current={current}
                  onEdit={(newValue) => onByteEdit?.(byteOffset, newValue)}
                  onClick={() => onOffsetClick?.(byteOffset)}
                />
              )
            }

            return (
              <span
                key={i}
                className={`
                  w-6 text-center cursor-pointer rounded
                  ${highlight ? highlight.color || 'bg-accent' : ''}
                  ${current ? 'ring-2 ring-primary' : ''}
                  hover:bg-accent/50 transition-colors
                `}
                onClick={() => onOffsetClick?.(byteOffset)}
                title={
                  highlight
                    ? `Field: ${highlight.fieldName}\nOffset: 0x${offsetToHex(highlight.offset)}\nSize: ${highlight.size} bytes`
                    : `Offset: 0x${offsetToHex(byteOffset)}`
                }
              >
                {byteToHex(byte)}
              </span>
            )
          })}
        </div>

        {/* ASCII */}
        <div className="w-32 flex">
          {Array.from({ length: bytesPerRow }, (_, i) => {
            const byteOffset = offset + i
            if (byteOffset >= data.length) {
              return (
                <span key={i} className="w-2">
                  {' '}
                </span>
              )
            }

            const byte = data[byteOffset]
            const highlight = getHighlightForOffset(byteOffset)
            const current = isCurrent(byteOffset)

            return (
              <span
                key={i}
                className={`
                  w-2 text-center cursor-pointer
                  ${highlight ? highlight.color || 'bg-accent' : ''}
                  ${current ? 'ring-2 ring-primary' : ''}
                  hover:bg-accent/50 transition-colors
                `}
                onClick={() => onOffsetClick?.(byteOffset)}
              >
                {byteToAscii(byte)}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
})
