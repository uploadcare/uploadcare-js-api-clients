import { SafeParseReturnType, ZodSchema, ZodTypeDef } from 'zod'

export const safeParseAsync = async <TOutput, TInput>(
  schema: ZodSchema<TOutput, ZodTypeDef, TInput> | undefined,
  data: unknown
): Promise<SafeParseReturnType<TInput, TOutput>> => {
  if (import.meta.env.MODE === 'development' && schema) {
    return await schema.safeParseAsync(data)
  }

  return { success: true, data: data as TOutput }
}

export const safeParse = <TOutput, TInput>(
  schema: ZodSchema<TOutput, ZodTypeDef, TInput> | undefined,
  data: unknown
): SafeParseReturnType<TInput, TOutput> => {
  if (import.meta.env.MODE === 'development' && schema) {
    return schema.safeParse(data)
  }

  return { success: true, data: data as TOutput }
}
