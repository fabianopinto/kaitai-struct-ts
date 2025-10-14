import { create } from 'zustand'

export interface ParseEvent {
  type: 'field' | 'error' | 'complete'
  fieldName?: string
  offset?: number
  size?: number
  value?: unknown
  error?: Error
  timestamp: number
}

export interface DebugState {
  // Files
  schemaContent: string | null
  binaryData: Uint8Array | null
  
  // Parse state
  parseResult: unknown | null
  parseEvents: ParseEvent[]
  currentStep: number
  isPlaying: boolean
  
  // UI state
  selectedField: string | null
  hexViewOffset: number
  breakpoints: Set<string>
  
  // Actions
  setSchemaContent: (content: string) => void
  setBinaryData: (data: Uint8Array) => void
  setParseResult: (result: unknown) => void
  addParseEvent: (event: ParseEvent) => void
  setCurrentStep: (step: number) => void
  setIsPlaying: (playing: boolean) => void
  setSelectedField: (field: string | null) => void
  setHexViewOffset: (offset: number) => void
  toggleBreakpoint: (fieldName: string) => void
  reset: () => void
}

const initialState = {
  schemaContent: null,
  binaryData: null,
  parseResult: null,
  parseEvents: [],
  currentStep: 0,
  isPlaying: false,
  selectedField: null,
  hexViewOffset: 0,
  breakpoints: new Set<string>(),
}

export const useDebugStore = create<DebugState>((set) => ({
  ...initialState,

  setSchemaContent: (content) => set({ schemaContent: content }),
  
  setBinaryData: (data) => set({ binaryData: data }),
  
  setParseResult: (result) => set({ parseResult: result }),
  
  addParseEvent: (event) =>
    set((state) => ({
      parseEvents: [...state.parseEvents, event],
    })),
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  setSelectedField: (field) => set({ selectedField: field }),
  
  setHexViewOffset: (offset) => set({ hexViewOffset: offset }),
  
  toggleBreakpoint: (fieldName) =>
    set((state) => {
      const newBreakpoints = new Set(state.breakpoints)
      if (newBreakpoints.has(fieldName)) {
        newBreakpoints.delete(fieldName)
      } else {
        newBreakpoints.add(fieldName)
      }
      return { breakpoints: newBreakpoints }
    }),
  
  reset: () => set(initialState),
}))
