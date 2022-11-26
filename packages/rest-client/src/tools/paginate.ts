import { Paginatable } from '../types/Paginatable'
import { PaginatedList } from '../types/PaginatedList'

function constructPageOptions<Options>(pageUrl: string, options: Options) {
  const url = new URL(pageUrl)
  const searchParams = Object.fromEntries(url.searchParams)
  const pageOptions: Options = {
    ...options,
    ...searchParams
  }
  return pageOptions
}

export class Paginator<Options, Settings, PageItem, PageExtra> {
  private _paginatable: Paginatable<Options, Settings, PageItem, PageExtra>
  private _options: Options
  private _settings: Settings
  private _page: PaginatedList<PageItem, PageExtra> | null = null

  constructor(
    paginatable: Paginatable<Options, Settings, PageItem, PageExtra>,
    options: Options,
    settings: Settings
  ) {
    this._paginatable = paginatable
    this._options = options
    this._settings = settings
  }

  updateOptions(options: Options) {
    this._options = {
      ...this._options,
      ...options
    }
    this._page = null
  }

  hasNextPage(): boolean {
    return !this._page || !!this._page.next
  }

  hasPrevPage(): boolean {
    return !!this._page && !!this._page.previous
  }

  getCurrentPage() {
    return this._page
  }

  async next() {
    if (!this._page) {
      this._page = await this._paginatable(this._options, this._settings)
      return this._page
    }
    if (!this._page.next) {
      return null
    }
    const pageOptions = constructPageOptions(this._page.next, this._options)
    this._page = await this._paginatable(pageOptions, this._settings)
    return this._page
  }

  async prev() {
    if (!this._page || !this._page.previous) {
      return null
    }
    const pageOptions = constructPageOptions(this._page.previous, this._options)
    this._page = await this._paginatable(pageOptions, this._settings)
    return this._page
  }

  generator() {
    return paginate(this._paginatable)(this._options, this._settings)
  }
}

export function paginate<Options, Settings, PageItem, PageExtra>(
  paginatable: Paginatable<Options, Settings, PageItem, PageExtra>
) {
  return async function* (options: Options, settings: Settings) {
    let page = await paginatable(options, settings)
    yield page

    while (page.next) {
      const pageOptions = constructPageOptions(page.next, options)
      page = await paginatable(pageOptions, settings)
      yield page
    }
  }
}
