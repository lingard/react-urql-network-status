import { createUseUrqlNetworkStatus } from './useUrqlNetworkStatus'
import { networkStatusExchange } from './networkStatusExchange'
import { networkStatusProgram } from './state'

export function createNetworkStatusNotifier() {
  const program = networkStatusProgram()
  const exchange = networkStatusExchange(program)

  return {
    exchange,
    useUrqlNetworkStatus: () => createUseUrqlNetworkStatus(program)
  }
}
