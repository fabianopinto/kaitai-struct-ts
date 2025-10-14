/**
 * @fileoverview Utility functions for hex viewing and formatting
 * @module debugger/lib/hex-utils
 * @author Fabiano Pinto
 * @license MIT
 */

/**
 * Convert a byte to a two-digit hex string
 *
 * @param byte - Byte value (0-255)
 * @returns Two-digit uppercase hex string
 * @example
 * ```typescript
 * byteToHex(255) // 'FF'
 * byteToHex(16)  // '10'
 * ```
 */
export function byteToHex(byte: number): string {
  return byte.toString(16).padStart(2, '0').toUpperCase()
}

/**
 * Convert an offset to a hex string with padding
 *
 * @param offset - Byte offset
 * @param padding - Number of digits (default: 8)
 * @returns Padded uppercase hex string
 * @example
 * ```typescript
 * offsetToHex(255)      // '000000FF'
 * offsetToHex(255, 4)   // '00FF'
 * ```
 */
export function offsetToHex(offset: number, padding = 8): string {
  return offset.toString(16).padStart(padding, '0').toUpperCase()
}

/**
 * Convert a byte to ASCII character (printable only)
 *
 * @param byte - Byte value (0-255)
 * @returns ASCII character or '.' for non-printable
 * @example
 * ```typescript
 * byteToAscii(65)  // 'A'
 * byteToAscii(0)   // '.'
 * ```
 */
export function byteToAscii(byte: number): string {
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.'
}

/**
 * Hex row data structure
 */
export interface HexRow {
  offset: number
  bytes: number[]
  ascii: string
}

/**
 * Format a row of hex data
 *
 * @param data - Binary data
 * @param offset - Starting offset
 * @param bytesPerRow - Number of bytes per row (default: 16)
 * @returns Formatted hex row
 */
export function formatHexRow(data: Uint8Array, offset: number, bytesPerRow = 16): HexRow {
  const endOffset = Math.min(offset + bytesPerRow, data.length)
  const bytes: number[] = []
  let ascii = ''

  for (let i = offset; i < endOffset; i++) {
    const byte = data[i]
    bytes.push(byte)
    ascii += byteToAscii(byte)
  }

  return { offset, bytes, ascii }
}

/**
 * Calculate the number of rows needed for the data
 *
 * @param dataLength - Total data length in bytes
 * @param bytesPerRow - Number of bytes per row (default: 16)
 * @returns Number of rows needed
 */
export function calculateRowCount(dataLength: number, bytesPerRow = 16): number {
  return Math.ceil(dataLength / bytesPerRow)
}

/**
 * Check if an offset is within a highlight range
 *
 * @param offset - Byte offset to check
 * @param highlightStart - Start of highlight range
 * @param highlightEnd - End of highlight range
 * @returns True if offset is highlighted
 */
export function isOffsetHighlighted(
  offset: number,
  highlightStart: number,
  highlightEnd: number
): boolean {
  return offset >= highlightStart && offset < highlightEnd
}

/**
 * Get the color for a highlight based on field type
 *
 * @param fieldType - Field type (u1, u2, str, etc.)
 * @returns Tailwind CSS class for background color
 */
export function getHighlightColor(fieldType?: string): string {
  const colors: Record<string, string> = {
    u1: 'bg-blue-200 dark:bg-blue-900',
    u2: 'bg-green-200 dark:bg-green-900',
    u4: 'bg-yellow-200 dark:bg-yellow-900',
    u8: 'bg-purple-200 dark:bg-purple-900',
    str: 'bg-pink-200 dark:bg-pink-900',
    strz: 'bg-pink-200 dark:bg-pink-900',
    bytes: 'bg-gray-200 dark:bg-gray-700',
    default: 'bg-accent',
  }

  return colors[fieldType || 'default'] || colors.default
}
