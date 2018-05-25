/* eslint-disable max-len */

import {dataURItoBlob} from './helpers'

const images = {
  blackSquare:
    'iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAP1BMVEUAAAB9fX2MjIybm5urq6u4uLi2traBgYF4eHjZ2dl0dHTPz8/8/Pytra2enp6Ojo6UlJSkpKTz8/Pk5OTIyMhQaSTuAAABiklEQVR4nO3dQU7DMBBG4XETp00hJUDvf1a6YAMbKqTR6MXv8wX+t7RkyfH68bm+3O+992V+mL7tpx/av51Pf9qnJ9zmJ2z9t2WNLY7tGnP1hGRtgML36gnJWkzVE5JZyGchn4V8FvJZyDdC4V49IVmLU/WEZBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfO1xjs1CPgv5LOSzkM9CPgv5LOSzkM9CPgv5LOSzkM9CPgv5LOSzkM9CPgv5LORrca6ekGyEF0MW0lnIZyGfhXwW8lnIZyGfhXwW8lnIZyGfhXwW8lnIZyGfhXwW8lnIZyHfCIVv1ROSjfDPjIV0FvJZyGchn4V8FvJZyGchn4V8FvJZyGchn4V8FvJZyGchn4V8IxTeqickazFXT0hmIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnId8IhVv1hGQtluoJyVr06gnJLOSzkM9CPgv5LOSzkM9CvhEKj34DvsR6bUd26V9gvwdvrjmldwAAAABJRU5ErkJggg==',
}

const uuids = {
  image: {
    publicKey: '',
    uuid: '8e92b914-93a6-490d-84ae-b8a7077aa957',
  },
}

export function image(id) {
  return dataURItoBlob(images[id])
}

export function uuid(id) {
  const {uuid} = uuids[id]

  return uuid
}

export function publicKey(id) {
  const {publicKey} = uuids[id]

  return publicKey
}
