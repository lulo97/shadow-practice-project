package com.lulo97.backend.features.transcriptline;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import com.fasterxml.jackson.core.type.TypeReference;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;

@Service
@Transactional
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "test", matchIfMissing = true)
public class TranscriptLineServiceSqlite implements TranscriptLineService {

    private final TranscriptLineRepository transcriptLineRepository;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper = new ObjectMapper();;

    public TranscriptLineServiceSqlite(EntityManager entityManager, TranscriptLineRepository transcriptLineRepository) {
        this.entityManager = entityManager;
        this.transcriptLineRepository = transcriptLineRepository;
    }

    @Override
    public List<TranscriptLineDto> findByVideoIdWithRecords(Long videoId) {
        String sql = """
                    SELECT
                        tl.id         AS id,
                        tl.video_id   AS videoId,
                        tl.text       AS text,
                        tl.vi_text    AS viText,
                        tl.start      AS start,
                        tl.end        AS end,
                        tl.skip       AS skip,
                        json_group_array(
                            CASE WHEN r.id IS NULL THEN NULL ELSE
                                json_object(
                                    'id',             r.id,
                                    'sttText',        r.stt_text,
                                    'score',          r.score,
                                    'sttProviderKey', r.stt_provider_key,
                                    'createdAt',      r.created_at
                                )
                            END
                        ) AS records
                    FROM transcript_line tl
                    LEFT JOIN record r ON r.transcript_line_id = tl.id
                    WHERE tl.video_id = :videoId
                    GROUP BY tl.id
                """;

        List<Object[]> rows = entityManager
                .createNativeQuery(sql)
                .setParameter("videoId", videoId)
                .getResultList();

        return rows.stream()
                .map(this::mapRow)
                .toList();
    }

    private TranscriptLineDto mapRow(Object[] row) {
        Long id = ((Number) row[0]).longValue();
        Long videoId = ((Number) row[1]).longValue();
        String text = (String) row[2];
        String viText = (String) row[3];
        Double start = row[4] != null ? ((Number) row[4]).doubleValue() : null;
        Double end = row[5] != null ? ((Number) row[5]).doubleValue() : null;
        Boolean skip = row[6] != null && ((Number) row[6]).intValue() == 1;
        String recordsJson = (String) row[7];

        List<RecordDto> records = parseRecords(recordsJson);

        return new TranscriptLineDto(id, videoId, text, viText, start, end, skip, records);
    }

    private List<RecordDto> parseRecords(String json) {
        try {
            List<RecordDto> records = objectMapper.readValue(json, new TypeReference<>() {
            });
            // filter out nulls from LEFT JOIN with no matching records
            return records.stream()
                    .filter(Objects::nonNull)
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    @Override
    public Optional<TranscriptLine> findById(Long transcriptLineId) {
        return this.transcriptLineRepository.findById(transcriptLineId);
    }
}