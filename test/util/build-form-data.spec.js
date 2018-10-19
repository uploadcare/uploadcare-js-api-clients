import * as factory from '../fixtureFactory'
import buildFormData from '../../src/util/build-form-data'

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
