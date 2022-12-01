import { jest } from '@jest/globals'
import { DOCUMENT_UUID, VIDEO_UUID } from '../../test/fixtures'
import { testSettings } from '../../test/helpers'
import { ConversionStatus } from '../types/ConversionStatus'
import { ConversionType } from '../types/ConversionType'
import { conversionJobPoller } from './conversionJobPoller'

jest.setTimeout(60 * 1000)

describe('conversionJobPoller', () => {
  it('should work with video conversion', async () => {
    const paths = [
      `${VIDEO_UUID}/video/-/invalid/`,
      `${VIDEO_UUID}/video/-/size/x20/`
    ]
    const promises = await conversionJobPoller(
      {
        type: ConversionType.VIDEO,
        paths,
        store: false
      },
      testSettings
    )

    expect(promises.length).toBe(2)
    await expect(promises[0]).resolves.toEqual({
      status: ConversionStatus.FAILED,
      error: 'CDN Path error: Cannot parse url part: invalid',
      path: paths[0],
      result: null
    })
    const finishedJob = await promises[1]
    // test types for `thumbnailsGroupUuid` presence
    expect(finishedJob.result?.thumbnailsGroupUuid).toBeString()
    expect(finishedJob).toEqual(
      expect.objectContaining({
        status: ConversionStatus.FINISHED,
        error: null,
        path: paths[1],
        result: expect.objectContaining({
          thumbnailsGroupUuid: expect.toBeString(),
          uuid: expect.toBeString()
        })
      })
    )
  })

  it('should work with document conversion', async () => {
    const paths = [
      `${DOCUMENT_UUID}/document/-/invalid/`,
      `${DOCUMENT_UUID}/document/-/format/pdf/`
    ]
    const promises = await conversionJobPoller(
      {
        type: ConversionType.DOCUMENT,
        paths,
        store: false
      },
      testSettings
    )

    expect(promises.length).toBe(2)
    await expect(promises[0]).resolves.toEqual({
      status: ConversionStatus.FAILED,
      error: 'CDN Path error: Cannot parse url part: invalid',
      path: paths[0],
      result: null
    })
    const finishedJob = await promises[1]
    expect(finishedJob).toEqual(
      expect.objectContaining({
        status: ConversionStatus.FINISHED,
        error: null,
        path: paths[1],
        result: expect.objectContaining({
          uuid: expect.toBeString()
        })
      })
    )
  })

  it('should accept onRun and onStatus callbacks', async () => {
    const path = `${DOCUMENT_UUID}/document/-/format/pdf/`

    const onRun = jest.fn()
    const onStatus = jest.fn()

    const promises = await conversionJobPoller(
      {
        type: ConversionType.DOCUMENT,
        onRun,
        onStatus,
        paths: [path],
        store: false
      },
      testSettings
    )

    expect(promises.length).toBe(1)
    await promises[0]

    expect(onRun.mock.calls.length).toBe(1)
    expect(onRun.mock.calls[0]).toEqual([
      expect.objectContaining({
        problems: {},
        result: [
          expect.objectContaining({
            originalSource: expect.toBeString(),
            token: expect.toBeNumber(),
            uuid: expect.toBeString()
          })
        ]
      })
    ])

    expect(onStatus.mock.calls.length).toBeGreaterThanOrEqual(1)
    expect(onStatus.mock.lastCall).toEqual([
      expect.objectContaining({
        error: null,
        path,
        status: ConversionStatus.FINISHED,
        result: expect.objectContaining({
          uuid: expect.toBeString()
        })
      })
    ])
  })
})
