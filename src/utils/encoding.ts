/**
 * @fileoverview String encoding and decoding utilities for binary data
 * @module utils/encoding
 * @author Fabiano Pinto
 * @license MIT
 */

/**
 * Decode bytes to string using specified encoding.
 * Supports UTF-8, ASCII, Latin-1, UTF-16LE, and UTF-16BE.
 * Falls back to TextDecoder for other encodings if available.
 * 
 * @param bytes - Byte array to decode
 * @param encoding - Character encoding name (e.g., 'UTF-8', 'ASCII')
 * @returns Decoded string
 * @throws {Error} If encoding is not supported
 * @example
 * ```typescript
 * const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])
 * const str = decodeString(bytes, 'UTF-8') // "Hello"
 * ```
 */
export function decodeString(bytes: Uint8Array, encoding: string): string {
  // Normalize encoding name
  const normalizedEncoding = encoding.toLowerCase().replace(/[-_]/g, '')

  // Handle common encodings
  switch (normalizedEncoding) {
    case 'utf8':
    case 'utf-8':
      return decodeUtf8(bytes)
    
    case 'ascii':
    case 'usascii':
      return decodeAscii(bytes)
    
    case 'utf16':
    case 'utf16le':
    case 'utf-16le':
      return decodeUtf16Le(bytes)
    
    case 'utf16be':
    case 'utf-16be':
      return decodeUtf16Be(bytes)
    
    case 'latin1':
    case 'iso88591':
    case 'iso-8859-1':
      return decodeLatin1(bytes)
    
    default:
      // Try using TextDecoder if available (browser/modern Node.js)
      if (typeof TextDecoder !== 'undefined') {
        try {
          return new TextDecoder(encoding).decode(bytes)
        } catch (e) {
          throw new Error(`Unsupported encoding: ${encoding}`)
        }
      }
      throw new Error(`Unsupported encoding: ${encoding}`)
  }
}

/**
 * Decode UTF-8 bytes to string.
 * Handles 1-4 byte UTF-8 sequences including surrogate pairs.
 * 
 * @param bytes - UTF-8 encoded byte array
 * @returns Decoded string
 * @private
 */
function decodeUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes)
  }
  
  // Fallback implementation
  let result = ''
  let i = 0
  
  while (i < bytes.length) {
    const byte1 = bytes[i++]
    
    if (byte1 < 0x80) {
      // 1-byte character (ASCII)
      result += String.fromCharCode(byte1)
    } else if (byte1 < 0xe0) {
      // 2-byte character
      const byte2 = bytes[i++]
      result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f))
    } else if (byte1 < 0xf0) {
      // 3-byte character
      const byte2 = bytes[i++]
      const byte3 = bytes[i++]
      result += String.fromCharCode(
        ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f)
      )
    } else {
      // 4-byte character (surrogate pair)
      const byte2 = bytes[i++]
      const byte3 = bytes[i++]
      const byte4 = bytes[i++]
      let codePoint =
        ((byte1 & 0x07) << 18) |
        ((byte2 & 0x3f) << 12) |
        ((byte3 & 0x3f) << 6) |
        (byte4 & 0x3f)
      codePoint -= 0x10000
      result += String.fromCharCode(
        0xd800 + (codePoint >> 10),
        0xdc00 + (codePoint & 0x3ff)
      )
    }
  }
  
  return result
}

/**
 * Decode ASCII bytes to string.
 * Only uses the lower 7 bits of each byte.
 * 
 * @param bytes - ASCII encoded byte array
 * @returns Decoded string
 * @private
 */
function decodeAscii(bytes: Uint8Array): string {
  let result = ''
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i] & 0x7f)
  }
  return result
}

/**
 * Decode Latin-1 (ISO-8859-1) bytes to string.
 * Each byte directly maps to a Unicode code point.
 * 
 * @param bytes - Latin-1 encoded byte array
 * @returns Decoded string
 * @private
 */
function decodeLatin1(bytes: Uint8Array): string {
  let result = ''
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i])
  }
  return result
}

/**
 * Decode UTF-16 Little Endian bytes to string.
 * Reads 2 bytes per character in little-endian order.
 * 
 * @param bytes - UTF-16LE encoded byte array
 * @returns Decoded string
 * @private
 */
function decodeUtf16Le(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-16le').decode(bytes)
  }
  
  let result = ''
  for (let i = 0; i < bytes.length; i += 2) {
    const charCode = bytes[i] | (bytes[i + 1] << 8)
    result += String.fromCharCode(charCode)
  }
  return result
}

/**
 * Decode UTF-16 Big Endian bytes to string.
 * Reads 2 bytes per character in big-endian order.
 * 
 * @param bytes - UTF-16BE encoded byte array
 * @returns Decoded string
 * @private
 */
function decodeUtf16Be(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-16be').decode(bytes)
  }
  
  let result = ''
  for (let i = 0; i < bytes.length; i += 2) {
    const charCode = (bytes[i] << 8) | bytes[i + 1]
    result += String.fromCharCode(charCode)
  }
  return result
}
