meta:
  id: edid_simple
  title: EDID (Extended Display Identification Data) - Simplified
  file-extension: bin
  endian: le
  license: CC0-1.0
doc: |
  Simplified EDID parser for demonstration purposes.
  EDID is a data structure provided by a display to describe its capabilities.
seq:
  - id: header
    contents: [0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00]
  - id: mfg_id
    type: u2be
  - id: product_code
    type: u2
  - id: serial
    type: u4
  - id: mfg_week
    type: u1
  - id: mfg_year_mod
    type: u1
  - id: edid_version_major
    type: u1
  - id: edid_version_minor
    type: u1
  - id: input_flags
    type: u1
  - id: screen_size_h
    type: u1
    doc: Maximum horizontal image size, in centimeters
  - id: screen_size_v
    type: u1
    doc: Maximum vertical image size, in centimeters
  - id: gamma_mod
    type: u1
  - id: features_flags
    type: u1
  - id: chromacity
    size: 10
  - id: est_timings
    size: 3
  - id: std_timings
    type: std_timing
    repeat: expr
    repeat-expr: 8
  - id: detailed_timings
    type: detailed_timing
    repeat: expr
    repeat-expr: 4
  - id: ext_flag
    type: u1
  - id: checksum
    type: u1
instances:
  mfg_year:
    value: mfg_year_mod + 1990
  gamma:
    value: (gamma_mod + 100) / 100.0
  mfg_str:
    value: >
      ((mfg_id >> 10) & 0x1f) + 0x40,
      ((mfg_id >> 5) & 0x1f) + 0x40,
      (mfg_id & 0x1f) + 0x40
types:
  std_timing:
    seq:
      - id: x_res_mod
        type: u1
      - id: aspect_ratio_and_freq
        type: u1
    instances:
      x_resolution:
        value: (x_res_mod + 31) * 8
      aspect_ratio:
        value: (aspect_ratio_and_freq >> 6) & 0x3
      freq:
        value: (aspect_ratio_and_freq & 0x3f) + 60
  detailed_timing:
    seq:
      - id: data
        size: 18
