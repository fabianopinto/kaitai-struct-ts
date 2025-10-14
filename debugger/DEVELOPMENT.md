# Visual Debugger Development Guide

## Overview

The Kaitai Struct Visual Debugger is a single-page application (SPA) built to provide an interactive debugging experience for binary format parsing. This document outlines the development plan, architecture, and implementation details.

## Project Status

**Current Phase:** Phase 3 - Complete ✅  
**Target Release:** v0.11.0  
**Branch:** `feature/visual-debugger`  
**Status:** Ready for merge and release 🚀

## Development Phases

### Phase 1: MVP Setup (COMPLETED ✅)

**Duration:** Initial setup  
**Status:** ✅ Complete

**Completed:**

- [x] Project structure and configuration
- [x] Technology stack setup (React + TypeScript + Vite)
- [x] Tailwind CSS configuration
- [x] Zustand store setup
- [x] Basic landing page with file upload
- [x] GitHub Actions deployment workflow
- [x] pnpm workspace configuration

**Deliverables:**

- Professional landing page
- File upload interface
- Development environment
- Build and deployment pipeline

### Phase 2: Core Components (COMPLETED ✅)

**Duration:** Completed  
**Status:** ✅ Complete

**Completed:**

- [x] Implement HexViewer component
  - [x] Hex/ASCII display
  - [x] Virtual scrolling for large files (react-virtuoso)
  - [x] Field highlighting
  - [x] Click-to-navigate
  - [x] Aligned column headers
- [x] Implement ParseTree component
  - [x] Hierarchical tree view
  - [x] Expand/collapse nodes
  - [x] Field metadata display (offset, size, type)
  - [x] Click-to-highlight in hex
  - [x] Type icons
- [x] Implement SchemaEditor component
  - [x] Monaco Editor integration
  - [x] YAML syntax highlighting
  - [x] Light theme for consistency
  - [x] Lazy loading
- [x] Integrate kaitai-struct-ts parser
  - [x] Parse schema and binary
  - [x] Display results
  - [x] Error handling
  - [x] Event tracking

**Deliverables:**

- ✅ Working hex viewer with virtual scrolling
- ✅ Interactive parse tree with expand/collapse
- ✅ Monaco-based schema editor
- ✅ Full parsing functionality with error handling

### Phase 3: Debugging Features (COMPLETED ✅)

**Duration:** Completed  
**Status:** ✅ Complete

**Completed:**

- [x] Console component
  - [x] Real-time event display
  - [x] Color-coded event types (info, error, complete)
  - [x] Timestamp with milliseconds
  - [x] Event metadata (field, offset, size, value)
  - [x] Auto-scroll functionality
- [x] Step-by-step debugging
  - [x] Play/Pause/Step controls (DebugControls component)
  - [x] Step forward/backward
  - [x] Current field indicator
  - [x] Progress bar visualization
  - [x] Auto-play with 500ms intervals
- [x] Field highlighting synchronization
  - [x] Parse tree highlights current field
  - [x] Hex viewer shows current offset
  - [x] Console displays current event
  - [x] All components stay in sync
- [x] Keyboard shortcuts
  - [x] F5: Play/Pause
  - [x] F9: Step backward
  - [x] F10: Step forward
  - [x] Ctrl+Shift+R: Reset
  - [x] Escape: Clear selection
- [x] Custom hooks
  - [x] useStepDebugger - Step-by-step logic
  - [x] useKeyboardShortcuts - Keyboard handling

**Deliverables:**

- ✅ Console with real-time event logging
- ✅ Step-by-step debugging controls
- ✅ Field highlighting synchronization
- ✅ Keyboard shortcuts (F5, F9, F10)
- ✅ Professional debugging experience

### Phase 4: Polish & Optimization (OPTIONAL 🎯)

**Duration:** Future enhancements  
**Status:** 🎯 Optional

