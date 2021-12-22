import { pipe } from 'fp-ts/function'
import { Eq } from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { filter, map, scan, Source } from 'wonka'

export const skipUntilChanged =
  <A>(eq: Eq<A>) =>
  (s: Source<A>): Source<A> =>
    pipe(
      s,
      scan<A, [O.Option<A>, boolean]>(
        ([prev], value) => [
          O.some(value),
          O.getEq(eq).equals(prev, O.some(value))
        ],
        [O.none, false]
      ),
      filter(([, eq]) => !eq),
      map(([value]) => O.toNullable(value) as A)
    )
