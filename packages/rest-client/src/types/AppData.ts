type ClamavVirusScan = {
  data: {
    infected: boolean
    infectedWith: string
  }
  version: string
  datetimeCreated: string
  datetimeUpdated: string
}

type AwsRekognitionDetectLabelParent = {
  Name: string
}

type AwsRekognitionDetectLabelInstance = {
  Confidence: number
  BoundingBox: {
    Height: number
    Left: number
    Top: number
    Width: number
  }
}

type AwsRekognitionDetectLabel = {
  Confidence: number
  Name: string
  Parents: AwsRekognitionDetectLabelParent[]
  Instances: AwsRekognitionDetectLabelInstance[]
}

type AwsRekognitionDetectLabels = {
  data: {
    LabelModelVersion: string
    Labels: AwsRekognitionDetectLabel[]
  }
  version: string
  datetimeCreated: string
  datetimeUpdated: string
}

export type AppData = {
  ucClamavVirusScan?: ClamavVirusScan
  awsRekognitionDetectLabels?: AwsRekognitionDetectLabels
}
