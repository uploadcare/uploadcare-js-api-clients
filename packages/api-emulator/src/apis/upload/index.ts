import { baseRoutes } from './base.js'
import { derivativeRoutes } from './derivative.js'
import { fromUrlRoutes } from './from-url.js'
import { groupRoutes } from './group.js'
import { infoRoutes } from './info.js'
import { multipartRoutes } from './multipart.js'

export const uploadRoutes = [
  ...baseRoutes,
  ...derivativeRoutes,
  ...fromUrlRoutes,
  ...groupRoutes,
  ...infoRoutes,
  ...multipartRoutes
]
