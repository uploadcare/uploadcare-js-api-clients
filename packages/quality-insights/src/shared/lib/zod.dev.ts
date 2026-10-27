import type { ZodSafeParseResult, ZodType } from 'zod'

export const safeParseAsync = async <TOutput, TInput>(
  schema: ZodType<TOutput, TInput>,
  data: unknown
): Promise<ZodSafeParseResult<TOutput>> => {
  return await schema.safeParseAsync(data)
}
