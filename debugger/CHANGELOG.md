# @k67/kaitai-debugger

## 0.9.0

### Minor Changes

- e1d9cbd: Add breakpoint system for advanced debugging

  Implement full breakpoint support in the visual debugger, allowing users to pause execution at specific fields during parsing.

  **New Features:**
  - Visual breakpoint indicators in parse tree (red circles)
  - Click to toggle breakpoints on any field
  - Automatic pause when hitting breakpoints during playback
  - Continue to next breakpoint functionality (F11)
  - Keyboard shortcut F9 to toggle breakpoint on selected field
  - Breakpoint-aware debug controls with continue button

  **UI Enhancements:**
  - Red circle indicators show active breakpoints
  - Hover effects on breakpoint toggles
  - Continue button appears when breakpoints are set
  - Visual feedback for breakpoint state

  **Keyboard Shortcuts Updated:**
  - `F8` - Step Back (changed from F9)
  - `F9` - Toggle Breakpoint on selected field (NEW)
  - `F11` - Continue to Next Breakpoint (NEW)

  **Implementation:**
  - Enhanced `useStepDebugger` hook with breakpoint detection
  - Updated `TreeNode` component with breakpoint UI
  - Modified `DebugControls` to show continue button
  - Updated keyboard shortcut handling

## 0.8.2

### Patch Changes

- Updated dependencies [016d96b]
  - @k67/kaitai-struct-ts@0.13.0

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
