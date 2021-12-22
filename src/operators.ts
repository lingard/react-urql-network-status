import { pipe } from 'fp-ts/function'
import { Eq } from 'fp-ts/Eq'
import { skipWhile, Source, tap } from 'wonka'

export const skipUntilChanged =
  <A>(eq: Eq<A>) =>
  (s: Source<A>) => {
    let prev: A

    return pipe(
      s,
      skipWhile((value) => eq.equals(value, prev)),
      tap((value) => {
        prev = value
      })
    )
  }
