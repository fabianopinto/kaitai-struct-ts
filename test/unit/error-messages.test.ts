/**
 * @fileoverview Tests for enhanced error messages with context
 * @module test/unit/error-messages
 */

import { describe, it, expect } from 'vitest'
import { ParseError, ValidationError, EOFError, KaitaiError } from '../../src/utils/errors'

describe('Enhanced Error Messages', () => {
  describe('KaitaiError', () => {
    it('should include byte offset in message', () => {
      const error = new KaitaiError('Test error', 42)
      expect(error.message).toContain('0x2A')
      expect(error.message).toContain('at byte offset')
      expect(error.position).toBe(42)
    })

    it('should work without position', () => {
      const error = new KaitaiError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.position).toBeUndefined()
    })

    it('should include hex context when provided', () => {
      const data = new Uint8Array([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
      ])
      const error = new KaitaiError('Test error', 8, data)
      
      expect(error.message).toContain('Context:')
      expect(error.message).toContain('00000000:')
      expect(error.message).toContain('08 09 0a 0b')
      expect(error.message).toContain('<--') // Marker at position
    })

    it('should show ASCII representation in context', () => {
      const data = new Uint8Array([
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, // "Hello "
        0x57, 0x6f, 0x72, 0x6c, 0x64, 0x21, // "World!"
      ])
      const error = new KaitaiError('Test error', 6, data)
      
      expect(error.message).toContain('Hello')
      expect(error.message).toContain('World!')
    })

    it('should handle non-printable characters as dots', () => {
      const data = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0x20, 0x41])
      const error = new KaitaiError('Test error', 3, data)
      
      expect(error.message).toContain('....')
      expect(error.message).toContain(' A')
    })

    it('should show context around error position', () => {
      const data = new Uint8Array(64).fill(0x42)
      data[32] = 0xFF // Error position
      
      const error = new KaitaiError('Test error', 32, data)
      
      // Should show bytes before and after position 32
      expect(error.message).toContain('00000010:') // 16 bytes before
      expect(error.message).toContain('00000020:') // Line with error
      expect(error.message).toContain('<--') // Marker
    })

    it('should handle position at start of data', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04])
      const error = new KaitaiError('Test error', 0, data)
      
      expect(error.message).toContain('00000000:')
      expect(error.message).toContain('<--')
    })

    it('should handle position at end of data', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04])
      const error = new KaitaiError('Test error', 3, data)
      
      expect(error.message).toContain('00000000:')
      expect(error.message).toContain('<--')
    })
  })

  describe('ParseError', () => {
    it('should inherit context formatting', () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const error = new ParseError('Invalid structure', 2, data)
      
      expect(error.name).toBe('ParseError')
      expect(error.message).toContain('Invalid structure')
      expect(error.message).toContain('0x2')
      expect(error.message).toContain('Context:')
    })
  })

  describe('ValidationError', () => {
    it('should inherit context formatting', () => {
      const data = new Uint8Array([0x00, 0x00, 0x00, 0x00])
      const error = new ValidationError('Magic bytes mismatch', 0, data)
      
      expect(error.name).toBe('ValidationError')
      expect(error.message).toContain('Magic bytes mismatch')
      expect(error.message).toContain('0x0')
      expect(error.message).toContain('Context:')
    })
  })

  describe('EOFError', () => {
    it('should inherit context formatting', () => {
      const data = new Uint8Array([0x01, 0x02])
      const error = new EOFError('Unexpected end of stream', 2, data)
      
      expect(error.name).toBe('EOFError')
      expect(error.message).toContain('Unexpected end of stream')
      expect(error.message).toContain('0x2')
    })

    it('should use default message', () => {
      const error = new EOFError()
      expect(error.message).toContain('Unexpected end of stream')
    })
  })

  describe('Hex Context Formatting', () => {
    it('should format multiple lines correctly', () => {
      const data = new Uint8Array(48).fill(0x41) // 'A' repeated
      const error = new KaitaiError('Test', 24, data)
      
      const lines = error.message.split('\n')
      expect(lines.length).toBeGreaterThan(2) // Multiple lines of context
      
      // Check hex formatting (skip "Context:" line)
      const hexLines = lines.filter(l => l.match(/^\s+[0-9a-f]{8}:/))
      expect(hexLines.length).toBeGreaterThan(0)
      expect(hexLines[0]).toMatch(/[0-9a-f]{8}:/)
    })

    it('should align hex and ASCII columns', () => {
      const data = new Uint8Array([
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f,
        0x72, 0x6c, 0x64, 0x21, 0x00, 0x00, 0x00, 0x00,
      ])
      const error = new KaitaiError('Test', 0, data)
      
      const lines = error.message.split('\n')
      const hexLine = lines.find(l => l.includes('48 65 6c'))
      
      expect(hexLine).toBeDefined()
      expect(hexLine).toContain('|')
      expect(hexLine).toContain('Hello')
    })

    it('should handle empty context gracefully', () => {
      const error = new KaitaiError('Test', 0, new Uint8Array(0))
      expect(error.message).toBe('Test (at byte offset 0x0)')
    })

    it('should handle large offsets', () => {
      const error = new KaitaiError('Test', 0x12345678)
      expect(error.message).toContain('0x12345678')
    })
  })
})
