# CLI Documentation

The `kaitai` command-line tool allows you to parse binary files using Kaitai Struct definitions without writing code.

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

## Options

| Option              | Short | Description                                       |
| ------------------- | ----- | ------------------------------------------------- |
| `--output <file>`   | `-o`  | Write output to file instead of stdout            |
| `--pretty`          | `-p`  | Pretty-print JSON output (default for stdout)     |
| `--no-pretty`       |       | Disable pretty printing                           |
| `--format <format>` | `-f`  | Output format: `json` or `yaml` (default: `json`) |
| `--field <path>`    |       | Extract specific field using dot notation         |
| `--no-validate`     |       | Skip schema validation                            |
| `--strict`          |       | Treat schema warnings as errors                   |
| `--quiet`           | `-q`  | Suppress non-error output                         |
| `--help`            | `-h`  | Show help message                                 |
| `--version`         | `-v`  | Show version number                               |

## Exit Codes

- `0` - Success
- `1` - General error (file not found, parse error)
- `2` - Invalid arguments or usage
- `3` - Schema validation error

## Examples

### Basic Parsing

```bash
# Parse and display as JSON
kaitai format.ksy data.bin

# With quiet mode (no progress messages)
kaitai format.ksy data.bin --quiet
```

### File Output

```bash
# Save to file (compact JSON by default)
kaitai format.ksy data.bin -o result.json

# Save with pretty printing
kaitai format.ksy data.bin -o result.json --pretty
```

### Field Extraction

```bash
# Extract single field
kaitai format.ksy data.bin --field version

# Extract nested field
kaitai gif.ksy image.gif --field header.magic
kaitai elf.ksy binary --field header.version
```

### Output Formats

```bash
# JSON output (default)
kaitai format.ksy data.bin

# YAML output
kaitai format.ksy data.bin --format yaml

# Compact JSON
kaitai format.ksy data.bin --no-pretty
```

### Validation

```bash
# With validation (default)
kaitai format.ksy data.bin

# Skip validation
kaitai format.ksy data.bin --no-validate

# Strict mode (warnings as errors)
kaitai format.ksy data.bin --strict
```

## Use Cases

### Quick Binary Inspection

Quickly inspect binary file contents:

```bash
kaitai gif.ksy image.gif
kaitai elf.ksy /usr/bin/ls
kaitai png.ksy photo.png
```

### Batch Processing

Process multiple files in a shell script:

```bash
# Process all .bin files
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

### CI/CD Integration

Validate binary formats in continuous integration:

```bash
# Validate binary format
kaitai format.ksy data.bin --strict --quiet || exit 1

# Extract and validate version
VERSION=$(kaitai format.ksy data.bin --field version --quiet)
if [ "$VERSION" -lt 2 ]; then
  echo "Version too old: $VERSION"
  exit 1
fi
```

### Debugging Format Definitions

Test `.ksy` definitions during development:

```bash
# Test without validation
kaitai test.ksy sample.bin --no-validate

# Test with strict validation
kaitai test.ksy sample.bin --strict
```

### Data Extraction

Extract specific data from binary files:

```bash
# Get file version
kaitai format.ksy data.bin --field version --quiet

# Get magic bytes
kaitai format.ksy data.bin --field header.magic --quiet

# Extract metadata
kaitai mp3.ksy song.mp3 --field id3.title --quiet
```

## Scripting Tips

### Quiet Mode for Scripting

Use `--quiet` to suppress progress messages:

```bash
# Only output JSON
result=$(kaitai format.ksy data.bin --quiet)

# Pipe to jq
kaitai format.ksy data.bin --quiet | jq '.version'
```

### Error Handling

Check exit codes for error handling:

```bash
if kaitai format.ksy data.bin --quiet; then
  echo "Parse successful"
else
  echo "Parse failed with exit code $?"
fi
```

### Redirecting Output

Progress messages go to stderr, data to stdout:

```bash
# Redirect only data
kaitai format.ksy data.bin > output.json 2>/dev/null

# Redirect only progress messages
kaitai format.ksy data.bin 2> progress.log
```

## Troubleshooting

### CLI Not Found

```bash
# Check installation
npm list -g @k67/kaitai-struct-ts

# Reinstall
npm install -g @k67/kaitai-struct-ts --force
```

### Permission Denied

```bash
# Make executable (if needed)
chmod +x $(which kaitai)
```

### Module Not Found

Ensure the package is built:

```bash
cd node_modules/@k67/kaitai-struct-ts
npm run build
```

## Advanced Usage

### Combining with Other Tools

```bash
# Parse and format with jq
kaitai format.ksy data.bin --quiet | jq '.header'

# Parse and search with grep
kaitai format.ksy data.bin --quiet | grep -i "version"

# Parse and save specific field
kaitai format.ksy data.bin --field data --quiet > extracted.bin
```

### Performance Tips

1. Use `--quiet` to reduce I/O overhead
2. Use `--no-validate` to skip schema validation (faster)
3. Use `--field` to extract only needed data
4. Use `--no-pretty` for smaller output files

## See Also

- [Quick Reference](./cli/CLI_QUICKREF.md) - Quick reference card
- [Implementation Guide](./cli/CLI_GUIDE.md) - Technical implementation details
- [Test Results](./cli/CLI_TEST_RESULTS.md) - Test suite results
- [Main README](../README.md) - Project overview
- [Examples](../EXAMPLES.md) - Format examples
