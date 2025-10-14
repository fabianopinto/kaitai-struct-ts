/**
 * @fileoverview Type definitions for debugger
 * @module debugger/types
 * @author Fabiano Pinto
 * @license MIT
 */

/**
 * Field highlight information for hex viewer
 */
export interface FieldHighlight {
  /** Byte offset in stream */
  offset: number
  /** Field size in bytes */
  size: number
  /** Field name */
  fieldName: string
  /** Parsed value */
  value: unknown
  /** Tailwind CSS color class */
  color?: string
}

/**
 * Hex viewer component props
 */
export interface HexViewerProps {
  /** Binary data to display */
  data: Uint8Array | null
  /** Field highlights */
  highlights?: FieldHighlight[]
  /** Current offset to highlight */
  currentOffset?: number
  /** Callback when offset is clicked */
  onOffsetClick?: (offset: number) => void
}

/**
 * Parse tree node structure
 */
export interface ParseTreeNode {
  /** Node name */
  name: string
  /** Node value */
  value: unknown
  /** Node type */
  type: string
  /** Byte offset (if available) */
  offset?: number
  /** Size in bytes (if available) */
  size?: number
  /** Child nodes */
  children?: ParseTreeNode[]
}

/**
 * Debug session data
 */
export interface DebugSession {
  /** Session ID */
  id: string
  /** Schema file name */
  schemaName: string
  /** Binary file name */
  binaryFileName: string
  /** Session creation time */
  createdAt: Date
  /** Parse events */
  events: ParseEvent[]
}

/**
 * Parse event
 */
export interface ParseEvent {
  /** Event type */
  type: 'field' | 'error' | 'complete'
  /** Field name */
  fieldName?: string
  /** Byte offset */
  offset?: number
  /** Field size */
  size?: number
  /** Parsed value */
  value?: unknown
  /** Error if type is 'error' */
  error?: Error
  /** Event timestamp */
  timestamp: number
}
