import { memo } from 'react'
import { byteToHex, byteToAscii, offsetToHex, isOffsetHighlighted } from '@/lib/hex-utils'
import type { FieldHighlight } from '@/types'

interface HexRowProps {
  data: Uint8Array
  rowIndex: number
  bytesPerRow: number
  highlights?: FieldHighlight[]
  currentOffset?: number
  onOffsetClick?: (offset: number) => void
}

export const HexRow = memo(function HexRow({
  data,
  rowIndex,
  bytesPerRow,
  highlights = [],
  currentOffset,
  onOffsetClick,
}: HexRowProps) {
  const offset = rowIndex * bytesPerRow
  const endOffset = Math.min(offset + bytesPerRow, data.length)

  // Check which bytes are highlighted
  const getHighlightForOffset = (byteOffset: number): FieldHighlight | undefined => {
    return highlights.find(
      (h) => byteOffset >= h.offset && byteOffset < h.offset + h.size
    )
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
              return <span key={i} className="w-6 text-center">  </span>
            }

            const byte = data[byteOffset]
            const highlight = getHighlightForOffset(byteOffset)
            const current = isCurrent(byteOffset)

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
                    ? `${highlight.fieldName}: ${JSON.stringify(highlight.value)}`
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
              return <span key={i} className="w-2"> </span>
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
