# Visual Debugger Development Guide

## Overview

The Kaitai Struct Visual Debugger is a single-page application (SPA) built to provide an interactive debugging experience for binary format parsing. This document outlines the development plan, architecture, and implementation details.

## Project Status

**Current Phase:** Phase 1 - MVP Setup ✅  
**Target Release:** v0.11.0  
**Branch:** `feature/visual-debugger`

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

### Phase 2: Core Components (IN PROGRESS 🚧)

**Duration:** 2-3 weeks  
**Status:** 🚧 In Progress

**Tasks:**
- [ ] Implement HexViewer component
  - [ ] Hex/ASCII display
  - [ ] Virtual scrolling for large files
  - [ ] Field highlighting
  - [ ] Click-to-navigate
- [ ] Implement ParseTree component
  - [ ] Hierarchical tree view
  - [ ] Expand/collapse nodes
  - [ ] Field metadata display
  - [ ] Click-to-highlight in hex
- [ ] Implement SchemaEditor component
  - [ ] Monaco Editor integration
  - [ ] YAML syntax highlighting
  - [ ] Error markers
  - [ ] Auto-completion
- [ ] Integrate kaitai-struct-ts parser
  - [ ] Parse schema and binary
  - [ ] Display results
  - [ ] Error handling

**Deliverables:**
- Working hex viewer
- Interactive parse tree
- Schema editor
- Basic parsing functionality

### Phase 3: Debugging Features (PLANNED 📋)

**Duration:** 2-3 weeks  
**Status:** 📋 Planned

**Tasks:**
- [ ] Implement InstrumentedParser
  - [ ] Wrap TypeInterpreter to emit events
  - [ ] Track parsing progress
  - [ ] Capture field metadata
- [ ] Step-by-step debugging
  - [ ] Play/Pause/Step controls
  - [ ] Step forward/backward
  - [ ] Current field indicator
- [ ] Breakpoints
  - [ ] Set/remove breakpoints
  - [ ] Pause on breakpoint
  - [ ] Breakpoint list
- [ ] Expression Console
  - [ ] REPL interface
  - [ ] Evaluate expressions
  - [ ] Access parse context
  - [ ] Autocomplete

**Deliverables:**
- Step debugging
- Breakpoint system
- Expression console
- Enhanced error visualization

### Phase 4: Polish & Optimization (PLANNED 📋)

**Duration:** 1-2 weeks  
**Status:** 📋 Planned

**Tasks:**
- [ ] Performance optimization
  - [ ] Virtual scrolling optimization
  - [ ] Lazy loading
  - [ ] Code splitting
- [ ] Keyboard shortcuts
  - [ ] Step (F10)
  - [ ] Continue (F5)
  - [ ] Toggle breakpoint (F9)
- [ ] Save/load sessions
  - [ ] Export session
  - [ ] Import session
  - [ ] LocalStorage persistence
- [ ] Example files
  - [ ] GIF example
  - [ ] WAV example
  - [ ] EDID example
- [ ] Documentation
  - [ ] User guide
  - [ ] Video tutorial
  - [ ] API documentation

**Deliverables:**
- Optimized performance
- Keyboard shortcuts
- Session management
- Example files
- Complete documentation

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
