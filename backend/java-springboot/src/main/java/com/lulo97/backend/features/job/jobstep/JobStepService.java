package com.lulo97.backend.features.job.jobstep;

import java.util.List;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

@Service
@Transactional
public class JobStepService {
    private final JobStepRepository jobStepRepository;

    JobStepService(JobStepRepository jobStepRepository) {
        this.jobStepRepository = jobStepRepository;
    }

    public JobStep save(JobStep jobstep) {
        return this.jobStepRepository.save(jobstep);
    }

    public List<JobStep> findByJobId(Long job_id) {
        return this.jobStepRepository.findByJobId(job_id);
    }

}
