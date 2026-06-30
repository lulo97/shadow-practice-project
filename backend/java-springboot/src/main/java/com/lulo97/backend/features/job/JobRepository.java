package com.lulo97.backend.features.job;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface JobRepository extends JpaRepository<Job, Long> {
    @Query("""
        select j
        from Job j
        where j.status = :status
          and j.type = :type
        order by j.createdAt desc
    """)
    List<Job> findNewJob(
            @Param("status") JobStatus status,
            @Param("type") JobType type,
            PageRequest pageable
    );
}
