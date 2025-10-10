#!/usr/bin/env ts-node
/**
 * Test script for WAV parsing with imports
 * Demonstrates how to use parseWithImports() to parse formats with dependencies
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { KsyParser } from '../src/parser/KsyParser'
import { TypeInterpreter } from '../src/interpreter/TypeInterpreter'
import { KaitaiStream } from '../src/stream/KaitaiStream'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function main() {
  console.log('='.repeat(60))
  console.log('WAV Format Parsing with Import Resolution')
  console.log('='.repeat(60))
  console.log()

  // Read the KSY files
  console.log('📖 Reading KSY definitions...')
  const wavKsyPath = resolve(__dirname, 'media/wav.ksy')
  const riffKsyPath = resolve(__dirname, 'common/riff.ksy')
  
  console.log(`  - WAV:  ${wavKsyPath}`)
  console.log(`  - RIFF: ${riffKsyPath}`)
  
  const wavKsy = readFileSync(wavKsyPath, 'utf-8')
  const riffKsy = readFileSync(riffKsyPath, 'utf-8')
  console.log('  ✅ KSY files loaded')
  console.log()

  // Read the binary data
  console.log('📖 Reading binary data...')
  const wavDataPath = resolve(__dirname, 'media/wav/small.wav')
  console.log(`  - File: ${wavDataPath}`)
  const wavData = readFileSync(wavDataPath)
  console.log(`  ✅ Loaded ${wavData.length} bytes`)
  console.log()

  // Parse with imports
  console.log('🔧 Parsing KSY with import resolution...')
  const parser = new KsyParser()
  const imports = new Map([['/common/riff', riffKsy]])
  
  console.log('  - Resolving imports: /common/riff')
  const schema = parser.parseWithImports(wavKsy, imports, { validate: true })
  console.log('  ✅ Schema parsed successfully')
  
  // Show resolved types
  if (schema.types) {
    console.log(`  - Resolved types: ${Object.keys(schema.types).length}`)
    const importedTypes = Object.keys(schema.types).filter(t => t.includes('::'))
    if (importedTypes.length > 0) {
      console.log('  - Imported types:')
      importedTypes.slice(0, 5).forEach(t => console.log(`    • ${t}`))
      if (importedTypes.length > 5) {
        console.log(`    ... and ${importedTypes.length - 5} more`)
      }
    }
  }
  console.log()

  // Parse binary data
  console.log('🔍 Parsing binary data...')
  const stream = new KaitaiStream(wavData)
  const interpreter = new TypeInterpreter(schema)
  
  try {
    const result = interpreter.parse(stream)
    console.log('  ✅ Binary data parsed successfully')
    console.log()

    // Display results
    console.log('📊 Parsed Result:')
    console.log('='.repeat(60))
    console.log(JSON.stringify(result, null, 2))
    console.log('='.repeat(60))
    console.log()

    // Show some statistics
    console.log('📈 Statistics:')
    console.log(`  - Bytes consumed: ${stream.pos}/${stream.size}`)
    console.log(`  - Fields parsed: ${Object.keys(result).length}`)
    console.log()

    console.log('✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Parse error:', error)
    if (error instanceof Error) {
      console.error('  Message:', error.message)
      console.error('  Stack:', error.stack)
    }
    process.exit(1)
  }
}

// Run the test
try {
  main()
} catch (error) {
  console.error('❌ Fatal error:', error)
  process.exit(1)
}
