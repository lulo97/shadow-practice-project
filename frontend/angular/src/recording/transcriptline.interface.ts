export interface TranscriptLine {
  id: number
  videoId: number
  text: string
  viText: any
  start: number
  end: number
  skip: number
  records: Record[]
}

export interface Record {
  id: number
  videoId: number
  userId: number
  score: number
  sttText: string
  sttProviderKey: string
  createdAt: string
}
