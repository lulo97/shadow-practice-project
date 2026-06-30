package com.lulo97.backend.features.job.jobstep;

/**
 * JobStepService
 */
public class JobStepService {
  private final JobStepRepository jobStepRepository;

    JobStepService(JobStepRepository jobStepRepository) {
        this.jobStepRepository = jobStepRepository;
    }

    public JobStep save(JobStep jobstep) {
        return this.jobStepRepository.save(jobstep);
    }

}
