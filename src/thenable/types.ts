import {CancelableInterface} from '../lifecycle/types'

export interface CancelableThenableInterface<T> extends
  Promise<T>,
  CancelableInterface {
}

export interface BaseThenableInterface<T> extends
  Promise<T>,
  CancelableInterface {
}
