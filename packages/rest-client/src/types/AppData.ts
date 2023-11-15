import { AddonName } from './AddonName'

export type TechFieldsAppData = {
  version: string
  datetime_created: string
  datetime_updated: string
}

export type AddonData<T> = TechFieldsAppData & { data: T }

export type ClamavVirusScan = AddonData<{
  infected: boolean
  infected_with: string
}>

export type AwsRekognitionDetectLabelParent = {
  Name: string
}

export type AwsRekognitionDetectLabelInstance = {
  Confidence: number
  BoundingBox: {
    Height: number
    Left: number
    Top: number
    Width: number
  }
}

export type AwsLabel<T> = T & { Confidence: number; Name: string }

export type AwsRekognitionDetectLabel = AwsLabel<{
  Parents: AwsRekognitionDetectLabelParent[]
  Instances: AwsRekognitionDetectLabelInstance[]
}>

export type AwsRekognitionDetectLabels = AddonData<{
  LabelModelVersion: string
  Labels: AwsRekognitionDetectLabel[]
}>

export type AwsRekognitionDetectModerationLabel = AwsLabel<{
  ParentName: string
}>

export type AwsRekognitionDetectModerationLabels = AddonData<{
  ModerationModelVersion: string
  ModerationLabels: AwsRekognitionDetectModerationLabel[]
}>

export type RemoveBg = AddonData<{
  foreground_type: string
}>

export type AppData = {
  [AddonName.UC_CLAMAV_VIRUS_SCAN]?: ClamavVirusScan
  [AddonName.AWS_REKOGNITION_DETECT_LABELS]?: AwsRekognitionDetectLabels
  [AddonName.AWS_REKOGNITION_DETECT_MODERATION_LABELS]?: AwsRekognitionDetectModerationLabels
  [AddonName.REMOVE_BG]?: RemoveBg
}
