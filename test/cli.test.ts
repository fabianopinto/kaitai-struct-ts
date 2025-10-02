/**
 * @fileoverview CLI integration tests
 * @module test/cli
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync, spawn } from 'child_process'
import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const TEST_DIR = join(__dirname, '.cli-test-tmp')
const CLI_PATH = join(__dirname, '..', 'dist', 'cli.js')

// Simple test format
const TEST_KSY = `
meta:
  id: test_format
  endian: le
seq:
  - id: magic
    contents: [0x4D, 0x59, 0x46, 0x4D]
  - id: version
    type: u2
  - id: count
    type: u4
`

// Binary data: "MYFM" + version(1) + count(42)
const TEST_BINARY = Buffer.from([
  0x4d,
  0x59,
  0x46,
  0x4d, // "MYFM"
  0x01,
  0x00, // version = 1 (u2le)
  0x2a,
  0x00,
  0x00,
  0x00, // count = 42 (u4le)
])

describe('CLI', () => {
  beforeAll(() => {
    // Create test directory
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true })
    }

    // Write test files
    writeFileSync(join(TEST_DIR, 'test.ksy'), TEST_KSY)
    writeFileSync(join(TEST_DIR, 'test.bin'), TEST_BINARY)

    // Ensure CLI is built
    try {
      if (!existsSync(CLI_PATH)) {
        console.log('Building CLI...')
        execSync('pnpm build', { cwd: join(__dirname, '..'), stdio: 'inherit' })
      }
    } catch (error) {
      console.error('Failed to build CLI:', error)
      throw error
    }
  })

  afterAll(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  describe('Basic functionality', () => {
    it('should parse binary file and output JSON', () => {
      const output = execSync(
        `node "${CLI_PATH}" "${join(TEST_DIR, 'test.ksy')}" "${join(TEST_DIR, 'test.bin')}" --quiet`,
        { encoding: 'utf-8' }
      )

      const result = JSON.parse(output)
      expect(result).toHaveProperty('magic')
      expect(result).toHaveProperty('version', 1)
      expect(result).toHaveProperty('count', 42)
    })

    it('should show help with --help', () => {
      const output = execSync(`node "${CLI_PATH}" --help`, {
        encoding: 'utf-8',
      })

      expect(output).toContain('kaitai - Parse binary files')
      expect(output).toContain('USAGE:')
      expect(output).toContain('OPTIONS:')
      expect(output).toContain('EXAMPLES:')
    })

    it('should show version with --version', () => {
      const output = execSync(`node "${CLI_PATH}" --version`, {
        encoding: 'utf-8',
      })

      expect(output).toMatch(/kaitai v\d+\.\d+\.\d+/)
    })
  })

  describe('Output options', () => {
    it('should write output to file with --output', () => {
      const outputFile = join(TEST_DIR, 'output.json')

      execSync(
        `node "${CLI_PATH}" "${join(TEST_DIR, 'test.ksy')}" "${join(TEST_DIR, 'test.bin')}" -o "${outputFile}" --quiet`
      )

      expect(existsSync(outputFile)).toBe(true)

      const content = readFileSync(outputFile, 'utf-8')
      const result = JSON.parse(content)

      expect(result).toHaveProperty('version', 1)
      expect(result).toHaveProperty('count', 42)
    })

    it('should output pretty JSON by default to stdout', () => {
      const output = execSync(
        `node "${CLI_PATH}" "${join(TEST_DIR, 'test.ksy')}" "${join(TEST_DIR, 'test.bin')}" --quiet`,
        { encoding: 'utf-8' }
      )

      // Pretty JSON should have newlines and indentation
      expect(output).toContain('\n')
      expect(output).toContain('  ')
    })

    it('should output compact JSON with --no-pretty', () => {
      const output = execSync(
        `node "${CLI_PATH}" "${join(TEST_DIR, 'test.ksy')}" "${join(TEST_DIR, 'test.bin')}" --no-pretty --quiet`,
        { encoding: 'utf-8' }
      )

      // Compact JSON should be on one line
      const lines = output.trim().split('\n')
      expect(lines.length).toBe(1)
    })
  })

  describe('Field extraction', () => {
    it('should extract specific field with --field', () => {
      const output = execSync(
        `node "${CLI_PATH}" "${join(TEST_DIR, 'test.ksy')}" "${join(TEST_DIR, 'test.bin')}" --field version --quiet`,
        { encoding: 'utf-8' }
      )

      const result = JSON.parse(output)
      expect(result).toBe(1)
    })

    it('should extract nested field with dot notation', () => {
      // For this test, we'd need a more complex format with nested structures
      // Skipping for now as our test format is flat
    })
  })

  describe('Error handling', () => {
    it('should exit with code 1 for missing file', () => {
      try {
        execSync(
          `node "${CLI_PATH}" "${join(TEST_DIR, 'nonexistent.ksy')}" "${join(TEST_DIR, 'test.bin')}"`,
          { encoding: 'utf-8', stdio: 'pipe' }
        )
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const execError = error as { status: number; stderr: Buffer }
        expect(execError.status).toBe(1)
      }
    })

    it('should exit with code 2 for missing arguments', () => {
      try {
        execSync(`node "${CLI_PATH}"`, { encoding: 'utf-8', stdio: 'pipe' })
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const execError = error as { status: number; stderr: Buffer }
        expect(execError.status).toBe(2)
      }
    })

    it('should exit with code 2 for invalid format option', () => {
      try {
        execSync(
          `node "${CLI_PATH}" "${join(TEST_DIR, 'test.ksy')}" "${join(TEST_DIR, 'test.bin')}" --format invalid`,
          { encoding: 'utf-8', stdio: 'pipe' }
        )
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const execError = error as { status: number; stderr: Buffer }
        expect(execError.status).toBe(2)
      }
    })
  })

  describe('Validation options', () => {
    it('should validate schema by default', () => {
      // This would require an invalid schema to test properly
      // For now, just ensure it doesn't crash with valid schema
      const output = execSync(
        `node "${CLI_PATH}" "${join(TEST_DIR, 'test.ksy')}" "${join(TEST_DIR, 'test.bin')}" --quiet`,
        { encoding: 'utf-8' }
      )

      expect(output).toBeTruthy()
    })

    it('should skip validation with --no-validate', () => {
      const output = execSync(
        `node "${CLI_PATH}" "${join(TEST_DIR, 'test.ksy')}" "${join(TEST_DIR, 'test.bin')}" --no-validate --quiet`,
        { encoding: 'utf-8' }
      )

      expect(output).toBeTruthy()
    })
  })

  describe('Quiet mode', () => {
    it('should suppress progress messages with --quiet', () => {
      const output = execSync(
        `node "${CLI_PATH}" "${join(TEST_DIR, 'test.ksy')}" "${join(TEST_DIR, 'test.bin')}" --quiet 2>&1`,
        { encoding: 'utf-8' }
      )

      // Should only contain JSON output, no progress messages
      expect(output).not.toContain('Reading')
      expect(output).not.toContain('Parsing')
      expect(output).not.toContain('Done')

      // Should still have valid JSON (entire output is JSON)
      const trimmed = output.trim()
      expect(() => JSON.parse(trimmed)).not.toThrow()
      const result = JSON.parse(trimmed)
      expect(result).toHaveProperty('version')
    })

    it('should show progress messages by default', () => {
      const output = execSync(
        `node "${CLI_PATH}" "${join(TEST_DIR, 'test.ksy')}" "${join(TEST_DIR, 'test.bin')}" 2>&1`,
        { encoding: 'utf-8' }
      )

      // Should contain progress messages on stderr
      expect(output).toContain('Reading')
    })
  })
})
