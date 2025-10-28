# @k67/kaitai-debugger

## 0.8.1

### Patch Changes

- Updated dependencies [f047c3b]
  - @k67/kaitai-struct-ts@0.12.1

## 0.8.0

### Minor Changes

- Major debugger improvements and bug fixes:

  **Debugger v0.5.0:**
  - Added example selector with 4 working examples (GIF, PNG, WAV, EDID)
  - Smart console clear that preserves step debugger functionality
  - Fixed step debugger bounds checking and navigation
  - Display step counter as 1-indexed for clarity
  - Fixed events accumulating when switching examples
  - All debug controls (reset/back/play/forward) now work correctly

  **Library v0.12.0:**
  - Fixed \_sizeof calculation for sized substreams (accurate hex highlighting)
  - Improved error handling and type safety
  - Better bounds checking in step debugger integration

### Patch Changes

- Updated dependencies
  - @k67/kaitai-struct-ts@0.12.0

## 0.1.1

### Patch Changes

- Updated dependencies
  - @k67/kaitai-struct-ts@0.11.1
