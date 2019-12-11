import { ProgressStateEnum } from "../types"

export default class StateChangeError extends Error {
  constructor(fromState: ProgressStateEnum, toState: ProgressStateEnum) {
    super()

    this.name = "StateChangeError"
    this.message = `"${fromState}" state can't be changed to "${toState}" state`

    Object.setPrototypeOf(this, StateChangeError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StateChangeError)
    } else {
      this.stack = new Error().stack
    }
  }
}
