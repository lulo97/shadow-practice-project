package com.lulo97.backend.features.job;

import java.time.LocalDateTime;

import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
public class Worker {

    private final JobService jobService;
    private final JobVideoUtils jobVideoUtils;

    public Worker(JobService jobService, JobVideoUtils jobVideoUtils) {
        this.jobService = jobService;
        this.jobVideoUtils = jobVideoUtils;
    }

    Job getNewestJob(Long job_id) {
        return this.jobService.findById(job_id).get();
    }

    @Scheduled(fixedRate = 3000)
    public void work() throws Exception {
        System.out.println("Worker tick:" + LocalDateTime.now());
        var new_job = this.jobService.findNewJob(JobStatus.QUEUED, JobType.VIDEO_INGEST);
        if (new_job.isEmpty())
            return;

        System.out.println("New job found:" + new_job.get().getId());
        try {
            jobVideoUtils.Run(new_job.get());
            var current_job = getNewestJob(new_job.get().getId());
            current_job.setStatus(JobStatus.DONE);
            this.jobService.save(current_job);
        } catch (Exception e) {
            var current_job = getNewestJob(new_job.get().getId());
            current_job.setStatus(JobStatus.FAILED);
            this.jobService.save(current_job);
            throw new Exception(e);
        }
    }
}
