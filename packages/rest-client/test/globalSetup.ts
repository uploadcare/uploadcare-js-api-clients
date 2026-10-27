import '../../../env.js'
import { resetGroups, resetMetadata, resetWebhooks } from './helpers'

export default async function setup() {
  try {
    await Promise.all([resetGroups(), resetMetadata(), resetWebhooks()])
  } catch (err) {
    console.error('Failed to reset rest-client test project state', err)
  }
}
