meta:
  id: gif
  file-extension: gif
  endian: le
  license: CC0-1.0
  title: GIF (Graphics Interchange Format)
seq:
  - id: header
    type: header
  - id: logical_screen_descriptor
    type: logical_screen_descriptor
  - id: global_color_table
    type: color_table
    if: logical_screen_descriptor.has_color_table
    repeat: expr
    repeat-expr: logical_screen_descriptor.color_table_size
  - id: blocks
    type: block
    repeat: eos
types:
  header:
    seq:
      - id: magic
        contents: 'GIF'
      - id: version
        size: 3
        type: str
        encoding: ASCII
  logical_screen_descriptor:
    seq:
      - id: screen_width
        type: u2
      - id: screen_height
        type: u2
      - id: flags
        type: u1
      - id: bg_color_index
        type: u1
      - id: pixel_aspect_ratio
        type: u1
    instances:
      has_color_table:
        value: (flags & 0x80) != 0
      color_table_size:
        value: 2 << (flags & 7)
  color_table:
    seq:
      - id: red
        type: u1
      - id: green
        type: u1
      - id: blue
        type: u1
  block:
    seq:
      - id: block_type
        type: u1
      - id: body
        type:
          switch-on: block_type
          cases:
            0x21: extension
            0x2c: image_data
            0x3b: trailer
  extension:
    seq:
      - id: label
        type: u1
      - id: body
        type: subblock
        repeat: until
        repeat-until: _.num_bytes == 0
  subblock:
    seq:
      - id: num_bytes
        type: u1
      - id: bytes
        size: num_bytes
  image_data:
    seq:
      - id: left
        type: u2
      - id: top
        type: u2
      - id: width
        type: u2
      - id: height
        type: u2
      - id: flags
        type: u1
      - id: local_color_table
        type: color_table
        if: has_color_table
        repeat: expr
        repeat-expr: color_table_size
      - id: lzw_min_code_size
        type: u1
      - id: image_data
        type: subblock
        repeat: until
        repeat-until: _.num_bytes == 0
    instances:
      has_color_table:
        value: (flags & 0x80) != 0
      color_table_size:
        value: 2 << (flags & 7)
  trailer:
    seq: []
