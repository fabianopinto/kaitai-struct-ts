#!/usr/bin/env node

/**
 * @fileoverview CLI utility for parsing binary files with Kaitai Struct definitions
 * @module kaitai-struct-ts/cli
 * @author Fabiano Pinto
 * @license MIT
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { parseArgs } from 'util'
import { parse } from './index'
import type { ParseOptions } from './index'

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

const VERSION = '0.7.1'

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

function formatOutput(
  data: unknown,
  format: 'json' | 'yaml',
  pretty: boolean
): string {
  if (format === 'yaml') {
    // Simple YAML output (could use yaml library for complex cases)
    return JSON.stringify(data, null, 2)
      .replace(/^{$/gm, '')
      .replace(/^}$/gm, '')
      .replace(/^\s*"([^"]+)":\s*/gm, '$1: ')
      .replace(/,$/gm, '')
  }

  // JSON format
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
}

function main(): void {
  const { options, positional } = parseCliArgs()

  // Handle --help
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

  // Parse options
  const parseOptions: ParseOptions = {
    validate: options.validate,
    strict: options.strict,
  }

  if (!options.quiet) {
    console.error('Parsing...')
  }

  // Parse binary data
  let result: Record<string, unknown>
  try {
    result = parse(ksyContent, binaryData, parseOptions)
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
