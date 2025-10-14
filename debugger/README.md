# Kaitai Struct Visual Debugger

A visual debugger for Kaitai Struct binary format definitions. This tool helps you understand, debug, and visualize how binary data is parsed according to your `.ksy` schema files.

## Features

- 🔍 **Hex Viewer** - Visualize binary data with field highlighting
- 🌳 **Parse Tree** - Navigate the parsed structure hierarchically
- ✏️ **Schema Editor** - Edit `.ksy` files with syntax highlighting
- ⏯️ **Step Debugging** - Step through parsing field by field
- 🎯 **Breakpoints** - Pause parsing at specific fields
- 💻 **Expression Console** - Evaluate expressions in parse context
- 📊 **Error Visualization** - See exactly where and why parsing fails

## Getting Started

### Development

```bash
# Install dependencies (from project root)
pnpm install

# Start development server
cd debugger
pnpm dev
```

The debugger will be available at `http://localhost:3000`

### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Deploy

The debugger is automatically deployed to GitHub Pages when changes are pushed to the main branch.

Live URL: `https://fabianopinto.github.io/kaitai-debugger/`

## Usage

1. **Upload Schema**: Click "Upload Schema (.ksy)" and select your Kaitai Struct definition file
2. **Upload Binary**: Click "Upload Binary File" and select the file you want to parse
3. **Start Debugging**: Click "Start Debugging" to begin the parsing process
4. **Explore**: Use the hex viewer, parse tree, and controls to explore the parsed data

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
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

## Development Roadmap

### Phase 1: MVP (Current)

- [x] Project setup
- [x] Basic UI layout
- [x] File upload functionality
- [ ] Basic parsing integration
- [ ] Simple hex viewer
- [ ] Parse tree display

### Phase 2: Core Features

- [ ] Step-by-step debugging
- [ ] Breakpoints
- [ ] Field highlighting in hex view
- [ ] Expression console
- [ ] Error visualization

### Phase 3: Advanced Features

- [ ] Virtual scrolling for large files
- [ ] Keyboard shortcuts
- [ ] Save/load sessions
- [ ] Example files
- [ ] Export functionality

### Phase 4: Polish

- [ ] Performance optimization
- [ ] Responsive design
- [ ] Documentation
- [ ] User guide
- [ ] Video tutorials

## Contributing

Contributions are welcome! Please see the main project's [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details

## Links

- [Main Project](https://github.com/fabianopinto/kaitai-struct-ts)
- [Kaitai Struct](https://kaitai.io/)
- [Documentation](../docs/README.md)
