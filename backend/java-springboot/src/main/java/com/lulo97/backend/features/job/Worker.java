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

    @Scheduled(fixedRate = 3000)
    public void work() throws Exception {
        System.out.println("Worker tick:" + LocalDateTime.now());
        var new_job = this.jobService.findNewJob(JobStatus.QUEUED, JobType.VIDEO_INGEST);
        if (new_job.isEmpty())
            return;

        System.out.println("New job found:" + new_job.get().getId());
        try {
            jobVideoUtils.Run(new_job.get());
            new_job.get().setStatus(JobStatus.DONE);
        } catch (Exception e) {
            new_job.get().setStatus(JobStatus.FAILED);
            throw new Exception(e);
        }
    }
}
