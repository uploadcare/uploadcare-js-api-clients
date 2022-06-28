import { resetGroups, resetMetadata } from './helpers'

async function main() {
  await resetGroups()
  await resetMetadata()
}

main()
