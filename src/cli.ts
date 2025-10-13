#!/usr/bin/env node

/**
 * @fileoverview CLI utility for parsing binary files with Kaitai Struct definitions
 * @module kaitai-struct-ts/cli
 * @author Fabiano Pinto
 * @license MIT
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { parseArgs } from 'util'
import { parse as parseYaml } from 'yaml'
import { KsyParser } from './parser'
import { TypeInterpreter } from './interpreter'
import { KaitaiStream } from './stream'

interface CliOptions {
  output?: string
  pretty?: boolean
  validate?: boolean
  strict?: boolean
  format?: 'json' | 'yaml'
  field?: string
  quiet?: boolean
  help?: boolean
  version?: boolean
}

// Read version from package.json
function getVersion(): string {
  try {
    // In CommonJS, __dirname is available
    const packageJsonPath = join(__dirname, '..', 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return packageJson.version
  } catch {
    return 'unknown'
  }
}

const VERSION = getVersion()

const HELP_TEXT = `
kaitai - Parse binary files using Kaitai Struct definitions

USAGE:
  kaitai <ksy-file> <binary-file> [options]
  pnpx kaitai <ksy-file> <binary-file> [options]

ARGUMENTS:
  <ksy-file>      Path to .ksy definition file (YAML format)
  <binary-file>   Path to binary file to parse

OPTIONS:
  -o, --output <file>     Write output to file instead of stdout
  -p, --pretty            Pretty-print JSON output (default: true for stdout)
  -f, --format <format>   Output format: json or yaml (default: json)
  --field <path>          Extract specific field (dot notation: e.g., "header.version")
  --no-validate           Skip schema validation
  --strict                Treat schema warnings as errors
  -q, --quiet             Suppress non-error output
  -h, --help              Show this help message
  -v, --version           Show version number

EXAMPLES:
  # Parse a binary file and output JSON
  kaitai format.ksy data.bin

  # Parse and save to file
  kaitai format.ksy data.bin -o output.json

  # Parse with pretty printing disabled
  kaitai format.ksy data.bin --no-pretty

  # Extract specific field
  kaitai format.ksy data.bin --field header.magic

  # Strict validation
  kaitai format.ksy data.bin --strict

  # Output as YAML
  kaitai format.ksy data.bin --format yaml

EXIT CODES:
  0   Success
  1   General error (file not found, parse error, etc.)
  2   Invalid arguments or usage
  3   Schema validation error

For more information, visit: https://github.com/fabianopinto/kaitai-struct-ts
`

function showHelp(): void {
  console.log(HELP_TEXT)
}

function showVersion(): void {
  console.log(`kaitai v${VERSION}`)
}

function parseCliArgs(): { options: CliOptions; positional: string[] } {
  try {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        output: { type: 'string', short: 'o' },
        pretty: { type: 'boolean', short: 'p', default: undefined },
        'no-pretty': { type: 'boolean', default: false },
        format: { type: 'string', short: 'f', default: 'json' },
        field: { type: 'string' },
        validate: { type: 'boolean', default: true },
        'no-validate': { type: 'boolean', default: false },
        strict: { type: 'boolean', default: false },
        quiet: { type: 'boolean', short: 'q', default: false },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
      allowPositionals: true,
    })

    // Handle --no-pretty flag
    const pretty =
      values.pretty !== undefined
        ? values.pretty
        : values['no-pretty']
          ? false
          : undefined

    // Handle --no-validate flag
    const validate = values['no-validate'] ? false : values.validate

    const options: CliOptions = {
      output: values.output as string | undefined,
      pretty,
      format: (values.format as 'json' | 'yaml') || 'json',
      field: values.field as string | undefined,
      validate,
      strict: values.strict as boolean,
      quiet: values.quiet as boolean,
      help: values.help as boolean,
      version: values.version as boolean,
    }

    return { options, positional: positionals }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error parsing arguments: ${error.message}`)
    }
    process.exit(2)
  }
}

function readFile(filePath: string, description: string): Buffer {
  const resolvedPath = resolve(filePath)

  if (!existsSync(resolvedPath)) {
    console.error(`Error: ${description} not found: ${filePath}`)
    process.exit(1)
  }

  try {
    return readFileSync(resolvedPath)
  } catch (error) {
    console.error(
      `Error reading ${description}: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exit(1)
  }
}

/**
 * Load imports for a KSY file by detecting and reading imported files.
 *
 * @param ksyPath - Path to the main KSY file
 * @param ksyContent - Content of the main KSY file
 * @param quiet - Whether to suppress output
 * @returns Map of import paths to their content
 */
