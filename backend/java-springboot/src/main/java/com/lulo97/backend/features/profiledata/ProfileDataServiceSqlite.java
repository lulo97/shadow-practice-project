package com.lulo97.backend.features.profiledata;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Qualifier("sqlite")
public class ProfileDataServiceSqlite implements ProfileDataService {

    private final JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter[] FORMATTERS =
            new DateTimeFormatter[] {DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")};

    public ProfileDataServiceSqlite(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public UserProfileDataDto getUserActivity(Long userId) {
        UserStatsDto stats = getStats(userId);
        List<VideoActivityDto> videoActivities = getVideoActivities(userId);
        applyLineCounts(videoActivities);
        List<RecentRecordDto> recentRecords = getRecentRecords(userId);

        UserProfileDataDto result = new UserProfileDataDto();
        result.setUserId(userId);
        result.setStats(stats);
        result.setVideos(videoActivities);
        result.setRecentRecords(recentRecords);
        return result;
    }

    private UserStatsDto getStats(Long userId) {
        String sql =
                """
                        SELECT
                            (SELECT COUNT(*) FROM jobs WHERE user_id = ?) AS total_jobs_run,
                            (SELECT COUNT(*) FROM jobs WHERE user_id = ? AND status = 'Done') AS completed_jobs,
                            (SELECT COUNT(*) FROM jobs WHERE user_id = ? AND status = 'Failed') AS failed_jobs,
                            (SELECT COUNT(*) FROM records WHERE user_id = ?) AS total_recordings_made,
                            (SELECT COALESCE(AVG(score), 0) FROM records WHERE user_id = ?) AS average_score,
                            (SELECT COUNT(DISTINCT video_id) FROM records WHERE user_id = ?) AS total_videos_learned
                        """;

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            UserStatsDto s = new UserStatsDto();
            s.setTotalJobsRun(rs.getInt("total_jobs_run"));
            s.setCompletedJobs(rs.getInt("completed_jobs"));
            s.setFailedJobs(rs.getInt("failed_jobs"));
            s.setTotalRecordingsMade(rs.getInt("total_recordings_made"));
            s.setAverageScore((int) rs.getDouble("average_score"));
            s.setTotalVideosLearned(rs.getInt("total_videos_learned"));
            return s;
        }, userId, userId, userId, userId, userId, userId);
    }

    private List<VideoActivityDto> getVideoActivities(Long userId) {
        String sql = """
                SELECT
                    v.id AS video_id,
                    v.youtube_id,
                    v.title,
                    MAX(r.score) AS best_score,
                    AVG(r.score) AS average_score,
                    COUNT(DISTINCT r.transcript_line_id) AS practiced_lines,
                    MAX(r.created_at) AS last_practiced_at
                FROM videos v
                JOIN records r ON v.id = r.video_id
                WHERE r.user_id = ?
                GROUP BY v.id, v.youtube_id, v.title
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            VideoActivityDto v = new VideoActivityDto();
            v.setVideoId(rs.getInt("video_id"));
            v.setYoutubeId(rs.getString("youtube_id"));
            v.setTitle(rs.getString("title"));
            v.setBestScore(rs.getInt("best_score"));
            v.setAverageScore((int) rs.getDouble("average_score"));
            v.setPracticedLines(rs.getInt("practiced_lines"));
            v.setLastPracticedAt(parseDateTime(rs.getString("last_practiced_at")));
            return v;
        }, userId);
    }

    private void applyLineCounts(List<VideoActivityDto> videoActivities) {
        if (videoActivities.isEmpty())
            return;

        List<Integer> videoIds =
                videoActivities.stream().map(VideoActivityDto::getVideoId).toList();

        String placeholders = String.join(",", Collections.nCopies(videoIds.size(), "?"));
        String sql = """
                SELECT video_id, COUNT(*) AS line_count
                FROM transcript_lines
                WHERE video_id IN (%s)
                GROUP BY video_id
                """.formatted(placeholders);

        Map<Integer, Integer> lineCounts = new HashMap<>();
        jdbcTemplate.query(sql, rs -> {
            lineCounts.put(rs.getInt("video_id"), rs.getInt("line_count"));
        }, videoIds.toArray());

        for (VideoActivityDto va : videoActivities) {
            va.setTotalLines(lineCounts.getOrDefault(va.getVideoId(), 0));
        }
    }

    private List<RecentRecordDto> getRecentRecords(Long userId) {
        String sql = """
                SELECT
                    r.id AS record_id,
                    v.title AS video_title,
                    tl.text AS transcript_text,
                    tl.vi_text,
                    r.score,
                    r.stt_text,
                    r.created_at
                FROM records r
                JOIN transcript_lines tl ON r.transcript_line_id = tl.id
                JOIN videos v ON r.video_id = v.id
                WHERE r.user_id = ?
                ORDER BY r.created_at DESC
                LIMIT 20
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            RecentRecordDto r = new RecentRecordDto();
            r.setRecordId(rs.getInt("record_id"));
            r.setVideoTitle(rs.getString("video_title"));
            r.setTranscriptText(rs.getString("transcript_text"));
            r.setViText(rs.getString("vi_text"));
            r.setScore(rs.getInt("score"));
            r.setSttText(rs.getString("stt_text"));
            r.setCreatedAt(parseDateTime(rs.getString("created_at")));
            return r;
        }, userId);
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank())
            return null;
        for (DateTimeFormatter fmt : FORMATTERS) {
            try {
                return LocalDateTime.parse(value, fmt);
            } catch (Exception ignored) {
                // try next formatter
            }
        }
        return null;
    }
}
