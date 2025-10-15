# Kaitai Struct Visual Debugger

> A modern, interactive visual debugger for Kaitai Struct binary format definitions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)

## Overview

The Kaitai Struct Visual Debugger is a powerful, browser-based tool for debugging and visualizing binary format parsing. Built as a single-page application, it provides an intuitive interface for exploring how Kaitai Struct parses binary data according to your schema definitions.

**Live Demo:** [https://fabianopinto.github.io/kaitai-struct-ts/](https://fabianopinto.github.io/kaitai-struct-ts/)

## What's New in v0.8.0

🎉 **Expression Console/REPL** - The debugger now includes an interactive JavaScript console:

- Evaluate expressions against parsed data in real-time
- Access context variables: `root`, `_` (selected field), `data` (binary)
- Use helper functions: `hex()`, `bin()`, `bytes()`, `sizeof()`, `offsetof()`
- Navigate command history with ↑↓ arrows
- See execution timing for each expression

🔄 **Unified Console** - Parse events and expression evaluations now appear together in chronological order, providing better context during debugging.

📦 **Example Selector** - Built-in examples (GIF, PNG, WAV, EDID) let you start debugging immediately without uploading files.

## Features

### Core Features

- **Hex Viewer** - Editable hex view with virtual scrolling, highlighting, and ASCII display
- **Parse Tree** - Explore parsed structure hierarchically with expand/collapse
- **Schema Editor** - Edit .ksy files with Monaco Editor and YAML syntax highlighting
- **Step-by-Step Debugging** - Step through the parsing process event by event
- **Unified Console** - Parse events and expression evaluations in chronological order
- **Expression Console/REPL** - Interactive JavaScript console for evaluating expressions
- **Debug Controls** - Play, pause, step forward/back, and reset functionality
- **Example Selector** - Built-in examples (GIF, PNG, WAV, EDID) for quick testing

### Advanced Features

- **Expression Evaluation** - Evaluate JavaScript against parsed data with helper functions
  - Context variables: `root`, `_` (selected field), `data` (binary)
  - Helpers: `hex()`, `bin()`, `bytes()`, `sizeof()`, `offsetof()`
  - Command history with ↑↓ navigation
- **Keyboard Shortcuts** - Efficient debugging workflow (F5, F9, F10, F11, etc.)
- **Synchronized Highlighting** - Field selection syncs across all components
- **Modern UI** - Clean, professional interface with Tailwind CSS
- **High Performance** - Virtual scrolling handles files of any size
- **Responsive Design** - Works on desktop and tablet devices
- **Theme Support** - Light and dark themes with CSS variables

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

### ✅ Completed Features

**v0.8.0 (Current)**

**Core Components:**

- [x] HexViewer with virtual scrolling for large files
- [x] ParseTree with hierarchical data explorer
- [x] SchemaEditor with Monaco (VS Code) integration
- [x] Unified Console with parse events and expression REPL
- [x] Expression Console/REPL with JavaScript evaluation
- [x] DebugControls with step-by-step debugging
- [x] ExampleSelector with built-in format examples

**Advanced Features:**

- [x] Expression evaluation with context and helper functions
- [x] Step-by-step debugging (play, pause, step forward/back)
- [x] Field highlighting synchronized across all components
- [x] Keyboard shortcuts (F5, F9, F10, F11, Ctrl+Shift+R, Esc)
- [x] Virtual scrolling for performance
- [x] Error visualization with detailed messages
- [x] Command history navigation
- [x] Execution timing display
- [x] Professional UI with Tailwind CSS
- [x] Complete TypeScript types and JSDoc
- [x] Production-ready code quality

### 🎯 Future Enhancements

**Potential Additions:**

- [ ] Enhanced breakpoint system with conditions
- [ ] Save/load debug sessions
- [ ] Export parse results to JSON
- [ ] More built-in examples
- [ ] Dark theme improvements
- [ ] Performance optimizations for very large files
- [ ] Video tutorials
- [ ] Proper array path notation (root.chunks[0] vs root.chunks.[0])

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development history and future plans.

## Contributing

Contributions are welcome! Please see the main project's [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details

## Links

- [Main Project](https://github.com/fabianopinto/kaitai-struct-ts)
- [Kaitai Struct](https://kaitai.io/)
- [Documentation](../docs/README.md)
