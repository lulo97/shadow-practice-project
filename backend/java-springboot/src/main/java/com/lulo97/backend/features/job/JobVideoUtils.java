package com.lulo97.backend.features.job;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import com.lulo97.backend.Utils.TranscriptLineFormat;
import com.lulo97.backend.features.job.jobstep.JobStep;
import com.lulo97.backend.features.job.jobstep.JobStepService;
import com.lulo97.backend.features.job.jobstep.JobStepStatus;
import com.lulo97.backend.features.job.ytdlp.YtdlpService;
import com.lulo97.backend.features.sse.SseService;
import com.lulo97.backend.features.transcriptline.TranscriptLine;
import com.lulo97.backend.features.transcriptline.TranscriptLineRepository;
import com.lulo97.backend.features.video.Video;
import com.lulo97.backend.features.video.VideoRepository;
import com.lulo97.backend.features.video.VideoService;
import com.lulo97.backend.features.videooperation.VideoOperation;

@Component
public class JobVideoUtils {

        private final VideoService videoService;
        private final YtdlpService ytDlpService;
        private final VideoOperation videoOperation;
        private final VideoRepository videoRepository;
        private final JobStepService jobStepService;
        private final JobService jobService;
        private final TranscriptLineRepository transcriptLineRepository;
        private final SseService sseService;

        JobVideoUtils(VideoService videoService, YtdlpService ytDlpService,
                        VideoOperation videoOperation, VideoRepository videoRepository,
                        JobStepService jobStepService,
                        TranscriptLineRepository transcriptLineRepository, JobService jobService,
                        SseService sseService) {
                this.videoService = videoService;
                this.ytDlpService = ytDlpService;
                this.videoOperation = videoOperation;
                this.videoRepository = videoRepository;
                this.jobStepService = jobStepService;
                this.transcriptLineRepository = transcriptLineRepository;
                this.jobService = jobService;
                this.sseService = sseService;
        }

        JobStep addJobStep(Long jobId, String jobStepName) {
                System.out.printf("Starting job step: %s%n", jobStepName);

                var job_step = new JobStep();
                job_step.setJobId(jobId);
                job_step.setStepName(jobStepName);
                job_step.setStatus(JobStepStatus.RUNNING);

                System.out.printf("Job step created: %s%n", jobStepName);

                return this.jobStepService.save(job_step);
        }

        JobStep failJobStep(JobStep jobStep, String error) {
                System.out.printf("Job step FAILED: %s - %s%n", jobStep.getStepName(), error);

                jobStep.setStatus(JobStepStatus.FAILED);
                jobStep.setErrorMsg(error);

                return this.jobStepService.save(jobStep);
        }

        JobStep doneJobStep(JobStep jobStep, String note) {
                System.out.printf("Job step DONE: %s%n", jobStep.getStepName());

                jobStep.setStatus(JobStepStatus.DONE);
                jobStep.setEndedAt(LocalDateTime.now());
                jobStep.setNote(note);

                return this.jobStepService.save(jobStep);
        }

        Video getNewestVideo(Long video_id) {
                return this.videoRepository.findById(video_id).get();
        }

