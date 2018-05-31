/* @flow */

/* eslint-disable max-len */

import {dataURItoBlob} from './helpers'

const images: {[key: string]: string} = {
  blackSquare:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAP1BMVEUAAAB9fX2MjIybm5urq6u4uLi2traBgYF4eHjZ2dl0dHTPz8/8/Pytra2enp6Ojo6UlJSkpKTz8/Pk5OTIyMhQaSTuAAABiklEQVR4nO3dQU7DMBBG4XETp00hJUDvf1a6YAMbKqTR6MXv8wX+t7RkyfH68bm+3O+992V+mL7tpx/av51Pf9qnJ9zmJ2z9t2WNLY7tGnP1hGRtgML36gnJWkzVE5JZyGchn4V8FvJZyDdC4V49IVmLU/WEZBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfO1xjs1CPgv5LOSzkM9CPgv5LOSzkM9CPgv5LOSzkM9CPgv5LOSzkM9CPgv5LORrca6ekGyEF0MW0lnIZyGfhXwW8lnIZyGfhXwW8lnIZyGfhXwW8lnIZyGfhXwW8lnIZyHfCIVv1ROSjfDPjIV0FvJZyGchn4V8FvJZyGchn4V8FvJZyGchn4V8FvJZyGchn4V8IxTeqickazFXT0hmIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnId8IhVv1hGQtluoJyVr06gnJLOSzkM9CPgv5LOSzkM9CvhEKj34DvsR6bUd26V9gvwdvrjmldwAAAABJRU5ErkJggg==',
}

const uuids: {[key: string]: {publicKey: string, uuid?: string}} = {
  image: {
    publicKey: '8fa271321efd536ee1aa',
    uuid: '89827330-e200-41bc-9fba-7d51c8e9ea15',
  },
  demo: {publicKey: 'demopublickey'},
  invalid: {publicKey: 'invalidpublickey'},
}

export function image(id: string): Blob {
  return dataURItoBlob(images[id])
}

export function file(mbSize: number): Blob {
  const byteLength = mbSize * 1000000
  const buffer = new ArrayBuffer(byteLength)
  const blob = new Blob([buffer])

  return blob
}

export function uuid(id: string): string {
  const {uuid} = uuids[id]

  return uuid
}

export function publicKey(id: string): string {
  const {publicKey} = uuids[id]

  return publicKey
}

export function linkTo(uuid: string): string {
  return `https://ucarecdn.com/${uuid}/`
}
