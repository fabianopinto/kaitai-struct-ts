meta:
  id: png
  file-extension: png
  endian: be
  license: CC0-1.0
  title: PNG (Portable Network Graphics)
seq:
  - id: magic
    contents: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  - id: chunks
    type: chunk
    repeat: until
    repeat-until: _.type == "IEND"
types:
  chunk:
    seq:
      - id: len
        type: u4
      - id: type
        type: str
        size: 4
        encoding: ASCII
      - id: body
        size: len
        type:
          switch-on: type
          cases:
            IHDR: ihdr_chunk
            PLTE: plte_chunk
            IDAT: raw_chunk
            IEND: raw_chunk
      - id: crc
        type: u4
  ihdr_chunk:
    seq:
      - id: width
        type: u4
      - id: height
        type: u4
      - id: bit_depth
        type: u1
      - id: color_type
        type: u1
        enum: color_type
      - id: compression_method
        type: u1
      - id: filter_method
        type: u1
      - id: interlace_method
        type: u1
  plte_chunk:
    seq:
      - id: entries
        type: rgb
        repeat: eos
  rgb:
    seq:
      - id: r
        type: u1
      - id: g
        type: u1
      - id: b
        type: u1
  raw_chunk:
    seq:
      - id: data
        size-eos: true
enums:
  color_type:
    0: greyscale
    2: truecolor
    3: indexed
    4: greyscale_alpha
    6: truecolor_alpha
