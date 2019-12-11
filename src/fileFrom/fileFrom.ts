import { UploadLifecycle } from "../lifecycle/UploadLifecycle"
import { FileUploadLifecycle } from "../lifecycle/FileUploadLifecycle"
import { FileFromObject } from "./FileFromObject"
import { FileFromUploaded } from "./FileFromUploaded"
import { FileFromUrl } from "./FileFromUrl"

/* Types */
import { FileData, SettingsInterface, UploadcareFileInterface } from "../types"
import { Url } from "../api/fromUrl"
import { Uuid } from "../api/types"
import {
  FileUploadLifecycleInterface,
  LifecycleHooksInterface,
  UploadInterface
} from "../lifecycle/types"
import { isFileData, isUrl, isUuid } from "./types"
import { Upload } from "../lifecycle/Upload"

/**
 * Uploads file from provided data.
 *
 * @param {FileData | Url | Uuid} data
 * @param {SettingsInterface} settings
 * @param {LifecycleHooksInterface<UploadcareFileInterface>} hooks
 * @throws TypeError
 * @returns {UploadInterface<UploadcareFileInterface>}
 */
export default function fileFrom(
  data: FileData | Url | Uuid,
  settings: SettingsInterface = {},
  hooks?: LifecycleHooksInterface<UploadcareFileInterface>
): UploadInterface<UploadcareFileInterface> {
  const lifecycle = new UploadLifecycle<UploadcareFileInterface>(hooks)
  const fileUploadLifecycle = new FileUploadLifecycle(lifecycle)

  if (isFileData(data)) {
    const fileHandler = new FileFromObject(data, settings, lifecycle)

    return new Upload<UploadcareFileInterface, FileUploadLifecycleInterface>(
      fileUploadLifecycle,
      fileHandler
    )
  }

  if (isUrl(data)) {
    const fileHandler = new FileFromUrl(data, settings)

    return new Upload<UploadcareFileInterface, FileUploadLifecycleInterface>(
      fileUploadLifecycle,
      fileHandler
    )
  }

  if (isUuid(data)) {
    const fileHandler = new FileFromUploaded(data, settings)

    return new Upload<UploadcareFileInterface, FileUploadLifecycleInterface>(
      fileUploadLifecycle,
      fileHandler
    )
  }

  throw new TypeError(`File uploading from "${data}" is not supported`)
}
