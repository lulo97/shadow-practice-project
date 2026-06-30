package com.lulo97.backend.features.job.ytdlp;

import java.util.List;
import com.lulo97.backend.Result;
import com.lulo97.backend.Utils.TranscriptLineFormat;

public interface YtdlpService {
  Result<String> GetTitle(String youtubeLink);
  Result<byte[]> GetThumbnail(String youtubeLink);
  Result<String> GetDescription(String youtubeLink);
  Result<byte[]> DownloadVideo(String youtubeLink);
  Result<List<TranscriptLineFormat>> FetchBuiltInTranscript(String youtubeLink);
  Result<byte[]> DownloadAudio(String youtubeLink);
}
