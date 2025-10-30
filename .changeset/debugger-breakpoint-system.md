---
"@k67/kaitai-debugger": minor
---

Add breakpoint system for advanced debugging

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