function loadImports(
  ksyPath: string,
  ksyContent: string,
  quiet: boolean
): Map<string, string> {
  const imports = new Map<string, string>()

  try {
    // Parse YAML to find imports
    const schema = parseYaml(ksyContent) as {
      meta?: { imports?: string[] }
    }

    if (!schema.meta?.imports || schema.meta.imports.length === 0) {
      return imports
    }

    const ksyDir = dirname(resolve(ksyPath))

    for (const importPath of schema.meta.imports) {
      // Convert import path to file path
      // e.g., '/common/riff' -> '../common/riff.ksy'
      const normalizedPath = importPath.startsWith('/')
        ? importPath.slice(1)
        : importPath
      const importFilePath = resolve(ksyDir, '..', normalizedPath + '.ksy')

      if (!existsSync(importFilePath)) {
        console.error(
          `Error: Import file not found: ${importFilePath} (from import: ${importPath})`
        )
        process.exit(1)
      }

      if (!quiet) {
        console.error(`  Loading import: ${importPath} -> ${importFilePath}`)
      }

      const importContent = readFileSync(importFilePath, 'utf-8')
      imports.set(importPath, importContent)

      // Recursively load nested imports
      const nestedImports = loadImports(importFilePath, importContent, quiet)
      for (const [nestedPath, nestedContent] of nestedImports) {
        if (!imports.has(nestedPath)) {
          imports.set(nestedPath, nestedContent)
        }
      }
    }
  } catch (error) {
    console.error(
      `Error loading imports: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exit(1)
  }

  return imports
}

function extractField(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      throw new Error(`Cannot access property '${part}' of ${typeof current}`)
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Safe JSON stringify that handles lazy evaluation errors
 */
function safeStringify(data: unknown, pretty: boolean): string {
  // Create a deep copy that evaluates getters safely
  function safeClone(obj: unknown, seen = new WeakSet<object>()): unknown {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj
    if (obj instanceof Uint8Array) return Array.from(obj)
    if (typeof obj === 'bigint') return String(obj)
    
    // Avoid circular references
    if (seen.has(obj)) return '[Circular]'
    seen.add(obj)
    
    if (Array.isArray(obj)) {
      return obj.map(item => safeClone(item, seen))
    }
    
    const result: Record<string, unknown> = {}
    const objRecord = obj as Record<string, unknown>
    
    for (const key in objRecord) {
      // Skip internal properties
      if (key === '_io' || key === '_root' || key === '_parent') continue
      
      try {
        const value = objRecord[key]
        result[key] = safeClone(value, seen)
      } catch (error) {
        // If accessing a lazy property fails, mark it as unavailable
        result[key] = `[Error: ${error instanceof Error ? error.message : 'unavailable'}]`
      }
    }
    
    return result
  }
  
  const safe = safeClone(data)
  return pretty ? JSON.stringify(safe, null, 2) : JSON.stringify(safe)
}

/**
 * Format output data
 */
function formatOutput(
  data: unknown,
  format: 'json' | 'yaml',
  pretty: boolean
): string {
  if (format === 'yaml') {
    // Simple YAML output (could use yaml library for complex cases)
    return safeStringify(data, true)
      .replace(/^{$/gm, '')
      .replace(/^}$/gm, '')
      .replace(/^\s*"([^"]+)":\s*/gm, '$1: ')
      .replace(/,$/gm, '')
  }

  // JSON format
  return safeStringify(data, pretty)
}

function main(): void {
  const { options, positional } = parseCliArgs()
  if (options.help) {
    showHelp()
    process.exit(0)
  }

  // Handle --version
  if (options.version) {
    showVersion()
    process.exit(0)
  }

  // Validate arguments
  if (positional.length < 2) {
    console.error('Error: Missing required arguments')
    console.error('Usage: kaitai <ksy-file> <binary-file> [options]')
    console.error('Run "kaitai --help" for more information')
    process.exit(2)
  }

  if (positional.length > 2) {
    console.error('Error: Too many arguments')
    console.error('Usage: kaitai <ksy-file> <binary-file> [options]')
    process.exit(2)
  }

  const [ksyFile, binaryFile] = positional

  // Validate format option
  if (options.format && !['json', 'yaml'].includes(options.format)) {
    console.error(
      `Error: Invalid format '${options.format}'. Must be 'json' or 'yaml'`
    )
    process.exit(2)
  }

  if (!options.quiet) {
    console.error(`Reading KSY definition: ${ksyFile}`)
    console.error(`Reading binary file: ${binaryFile}`)
  }

  // Read files
  const ksyContent = readFile(ksyFile, 'KSY definition file').toString('utf-8')
  const binaryData = readFile(binaryFile, 'Binary file')

  // Load imports
  if (!options.quiet) {
    console.error('Detecting imports...')
  }
  const imports = loadImports(ksyFile, ksyContent, options.quiet || false)

  if (!options.quiet && imports.size > 0) {
    console.error(`Loaded ${imports.size} import(s)`)
  }

  // Parse options
  const parseOptions = {
    validate: options.validate,
    strict: options.strict,
  }

  if (!options.quiet) {
    console.error('Parsing schema...')
  }

  // Parse schema with imports
  let result: Record<string, unknown>
  try {
    const parser = new KsyParser()
    const schema =
      imports.size > 0
        ? parser.parseWithImports(ksyContent, imports, parseOptions)
        : parser.parse(ksyContent, parseOptions)

    if (!options.quiet) {
      console.error('Parsing binary data...')
    }

    // Create stream and interpreter
    const stream = new KaitaiStream(binaryData)
    const interpreter = new TypeInterpreter(schema)
    result = interpreter.parse(stream)
  } catch (error) {
    console.error(
      `Parse error: ${error instanceof Error ? error.message : String(error)}`
    )
    if (error instanceof Error && error.name === 'ValidationError') {
      process.exit(3)
    }
    process.exit(1)
  }

  // Extract specific field if requested
  let output: unknown = result
  if (options.field) {
    try {
      output = extractField(result, options.field)
      if (!options.quiet) {
        console.error(`Extracted field: ${options.field}`)
      }
    } catch (error) {
      console.error(
        `Error extracting field '${options.field}': ${error instanceof Error ? error.message : String(error)}`
      )
      process.exit(1)
    }
  }

  // Determine pretty printing
  const shouldPretty =
    options.pretty !== undefined ? options.pretty : !options.output

  // Format output
  const formatted = formatOutput(output, options.format || 'json', shouldPretty)

  // Write output
  if (options.output) {
    try {
      writeFileSync(options.output, formatted + '\n', 'utf-8')
      if (!options.quiet) {
        console.error(`Output written to: ${options.output}`)
      }
    } catch (error) {
      console.error(
        `Error writing output file: ${error instanceof Error ? error.message : String(error)}`
      )
      process.exit(1)
    }
  } else {
    console.log(formatted)
  }

  if (!options.quiet) {
    console.error('Done!')
  }
}

// Run CLI
main()
