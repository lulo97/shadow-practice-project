import { Component, ElementRef, inject, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { TranscriptLine } from "./transcriptline.interface";
import { AudioService } from "../services/audio.service";
import { Video } from "../homepage/video.interface";
import { TranslationComponent } from "./translation.component";
import { ModalService } from "../components/modal/modal.service";

interface Sentence {
  id: number;
  en: string;
  vi: string;
  heard: string;
  score: number;
  startTime: string;
  endTime: string;
  recorded: boolean;
}

@Component({
  selector: "app-video-transcription",
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Top Nav -->
    <div style="display:flex; border-bottom:1px solid #ccc;">
      <button (click)="goBack()" style="flex:1; padding:8px;">Back</button>
      <div style="flex:2; padding:8px; text-align:center;">
        {{ videoMetadata ? videoMetadata.title : "Title" }}
      </div>
      <button (click)="openTranslationModal()" style="flex:1; padding:8px;">
        + Translation
      </button>
      <button (click)="openSettings()" style="flex:1; padding:8px;">
        Setting
      </button>
    </div>

    <!-- Main layout -->
    <div style="display:flex; gap:8px; padding:8px;">
      <!-- Left: Video + Controls -->
      <div style="flex:1; border:1px solid #ccc; padding:8px;">
        <!-- Video player placeholder -->
        <video #videoPlayer class="youtube-video" controls>
          <source [src]="videoMp4Data" type="video/mp4" />
        </video>

        <!-- Playback controls -->
        <div
          style="border:1px solid #ccc; padding:8px; margin-bottom:4px; display:flex; gap:16px;"
        >
          <button (click)="togglePlay()">
            <span>
              {{ this.isPlaying ? "■ Stop" : "▶ Play" }}
            </span>
          </button>
          <button (click)="startRecord()">
            <span>
              {{
                (audioService.isRecording$ | async)
                  ? "■ Stop Recording"
                  : "● Record"
              }}
            </span>
          </button>

          <button (click)="skipTranscriptLine()">
            <ng-container
              *ngIf="activeTranscriptLine?.skip == 1; else skipLabel"
            >
              <span>⏭ Undo skip</span>
            </ng-container>
            <ng-template #skipLabel>
              <span>⏭ Skip</span>
            </ng-template>
          </button>
        </div>

        <!-- My recording -->
        <div
          style="border:1px solid #ccc; padding:8px; display:flex; justify-content:space-between; align-items:center;"
        >
          <span>Mine record</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span
              *ngIf="mineWavAudio"
              style="font-family:monospace; font-size:13px;"
            >
              {{ formatTime(currentAudioTime) }}/{{
                formatTime(totalAudioDuration)
              }}
            </span>
            <audio
              *ngIf="mineWavAudio"
              #mineAudioPlayer
              [src]="mineWavAudio"
              (timeupdate)="onAudioTimeUpdate()"
              (loadedmetadata)="onAudioLoaded()"
              (ended)="onAudioEnded()"
            ></audio>
            <button (click)="playMyRecord()">
              {{ isAudioPlaying ? "⏸" : "▶" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Transcription list -->
      <div style="flex:1; border:1px solid #ccc; padding:8px;">
        <!-- Header -->
        <div
          style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"
        >
          <strong>Transcription</strong>
          <button (click)="jumpToUnrecorded()">Jump to unrecorded</button>
        </div>

        <!-- Sentence list -->
        <div
          *ngFor="let transcript_line of transcriptLines"
          (click)="selectTranscriptLine(transcript_line)"
          style="border:1px solid #ccc; padding:8px; margin-bottom:6px; cursor:pointer;"
          [style.background]="
            activeTranscriptLine?.id === transcript_line.id ? '#eef' : 'white'
          "
        >
          <div style="display:flex; justify-content:space-between;">
            <div>
              <div><strong>EN:</strong> {{ transcript_line.text }}</div>
              <div style="color:#c06000;">
                <strong>VI:</strong> {{ transcript_line.viText }}
              </div>
              <div
                *ngIf="
                  transcript_line.records[0] &&
                  transcript_line.records[0].sttText
                "
                style="color:#0070c0;"
              >
                Heard: {{ transcript_line.records[0].sttText }} (Score
                {{ transcript_line.records[0].score }})
              </div>
              <div *ngIf="!transcript_line.records[0]" style="color:#aaa;">
                Not recorded yet
              </div>
            </div>
            <div style="white-space:nowrap; padding-left:12px;">
              {{ transcript_line.start }} - {{ transcript_line.end }}
            </div>
          </div>
        </div>

        <div style="text-align:center; color:#999;">...</div>
      </div>
    </div>
  `,
  styles: `
    .youtube-video {
      width: 100%;
      aspect-ratio: 16 / 9;
      background-color: black; /* Optional: for letterboxing */
    }
  `,
})
export class RecordingComponent {
  isAudioPlaying = false;
  currentAudioTime = 0;
  totalAudioDuration = 0;

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  onAudioTimeUpdate(): void {
    this.currentAudioTime =
      this.mineAudioPlayer?.nativeElement.currentTime ?? 0;
  }

  onAudioLoaded(): void {
    this.totalAudioDuration = this.mineAudioPlayer?.nativeElement.duration ?? 0;
  }

  onAudioEnded(): void {
    this.isAudioPlaying = false;
    this.currentAudioTime = 0;
  }

  audioService = inject(AudioService);

  isPlaying = false;
  showTranslation = true;

  activeTranscriptLineId: number = 0;

  get activeTranscriptLine(): TranscriptLine | null {
    if (this.activeTranscriptLineId === null || !this.transcriptLines)
      return null;
    return (
      this.transcriptLines.find((s) => s.id === this.activeTranscriptLineId) ??
      null
    );
  }

  videoId = window.location.pathname.split("/").filter(Boolean).pop();

  videoMp4Data = null;

  videoMetadata: Video | null = null;

  @ViewChild("videoPlayer") videoPlayer!: ElementRef<HTMLVideoElement>;

  mineWavAudio = null;

  @ViewChild("mineAudioPlayer") mineAudioPlayer!: ElementRef<HTMLAudioElement>;

  transcriptLines: TranscriptLine[] | null = null;

  async fetchVideoMetadata() {
    const result = await callApi({
      endpoint: `api/videos/metadata/${this.videoId}`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.videoMetadata = result.data;
  }

  async fetchTranscriptLines() {
    const result = await callApi({
      endpoint: `api/transcripts/${this.videoId}`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.transcriptLines = result.data;
  }

  async fetchVideoMp4Data() {
    const result = await callApi({
      endpoint: `api/videos/video_data/${this.videoId}`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.videoMp4Data = result.data.url;

    setTimeout(() => {
      if (this.videoPlayer) {
        this.videoPlayer.nativeElement.load();
      }
    });
  }

  ngOnInit(): void {
    this.fetchVideoMp4Data();
    this.fetchTranscriptLines();
    this.fetchVideoMetadata();
  }

  goBack(): void {
    console.log("Navigate back");
    window.location.href = "/";
  }

  openSettings(): void {
    console.log("Open settings");
  }
  private _pauseAtEndTime: () => void = () => {};
  togglePlay(): void {
    const video = this.videoPlayer.nativeElement;

    if (this.isPlaying) {
      // Stop and snap back to start of current line
      video.pause();
      if (this.activeTranscriptLine) {
        video.currentTime = this.activeTranscriptLine.start;
      }
      this.isPlaying = false;
      video.removeEventListener("timeupdate", this._pauseAtEndTime);
      return;
    }

    if (!this.activeTranscriptLine) {
      messageUtils("Select record");
      return;
    }

    video.currentTime = this.activeTranscriptLine.start;
    video.play();
    this.isPlaying = true;

    this._pauseAtEndTime = () => {
      if (video.currentTime >= this.activeTranscriptLine!!.end) {
        video.pause();
        video.currentTime = this.activeTranscriptLine!!.start; // snap back
        this.isPlaying = false;
        video.removeEventListener("timeupdate", this._pauseAtEndTime);
      }
    };

    video.addEventListener("timeupdate", this._pauseAtEndTime);
  }
  async startRecord(): Promise<void> {
    if (!this.activeTranscriptLine?.id) {
      messageUtils("activeTranscriptLine null");
      return;
    }

    let blob;
    if (this.audioService.isRecordingValue) {
      blob = await this.audioService.stopRecording();
      console.log(blob);
    } else {
      await this.audioService.startRecording();
      return;
    }

    if (!blob) {
      messageUtils("Blob null");
      return;
    }

    const formData = new FormData();
    formData.append("file", blob, "audio.wav");
    formData.append("videoId", this.videoId!!);
    formData.append(
      "transcriptLineId",
      this.activeTranscriptLine?.id.toString()!!,
    );

    const result = await callApi({
      endpoint: "api/records",
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.fetchTranscriptLines();
  }

  async skipTranscriptLine(): Promise<void> {
    if (!this.activeTranscriptLine) return;
    if (!this.transcriptLines) return;
    const idx = this.transcriptLines.findIndex(
      (s) => s.id === this.activeTranscriptLine!.id,
    );
    if (idx < this.transcriptLines.length - 1) {
      const result = await callApi({
        endpoint: `api/transcripts/skip/${this.activeTranscriptLine.id}`,
        method: "POST",
      });

      if (!result.success) {
        messageUtils(result.message);
        return;
      }

      this.fetchTranscriptLines();
    }
  }

  async playMyRecord(): Promise<void> {
    if (!this.activeTranscriptLine) {
      messageUtils("activeTranscriptLine null");
      return;
    }

    const record_id = this.activeTranscriptLine.records[0].id;

    if (!record_id) {
      messageUtils("record_id null");
      return;
    }

    const result = await callApi({
      endpoint: `api/records/file/${record_id}/`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.mineWavAudio = result.data.url;

    // Reset state for new audio
    this.isAudioPlaying = false;
    this.currentAudioTime = 0;
    this.totalAudioDuration = 0;

    // Wait for *ngIf to render the element, then play
    setTimeout(() => {
      const audio = this.mineAudioPlayer?.nativeElement;
      if (!audio) return;
      if (this.isAudioPlaying) {
        audio.pause();
        this.isAudioPlaying = false;
      } else {
        audio.play();
        this.isAudioPlaying = true;
      }
    });
  }

  deleteMyRecord(): void {
    console.log("Deleted my recording");
  }

  selectTranscriptLine(transcript_line: TranscriptLine): void {
    this.activeTranscriptLineId = transcript_line.id;
    this.mineWavAudio = null;
    // Reset state for new audio
    this.isAudioPlaying = false;
    this.currentAudioTime = 0;
    this.totalAudioDuration = 0;
    console.log("Selected sentence", transcript_line.id);
  }

  jumpToUnrecorded(): void {
    if (!this.transcriptLines) return;
    const unrecorded = this.transcriptLines.find((s) => s.records.length == 0);
    if (unrecorded) {
      this.activeTranscriptLineId = unrecorded.id;
      console.log("Jumped to unrecorded sentence", unrecorded.id);
    }
  }

  private modal = inject(ModalService);
  openTranslationModal() {
    this.modal.open({
      title: "Translation Modal",
      component: TranslationComponent,
      size: "lg",
      onClose: () => {},
      data: {
        transcriptLines: this.transcriptLines,
        videoId: this.videoId,
        fetchTranscriptLines: this.fetchTranscriptLines,
      },
    });
  }
}
