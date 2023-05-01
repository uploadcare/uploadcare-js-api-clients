type Task<T = unknown> = () => Promise<T>
type Resolver = (value: unknown) => void
type Rejector = (error: unknown) => void

export class Queue {
  private _concurrency = 1
  private _pending: Task[] = []
  private _running = 0
  private _resolvers: Map<Task, Resolver> = new Map()
  private _rejectors: Map<Task, Rejector> = new Map()

  constructor(concurrency: number) {
    this._concurrency = concurrency
  }

  private _run() {
    const tasksLeft = this._concurrency - this._running
    for (let i = 0; i < tasksLeft; i++) {
      const task = this._pending.shift()
      if (!task) {
        return
      }
      const resolver = this._resolvers.get(task)
      const rejector = this._rejectors.get(task)
      if (!resolver || !rejector)
        throw new Error(
          'Unexpected behavior: resolver or rejector is undefined'
        )
      this._running += 1

      task()
        .finally(() => {
          this._resolvers.delete(task)
          this._rejectors.delete(task)
          this._running -= 1
          this._run()
        })
        .then((value) => resolver(value))
        .catch((error) => rejector(error))
    }
  }

  add<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this._resolvers.set(task, resolve as Resolver)
      this._rejectors.set(task, reject as Rejector)

      this._pending.push(task)
      this._run()
    }) as Promise<T>
  }

  get pending() {
    return this._pending.length
  }

  get running() {
    return this._running
  }

  set concurrency(value: number) {
    this._concurrency = value
    this._run()
  }

  get concurrency() {
    return this._concurrency
  }
}
