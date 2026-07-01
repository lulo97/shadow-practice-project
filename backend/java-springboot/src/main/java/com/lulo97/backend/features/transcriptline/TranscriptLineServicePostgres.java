package com.lulo97.backend.features.transcriptline;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;

@Service
@Transactional
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "prod")
public class TranscriptLineServicePostgres implements TranscriptLineService {

    private final TranscriptLineRepository transcriptLineRepository;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TranscriptLineServicePostgres(EntityManager entityManager,
            TranscriptLineRepository transcriptLineRepository) {
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
                        tl.end_time        AS end,
                        tl.skip       AS skip,
                        tl.line_index AS line_index,
                        COALESCE(
                            json_agg(
                                json_build_object(
                                    'id',             r.id,
                                    'sttText',        r.stt_text,
                                    'score',          r.score,
                                    'sttProviderKey', r.stt_provider_key,
                                    'createdAt',      EXTRACT(EPOCH FROM r.created_at) * 1000
                                )
                            ) FILTER (WHERE r.id IS NOT NULL),
                            '[]'
                        ) AS records
                    FROM transcript_line tl
                    LEFT JOIN record r ON r.transcript_line_id = tl.id
                    WHERE tl.video_id = :videoId
                    GROUP BY tl.id
                    ORDER BY tl.line_index
                """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).setParameter("videoId", videoId)
                .getResultList();

        return rows.stream().map(this::mapRow).toList();
    }

    private TranscriptLineDto mapRow(Object[] row) {
        Long id = ((Number) row[0]).longValue();
        Long videoId = ((Number) row[1]).longValue();
        String text = (String) row[2];
        String viText = (String) row[3];
        Double start = row[4] != null ? ((Number) row[4]).doubleValue() : null;
        Double end = row[5] != null ? ((Number) row[5]).doubleValue() : null;
        Boolean skip = row[6] != null && ((Number) row[6]).intValue() == 1;
        Integer line_index = row[7] != null ? ((Number) row[7]).intValue() : null;

        // Postgres native query returns jsonb/json columns as String (via jackson/hibernate type
        // mapping)
        // e.g.
        // [{"id":5599249372330489,"sttText":"-","score":0,"sttProviderKey":"WHISPER_CPP","createdAt":1782854624808}]
        String recordsJson = row[8] != null ? row[8].toString() : null;

        List<RecordDto> records = parseRecords(recordsJson);

        return new TranscriptLineDto(id, videoId, text, viText, start, end, skip, line_index,
                records);
    }

    private List<RecordDto> parseRecords(String json) {
        List<RecordDto> records = new ArrayList<>();

        if (json == null || json.isBlank()) {
            return records;
        }

        try {
            JsonNode root = objectMapper.readTree(json);

            if (!root.isArray()) {
                System.err.println("Error parseRecords: expected JSON array, got = " + json);
                return records;
            }

            for (JsonNode node : root) {
                if (node == null || node.isNull()) {
                    continue;
                }

                RecordDto dto = parseSingleRecord(node);
                if (dto != null) {
                    records.add(dto);
                }
            }
        } catch (Exception e) {
            System.err.println("Error parseRecords: input json = " + json);
            System.err.println(e);
        }

        return records;
    }

    private RecordDto parseSingleRecord(JsonNode node) {
        try {
            RecordDto dto = new RecordDto();

            if (node.hasNonNull("id")) {
                dto.setId(node.get("id").asLong());
            }

            if (node.hasNonNull("sttText")) {
                dto.setSttText(node.get("sttText").asText());
            }

            if (node.hasNonNull("score")) {
                dto.setScore(node.get("score").asDouble());
            }

            if (node.hasNonNull("sttProviderKey")) {
                dto.setSttProviderKey(node.get("sttProviderKey").asText());
            }

            if (node.hasNonNull("createdAt")) {
                long epochMillis = node.get("createdAt").asLong();
                dto.setCreatedAt(LocalDateTime.ofInstant(Instant.ofEpochMilli(epochMillis),
                        ZoneId.systemDefault()));
            }

            return dto;
        } catch (Exception e) {
            System.err.println("Error parseSingleRecord: node = " + node);
            System.err.println(e);
            return null;
        }
    }

    @Override
    public Optional<TranscriptLine> findById(Long transcriptLineId) {
        return this.transcriptLineRepository.findById(transcriptLineId);
    }

    @Override
    public TranscriptLine save(TranscriptLine transcript) {
        return this.transcriptLineRepository.save(transcript);
    }

    @Override
    public List<TranscriptLine> saveAll(List<TranscriptLine> updatedLines) {
        return this.transcriptLineRepository.saveAll(updatedLines);
    }

    @Override
    public List<TranscriptLine> findByVideoId(Long videoId) {
        String jpql = """
                    SELECT tl
                    FROM TranscriptLine tl
                    WHERE tl.videoId = :videoId
                    ORDER BY tl.lineIndex
                """;

        return entityManager.createQuery(jpql, TranscriptLine.class)
                .setParameter("videoId", videoId).getResultList();
    }
}
