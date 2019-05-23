import * as base from './controllers/base'
import * as fromUrl from './controllers/from_url'
import * as info from './controllers/info'

export type RouteType = {
  [path: string]: {
    method: string,
    fn: Function,
    isProtected: boolean,
  }
}

export const ROUTES: Array<RouteType> = [
  {
    '/base': {
      method: 'post',
      fn: base.index,
      isProtected: true,
    }
  }, {
    '/from_url': {
      method: 'post',
      fn: fromUrl.index,
      isProtected: true,
    }
  }, {
    '/from_url/status': {
      method: 'get',
      fn: fromUrl.status,
      isProtected: false,
    }
  }, {
    '/info': {
      method: 'get',
      fn: info.index,
      isProtected: true,
    }
  },
]
