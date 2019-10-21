import {LifecycleInterface, UploadInterface} from './types'

/**
 * Creates a proxy handler to track lifecycle callbacks.
 *
 * @param {LifecycleInterface<UploadcareFileInterface|UploadcareGroupInterface>} lifecycle
 */
export const createProxyHandler = <T>(lifecycle: LifecycleInterface<T>): ProxyHandler<UploadInterface<T>> => {
  const trackableProperties = [
    'onProgress',
    'onUploaded',
    'onReady',
    'onCancel',
  ]

  return {
    set: (target, propertyKey, newValue): boolean => {
      if (trackableProperties.includes(String(propertyKey))) {
        // update object property
        target[propertyKey] = newValue

        // and update uploadLifecycle property
        lifecycle[propertyKey] = newValue
        return true
      } else {
        return false
      }
    }
  }
}
