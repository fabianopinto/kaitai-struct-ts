/**
 * @fileoverview Custom hook for step-by-step debugging
 * @module debugger/hooks/useStepDebugger
 * @author Fabiano Pinto
 * @license MIT
 */

import { useCallback, useEffect } from 'react'
import { useDebugStore } from '@/store/debugStore'

/**
 * Custom hook for step-by-step debugging functionality
 *
 * @returns Step debugging state and actions
 * @example
 * ```typescript
 * const { play, pause, stepForward, stepBack, reset } = useStepDebugger()
 * ```
 */
export function useStepDebugger() {
  const {
    parseEvents,
    currentStep,
    isPlaying,
    setCurrentStep,
    setIsPlaying,
    setSelectedField,
    setHexViewOffset,
  } = useDebugStore()

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const nextStep = currentStep + 1
      if (nextStep >= parseEvents.length) {
        // Would go past the last step, stop playing
        setIsPlaying(false)
        return
      }
      setCurrentStep(nextStep)
    }, 500) // 500ms between steps

    return () => clearInterval(interval)
  }, [isPlaying, currentStep, parseEvents.length, setCurrentStep, setIsPlaying])

  // Update selected field and hex offset based on current step
  useEffect(() => {
    // Reset if currentStep is out of bounds
    if (parseEvents.length === 0) {
      setCurrentStep(0)
      setSelectedField(null)
      return
    }

    // Clamp currentStep to valid range
    if (currentStep >= parseEvents.length) {
      setCurrentStep(parseEvents.length - 1)
      return
    }

    if (currentStep >= 0 && currentStep < parseEvents.length) {
      const event = parseEvents[currentStep]
      if (event.fieldName) {
        setSelectedField(event.fieldName)
      }
      if (event.offset !== undefined) {
        setHexViewOffset(event.offset)
      }
    }
  }, [currentStep, parseEvents, setSelectedField, setHexViewOffset, setCurrentStep])

  const play = useCallback(() => {
    if (currentStep >= parseEvents.length - 1) {
      setCurrentStep(0)
    }
    setIsPlaying(true)
  }, [currentStep, parseEvents.length, setCurrentStep, setIsPlaying])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [setIsPlaying])

  const stepForward = useCallback(() => {
    if (currentStep < parseEvents.length - 1) {
      setCurrentStep(currentStep + 1)
    }
    setIsPlaying(false)
  }, [currentStep, parseEvents.length, setCurrentStep, setIsPlaying])

  const stepBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setIsPlaying(false)
    }
  }, [currentStep, setCurrentStep, setIsPlaying])

  const reset = useCallback(() => {
    setCurrentStep(0)
    setIsPlaying(false)
    setSelectedField(null)
    setHexViewOffset(0)
  }, [setCurrentStep, setIsPlaying, setSelectedField, setHexViewOffset])

  return {
    play,
    pause,
    stepForward,
    stepBack,
    reset,
    currentStep,
    totalSteps: parseEvents.length,
    isPlaying,
  }
}
