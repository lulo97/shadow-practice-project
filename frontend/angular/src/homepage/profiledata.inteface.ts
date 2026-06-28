export interface UserProfileData {
  userId: number;
  stats: UserStats;
  videos: VideoActivity[];
  recentRecords: RecentRecord[];
}

export interface UserStats {
  totalVideosLearned: number;
  totalRecordingsMade: number;
  averageScore: number;
  totalJobsRun: number;
  completedJobs: number;
  failedJobs: number;
}

export interface VideoActivity {
  videoId: number;
  youtubeId: string;
  title: string;
  totalLines: number;
  practicedLines: number;
  bestScore: number;
  averageScore: number;
  lastPracticedAt: string | null;
}

export interface RecentRecord {
  recordId: number;
  videoTitle: string;
  transcriptText: string;
  viText: string | null;
  score: number;
  sttText: string | null;
  createdAt: string;
}
