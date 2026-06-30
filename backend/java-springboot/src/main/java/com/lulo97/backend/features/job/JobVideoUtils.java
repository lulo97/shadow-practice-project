package com.lulo97.backend.features.job;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.lulo97.backend.Utils.TranscriptLineFormat;
import com.lulo97.backend.features.job.jobstep.JobStep;
import com.lulo97.backend.features.job.jobstep.JobStepService;
import com.lulo97.backend.features.job.jobstep.JobStepStatus;
import com.lulo97.backend.features.job.ytdlp.YtdlpService;
import com.lulo97.backend.features.transcriptline.TranscriptLine;
import com.lulo97.backend.features.transcriptline.TranscriptLineRepository;
import com.lulo97.backend.features.video.VideoRepository;
import com.lulo97.backend.features.video.VideoService;
import com.lulo97.backend.features.videooperation.VideoOperation;

public class JobVideoUtils {

        private final VideoService videoService;
        private final YtdlpService ytDlpService;
        private final VideoOperation videoOperation;
        private final VideoRepository videoRepository;
        private final JobStepService jobStepService;
        private final JobService jobService;
        private final TranscriptLineRepository transcriptLineRepository;

        JobVideoUtils(VideoService videoService, YtdlpService ytDlpService,
                        VideoOperation videoOperation, VideoRepository videoRepository,
                        JobStepService jobStepService,
                        TranscriptLineRepository transcriptLineRepository, JobService jobService) {
                this.videoService = videoService;
                this.ytDlpService = ytDlpService;
                this.videoOperation = videoOperation;
                this.videoRepository = videoRepository;
                this.jobStepService = jobStepService;
                this.transcriptLineRepository = transcriptLineRepository;
                this.jobService = jobService;
        }

        JobStep addJobStep(Long jobId, String jobStepName) {
                var job_step = new JobStep();
                job_step.setJobId(jobId);
                job_step.setStepName(jobStepName);
                job_step.setStatus(JobStepStatus.RUNNING);
                return this.jobStepService.save(job_step);
        }

        JobStep failJobStep(JobStep jobStep, String error) {
                jobStep.setStatus(JobStepStatus.FAILED);
                jobStep.setErrorMsg(error);
                return this.jobStepService.save(jobStep);
        }

        JobStep doneJobStep(JobStep jobStep, String note) {
                jobStep.setStatus(JobStepStatus.DONE);
                jobStep.setEndedAt(LocalDateTime.now());
                jobStep.setNote(note);
                return this.jobStepService.save(jobStep);
        }

        void Run(Job job) throws Exception {



                if (job.getStatus() == JobStatus.QUEUED) {
                        // Update job to running for this thread so other thread pick this job will
                        // not re-run
                        job.setStatus(JobStatus.RUNNING);
                        this.jobService.save(job);
                        System.out.printf("Thread %s is doing job id = %s%n",
                                        Thread.currentThread().getName(), job.getId());
                } else {
                        System.out.println("Job already processing");
                        return;
                }

                Long videoId = job.getVideoId();

                String youtubeId = this.videoRepository.findById(videoId).get().getYoutube_id();

                var jobId = job.getId();

                var video_result = this.videoService.findById(videoId);

                if (video_result.isEmpty()) {
                        throw new Exception("Something not wrong");
                }

                var video = video_result.get();

                var link = "https://youtube.com/watch?v=%s".formatted(youtubeId);

                // If one step fail then stop all, mark current job is failed (not accept invalid
                // data)

                // 1. Title
                var title_job_step = addJobStep(jobId, "Fetching video title");
                var title_result = this.ytDlpService.GetTitle(link);

                if (!title_result.getSuccess()) {
                        failJobStep(title_job_step, title_result.getError());
                        throw new Exception(title_result.getError());
                }

                video.setTitle(title_result.getData());
                doneJobStep(title_job_step, "");

                // 2. Thumbnail
                var thumbnail_job_step = addJobStep(jobId, "Fetching video thumbnail");

                var thumbnail_result = this.ytDlpService.GetThumbnail(link);

                if (!thumbnail_result.getSuccess()) {
                        failJobStep(thumbnail_job_step, thumbnail_result.getError());
                        throw new Exception(thumbnail_result.getError());
                }

                this.videoOperation.WriteThumbnail(video.getId(), this.videoRepository,
                                thumbnail_result.getData());
                doneJobStep(thumbnail_job_step, "");

                // 3. Description
                var description_job_step = addJobStep(jobId, "Fetching video description");


                var description_result = this.ytDlpService.GetDescription(link);

                if (!description_result.getSuccess()) {
                        failJobStep(description_job_step, title_result.getError());
                        throw new Exception(description_result.getError());
                }

                video.setDescription(description_result.getData());
                doneJobStep(description_job_step, "");

                // 4. Video mp4
                var videp_mp4_job_step = addJobStep(jobId, "Fetching video data mp4");

                var video_mp4_result = this.ytDlpService.DownloadVideo(link);

                if (!video_mp4_result.getSuccess()) {
                        failJobStep(videp_mp4_job_step, video_mp4_result.getError());

                        throw new Exception(video_mp4_result.getError());
                }

                this.videoOperation.WriteVideo(video.getId(), this.videoRepository,
                                video_mp4_result.getData());
                doneJobStep(videp_mp4_job_step, "");

                // 5. Transcript
                var transcript_job_step = addJobStep(jobId, "Fetching english transcript");
                var transcript_result = this.ytDlpService.FetchBuiltInTranscript(link);

                List<TranscriptLineFormat> strText = null;

                if (!transcript_result.getSuccess()) {
                        failJobStep(transcript_job_step, transcript_result.getError());
                        throw new Exception(transcript_result.getError());
                }

                if (transcript_result.getData() != null && transcript_result.getData().size() > 0) {
                        strText = transcript_result.getData();
                        doneJobStep(videp_mp4_job_step, "English subtitle exist");
                } else {
                        doneJobStep(videp_mp4_job_step,
                                        "English subtitle not exist, download audio and do ASR next");
                }

                // 5.1
                if (transcript_result.getData() == null
                                || transcript_result.getData().size() == 0) {
                        throw new Exception("Coding more here");
                }

                // 6 Parse transcript lines
                var parse_transcript_job_step = addJobStep(jobId, "Store english transcript");
                List<TranscriptLine> entities = new ArrayList<>();

                for (int i = 0; i < strText.size(); i++) {
                        TranscriptLine entity = new TranscriptLine();

                        entity.setVideoId(video.getId());
                        entity.setLineIndex(i);
                        entity.setStart(strText.get(i).Start);
                        entity.setEnd(strText.get(i).End);
                        entity.setText(strText.get(i).Text);
                        entity.setSkip(0);

                        entities.add(entity);
                }

                this.transcriptLineRepository.saveAll(entities);

                doneJobStep(parse_transcript_job_step, "");
        }
}
