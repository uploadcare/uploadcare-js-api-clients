import { AddonName } from './AddonName'

export type TechFieldsAppData = {
  version: string
  datetime_created: string
  datetime_updated: string
}

export type ClamavVirusScan = {
  data: {
    infected: boolean
    infected_with: string
  }
} & TechFieldsAppData

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
} & TechFieldsAppData

export type AwsRekognitionDetectModerationLabel = Pick<
  AwsRekognitionDetectLabel,
  'Confidence' | 'Name'
> & { ParentName: string }

export type AwsRekognitionDetectModerationLabels = {
  data: {
    ModerationModelVersion: string
    ModerationLabels: AwsRekognitionDetectModerationLabel[]
  }
} & TechFieldsAppData

export type RemoveBg = {
  data: {
    foreground_type: string
  }
} & TechFieldsAppData

export type AppData = {
  [AddonName.UC_CLAMAV_VIRUS_SCAN]?: ClamavVirusScan
  [AddonName.AWS_REKOGNITION_DETECT_LABELS]?: AwsRekognitionDetectLabels
  [AddonName.AWS_REKOGNITION_DETECT_MODERATION_LABELS]: AwsRekognitionDetectModerationLabels
  [AddonName.REMOVE_BG]?: RemoveBg
}
