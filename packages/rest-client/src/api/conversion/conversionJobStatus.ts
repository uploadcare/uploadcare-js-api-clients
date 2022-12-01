import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { ConversionStatusOptions } from '../../types/ConversionStatusOptions'
import { ConversionStatusResponse } from '../../types/ConversionStatusResponse'
import { ConversionStatusResult } from '../../types/ConversionStatusResult'
import { ConversionType } from '../../types/ConversionType'
import { ValueOf } from '../../types/ValueOf'
import { handleApiRequest } from '../handleApiRequest'

export async function conversionJobStatus<
  T extends ValueOf<typeof ConversionType>
>(
  options: ConversionStatusOptions<T>,
  userSettings: ApiRequestSettings
): Promise<ConversionStatusResponse<ConversionStatusResult[T]>> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/convert/${options.type}/status/${options.token}/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
