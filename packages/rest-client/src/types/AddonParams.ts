import { AddonName } from './AddonName'

export type AddonUcClamavVirusScanParams = {
  purge_infected: boolean
}

export type AddonAwsRekognitionDetectLabelsParams = undefined

export type AddonRemoveBgParams = {
  crop?: boolean
  crop_margin?: string
  scale?: string
  add_shadow?: boolean
  type_level?: 'none' | '1' | '2' | 'latest'
  type?: 'auto' | 'person' | 'product' | 'car'
  semitransparency?: boolean
  channels?: 'rgba' | 'alpha'
  roi?: string
  position?: string
}

export type AddonParams = {
  [AddonName.UC_CLAMAV_VIRUS_SCAN]: AddonUcClamavVirusScanParams
  [AddonName.AWS_REKOGNITION_DETECT_LABELS]: AddonAwsRekognitionDetectLabelsParams
  [AddonName.REMOVE_BG]: AddonRemoveBgParams
}
