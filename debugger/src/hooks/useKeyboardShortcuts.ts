/**
 * @fileoverview Custom hook for keyboard shortcuts
 * @module debugger/hooks/useKeyboardShortcuts
 * @author Fabiano Pinto
 * @license MIT
 */

import { useEffect } from 'react'

/**
 * Keyboard shortcut configuration
 */
interface ShortcutConfig {
  /** F5 - Play/Pause */
  onPlay?: () => void
  /** F8 - Step Back */
  onStepBack?: () => void
  /** F9 - Toggle Breakpoint */
  onToggleBreakpoint?: () => void
  /** F10 - Step Forward */
  onStepForward?: () => void
  /** F11 - Continue to Next Breakpoint */
  onContinue?: () => void
  /** Ctrl+Shift+R - Reset */
  onReset?: () => void
  /** Escape - Clear selection */
  onEscape?: () => void
}

/**
 * Custom hook for keyboard shortcuts in debugger
 *
 * @param config - Shortcut configuration
 * @example
 * ```typescript
 * useKeyboardShortcuts({
 *   onPlay: handlePlay,
 *   onStepForward: handleStepForward,
 * })
 * ```
 */
export function useKeyboardShortcuts(config: ShortcutConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // F5 - Play/Pause
      if (event.key === 'F5') {
        event.preventDefault()
        config.onPlay?.()
        return
      }

      // F8 - Step Back
      if (event.key === 'F8') {
        event.preventDefault()
        config.onStepBack?.()
        return
      }

      // F9 - Toggle Breakpoint on selected field
      if (event.key === 'F9') {
        event.preventDefault()
        config.onToggleBreakpoint?.()
        return
      }

      // F10 - Step Forward
      if (event.key === 'F10') {
        event.preventDefault()
        config.onStepForward?.()
        return
      }

      // F11 - Continue to Next Breakpoint
      if (event.key === 'F11') {
        event.preventDefault()
        config.onContinue?.()
        return
      }

      // Ctrl+Shift+R - Reset
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        config.onReset?.()
        return
      }

      // Escape - Clear selection
      if (event.key === 'Escape') {
        event.preventDefault()
        config.onEscape?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config])
}
