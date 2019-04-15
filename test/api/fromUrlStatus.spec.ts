import fromUrlStatus, {StatusEnum} from '../../src/api/fromUrlStatus'
import * as factory from '../_fixtureFactory'
import {Environment, getSettingsForTesting} from '../_helpers'

const environment = Environment.Staging

describe('API - from url status', () => {
  it('should return info about file uploaded from url', async() => {
    const token = factory.token('valid')
    const settings = getSettingsForTesting({}, environment)
    const data = await fromUrlStatus(token, settings)

    expect(data.status).toBeTruthy()

    if (data.status === StatusEnum.Progress || data.status === StatusEnum.Success) {
      expect(data.done).toBeTruthy()
      expect(data.total).toBeTruthy()
    } else if (data.status === StatusEnum.Error) {
      expect(data.error).toBeTruthy()
    }
  })

  it('should be rejected with empty token', (done) => {
    const token = factory.token('empty')
    const settings = getSettingsForTesting({}, environment)

    fromUrlStatus(token, settings)
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})
