import { useState, useCallback } from 'react'

export function useHistory(maxHistory = 50) {
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])

  const takeSnapshot = useCallback((currentState) => {
    // Save current state to past, clear future
    setPast((prev) => {
      const newPast = [...prev, currentState]
      if (newPast.length > maxHistory) {
        newPast.shift() // Keep history within bounds
      }
      return newPast
    })
    setFuture([])
  }, [maxHistory])

  const undo = useCallback((currentState) => {
    if (past.length === 0) return null

    const previousState = past[past.length - 1]
    const newPast = past.slice(0, past.length - 1)

    setPast(newPast)
    setFuture((prev) => [currentState, ...prev])

    return previousState
  }, [past])

  const redo = useCallback((currentState) => {
    if (future.length === 0) return null

    const nextState = future[0]
    const newFuture = future.slice(1)

    setFuture(newFuture)
    setPast((prev) => [...prev, currentState])

    return nextState
  }, [future])

  const clearHistory = useCallback(() => {
    setPast([])
    setFuture([])
  }, [])

  return {
    takeSnapshot,
    undo,
    redo,
    clearHistory,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
