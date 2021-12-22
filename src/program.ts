import { pipe } from 'fp-ts/function'
import { makeSubject, Source, takeUntil, never, publish, tap } from 'wonka'

export interface Dispatch<Msg> {
  (msg: Msg): void
}

export interface Program<Msg, Model> {
  dispatch: Dispatch<Msg>
  model$: Source<Model>
}

export function program<Model, Msg>(
  init: Model,
  update: (model: Model, msg: Msg) => Model,
  stop: Source<unknown> = never
): Program<Msg, Model> {
  let value = init

  const { source, next } = makeSubject<Model>()
  const model$ = pipe(source, takeUntil(stop))
  const dispatch: Dispatch<Msg> = (msg) => pipe(update(value, msg), next)

  pipe(
    source,
    tap((next) => {
      value = next
    }),
    publish
  )

  next(init)

  return {
    model$,
    dispatch
  }
}