**Completed:**
- [x] Virtual scrolling (react-virtuoso)
- [x] Code splitting (Monaco lazy loading)
- [x] Keyboard shortcuts (F5, F9, F10, Ctrl+Shift+R, Esc)

**Future Enhancements:**

- [ ] Additional performance optimization
  - [ ] Memoization improvements
  - [ ] Bundle size reduction
- [ ] Save/load sessions
  - [ ] Export session to JSON
  - [ ] Import session from JSON
  - [ ] LocalStorage persistence
- [ ] Example files
  - [ ] GIF example
  - [ ] WAV example
  - [ ] EDID example
  - [ ] PNG example
- [ ] Advanced features
  - [ ] Breakpoint system (UI ready, logic pending)
  - [ ] Expression console/REPL
  - [ ] Export parse results
  - [ ] Theme customization
- [ ] Documentation
  - [ ] Video tutorial
  - [ ] Interactive guide
  - [ ] API documentation

**Deliverables:**

- Session management
- Example files
- Advanced debugging features
- Enhanced documentation

## Architecture

### Component Hierarchy

```
App
├── Header
│   ├── Logo
│   ├── Title
│   └── HelpButton
├── MainContent
│   ├── SchemaEditor (Monaco)
│   ├── HexViewer
│   │   ├── HexRow (virtualized)
│   │   └── FieldHighlight
│   ├── ParseTree
│   │   └── TreeNode (recursive)
│   └── Console
│       └── ExpressionInput
└── DebugControls
    ├── PlayButton
    ├── PauseButton
    ├── StepButton
    └── ProgressIndicator
```

### State Management (Zustand)

```typescript
interface DebugState {
  // Files
  schemaContent: string | null
  binaryData: Uint8Array | null

  // Parse state
  parseResult: unknown | null
  parseEvents: ParseEvent[]
  currentStep: number
  isPlaying: boolean

  // UI state
  selectedField: string | null
  hexViewOffset: number
  breakpoints: Set<string>

  // Actions
  setSchemaContent: (content: string) => void
  setBinaryData: (data: Uint8Array) => void
  // ... more actions
}
```

### Data Flow

```
User uploads files
  ↓
Files stored in Zustand
  ↓
User clicks "Parse"
  ↓
InstrumentedParser parses data
  ↓
Events emitted during parsing
  ↓
Events stored in Zustand
  ↓
Components react to state changes
  ↓
UI updates (hex viewer, parse tree, etc.)
```

## Development Workflow

### Local Development

```bash
# Start development server
cd debugger
pnpm dev

# Open http://localhost:3000
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Testing

```bash
# Run tests (to be added)
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Deployment

Automatic deployment to GitHub Pages:

- Push to `main` branch
- GitHub Actions builds and deploys
- Available at: https://fabianopinto.github.io/kaitai-debugger/

## Code Style

### TypeScript

- Use strict mode
- Prefer interfaces over types
- Use explicit return types for functions
- Avoid `any`, use `unknown` if needed

### React

- Use functional components
- Use hooks (useState, useEffect, custom hooks)
- Prefer composition over inheritance
- Keep components small and focused

### Naming Conventions

- Components: PascalCase (e.g., `HexViewer`)
- Files: PascalCase for components (e.g., `HexViewer.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useDebugger`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

## Performance Considerations

### Virtual Scrolling

For large files, use virtual scrolling:

- Only render visible rows
- Use `react-virtuoso` library
- Maintain scroll position

### Code Splitting

Split large components:

```typescript
const MonacoEditor = lazy(() => import('@monaco-editor/react'))
```

### Memoization

Use React.memo for expensive components:

```typescript
export const HexRow = React.memo(({ data, offset }) => {
  // ...
})
```

## Bundle Size Targets

- Initial load: < 200KB (gzipped)
- With Monaco Editor: < 350KB (gzipped)
- Total (all chunks): < 500KB (gzipped)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- No IE11 support

## Contributing

See main project [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Radix UI](https://www.radix-ui.com/)

## Questions?

Open an issue on GitHub or reach out to the maintainers.
