export interface Video {
  id: number
  title: string
  youtubeId: string
  userId: number
  createdAt: string
  description: string,
  thumbnail?: string,
  jobId?: number,
  status?: string,
  processPercent?: number,
  lastPracticed?: string,
}