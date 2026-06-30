package com.lulo97.backend.features.job;

import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class JobService {
    private final JobRepository jobRepository;

    JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    Job save(Job job) {
        return this.jobRepository.save(job);
    }

    Optional<Job> findNewJob(JobStatus status, JobType type) {
        Optional<Job> job = this.jobRepository
                .findNewJob(status, type, PageRequest.of(0, 1))
                .stream()
                .findFirst();

        return job;
    }

    public Optional<Job> findById(Long job_id) {
        return this.jobRepository.findById(job_id);
    }

}
