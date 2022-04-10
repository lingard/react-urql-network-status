// import * as O from 'fp-ts/Option'
// import * as assert from 'assert'
// import { CombinedError, OperationResult, Operation } from 'urql'
// import * as _ from '../src/state'
// import { queryOperation, queryResult } from './utils'
// import { tap, publish } from 'wonka'
// import { pipe } from 'fp-ts/lib/function'
// import { operationRequestEvent } from '../src/OperationEvent'

// const error = new CombinedError({
//   networkError: new Error('')
// })

// describe('pendingOperations', () => {
//   it('appends requests', () => {
//     const actual = _.pendingOperations(
//       [],
//       operationRequestEvent(queryOperation)
//     )

//     assert.deepStrictEqual(actual, [queryOperation])
//   })

//   it('removes completed requests', () => {
//     const queryOperation2: Operation = {
//       ...queryOperation,
//       key: Infinity
//     }
//     const success = _.pendingOperations(
//       [queryOperation2, queryOperation],
//       _.networkStatusActionSuccess(queryOperation, queryResult)
//     )
//     const failure = _.pendingOperations(
//       [queryOperation2, queryOperation],
//       _.networkStatusActionError(queryOperation, error)
//     )

//     assert.deepStrictEqual(success, [queryOperation2])
//     assert.deepStrictEqual(failure, [queryOperation2])
//   })
// })

// describe('latestOperationError', () => {
//   it('adds error from error action', () => {
//     const init = O.none
//     const actual = _.latestOperationError(
//       init,
//       _.networkStatusActionError(queryOperation, error)
//     )

//     assert.deepStrictEqual(
//       actual,
//       O.some(
//         _.operationError({
//           operation: queryOperation,
//           error
//         })
//       )
//     )
//   })

//   it('adds graphql errors from success action', () => {
//     const queryResult: OperationResult = {
//       operation: queryOperation,
//       error,
//       data: []
//     }
//     const init = O.none
//     const actual = _.latestOperationError(
//       init,
//       _.networkStatusActionSuccess(queryOperation, queryResult)
//     )

//     assert.deepStrictEqual(
//       actual,
//       O.some(
//         _.operationError({
//           operation: queryOperation,
//           error
//         })
//       )
//     )
//   })

//   it('resets error on requests', () => {
//     const init = O.some(
//       _.operationError({
//         operation: queryOperation,
//         error
//       })
//     )
//     const actual = _.latestOperationError(
//       init,
//       operationRequestEvent(queryOperation)
//     )

//     assert.deepStrictEqual(actual, O.none)
//   })
// })

// describe('networkStatusProgram', () => {
//   it('should render', () => {
//     const states: _.NetworkStatus[] = []

//     const program = _.networkStatusProgram()

//     pipe(
//       program.model$,
//       tap((state) => {
//         states.push(state)
//       }),
//       publish
//     )

//     program.dispatch(operationRequestEvent(queryOperation))
//     program.dispatch(_.networkStatusActionSuccess(queryOperation, queryResult))
//     program.dispatch(operationRequestEvent(queryOperation))
//     program.dispatch(_.networkStatusActionError(queryOperation, error))

//     const pendingQueryState = {
//       ..._.emptyNetworkStatus,
//       query: {
//         ..._.emptyNetworkStatus.query,
//         pending: [queryOperation]
//       }
//     }

//     assert.deepStrictEqual(states, [
//       {
//         ..._.emptyNetworkStatus,
//         query: {
//           ..._.emptyNetworkStatus.query,
//           pending: [queryOperation]
//         }
//       },
//       _.emptyNetworkStatus,
//       pendingQueryState,
//       {
//         ..._.emptyNetworkStatus,
//         query: {
//           ..._.emptyNetworkStatus.query,
//           latestError: O.some(
//             _.operationError({
//               operation: queryOperation,
//               error
//             })
//           )
//         }
//       }
//     ])
//   })
// })
