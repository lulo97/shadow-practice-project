export interface Job {
  id: number
  userId: number
  videoId: number
  status: string
  type: string
  createdAt: string
}

export interface JobStep {
  id: number
  jobId: number
  stepName: string
  status: string
  note?: string
  errorMsg: any
  startedAt: string
  endedAt: string
}
