import {CancelableInterface, CancelHookInterface} from '../lifecycle/types'

export interface CancelableThenableInterface<T> extends
  CancelHookInterface,
  Promise<T>,
  CancelableInterface {
}

export interface BaseThenableInterface<T> extends
  Promise<T>,
  CancelableInterface {
}
