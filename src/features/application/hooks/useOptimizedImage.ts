import { useCallback, useEffect, useRef, useState } from 'react'
import { formatBytes, optimizeImage, type OptimizeImageResult } from '../utils/optimizeImage'

interface OptimizedImageState {
  isOptimizing: boolean
  error: string | null
  result: OptimizeImageResult | null
  originalFile: File | null
  optimizedFile: File | null
}

export function useOptimizedImage() {
  const [state, setState] = useState<OptimizedImageState>({ isOptimizing: false, error: null, result: null, originalFile: null, optimizedFile: null })
  const runId = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; runId.current += 1 }
  }, [])

  const setOriginalFile = useCallback((file: File | null) => {
    runId.current += 1
    const currentRun = runId.current
    if (!file) { setState({ isOptimizing: false, error: null, result: null, originalFile: null, optimizedFile: null }); return }
    setState({ isOptimizing: true, error: null, result: null, originalFile: file, optimizedFile: null })
    void optimizeImage(file).then((result) => {
      if (!mounted.current || currentRun !== runId.current) return
      setState((previous) => ({ ...previous, isOptimizing: false, result, optimizedFile: result.file }))
    }).catch((error: unknown) => {
      if (!mounted.current || currentRun !== runId.current) return
      setState((previous) => ({ ...previous, isOptimizing: false, result: null, optimizedFile: null, error: error instanceof Error ? error.message : 'No pudimos procesar esta imagen.' }))
    })
  }, [])

  const reset = useCallback(() => { runId.current += 1; setState({ isOptimizing: false, error: null, result: null, originalFile: null, optimizedFile: null }) }, [])
  const statusMessage = state.result?.wasOptimized ? `Imagen convertida a WebP: ${formatBytes(state.result.originalSize)} → ${formatBytes(state.result.optimizedSize)}` : state.result ? 'La imagen ya tenía un tamaño adecuado.' : null
  return { ...state, setOriginalFile, reset, statusMessage }
}
