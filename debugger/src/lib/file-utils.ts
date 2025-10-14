/**
 * @fileoverview Utility functions for file handling
 * @module debugger/lib/file-utils
 * @author Fabiano Pinto
 * @license MIT
 */

/**
 * Read a file as text
 *
 * @param file - File to read
 * @returns Promise resolving to file content as string
 * @throws Error if file reading fails
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/**
 * Read a file as Uint8Array
 *
 * @param file - File to read
 * @returns Promise resolving to file content as Uint8Array
 * @throws Error if file reading fails
 */
export async function readFileAsBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer
      resolve(new Uint8Array(arrayBuffer))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Download data as a file
 *
 * @param data - Data to download (string or Uint8Array)
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type of the file
 */
export function downloadFile(data: string | Uint8Array, filename: string, mimeType: string) {
  const blob = new Blob([data as BlobPart], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., '1.5 MB')
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validate if a file is a valid .ksy schema
 *
 * @param filename - Filename to validate
 * @returns True if filename has .ksy, .yaml, or .yml extension
 */
export function isValidKsyFile(filename: string): boolean {
  return filename.endsWith('.ksy') || filename.endsWith('.yaml') || filename.endsWith('.yml')
}
