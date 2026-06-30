package com.lulo97.backend.features.job.jobstep;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobStepRepository extends JpaRepository<JobStep, Long> {

    @Query("""
            select js from JobStep js where js.jobId = :jobId
            """)
    List<JobStep> findByJobId(@Param("jobId") Long job_id);

}
