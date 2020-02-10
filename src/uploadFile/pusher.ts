import * as WebSocket from 'ws'

import fromUrl, { TypeEnum } from '../api/fromUrl'

import { FileInfo } from '../api/types'
import { Status } from '../api/fromUrlStatus'
import CancelController from '../tools/CancelController'
import { UploadClientError } from '../tools/errors'

type ListenerStore<T extends object> = {
  [K in keyof T]: ((data: T[K]) => void)[]
}

type AllStatuses =
  | StatusErrorResponse
  | StatusProgressResponse
  | StatusSuccessResponse

type StatusProgressResponse = {
  status: Status.Progress
  done: number
  total: number
}

type StatusErrorResponse = {
  status: Status.Error
  msg: string
  url: string
}

type StatusSuccessResponse = {
  status: Status.Success
} & FileInfo

class Events<T extends object> {
  events: ListenerStore<T>

  constructor() {
    this.events = Object.create({})
  }

  emit<U extends keyof T>(event: U, data: T[U]): void {
    this.events[event]?.forEach(fn => fn(data))
  }

  on<U extends keyof T>(event: U, callback: (data: T[U]) => void): void {
    this.events[event] = this.events[event] || []
    this.events[event].push(callback)
  }

  off<U extends keyof T>(event: U, callback?: (data: T[U]) => void): void {
    if (callback) {
      this.events[event] = this.events[event].filter(fn => fn !== callback)
    } else {
      this.events[event] = []
    }
  }
}

const response = (
  type: 'progress' | 'success' | 'fail',
  data: any
): AllStatuses => {
  if (type === 'success') {
    return { status: Status.Success, ...data } as StatusSuccessResponse
  }

  if (type === 'progress') {
    return { status: Status.Progress, ...data } as StatusProgressResponse
  }

  return { status: Status.Error, ...data } as StatusErrorResponse
}

const PUSHERURl =
  'wss://ws.pusherapp.com:443/app/79ae88bd931ea68464d9?protocol=5&client=js&version=1.12.2'

type Message<T> = {
  event: string
  data: T
}

type Messages = {
  [key: string]: AllStatuses
} & {
  connected: undefined
}

class Pusher {
  ws: WebSocket | undefined = undefined
  queue: Message<{ channel: string }>[] = []
  isConnected = false
  emmitter: Events<Messages> = new Events()

  connect(): void {
    if (!this.isConnected && !this.ws) {
      this.ws = new WebSocket(PUSHERURl)

      this.emmitter.on('connected', () => {
        this.isConnected = true
        this.queue.forEach(message => this.send(message))
        this.queue = []
      })

      this.ws.addEventListener('message', e => {
        const data = JSON.parse(e.data)

        switch (data.event) {
          case 'pusher:connection_established': {
            this.emmitter.emit('connected', undefined)
            break
          }

          case 'progress':
          case 'success':
          case 'fail': {
            console.log(data)

            this.emmitter.emit<string>(
              data.channel,
              response(data.event, JSON.parse(data.data))
            )
          }
        }
      })
    }
  }

  send(data: { event: string; data: { channel: string } }): void {
    const str = JSON.stringify(data)
    // console.log('send: ')
    // console.log('  ', str)

    this.ws?.send(str)
  }

  subscribe(token: string, handler: (data: AllStatuses) => void): void {
    this.connect()

    const channel = `task-status-${token}`
    const message = {
      event: 'pusher:subscribe',
      data: { channel }
    }

    this.emmitter.on(channel, handler)
    if (this.isConnected) {
      this.send(message)
    } else {
      this.queue.push(message)
    }
  }

  unsubscribe(token: string): void {
    const channel = `task-status-${token}`
    const message = {
      event: 'pusher:unsubscribe',
      data: { channel }
    }

    this.emmitter.off(channel)
    if (this.isConnected) {
      this.send(message)
    } else {
      this.queue.push(message)
    }
  }
}

// export default Pusher

let pusher: Pusher | null = null
const getPusher = (): Pusher => {
  if (!pusher) {
    pusher = new Pusher()
  }

  pusher.connect()
  return pusher
}

const push = ({
  token,
  cancel,
  callback,
  onProgress
}: {
  token: string
  cancel: CancelController
  callback: () => void
  onProgress?: (info: { value: number }) => void
}): Promise<FileInfo | UploadClientError> =>
  new Promise((resolve, reject) => {
    const pusher = getPusher()

    cancel.onCancel(() => {
      pusher.unsubscribe(token)
      reject('stop pisher')
    })

    pusher.subscribe(token, result => {
      callback()

      switch (result.status) {
        case Status.Success: {
          pusher.unsubscribe(token)
          if (onProgress) onProgress({ value: result.done / result.total })
          resolve(result)
          break
        }

        case Status.Progress: {
          if (onProgress) {
            onProgress({ value: result.done / result.total })
          }
          break
        }

        case Status.Error: {
          pusher.unsubscribe(token)
          reject(new UploadClientError(result.msg))
        }
      }
    })
  })

const preconnect = (): void => {
  getPusher().connect()
}

export default push
export { preconnect }

// a.connect()

// setTimeout(() => {
//   fromUrl(
//     'https://images.unsplash.com/photo-1580840612958-0fc3f8570eaa?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2734&q=80',
//     { publicKey: 'demopublickey' }
//   ).then(result => {
//     if (result.type === TypeEnum.Token) {
//       a.subscribe(result.token, console.log)

//       setTimeout(() => {
//         a.unsubscribe(result.token)
//       }, 5000)
//     }
//   })
// }, 2000)
