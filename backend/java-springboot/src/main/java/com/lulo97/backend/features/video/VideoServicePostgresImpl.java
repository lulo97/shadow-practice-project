package com.lulo97.backend.features.video;

import org.hibernate.service.spi.ServiceException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lulo97.backend.Result;
import com.lulo97.backend.Utils;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.PersistenceException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "prod", matchIfMissing = true)
public class VideoServicePostgresImpl implements VideoService {

    private final VideoRepository videoRepository;
    private final JdbcTemplate jdbcTemplate;

    public VideoServicePostgresImpl(VideoRepository videoRepository, JdbcTemplate jdbcTemplate) {
        System.out.println("VideoServicePostgresImpl run");
        this.videoRepository = videoRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Result<?> getList(Long user_id, String title, LocalDateTime fromDate,
            LocalDateTime toDate, String videoType) {

        try {

            List<String> conditions = new ArrayList<>();
            List<Object> params = new ArrayList<>();

            if (title != null && !title.isBlank()) {
                conditions.add("LOWER(v.title) LIKE LOWER(?)");

                params.add("%" + title + "%");
            }

            if (fromDate != null) {
                conditions.add("v.created_at >= ?");

                params.add(fromDate);
            }

            if (toDate != null) {
                conditions.add("v.created_at <= ?");

                params.add(toDate);
            }

            if ("SYSTEM_VIDEOS".equals(videoType)) {
                conditions.add("u.username = ?");
                params.add(Utils.ADMIN_USERNAME);
            } else {
                conditions.add("u.id = ?");

                params.add(user_id);
            }

            String whereClause = " WHERE " + String.join(" AND ", conditions);

            String sql = """
                    SELECT
                        v.id AS Id,
                        v.title AS Title,
                        v.youtube_id AS YoutubeId,
                        v.user_id AS UserId,
                        v.created_at AS CreatedAt,
                        v.description AS Description,

                        MAX(j.id) AS JobId,

                        CASE
                            WHEN COUNT(tl.id)=0
                                THEN 'NOT_STARTED'

                            WHEN COUNT(
                                DISTINCT CASE
                                    WHEN tl.skip = 0
                                    THEN r.transcript_line_id
                                END
                            ) = 0
                            THEN 'NOT_STARTED'

                            WHEN COUNT(DISTINCT tl.id)
                                >
                                (
                                    COUNT(DISTINCT r.transcript_line_id)
                                )
                            THEN 'UNFINISHED'

                            ELSE 'FINISHED'
                        END AS Status,


                        CAST(
                            (
                                COUNT(DISTINCT r.transcript_line_id)
                                * 100
                                /
                                NULLIF(COUNT(DISTINCT tl.id),0)
                            )
                        AS INTEGER) AS ProcessPercent,


                        MAX(r.created_at) AS LastPracticed


                    FROM video v

                    LEFT JOIN users u
                        ON v.user_id = u.id

                    LEFT JOIN job j
                        ON v.id = j.video_id

                    LEFT JOIN transcript_line tl
                        ON v.id = tl.video_id

                    LEFT JOIN record r
                        ON tl.id = r.transcript_line_id

                    """ + whereClause + """

                    GROUP BY
                        v.id,
                        v.title,
                        v.youtube_id,
                        v.user_id,
                        v.created_at,
                        v.description

                    ORDER BY v.created_at DESC
                    """;

            // Query query = entityManager.createNativeQuery(
            // sql);

            // for (int i = 0; i < params.size(); i++) {
            // query.setParameter(
            // i + 1,
            // params.get(i));
            // }

            // List<?> data = query.getResultList();
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, params.toArray());

            return Result.ok(result);

        } catch (Exception e) {
            // Only way is the throw here
            // Because it always throw "Transaction silently rolled back because it has been marked
            // as rollback-only" no matter what
            throw new ServiceException("Database error: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<Video> findById(Long id) {
        return this.videoRepository.findById(id);
    }

    @Override
    public Video save(Video video) {
        return this.videoRepository.save(video);
    }
}
