/**
 * @fileoverview Main entry point for kaitai-struct-ts library
 * @module kaitai-struct-ts
 * @author Fabiano Pinto
 * @license MIT
 * @version 0.1.0
 * 
 * @description
 * A runtime interpreter for Kaitai Struct binary format definitions in TypeScript.
 * Parse any binary data format by providing a .ksy (Kaitai Struct YAML) definition file.
 * 
 * @example
 * ```typescript
 * import { KaitaiStream } from 'kaitai-struct-ts'
 * 
 * const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04])
 * const stream = new KaitaiStream(buffer)
 * const value = stream.readU4le()
 * ```
 */

// Export main classes and functions
export { KaitaiStream } from './stream'
export * from './utils/errors'

// TODO: Export parser and interpreter when implemented
// export { parse } from './parser'
// export { KaitaiParser } from './parser'
// export { TypeInterpreter } from './interpreter'