        void Run(Job job) throws Exception {

                System.out.printf("Starting job processing id=%s%n", job.getId());

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

                System.out.printf("Loading video id=%s%n", videoId);

                String youtubeId = this.videoRepository.findById(videoId).get().getYoutube_id();

                System.out.printf("Youtube id=%s%n", youtubeId);

                var jobId = job.getId();

                var link = "https://youtube.com/watch?v=%s".formatted(youtubeId);

                System.out.printf("Processing url=%s%n", link);

                // IMPORTANT: get new video every time save to avoid stale data
                Video current_video;

                // If one step fail then stop all, mark current job is failed (not accept invalid
                // data)

                // 1. Title
                System.out.println("Step 1: Fetching title");

                var title_job_step = addJobStep(jobId, "Fetching video title");
                var title_result = this.ytDlpService.GetTitle(link);

                if (!title_result.getSuccess()) {
                        failJobStep(title_job_step, title_result.getError());
                        throw new Exception(title_result.getError());
                }

                System.out.printf("Title received: %s%n", title_result.getData());

                current_video = this.getNewestVideo(videoId);
                current_video.setTitle(title_result.getData());
                this.videoRepository.save(current_video);

                doneJobStep(title_job_step, "");

                // 2. Thumbnail
                System.out.println("Step 2: Fetching thumbnail");

                var thumbnail_job_step = addJobStep(jobId, "Fetching video thumbnail");

                var thumbnail_result = this.ytDlpService.GetThumbnail(link);

                if (!thumbnail_result.getSuccess()) {
                        failJobStep(thumbnail_job_step, thumbnail_result.getError());
                        throw new Exception(thumbnail_result.getError());
                }

                var result_write_thumbnail = this.videoOperation.WriteThumbnail(videoId,
                                this.videoRepository, thumbnail_result.getData());

                if (!result_write_thumbnail.getSuccess()) {
                        failJobStep(thumbnail_job_step, result_write_thumbnail.getError());
                        throw new Exception(result_write_thumbnail.getError());
                }

                // var thumbnail_saved = this.videoOperation.ReadThumbnail(getNewestVideo(videoId));

                // if (!thumbnail_saved.getSuccess() || thumbnail_saved.getData() == null
                // || thumbnail_saved.getData().length == 0) {
                // var error = thumbnail_saved.getError() == null ? thumbnail_saved.getError()
                // : "Something wrong here";
                // failJobStep(thumbnail_job_step, error);
                // throw new Exception(error);
                // }

                System.out.println("Thumbnail saved, size = " + thumbnail_result.getData().length);

                doneJobStep(thumbnail_job_step, "");

                // 3. Description
                System.out.println("Step 3: Fetching description");

                var description_job_step = addJobStep(jobId, "Fetching video description");


                var description_result = this.ytDlpService.GetDescription(link);

                if (!description_result.getSuccess()) {
                        failJobStep(description_job_step, title_result.getError());
                        throw new Exception(description_result.getError());
                }

                current_video = getNewestVideo(videoId);
                current_video.setDescription(description_result.getData());
                this.videoRepository.save(current_video);

                System.out.println("Description received");

                doneJobStep(description_job_step, "");

                // 4. Video mp4
                System.out.println("Step 4: Downloading mp4");

                var videp_mp4_job_step = addJobStep(jobId, "Fetching video data mp4");

                var video_mp4_result = this.ytDlpService.DownloadVideo(link);

                if (!video_mp4_result.getSuccess()) {
                        failJobStep(videp_mp4_job_step, video_mp4_result.getError());

                        throw new Exception(video_mp4_result.getError());
                }

                var result_write_video = this.videoOperation.WriteVideo(videoId,
                                this.videoRepository, video_mp4_result.getData());

                if (!result_write_video.getSuccess()) {
                        failJobStep(thumbnail_job_step, result_write_video.getError());
                        throw new Exception(result_write_video.getError());
                }

                System.out.println("Video saved, size = " + video_mp4_result.getData().length);

                doneJobStep(videp_mp4_job_step, "");

                // 5. Transcript
                System.out.println("Step 5: Fetching transcript");

                var transcript_job_step = addJobStep(jobId, "Fetching english transcript");
                var transcript_result = this.ytDlpService.FetchBuiltInTranscript(link);

                List<TranscriptLineFormat> strText = null;

                if (!transcript_result.getSuccess()) {
                        failJobStep(transcript_job_step, transcript_result.getError());
                        throw new Exception(transcript_result.getError());
                }

                if (transcript_result.getData() != null && transcript_result.getData().size() > 0) {
                        strText = transcript_result.getData();

                        System.out.println("English subtitle exists, size = "
                                        + transcript_result.getData().size());

                        doneJobStep(transcript_job_step, "English subtitle exist");
                } else {

                        System.out.println("English subtitle missing");

                        doneJobStep(transcript_job_step,
                                        "English subtitle not exist, download audio and do ASR next");
                }

                // 5.1
                if (transcript_result.getData() == null
                                || transcript_result.getData().size() == 0) {
                        throw new Exception("Coding more here");
                }

                // 6 Parse transcript lines

                System.out.println("Step 6: Saving transcript lines");

                var parse_transcript_job_step = addJobStep(jobId, "Store english transcript");

                List<TranscriptLine> entities = new ArrayList<>();

                for (int i = 0; i < strText.size(); i++) {

                        TranscriptLine entity = new TranscriptLine();

                        entity.setVideoId(videoId);
                        entity.setLineIndex(i);
                        entity.setStart(strText.get(i).Start);
                        entity.setEnd(strText.get(i).End);
                        entity.setText(strText.get(i).Text);
                        entity.setSkip(0);

                        entities.add(entity);
                }

                this.transcriptLineRepository.saveAll(entities);

                System.out.printf("Saved %s transcript lines%n", entities.size());

                doneJobStep(parse_transcript_job_step, "");

                System.out.printf("Job finished successfully id=%s%n", job.getId());

                this.sseService.sendToUser("{ \"message\" : \"RESET_HOMEPAGE\" }", job.getUserId());
        }
}
