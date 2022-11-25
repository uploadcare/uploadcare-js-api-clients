import { listOfFiles } from '../api/file/listOfFiles'
import { paginate, Paginator } from './paginate'
import { testSettings } from '../../test/helpers'
import { expect, jest } from '@jest/globals'

jest.setTimeout(30000)

describe('paginate', () => {
  it('should iterate over all the pages', async () => {
    const paginatedListOfFiles = paginate(listOfFiles)
    expect.hasAssertions()
    for await (const page of paginatedListOfFiles({}, testSettings)) {
      expect(page.results).toBeTruthy()
      expect(page.results.length).toBeGreaterThan(0)
    }
  })
})

describe('Paginator', () => {
  describe('next()', () => {
    it('should return first page on initial next() call', async () => {
      const paginator = new Paginator(listOfFiles, {}, testSettings)
      const page = (await paginator.next()) as Awaited<
        ReturnType<typeof listOfFiles>
      >
      expect(page).toBeTruthy()
      expect(page.results).toBeTruthy()
      expect(page.results.length).toBeGreaterThan(0)
    })

    it('should return next page', async () => {
      const paginator = new Paginator(listOfFiles, {}, testSettings)
      const firstPage = (await paginator.next()) as Awaited<
        ReturnType<typeof listOfFiles>
      >
      const secondPage = (await paginator.next()) as Awaited<
        ReturnType<typeof listOfFiles>
      >

      expect(firstPage).toBeTruthy()
      expect(firstPage.results).toBeTruthy()
      expect(firstPage.results.length).toBeGreaterThan(0)

      expect(secondPage).toBeTruthy()
      expect(secondPage.results).toBeTruthy()
      expect(secondPage.results.length).toBeGreaterThan(0)

      expect(firstPage).not.toEqual(secondPage)
    })
  })

  describe('prev()', () => {
    it('should return prev page', async () => {
      const paginator = new Paginator(listOfFiles, {}, testSettings)
      const firstPage = (await paginator.next()) as Awaited<
        ReturnType<typeof listOfFiles>
      >
      await paginator.next()
      const prevPage = (await paginator.prev()) as Awaited<
        ReturnType<typeof listOfFiles>
      >

      expect(prevPage).toBeTruthy()
      expect(prevPage.results).toBeTruthy()
      expect(prevPage.results.length).toBeGreaterThan(0)

      expect(firstPage).toEqual(prevPage)
    })

    it('should return null if there is no prev page', async () => {
      const paginator = new Paginator(listOfFiles, {}, testSettings)
      await paginator.next()
      await paginator.next()
      await paginator.prev()
      expect(paginator.prev()).resolves.toEqual(null)
    })
  })

  describe('hasPrevPage()', () => {
    it('should return false right after construction', async () => {
      const paginator = new Paginator(listOfFiles, {}, testSettings)
      expect(paginator.hasPrevPage()).toBeFalsy()
    })

    it('should return true if prev page is available', async () => {
      const paginator = new Paginator(listOfFiles, {}, testSettings)
      await paginator.next()
      await paginator.next()
      expect(paginator.hasPrevPage()).toBeTruthy()
    })
  })

  describe('hasNextPage()', () => {
    it('should return true right after construction', async () => {
      const paginator = new Paginator(listOfFiles, {}, testSettings)
      expect(paginator.hasNextPage()).toBeTruthy()
    })

    it('should return false on the last page', async () => {
      const paginator = new Paginator(
        listOfFiles,
        { stored: true },
        testSettings
      )
      while (await paginator.next()) {
        // noop
      }
      expect(paginator.hasNextPage()).toBeFalsy()
    })
  })

  describe('getCurrentPage()', () => {
    it('should return null right after construction', async () => {
      const paginator = new Paginator(listOfFiles, {}, testSettings)
      expect(paginator.getCurrentPage()).toBe(null)
    })

    it('should return current page', async () => {
      const paginator = new Paginator(listOfFiles, {}, testSettings)
      const firstPage = (await paginator.next()) as Awaited<
        ReturnType<typeof listOfFiles>
      >
      expect(paginator.getCurrentPage()).toEqual(firstPage)
      const secondPage = (await paginator.next()) as Awaited<
        ReturnType<typeof listOfFiles>
      >
      expect(paginator.getCurrentPage()).toEqual(secondPage)
    })
  })

  describe('generator()', () => {
    it('should return generator', async () => {
      const paginator = new Paginator(listOfFiles, {}, testSettings)
      const generator = paginator.generator()
      const result = await generator.next()
      const page = result.value as Awaited<ReturnType<typeof listOfFiles>>
      expect(page.results).toBeTruthy()
      expect(page.results.length).toBeGreaterThan(0)
    })
  })

  describe('updateOptions()', () => {
    it('should update options', async () => {
      const paginator = new Paginator(
        listOfFiles,
        { stored: false, removed: true },
        testSettings
      )
      const firstPage = (await paginator.next()) as Awaited<
        ReturnType<typeof listOfFiles>
      >
      expect(firstPage.results[0].datetimeRemoved).toBeTruthy()
      expect(firstPage.results[0].datetimeStored).toBeFalsy()

      paginator.updateOptions({ stored: true, removed: false })
      const secondPage = (await paginator.next()) as Awaited<
        ReturnType<typeof listOfFiles>
      >
      expect(secondPage.results[0].datetimeRemoved).toBeFalsy()
      expect(secondPage.results[0].datetimeStored).toBeTruthy()
    })
  })
})
