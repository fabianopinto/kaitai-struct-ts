/**
 * Example files configuration for the debugger
 */

export interface Example {
  id: string
  name: string
  description: string
  schemaPath: string
  binaryPath: string
  category: 'image' | 'audio' | 'hardware' | 'archive'
  icon?: string
}

// Get base path - use import.meta.env.BASE_URL which Vite provides
const BASE_PATH = import.meta.env.BASE_URL

export const EXAMPLES: Example[] = [
  {
    id: 'gif',
    name: 'GIF Image',
    description: '1x1 pixel GIF89a image with color table',
    schemaPath: `${BASE_PATH}examples/gif.ksy`,
    binaryPath: `${BASE_PATH}examples/sample.gif`,
    category: 'image',
    icon: '🖼️',
  },
  {
    id: 'png',
    name: 'PNG Image',
    description: '1x1 pixel PNG with IHDR and IDAT chunks',
    schemaPath: `${BASE_PATH}examples/png.ksy`,
    binaryPath: `${BASE_PATH}examples/sample.png`,
    category: 'image',
    icon: '🖼️',
  },
  {
    id: 'wav',
    name: 'WAV Audio',
    description: 'Minimal WAVE audio file with PCM data',
    schemaPath: `${BASE_PATH}examples/wav-simple.ksy`,
    binaryPath: `${BASE_PATH}examples/small.wav`,
    category: 'audio',
    icon: '🔊',
  },
  {
    id: 'edid',
    name: 'EDID Display Data',
    description: 'Extended Display Identification Data (EDID 1.0)',
    schemaPath: `${BASE_PATH}examples/edid-simple.ksy`,
    binaryPath: `${BASE_PATH}examples/edid-1.0.bin`,
    category: 'hardware',
    icon: '🖥️',
  },
]

export const EXAMPLE_CATEGORIES = {
  image: { label: 'Images', icon: '🖼️' },
  audio: { label: 'Audio', icon: '🔊' },
  hardware: { label: 'Hardware', icon: '🖥️' },
  archive: { label: 'Archives', icon: '📦' },
} as const
