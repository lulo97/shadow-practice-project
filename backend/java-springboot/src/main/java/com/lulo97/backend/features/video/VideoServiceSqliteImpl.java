package com.lulo97.backend.features.video;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lulo97.backend.Result;
import com.lulo97.backend.Utils;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "sqlite", matchIfMissing = true)
public class VideoServiceSqliteImpl implements VideoService {

    private final EntityManager entityManager;

    public VideoServiceSqliteImpl(EntityManager entityManager) {
        System.out.println("VideoServiceSqliteImpl run");
        this.entityManager = entityManager;
    }

    @Override
    public Result<?> getList(
            Long user_id,
            String title,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String videoType) {

        List<String> conditions = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        int index = 1;

        if (title != null && !title.isBlank()) {
            conditions.add("LOWER(v.title) LIKE LOWER(:" + index + ")");
            params.add("%" + title + "%");
            index++;
        }

        if (fromDate != null) {
            conditions.add("v.created_at >= :" + index);
            params.add(fromDate);
            index++;
        }

        if (toDate != null) {
            conditions.add("v.created_at <= :" + index);
            params.add(toDate);
            index++;
        }

        if ("SYSTEM_VIDEOS".equals(videoType)) {
            conditions.add("u.username = :" + index);
            params.add(
                    Utils.ADMIN_USERNAME);
        } else {
            conditions.add("u.id = :" + index);

            params.add(
                    user_id);
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
                        WHEN COUNT(tl.id) = 0 THEN 'NOT_STARTED'

                        WHEN COUNT(
                            DISTINCT CASE
                                WHEN tl.skip = 0
                                THEN r.transcript_line_id
                            END
                        ) = 0
                        AND COUNT(
                            DISTINCT CASE
                                WHEN tl.skip = 1
                                THEN tl.id
                            END
                        ) = 0
                        THEN 'NOT_STARTED'

                        WHEN (
                            COUNT(
                                DISTINCT CASE
                                    WHEN tl.skip = 0
                                    THEN r.transcript_line_id
                                END
                            )
                            +
                            COUNT(
                                DISTINCT CASE
                                    WHEN tl.skip = 1
                                    THEN tl.id
                                END
                            )
                        )
                        < COUNT(DISTINCT tl.id)

                        THEN 'UNFINISHED'

                        ELSE 'FINISHED'

                    END AS Status,


                    CAST(
                        (
                            COUNT(
                                DISTINCT CASE
                                    WHEN tl.skip = 0
                                    THEN r.transcript_line_id
                                END
                            )
                            +
                            COUNT(
                                DISTINCT CASE
                                    WHEN tl.skip = 1
                                    THEN tl.id
                                END
                            )
                        ) * 100
                        /
                        NULLIF(COUNT(DISTINCT tl.id),0)

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

                """
                + whereClause +
                """

                        GROUP BY
                            v.id,
                            v.title,
                            v.youtube_id,
                            v.user_id,
                            v.created_at,
                            v.description

                        ORDER BY v.created_at DESC
                        """;

        Query query = entityManager.createNativeQuery(
                sql,
                "VideoHomepageDtoMapping");

        for (int i = 0; i < params.size(); i++) {
            query.setParameter(
                    i + 1,
                    params.get(i));
        }

        List<?> result = query.getResultList();

        return Result.ok(result);
    }
}