import '../../../env.js'
import { resetGroups, resetMetadata, resetWebhooks } from './helpers'

function reset() {
  return Promise.all([resetGroups(), resetMetadata(), resetWebhooks()])
}

try {
  await reset()
} catch (err) {
  console.error('Failed to reset rest-client test project state', err)
}
