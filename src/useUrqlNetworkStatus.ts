import { useEffect, useState } from 'react'
import { NetworkStatusProgram, emptyNetworkStatus } from './state'
import { subscribe, pipe } from 'wonka'

export const createUseUrqlNetworkStatus =
  (program: NetworkStatusProgram) => () => {
    const [state, setState] = useState(emptyNetworkStatus)

    useEffect(() => {
      const subscription = pipe(program.model$, subscribe(setState))

      return () => subscription.unsubscribe()
    }, [])

    return state
  }
