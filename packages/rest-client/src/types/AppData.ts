import { AddonName } from './AddonName'

export type ClamavVirusScan = {
  data: {
    infected: boolean
    infected_with: string
  }
  version: string
  datetime_created: string
  datetime_updated: string
}

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

export type AwsRekognitionDetectLabel = {
  Confidence: number
  Name: string
  Parents: AwsRekognitionDetectLabelParent[]
  Instances: AwsRekognitionDetectLabelInstance[]
}

export type AwsRekognitionDetectLabels = {
  data: {
    LabelModelVersion: string
    Labels: AwsRekognitionDetectLabel[]
  }
  version: string
  datetime_created: string
  datetime_updated: string
}

export type RemoveBg = {
  data: {
    foreground_type: string
  }
  version: string
  datetime_created: string
  datetime_updated: string
}

export type AppData = {
  [AddonName.UC_CLAMAV_VIRUS_SCAN]?: ClamavVirusScan
  [AddonName.AWS_REKOGNITION_DETECT_LABELS]?: AwsRekognitionDetectLabels
  [AddonName.REMOVE_BG]?: RemoveBg
}
