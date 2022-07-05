export type ClamavVirusScan = {
  data: {
    infected: boolean
    infectedWith: string
  }
  version: string
  datetimeCreated: string
  datetimeUpdated: string
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
  datetimeCreated: string
  datetimeUpdated: string
}

// TODO: should this object be camelized?
export type AppData = {
  ucClamavVirusScan?: ClamavVirusScan
  awsRekognitionDetectLabels?: AwsRekognitionDetectLabels
}
