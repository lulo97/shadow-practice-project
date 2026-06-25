export interface TranscriptLine {
  id: number
  videoId: number
  text: string
  viText: any
  start: number
  end: number
  records: Record[]
}

export interface Record {
  id: number
  videoId: number
  userId: number
  transcriptLineId: number
  filePath: string
  blobData: any
  score: number
  durationSeconds: number
  sttText: string
  sttProviderKey: string
  createdAt: string
}
