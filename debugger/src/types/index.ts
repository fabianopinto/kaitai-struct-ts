export interface FieldHighlight {
  offset: number
  size: number
  fieldName: string
  value: unknown
  color?: string
}

export interface HexViewerProps {
  data: Uint8Array | null
  highlights?: FieldHighlight[]
  currentOffset?: number
  onOffsetClick?: (offset: number) => void
}

export interface ParseTreeNode {
  name: string
  value: unknown
  type: string
  offset?: number
  size?: number
  children?: ParseTreeNode[]
}

export interface DebugSession {
  id: string
  schemaName: string
  binaryFileName: string
  createdAt: Date
  events: ParseEvent[]
}

export interface ParseEvent {
  type: 'field' | 'error' | 'complete'
  fieldName?: string
  offset?: number
  size?: number
  value?: unknown
  error?: Error
  timestamp: number
}
