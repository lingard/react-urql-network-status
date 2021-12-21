import { useRef, useCallback } from 'react'
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect'

type AnyFn = <A>(a: A) => unknown

export function useEventCallback(fn: AnyFn) {
  const ref = useRef<AnyFn>(() => {
    throw new Error('Function is called before it was assigned.')
  })

  useIsomorphicLayoutEffect(() => {
    ref.current = fn
  })

  return useCallback((a) => ref.current(a), [])
}
