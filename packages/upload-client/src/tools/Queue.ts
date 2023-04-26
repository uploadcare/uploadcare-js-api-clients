type Task<T = unknown> = () => Promise<T>
type Resolver = (value: unknown) => void
type Rejector = (error: unknown) => void

export class Queue {
  #concurrency = 1
  #pending: Task[] = []
  #running = 0
  #resolvers: WeakMap<Task, Resolver> = new WeakMap()
  #rejectors: WeakMap<Task, Rejector> = new WeakMap()

  constructor(concurrency: number) {
    this.#concurrency = concurrency
  }

  #run() {
    const tasksLeft = this.#concurrency - this.#running
    for (let i = 0; i < tasksLeft; i++) {
      const task = this.#pending.shift()
      if (!task) {
        return
      }
      const resolver = this.#resolvers.get(task)
      const rejector = this.#rejectors.get(task)
      if (!resolver || !rejector)
        throw new Error(
          'Unexpected behavior: resolver or rejector is undefined'
        )
      this.#running += 1

      task()
        .finally(() => {
          this.#resolvers.delete(task)
          this.#rejectors.delete(task)
          this.#running -= 1
          this.#run()
        })
        .then((value) => resolver(value))
        .catch((error) => rejector(error))
    }
  }

  add<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.#resolvers.set(task, resolve as Resolver)
      this.#rejectors.set(task, reject as Rejector)

      this.#pending.push(task)
      this.#run()
    }) as Promise<T>
  }

  get pending() {
    return this.#pending.length
  }

  get running() {
    return this.#running
  }

  set concurrency(value: number) {
    this.#concurrency = value
    this.#run()
  }

  get concurrency() {
    return this.#concurrency
  }
}
