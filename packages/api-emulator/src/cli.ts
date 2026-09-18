import { createEmulatorServer } from './listen.js'

const port = Number(process.env.PORT ?? 3000)
const { origin } = await createEmulatorServer({ port })
if (!process.argv.includes('--silent'))
  console.log(`Uploadcare API emulator listening on ${origin}`)
