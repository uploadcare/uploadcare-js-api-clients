import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { storeValueToString } from '../../tools/storeValueToString'
import { ConversionOptions } from '../../types/ConversionOptions'
import { ConversionResponse } from '../../types/ConversionResponse'
import { ConversionResult } from '../../types/ConversionResult'
import { ConversionType } from '../../types/ConversionType'
import { ValueOf } from '../../types/ValueOf'
import { handleApiRequest } from '../handleApiRequest'

export async function convert<T extends ValueOf<typeof ConversionType>>(
  options: ConversionOptions<T>,
  userSettings: ApiRequestSettings
): Promise<ConversionResponse<ConversionResult[T]>> {
  const apiRequest = await makeApiRequest(
    {
      method: 'POST',
      path: `/convert/${options.type}/`,
      body: {
        paths: options.paths,
        store: storeValueToString(options.store)
      }
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
