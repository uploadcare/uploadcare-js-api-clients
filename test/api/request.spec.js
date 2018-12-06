import request, {buildFormData} from '../../src/api/request'
import * as factory from '../fixtureFactory'
import axios from 'axios'

describe('buildFormData', () => {
  it('should return FormData with nice input object', () => {
    const file = factory.image('blackSquare').data
    const body = {
      file,
      UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
    }

    const data = buildFormData(body)

    expect(data).toBeDefined()
    expect(typeof data).toBe('object')
    expect(typeof data.append).toBe('function')
  })
})

describe('API – request', () => {
  it('should return Promise', () => {
    expect(typeof request({path: '/info/'}).then).toBe('function')
  })

  it('should be resolved with 200 code when all input is valid', async() => {
    const response = await request({
      path: '/info/',
      query: {
        pub_key: factory.publicKey('image'),
        file_id: factory.uuid('image'),
      },
    })

    await expect(response.status).toBe(200)
    await expect(response.data).toEqual(jasmine.objectContaining({uuid: factory.uuid('image')}))
  })

  it('should be resolved if server returns error', async() => {
    const response = await request({
      path: '/info/',
      query: {pub_key: factory.publicKey('image')},
    })

    await expect(response.status).toBe(200)
    await expect(response.data).toEqual(
      jasmine.objectContaining({
        error: {
          status_code: 400,
          content: 'file_id is required.',
        },
      })
    )
  })

  it('should be rejected on connection error', async() => {
    const interceptor = axios.interceptors.response.use(() => Promise.reject('error'))
    const req = request({path: '/info/'})

    await expectAsync(req).toBeRejected()
    req.catch(error => expect(error).toBe('error'))

    axios.interceptors.response.eject(interceptor)
  })

  it('should be able to upload data', async() => {
    const file = factory.image('blackSquare')

    const response = await request({
      method: 'POST',
      path: '/base/',
      body: {
        UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
        file: file.data,
      },
    })

    expect(response.status).toBe(200)
    expect(response.data.file).toBeTruthy()
  })
})
