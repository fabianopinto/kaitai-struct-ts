meta:
  id: wav_simple
  title: WAV Audio File (Simplified)
  file-extension: wav
  endian: le
  license: CC0-1.0
doc: |
  Simplified WAV file parser for demonstration purposes.
  Parses the basic RIFF/WAVE structure with fmt and data chunks.
seq:
  - id: riff_id
    contents: "RIFF"
  - id: file_size
    type: u4
  - id: wave_id
    contents: "WAVE"
  - id: chunks
    type: chunk
    repeat: eos
types:
  chunk:
    seq:
      - id: chunk_id
        type: str
        size: 4
        encoding: ASCII
      - id: chunk_size
        type: u4
      - id: chunk_data
        size: chunk_size
        type:
          switch-on: chunk_id
          cases:
            '"fmt "': fmt_chunk
            '"data"': data_chunk
      - id: padding
        size: chunk_size % 2
  fmt_chunk:
    seq:
      - id: audio_format
        type: u2
        enum: format_type
      - id: num_channels
        type: u2
      - id: sample_rate
        type: u4
      - id: byte_rate
        type: u4
      - id: block_align
        type: u2
      - id: bits_per_sample
        type: u2
  data_chunk:
    seq:
      - id: data
        size-eos: true
enums:
  format_type:
    1: pcm
    3: ieee_float
    6: alaw
    7: mulaw
