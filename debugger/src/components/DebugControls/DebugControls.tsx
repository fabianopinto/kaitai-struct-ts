/**
 * @fileoverview Debug controls component for step-by-step debugging
 * @module debugger/components/DebugControls/DebugControls
 * @author Fabiano Pinto
 * @license MIT
 */

import { Play, Pause, SkipForward, SkipBack, RotateCcw, FastForward, Circle } from 'lucide-react'

/**
 * Debug controls component props
 */
interface DebugControlsProps {
  /** Whether debugging is currently playing */
  isPlaying: boolean
  /** Current step index */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** Whether there are any breakpoints set */
  hasBreakpoints?: boolean
  /** Callback to start/resume playback */
  onPlay: () => void
  /** Callback to pause playback */
  onPause: () => void
  /** Callback to step forward */
  onStepForward: () => void
  /** Callback to step backward */
  onStepBack: () => void
  /** Callback to reset to beginning */
  onReset: () => void
  /** Callback to continue to next breakpoint */
  onContinue?: () => void
}

/**
 * Debug controls component for step-by-step debugging
 *
 * @param props - Component props
 * @returns Debug controls component
 */
export function DebugControls({
  isPlaying,
  currentStep,
  totalSteps,
  hasBreakpoints = false,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onContinue,
}: DebugControlsProps) {
  return (
    <div className="border-b border-border bg-muted/30 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Reset */}
          <button
            onClick={onReset}
            disabled={currentStep === 0}
            className="p-2 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset (Ctrl+Shift+R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Step Back */}
          <button
            onClick={onStepBack}
            disabled={currentStep === 0}
            className="p-2 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            title="Step Back (F8)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          {isPlaying ? (
            <button
              onClick={onPause}
              className="p-2 rounded hover:bg-accent bg-primary text-primary-foreground"
              title="Pause (F5)"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={currentStep >= totalSteps}
              className="p-2 rounded hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Play (F5)"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            disabled={currentStep >= totalSteps}
            className="p-2 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            title="Step Forward (F10)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Continue to Next Breakpoint */}
          {hasBreakpoints && onContinue && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <button
                onClick={onContinue}
                disabled={currentStep >= totalSteps}
                className="p-2 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Continue to Next Breakpoint (F11)"
              >
                <FastForward className="w-4 h-4" />
                <Circle className="w-2 h-2 fill-red-500 text-red-500" />
              </button>
            </>
          )}
        </div>

        {/* Progress Info */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} / {totalSteps}
          </span>
          {totalSteps > 0 && (
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
