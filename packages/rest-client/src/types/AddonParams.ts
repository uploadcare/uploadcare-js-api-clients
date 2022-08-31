import { AddonName } from './AddonName'

export type AddonUcClamavVirusScanParams = {
  purgeInfected: boolean
}

export type AddonAwsRekognitionDetectLabelsParams = undefined

export type AddonRemoveBgParams = {
  crop?: boolean
  cropMargin?: string
  scale?: string
  addShadow?: boolean
  typeLevel?: 'none' | '1' | '2' | 'latest'
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
