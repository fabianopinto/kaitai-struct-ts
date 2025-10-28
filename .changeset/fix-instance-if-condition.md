---
"@k67/kaitai-struct-ts": patch
---

Fix: Check if condition before evaluating value instances

Fixed an issue where value instances (calculated fields) were not checking their `if` condition before evaluation. This caused errors in the debugger when enumerating properties with `Object.entries()`, which triggered lazy evaluation of all instances including those with false conditions. The fix ensures that conditional instances return `undefined` immediately when their condition is false, preventing evaluation of potentially invalid expressions.
