package com.lulo97.backend;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.lulo97.backend.Utils.TranscriptLineFormat;
import com.lulo97.backend.features.transcriptline.TranscriptLine;
import com.lulo97.backend.features.transcriptline.TranscriptLineRepository;
import com.lulo97.backend.features.user.UserRepository;
import com.lulo97.backend.features.user.Users;
import com.lulo97.backend.features.video.Video;
import com.lulo97.backend.features.video.VideoRepository;
import com.lulo97.backend.features.videooperation.VideoOperation;

@Configuration
public class DataSeeder {

    private static String SYSTEM_VIDEOS_PATH = "C:\\Users\\ADMIN\\Desktop\\shadow-practice-project\\backend\\csharp-aspnet-webapi\\Assets\\system_videos";

    private static String TEST_USER_VIDEOS_PATH = "C:\\Users\\ADMIN\\Desktop\\shadow-practice-project\\backend\\csharp-aspnet-webapi\\Assets\\test_user_videos";

    private final UserRepository userRepository;
    private final VideoRepository videoRepository;
    private final VideoOperation videoOperation;
    private final TranscriptLineRepository transcriptLineRepository;

    public DataSeeder(UserRepository userRepository, VideoRepository videoRepository, VideoOperation videoOperation,
            TranscriptLineRepository transcriptLineRepository) {
        this.userRepository = userRepository;
        this.videoOperation = videoOperation;
        this.videoRepository = videoRepository;
        this.transcriptLineRepository = transcriptLineRepository;
    }

    @Bean
    CommandLineRunner seed() {
        return args -> {
            if (this.userRepository.count() == 0) {
                this.userRepository.save(new Users(Utils.ADMIN_USERNAME, "M90&Op2p|D<."));
                this.userRepository.save(new Users(Utils.TEST_USERNAME, "M90&Op2p|D<."));
                System.out.println("Add admin and alice");
            }

            //this.RunSeedVideo(true);
            this.RunSeedVideo(false);
        };
    }

    void RunSeedVideo(Boolean is_system

    ) throws Exception {
        List<Path> folders = Files.list(is_system ? Paths.get(SYSTEM_VIDEOS_PATH) : Paths.get(TEST_USER_VIDEOS_PATH))
                .filter(Files::isDirectory)
                .toList();

        var admin_user = this.userRepository.findByUsername(Utils.ADMIN_USERNAME).get();
        var test_user = this.userRepository.findByUsername(Utils.TEST_USERNAME).get();
        var current_user_id = is_system ? admin_user.getId() : test_user.getId();

        for (Path folder : folders) {
            var youtubeId = folder.getFileName().toString();
            ;

            Optional<Path> firstMp4 = Files.list(folder)
                    .filter(path -> path.toString().toLowerCase().endsWith(".mp4"))
                    .findFirst();

            byte[] videoBytes = Files.readAllBytes(firstMp4.get());

            Optional<Path> firstJpg = Files.list(folder)
                    .filter(path -> path.toString().toLowerCase().endsWith(".jpg"))
                    .findFirst();

            byte[] thumbnailBytes = Files.readAllBytes(firstJpg.get());

            Optional<Path> firstEnVtt = Files.list(folder)
                    .filter(path -> path.toString().toLowerCase().endsWith(".en.vtt"))
                    .findFirst();
            Optional<Path> firstViVtt = Files.list(folder)
                    .filter(path -> path.toString().toLowerCase().endsWith(".vi.vtt"))
                    .findFirst();

            String enVtt = Files.readString(firstEnVtt.get());
            String viVtt = Files.readString(firstViVtt.get());

            List<TranscriptLineFormat> enTranscriptLine = Utils.ParseTranscript(enVtt);
            List<TranscriptLineFormat> viTranscriptLine = Utils.ParseTranscript(viVtt);

            Optional<Path> firstMetadata = Files.list(folder)
                    .filter(path -> path.toString().toLowerCase().endsWith(".metadata.txt"))
                    .findFirst();

            String metadata = Files.readString(firstMetadata.get());
            String[] lines = metadata.split("\\R", 2);
            String title = lines.length > 0 ? lines[0].trim() : "Untitled";
            String description = lines.length > 1 ? lines[1].trim() : "";

            var video = this.videoRepository.save(new Video(current_user_id, title, description, youtubeId));

            var result_add_video = this.videoOperation.WriteVideo(video.getId(), this.videoRepository, videoBytes);

            if (!result_add_video.getSuccess()) {
                throw new Exception(result_add_video.getError());
            }

            var result_add_thumbnail = videoOperation.WriteThumbnail(video.getId(), this.videoRepository,
                    thumbnailBytes);

            if (!result_add_thumbnail.getSuccess()) {
                throw new Exception(result_add_thumbnail.getError());
            }

            var result_add_audio = videoOperation.WriteAudio(video.getId(), this.videoRepository, videoBytes);

            if (!result_add_audio.getSuccess()) {
                throw new Exception(result_add_audio.getError());
            }

            List<TranscriptLine> entities = new ArrayList<>();

            for (int i = 0; i < enTranscriptLine.size(); i++) {
                TranscriptLine entity = new TranscriptLine();

                entity.setVideoId(video.getId());
                entity.setLineIndex(i);
                entity.setStart(enTranscriptLine.get(i).Start);
                entity.setEnd(enTranscriptLine.get(i).End);
                entity.setText(enTranscriptLine.get(i).Text);
                entity.setViText(viTranscriptLine.get(i).Text);
                entity.setSkip(0);

                entities.add(entity);
            }

            this.transcriptLineRepository.saveAll(entities);

            break;
        }
    }
}