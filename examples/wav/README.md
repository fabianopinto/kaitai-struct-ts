# WAV Audio Format Example

This example demonstrates parsing Microsoft WAVE audio files using `@k67/kaitai-struct-ts`.

## 📄 Files

- **`wav.ksy`** - Kaitai Struct format definition for WAV files
- **`small.wav`** - Sample WAV audio file

## 📖 About WAV Format

The WAVE file format is a subset of Microsoft's RIFF specification for multimedia files. A WAV file consists of:

- **RIFF container** - Resource Interchange File Format
- **Format chunk** - Audio format specifications (PCM, sample rate, channels, etc.)
- **Data chunk** - Actual audio sample data
- **Optional chunks** - Metadata, cue points, broadcast extensions, etc.

## 🎯 Features Demonstrated

This example showcases:

- ✅ **RIFF container parsing** - Nested chunk structure
- ✅ **Switch/case types** - Different chunk types based on FourCC
- ✅ **Enumerations** - Audio format codes
- ✅ **Bit-level fields** - Channel masks
- ✅ **Conditional parsing** - Optional fields based on format
- ✅ **Instances** - Lazy-evaluated fields
- ✅ **Imports** - Uses common RIFF definitions

## 🚀 Usage

### CLI

```bash
# Parse and display full structure
npx @k67/kaitai-struct-ts examples/wav/wav.ksy examples/wav/small.wav

# Save to JSON file
npx @k67/kaitai-struct-ts examples/wav/wav.ksy examples/wav/small.wav -o output.json

# Extract specific field
npx @k67/kaitai-struct-ts examples/wav/wav.ksy examples/wav/small.wav --field subchunks
```

### Library

```typescript
import { parse } from '@k67/kaitai-struct-ts'
import { readFileSync } from 'fs'

// Load format and data
const ksy = readFileSync('examples/wav/wav.ksy', 'utf-8')
const data = readFileSync('examples/wav/small.wav')

// Parse
const wav = parse(ksy, data)

// Access parsed data
console.log('Format:', wav.form_type)
console.log('Chunks:', wav.subchunks?.length)

// Access format chunk
const formatChunk = wav.subchunks?.find((c) => c.chunk_id === 'fmt')
if (formatChunk) {
  console.log('Sample rate:', formatChunk.chunk_data.n_samples_per_sec)
  console.log('Channels:', formatChunk.chunk_data.n_channels)
  console.log('Bits per sample:', formatChunk.chunk_data.w_bits_per_sample)
}
```

## 📊 Expected Output Structure

```json
{
  "chunk_id": "riff",
  "is_riff_chunk": true,
  "form_type": "wave",
  "is_form_type_wave": true,
  "subchunks": [
    {
      "chunk_id": "fmt",
      "chunk_data": {
        "w_format_tag": "pcm",
        "n_channels": 2,
        "n_samples_per_sec": 44100,
        "n_avg_bytes_per_sec": 176400,
        "n_block_align": 4,
        "w_bits_per_sample": 16
      }
    },
    {
      "chunk_id": "data",
      "chunk_data": {
        "data": "..."
      }
    }
  ]
}
```

## ⚠️ Current Status

> **Note:** This example requires the following features to be fully supported:
>
> - ✅ Basic RIFF parsing
> - ⚠️ Import statements (`imports: [/common/riff]`)
> - ⚠️ Complex switch-on expressions
> - ⚠️ IO redirection (`io: chunk.data_slot._io`)

Some features may not work yet. This serves as a test case for development.

## 🔗 References

- **Format Specification:** http://soundfile.sapp.org/doc/WaveFormat/
- **RIFF Specification:** https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
- **Broadcast Wave Format:** https://en.wikipedia.org/wiki/Broadcast_Wave_Format
- **Kaitai Struct Gallery:** https://formats.kaitai.io/wav/

## 📝 Format Details

### Chunk Types

| FourCC | Name                | Description                 |
| ------ | ------------------- | --------------------------- |
| `fmt ` | Format              | Audio format specifications |
| `data` | Data                | Audio sample data           |
| `fact` | Fact                | Number of samples (non-PCM) |
| `cue ` | Cue                 | Cue points for editing      |
| `LIST` | List                | Container for sub-chunks    |
| `bext` | Broadcast Extension | BWF metadata                |
| `iXML` | iXML                | Production metadata         |

### Audio Format Codes

| Code   | Format             |
| ------ | ------------------ |
| 0x0001 | PCM (uncompressed) |
| 0x0003 | IEEE Float         |
| 0x0006 | A-law              |
| 0x0007 | μ-law              |
| 0x0055 | MPEG Layer 3       |
| 0xFFFE | Extensible         |

## 🧪 Testing

Test parsing with different WAV files:

```bash
# Test with the provided sample
npx @k67/kaitai-struct-ts examples/wav/wav.ksy examples/wav/small.wav

# Test with your own WAV files
npx @k67/kaitai-struct-ts examples/wav/wav.ksy /path/to/your/file.wav
```
