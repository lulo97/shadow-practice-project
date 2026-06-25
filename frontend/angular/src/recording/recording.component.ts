import { Component, ElementRef, inject, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { TranscriptLine } from "./transcriptline.interface";
import { AudioService } from "../services/audio.service";

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
        {{ 123333 }}
      </div>
      <button (click)="toggleTranslation()" style="flex:1; padding:8px;">
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
          <button (click)="togglePlay()">▶ Play</button>
          <button (click)="startRecord()">
            <ng-container
              *ngIf="audioService.isRecording$ | async; else notRecording"
            >
              <span class="stop-icon">■</span> Stop Recording
            </ng-container>
            <ng-template #notRecording>
              <span class="record-icon">●</span> Record
            </ng-template>
          </button>
          <button (click)="skipSentence()">⏭ Skip</button>
        </div>

        <!-- My recording -->
        <div
          style="border:1px solid #ccc; padding:8px; display:flex; justify-content:space-between; align-items:center;"
        >
          <span>Mine record</span>
          <div>
            <button (click)="playMyRecord()" [disabled]="!hasMyRecord">
              ▶
            </button>
            <button
              (click)="deleteMyRecord()"
              [disabled]="!hasMyRecord"
              style="margin-left:8px;"
            >
              ✕
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
                *ngIf="transcript_line.records[0].sttText"
                style="color:#0070c0;"
              >
                Heard: {{ transcript_line.records[0].sttText }} (Score
                {{ transcript_line.records[0].score }})
              </div>
              <div
                *ngIf="!transcript_line.records[0].sttText"
                style="color:#aaa;"
              >
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
  audioService = inject(AudioService);

  isPlaying = false;
  hasMyRecord = false;
  showTranslation = true;

  activeTranscriptLine: TranscriptLine | null = null;

  videoId = window.location.pathname.split("/").filter(Boolean).pop();

  videoMp4Data = null;

  @ViewChild("videoPlayer") videoPlayer!: ElementRef<HTMLVideoElement>;

  transcriptLines: TranscriptLine[] | null = null;

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
  }

  goBack(): void {
    console.log("Navigate back");
  }

  toggleTranslation(): void {
    this.showTranslation = !this.showTranslation;
  }

  openSettings(): void {
    console.log("Open settings");
  }

  togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    console.log(this.isPlaying ? "Playing video" : "Paused video");

    if (!this.activeTranscriptLine) {
      messageUtils("Select record");
      return;
    }

    // Access the video element
    const video = this.videoPlayer.nativeElement;

    // Jump to the start time
    video.currentTime = this.activeTranscriptLine.start;

    // Play the video
    video.play();

    // Set up a listener to pause when it reaches the end time
    const pauseAtEndTime = () => {
      if (video.currentTime >= this.activeTranscriptLine!!.end) {
        video.pause();
        this.isPlaying = false;
        // Remove the event listener so it doesn't keep triggering
        video.removeEventListener("timeupdate", pauseAtEndTime);
      }
    };

    video.addEventListener("timeupdate", pauseAtEndTime);
  }

  async startRecord(): Promise<void> {
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

    const result_stt = await callApi({
      endpoint: "api/stt",
      method: "POST",
      body: formData,
    });

    if (!result_stt.success) {
      messageUtils(result_stt.message);
      return;
    }

    const result_record = await callApi({
      endpoint: "api/records",
      method: "POST",
      body: {
        videoId: this.videoId,
        transcriptId: this.activeTranscriptLine?.id,
        sttText: result_stt.data.sttText,
      },
    });

    if (!result_record.success) {
      messageUtils(result_record.message);
      return;
    }
  }

  skipSentence(): void {
    if (!this.activeTranscriptLine) return;
    if (!this.transcriptLines) return;
    const idx = this.transcriptLines.findIndex(
      (s) => s.id === this.activeTranscriptLine!.id,
    );
    if (idx < this.transcriptLines.length - 1) {
      this.activeTranscriptLine = this.transcriptLines[idx + 1];
    }
  }

  playMyRecord(): void {
    console.log("Playing my recording");
  }

  deleteMyRecord(): void {
    this.hasMyRecord = false;
    console.log("Deleted my recording");
  }

  selectTranscriptLine(transcript_line: TranscriptLine): void {
    this.activeTranscriptLine = transcript_line;
    this.hasMyRecord = !!transcript_line.records[0].sttText;
    console.log("Selected sentence", transcript_line.id);
  }

  jumpToUnrecorded(): void {
    if (!this.transcriptLines) return;
    const unrecorded = this.transcriptLines.find((s) => s.records.length == 0);
    if (unrecorded) {
      this.selectTranscriptLine(unrecorded);
      console.log("Jumped to unrecorded sentence", unrecorded.id);
    }
  }
}
