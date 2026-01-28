import type { SafeParseReturnType, ZodSchema, ZodTypeDef } from 'zod'

export const safeParseAsync = async <TOutput, TInput>(
  schema: ZodSchema<TOutput, ZodTypeDef, TInput>,
  data: unknown
): Promise<SafeParseReturnType<TInput, TOutput>> => {
  return await schema.safeParseAsync(data)
}
