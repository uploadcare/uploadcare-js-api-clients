import * as base from './controllers/base'
import * as fromUrl from './controllers/from_url'
import * as info from './controllers/info'
import * as group from './controllers/group'
import * as throttle from './controllers/throttle'

export type RouteType = {
  [path: string]: {
    method: string,
    fn: Function,
    isProtected: boolean,
    isFake?: boolean,
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
      description: '/info/?pub_key=XXXXXXXXXXXXXXXXXXXX&file_id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    }
  }, {
    '/group': {
      method: 'post',
      fn: group.index,
      isProtected: true,
      description: '/group/',
    }
  }, {
    '/group/info': {
      method: 'get',
      fn: group.info,
      isProtected: true,
      description: '/group/info/?pub_key=XXXXXXXXXXXXXXXXXXXX&group_id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX~N',
    }
  }, {
    '/throttle': {
      method: 'post',
      fn: throttle.index,
      isFake: true,
      isProtected: true,
    }
  },
]
