# Kaitai Struct Visual Debugger

> A modern, interactive visual debugger for Kaitai Struct binary format definitions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)

## Overview

The Kaitai Struct Visual Debugger is a powerful, browser-based tool for debugging and visualizing binary format parsing. Built as a single-page application, it provides an intuitive interface for exploring how Kaitai Struct parses binary data according to your schema definitions.

**Live Demo:** [https://fabianopinto.github.io/kaitai-struct-ts/](https://fabianopinto.github.io/kaitai-struct-ts/)

## Features

### Core Features

- **Hex Viewer** - View binary data in hex and ASCII with virtual scrolling for large files
- **Parse Tree** - Explore parsed structure hierarchically with expand/collapse
- **Schema Editor** - Edit .ksy files with Monaco Editor and YAML syntax highlighting
- **Step-by-Step Debugging** - Step through the parsing process event by event
- **Console** - Real-time parsing events with timestamps and metadata
- **Debug Controls** - Play, pause, step forward/back, and reset functionality

### Advanced Features

- **Keyboard Shortcuts** - Efficient debugging workflow (F5, F9, F10, etc.)
- **Synchronized Highlighting** - Field selection syncs across all components
- **Modern UI** - Clean, professional interface with Tailwind CSS
- **High Performance** - Virtual scrolling handles files of any size
- **Responsive Design** - Works on desktop and tablet devices
- **Theme Support** - Light theme with CSS variables

## Getting Started

### Prerequisites

- Node.js 18+ or compatible runtime
- pnpm 8+ (recommended) or npm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/fabianopinto/kaitai-struct-ts.git
cd kaitai-struct-ts/debugger

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev

# Open http://localhost:5173 in your browser
```

The development server includes:
- Hot Module Replacement (HMR)
- Fast refresh
- TypeScript type checking
- ESLint integration

### Building for Production

```bash
# Build optimized production bundle
pnpm build

# Preview production build locally
pnpm preview
```

### Code Quality

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## Usage Guide

### Basic Workflow

1. **Upload Schema** - Click "Upload Schema (.ksy)" and select your Kaitai Struct definition file
2. **Upload Binary** - Click "Upload Binary File" and select the file you want to parse
3. **Start Debugging** - Click "Start Debugging" to parse the file
4. **Explore Results** - Use the debugger interface to explore the parsed data
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Monaco Editor** - Code editor (VS Code)
- **Radix UI** - Accessible components
- **@k67/kaitai-struct-ts** - Parser library

## Project Structure

```
debugger/
├── src/
│   ├── components/      # React components
│   │   ├── HexViewer/   # Hex viewer component
│   │   ├── ParseTree/   # Parse tree component
│   │   ├── SchemaEditor/# Schema editor component
│   │   └── ...
│   ├── lib/             # Utility libraries
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand store
│   ├── types/           # TypeScript types
│   ├── styles/          # Global styles
│   ├── App.tsx          # Root component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── index.html           # HTML template
└── vite.config.ts       # Vite configuration
```

## What's Included

### ✅ Completed Features (v0.11.0)

**Core Components:**
- [x] HexViewer with virtual scrolling for large files
- [x] ParseTree with hierarchical data explorer
- [x] SchemaEditor with Monaco (VS Code) integration
- [x] Console with real-time event logging
- [x] DebugControls with step-by-step debugging

**Advanced Features:**
- [x] Step-by-step debugging (play, pause, step forward/back)
- [x] Field highlighting synchronized across all components
- [x] Keyboard shortcuts (F5, F9, F10, Ctrl+Shift+R, Esc)
- [x] Virtual scrolling for performance
- [x] Error visualization with detailed messages
- [x] Professional UI with Tailwind CSS
- [x] Complete TypeScript types and JSDoc
- [x] Production-ready code quality

### 🎯 Future Enhancements

**Potential Additions:**
- [ ] Breakpoint system (UI ready, logic pending)
- [ ] Expression console/REPL
- [ ] Save/load debug sessions
- [ ] Export parse results to JSON
- [ ] Example files (GIF, WAV, PNG)
- [ ] Theme customization
- [ ] Video tutorials

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development history and future plans.

## Contributing

Contributions are welcome! Please see the main project's [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details

## Links

- [Main Project](https://github.com/fabianopinto/kaitai-struct-ts)
- [Kaitai Struct](https://kaitai.io/)
- [Documentation](../docs/README.md)
