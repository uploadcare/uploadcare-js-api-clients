import {
  dataURItoBlob,
  dataURItoBuffer,
  getSettingsForTesting
} from './_helpers'
import { isNode } from '../src/tools/isNode'

const settings = getSettingsForTesting({})

/* eslint-disable max-len */
const images: { [key: string]: string } = {
  blackSquare:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAP1BMVEUAAAB9fX2MjIybm5urq6u4uLi2traBgYF4eHjZ2dl0dHTPz8/8/Pytra2enp6Ojo6UlJSkpKTz8/Pk5OTIyMhQaSTuAAABiklEQVR4nO3dQU7DMBBG4XETp00hJUDvf1a6YAMbKqTR6MXv8wX+t7RkyfH68bm+3O+992V+mL7tpx/av51Pf9qnJ9zmJ2z9t2WNLY7tGnP1hGRtgML36gnJWkzVE5JZyGchn4V8FvJZyDdC4V49IVmLU/WEZBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfO1xjs1CPgv5LOSzkM9CPgv5LOSzkM9CPgv5LOSzkM9CPgv5LOSzkM9CPgv5LORrca6ekGyEF0MW0lnIZyGfhXwW8lnIZyGfhXwW8lnIZyGfhXwW8lnIZyGfhXwW8lnIZyHfCIVv1ROSjfDPjIV0FvJZyGchn4V8FvJZyGchn4V8FvJZyGchn4V8FvJZyGchn4V8IxTeqickazFXT0hmIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnIZ+FfBbyWchnId8IhVv1hGQtluoJyVr06gnJLOSzkM9CPgv5LOSzkM9CvhEKj34DvsR6bUd26V9gvwdvrjmldwAAAABJRU5ErkJggg=='
}
/* eslint-enable max-len */

const uuids: { [key: string]: { publicKey: string; uuid: string } } = {
  image: {
    publicKey: '657ec3b474e01b9045f7',
    uuid: 'd3275f8b-686d-4980-916a-53a1fc17450b'
  },
  token: {
    publicKey: '657ec3b474e01b9045f7',
    uuid: 'b6aac6aa-be7b-46d2-9fc3-208290c78024'
  },
  demo: {
    publicKey: 'demopublickey',
    uuid: ''
  },
  invalid: {
    publicKey: 'invalidpublickey',
    uuid: ''
  },
  empty: {
    publicKey: '',
    uuid: ''
  },
  multipart: {
    publicKey: 'pub_test__no_storing',
    uuid: ''
  }
}

export type FixtureFile = {
  data: Buffer | Blob
  size: number
}

function imageBuffer(id: string): FixtureFile {
  const data = dataURItoBuffer(images[id])
  const size = data.length

  return {
    data,
    size
  }
}

function imageBlob(id: string): FixtureFile {
  const data = dataURItoBlob(images[id])
  const size = data.size

  return {
    data,
    size
  }
}

export function image(id: string): FixtureFile {
  if (isNode()) {
    return imageBuffer(id)
  }

  return imageBlob(id)
}

function fileBuffer(bytes: number): FixtureFile {
  const buffer = Buffer.alloc(bytes)

  return {
    data: buffer,
    size: buffer.length
  }
}

function fileBlob(bytes: number): FixtureFile {
  const buffer = new ArrayBuffer(bytes)
  const blob = new Blob([buffer])

  return {
    data: blob,
    size: blob.size
  }
}

export function file(mbSize: number): FixtureFile {
  const byteLength = mbSize * 1024 * 1024

  if (isNode()) {
    return fileBuffer(byteLength)
  }

  return fileBlob(byteLength)
}

export function uuid(id: string): string {
  const { uuid } = uuids[id]

  return uuid
}

export function publicKey(id: string): string {
  const { publicKey } = uuids[id]

  return publicKey
}

export function imageUrl(id: string): string {
  const images = {
    valid: `${settings.baseCDN}/d3275f8b-686d-4980-916a-53a1fc17450b/1findfacecropgrayscale.jpg`,
    doesNotExist: 'https://1.com/1.jpg',
    privateIP: 'http://192.168.1.10/1.jpg'
  }

  return images[id]
}

export function token(id: string): string {
  const tokens = {
    valid: 'ee5b6d12-ee19-48fd-b226-b94ab61ce191',
    empty: ''
  }

  return tokens[id]
}

export function groupId(id: string): string {
  const groupIds = {
    valid: '01136e2a-7d57-4546-81be-1043e7774e70~2',
    invalid: '123ebb27-1fd6-46c6-a859-b9893'
  }

  return groupIds[id]
}

export function groupOfFiles(id: string): Array<string> {
  const groupOfFiles = {
    valid: [
      'd3275f8b-686d-4980-916a-53a1fc17450b',
      'b7db68d6-6dc5-4fd7-90b2-9077030f206d/-/resize/x800/'
    ],
    invalid: [
      '2e6b7f23-9143-4b71-94e7-338bb',
      'e143e315-bdce-4421-9a0b-ca1aa/-/resize/x800/'
    ]
  }

  return groupOfFiles[id]
}
