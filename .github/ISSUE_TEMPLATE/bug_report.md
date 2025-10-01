---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

A clear and concise description of what the bug is.

## To Reproduce

Steps to reproduce the behavior:

1. Create a .ksy file with '...'
2. Parse binary data '...'
3. See error

## Expected Behavior

A clear and concise description of what you expected to happen.

## Actual Behavior

What actually happened.

## Code Example

```typescript
// Minimal reproducible example
import { parse } from '@k67/kaitai-struct-ts'

const ksy = `
meta:
  id: example
  endian: le
seq:
  - id: value
    type: u4
`

const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04])
const result = parse(ksy, buffer)
```

## Environment

- **Package Version:** [e.g., 0.2.0]
- **Node.js Version:** [e.g., 20.10.0]
- **Operating System:** [e.g., macOS 14.0, Ubuntu 22.04, Windows 11]
- **Package Manager:** [e.g., npm 10.2.0, pnpm 8.10.0]

## Additional Context

Add any other context about the problem here (error messages, stack traces, etc.).

## Possible Solution

If you have suggestions on how to fix the bug, please describe them here.
