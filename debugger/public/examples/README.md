# Example Files for Kaitai Struct Debugger

This folder contains example binary files and their corresponding `.ksy` schema definitions for testing and demonstration purposes.

## Available Examples

### 1. GIF (Graphics Interchange Format)
- **Schema**: `gif.ksy`
- **Sample**: `sample.gif`
- **Description**: 1x1 pixel GIF image with basic structure
- **Features**: Header, logical screen descriptor, color table, image data blocks

### 2. PNG (Portable Network Graphics)
- **Schema**: `png.ksy`
- **Sample**: `sample.png`
- **Description**: 1x1 pixel PNG image
- **Features**: PNG signature, IHDR chunk, IDAT chunk, IEND chunk

### 3. WAV (Waveform Audio File Format)
- **Schema**: `wav-simple.ksy`
- **Sample**: `small.wav`
- **Description**: Minimal WAV audio file
- **Features**: RIFF header, fmt chunk, data chunk

### 4. EDID (Extended Display Identification Data)
- **Schema**: `edid-simple.ksy`
- **Sample**: `edid-1.0.bin`
- **Description**: Display identification data (EDID 1.0)
- **Features**: Manufacturer ID, product code, display capabilities

## Usage

1. Open the Kaitai Struct Debugger
2. Click "Load Schema" and select a `.ksy` file
3. Click "Load Binary" and select the corresponding sample file
4. Click "Parse" to see the parsed structure

## Notes

- These are simplified versions of the schemas for demonstration purposes
- The WAV and EDID schemas are standalone (no imports required)
- All sample files are minimal valid examples
- For production use, refer to the full schemas in the main repository

## Creating Your Own Examples

To add new examples:

1. Create a `.ksy` schema file
2. Create a corresponding binary sample file
3. Test in the debugger
4. Update this README

## Resources

- [Kaitai Struct Format Gallery](https://formats.kaitai.io/)
- [Kaitai Struct Documentation](https://doc.kaitai.io/)
- [Main Repository](https://github.com/fabianopinto/kaitai-struct-ts)
