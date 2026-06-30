package com.lulo97.backend.features.job;

import com.lulo97.backend.features.user.Users;
import com.lulo97.backend.features.video.VideoRepository;

public class JobService {
    private final JobRepository jobRepository;

    JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    Job save(Job job) {
        return this.jobRepository.save(job);
    }

}
