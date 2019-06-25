import * as base from './controllers/base'
import * as fromUrl from './controllers/from_url'
import * as info from './controllers/info'
import * as throttle from './controllers/throttle'

export type RouteType = {
  [path: string]: {
    method: string,
    fn: Function,
    isProtected: boolean,
    description?: string,
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
      description: '/from_url/?pub_key=XXXXXXXXXXXXXXXXXXXX',
    }
  }, {
    '/from_url/status': {
      method: 'get',
      fn: fromUrl.status,
      isProtected: false,
      description: '/from_url/status/?pub_key=XXXXXXXXXXXXXXXXXXXX&token=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    }
  }, {
    '/info': {
      method: 'get',
      fn: info.index,
      isProtected: true,
      description: '/info?pub_key=XXXXXXXXXXXXXXXXXXXX&file_id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    }
  }, {
    '/throttle': {
      method: 'post',
      fn: throttle.index,
      isProtected: true,
    }
  },
]
