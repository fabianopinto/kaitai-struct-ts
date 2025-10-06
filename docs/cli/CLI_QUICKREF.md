# CLI Quick Reference

## Installation

```bash
# Global install
npm install -g @k67/kaitai-struct-ts

# Or use without installing
npx @k67/kaitai-struct-ts <args>
pnpx @k67/kaitai-struct-ts <args>
```

## Basic Usage

```bash
kaitai <ksy-file> <binary-file> [options]
```

## Common Commands

```bash
# Parse and display
kaitai format.ksy data.bin

# Save to file
kaitai format.ksy data.bin -o output.json

# Extract field
kaitai format.ksy data.bin --field header.magic

# Quiet mode (scripting)
kaitai format.ksy data.bin --quiet

# Help
kaitai --help

# Version
kaitai --version
```

## All Options

| Option            | Short | Description                      |
| ----------------- | ----- | -------------------------------- |
| `--output <file>` | `-o`  | Write to file                    |
| `--pretty`        | `-p`  | Pretty JSON (default for stdout) |
| `--no-pretty`     |       | Compact JSON                     |
| `--format <fmt>`  | `-f`  | Output format: json, yaml        |
| `--field <path>`  |       | Extract field (dot notation)     |
| `--no-validate`   |       | Skip schema validation           |
| `--strict`        |       | Warnings as errors               |
| `--quiet`         | `-q`  | No progress messages             |
| `--help`          | `-h`  | Show help                        |
| `--version`       | `-v`  | Show version                     |

## Exit Codes

- `0` - Success
- `1` - Error (file not found, parse error)
- `2` - Invalid arguments
- `3` - Schema validation error

## Examples

### Quick Inspection

```bash
kaitai gif.ksy image.gif
kaitai elf.ksy binary
kaitai png.ksy photo.png
```

### Field Extraction

```bash
# Single field
kaitai format.ksy data.bin --field version

# Nested field
kaitai format.ksy data.bin --field header.magic
```

### File Output

```bash
# Pretty JSON to file
kaitai format.ksy data.bin -o result.json

# Compact JSON to file
kaitai format.ksy data.bin --no-pretty -o compact.json
```

### Scripting

```bash
# Quiet mode
kaitai format.ksy data.bin --quiet > output.json

# Error handling
if kaitai format.ksy data.bin --quiet; then
  echo "Parse successful"
else
  echo "Parse failed"
fi
```

### Batch Processing

```bash
# Process multiple files
for file in *.bin; do
  kaitai format.ksy "$file" -o "${file%.bin}.json" --quiet
done

# With error handling
for file in *.bin; do
  if kaitai format.ksy "$file" -o "${file%.bin}.json" --quiet; then
    echo "✓ $file"
  else
    echo "✗ $file"
  fi
done
```

### CI/CD

```bash
# Validate binary format
kaitai format.ksy data.bin --strict --quiet || exit 1

# Extract and validate version
VERSION=$(kaitai format.ksy data.bin --field version --quiet)
if [ "$VERSION" -lt 2 ]; then
  echo "Version too old"
  exit 1
fi
```

## Tips

1. **Use `--quiet` for scripting** - Only outputs data, no progress messages
2. **Use `--field` for extraction** - Get specific values without jq
3. **Use `--strict` in CI** - Catch schema issues early
4. **Redirect stderr** - Progress messages go to stderr, data to stdout
5. **Check exit codes** - Use in scripts for error handling

## Troubleshooting

```bash
# CLI not found
npm list -g @k67/kaitai-struct-ts

# Permission denied
chmod +x $(which kaitai)

# Module not found
npm install -g @k67/kaitai-struct-ts --force
```

## More Info

- Full docs: `kaitai --help`
- GitHub: https://github.com/fabianopinto/kaitai-struct-ts
- Kaitai Struct: https://kaitai.io/
