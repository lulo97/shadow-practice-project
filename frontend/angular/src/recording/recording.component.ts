import { Component, ElementRef, inject, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { TranscriptLine } from "./transcriptline.interface";
import { AudioService } from "../services/audio.service";
import { Video } from "../homepage/video.interface";
import { TranslationComponent } from "./translation.component";
import { ModalService } from "../components/modal/modal.service";
import { SettingComponent } from "./setting.component";
import { RecordHistoryComponent } from "./recordhistory.component";
import { OnDestroy, HostListener } from "@angular/core";

@Component({
  selector: "app-video-transcription",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="h-screen bg-gray-50 text-gray-800 antialiased overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex-none flex items-center justify-between border-b bg-white px-3 py-1.5 shadow-sm"
      >
        <button
          (click)="goBack()"
          class="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 shadow-sm"
        >
          ← Back
        </button>

        <div class="flex items-center gap-1.5">
          <button
            (click)="openTranslationModal()"
            class="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 shadow-sm"
          >
            ＋ Translation
          </button>
          <button
            (click)="openSettingModal()"
            class="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 shadow-sm"
          >
            Settings ⚙
          </button>
        </div>
      </div>

      <!-- Body -->
      <div #resizeContainer class="flex-1 flex overflow-hidden min-h-0">
        <!-- Left panel -->
        <div
          [style.width]="leftWidthPercent + '%'"
          class="flex-none overflow-y-auto flex flex-col gap-1.5 p-1.5 min-w-0"
        >
          <div
            class="rounded-xl bg-white p-1.5 shadow-sm border border-gray-200 h-full flex flex-col justify-center"
          >
            <div class="font-bold text-gray-900">
              {{ videoMetadata ? videoMetadata.title : "Title" }}
            </div>
            <div>
              {{ videoMetadata ? videoMetadata.description : "Description" }}
            </div>

            <!-- Video -->
            <div
              class="relative overflow-hidden rounded-lg bg-black aspect-video shadow-inner"
            >
              <video #videoPlayer controls class="h-full w-full object-contain">
                <source [src]="videoMp4Data" type="video/mp4" />
              </video>
            </div>

            <!-- Controls -->
            <div class="mt-1.5 grid grid-cols-1 gap-1">
              <button
                (click)="togglePlay()"
                class="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
              >
                {{ this.isPlaying ? "■ Stop" : "▶ Play" }}
              </button>

              <button
                (click)="startRecord()"
                class="flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-sm font-medium transition active:scale-[0.98]"
                [ngClass]="
                  (audioService.isRecording$ | async)
                    ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                "
              >
                {{
                  (audioService.isRecording$ | async)
                    ? "■ Stop Recording"
                    : "● Record"
                }}
              </button>

              <button
                (click)="skipTranscriptLine()"
                class="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <ng-container
                  *ngIf="activeTranscriptLine?.skip == 1; else skipLabel"
                  >⏭ Undo skip</ng-container
                >
                <ng-template #skipLabel>⏭ Skip</ng-template>
              </button>

              <button
                (click)="openRecordHistory()"
                class="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Record History
              </button>
            </div>

            <!-- Audio preview -->
            <div
              class="mt-1.5 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5"
            >
              <div class="flex flex-col gap-0">
                <span
                  class="text-xs font-semibold uppercase tracking-wide text-gray-400"
                  >Audio Preview</span
                >
                <span class="text-xs font-semibold text-gray-700"
                  >Mine record</span
                >
              </div>

              <div class="flex items-center gap-1.5">
                <span
                  *ngIf="mineWavAudio"
                  class="font-mono text-xs font-medium text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded"
                >
                  {{ formatTime(currentAudioTime) }} /
                  {{ formatTime(totalAudioDuration) }}
                </span>

                <audio
                  *ngIf="mineWavAudio"
                  #mineAudioPlayer
                  [src]="mineWavAudio"
                  (timeupdate)="onAudioTimeUpdate()"
                  (loadedmetadata)="onAudioLoaded()"
                  (ended)="onAudioEnded()"
                ></audio>

                <button
                  (click)="playMyRecord()"
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow transition hover:bg-blue-700 hover:scale-105 active:scale-95"
                  [title]="isAudioPlaying ? 'Pause Audio' : 'Play Audio'"
                >
                  <span class="text-xs font-bold">{{
                    isAudioPlaying ? "⏸" : "▶"
                  }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Drag divider -->
        <div
          (mousedown)="onDividerMouseDown($event)"
          class="flex-none w-1.5 cursor-col-resize flex items-center justify-center group select-none"
        >
          <div
            class="w-px h-full bg-gray-200 group-hover:bg-blue-400 transition-colors duration-150"
          ></div>
        </div>

        <!-- Right panel -->
        <div class="flex-1 overflow-hidden min-w-0 p-1.5">
          <div
            class="h-full rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm flex flex-col"
          >
            <!-- Right header -->
            <div
              class="flex-none flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-1.5 mb-1.5"
            >
              <div>
                <h2 class="text-base font-bold text-gray-900">
                  Transcription Track
                </h2>
                <p class="text-xs text-gray-500">
                  Review, skip, or select blocks to sync record targets
                </p>
              </div>
              <button
                (click)="jumpToUnrecorded()"
                class="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Jump to unrecorded
              </button>
            </div>

            <!-- Transcript list -->
            <div class="flex-1 overflow-y-auto min-h-0 space-y-1 pr-0.5">
              <div
                *ngFor="let transcript_line of transcriptLines"
                (click)="selectTranscriptLine(transcript_line)"
                class="group relative cursor-pointer rounded-lg border p-2 transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
                [ngClass]="
                  activeTranscriptLine?.id === transcript_line.id
                    ? 'bg-blue-50'
                    : 'bg-white'
                "
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-1 flex-1 min-w-0">
                    <div
                      class="font-semibold text-sm text-gray-900 leading-snug"
                    >
                      {{ transcript_line.text }}
                    </div>

                    <div
                      class="gap-x-2 gap-y-0.5 text-xs border-t border-gray-100 pt-1"
                    >
                      <div class="flex items-start gap-1 text-gray-600">
                        <span
                          class="font-bold uppercase tracking-wide text-gray-400 shrink-0"
                          >VI:</span
                        >
                        <span class="italic text-gray-700">{{
                          transcript_line.viText || "—"
                        }}</span>
                      </div>
                    </div>

                    <div class="pt-0.5">
                      <div
                        *ngIf="
                          this.getLastRecord(transcript_line) &&
                          this.getLastRecord(transcript_line)?.sttText
                        "
                        class="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-100"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                        ></span>
                        <span>Heard:</span>
                        <span class="font-semibold text-gray-900"
                          >"{{
                            this.getLastRecord(transcript_line)?.sttText
                          }}"</span
                        >
                        <span class="text-emerald-600 font-mono"
                          >(Score:
                          {{
                            this.getLastRecord(transcript_line)?.score
                          }})</span
                        >
                      </div>

                      <div
                        *ngIf="!this.getLastRecord(transcript_line)"
                        class="inline-flex items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-400 border border-gray-200"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"
                        ></span>
                        <span>Not recorded yet</span>
                      </div>
                    </div>
                  </div>

                  <div
                    class="flex flex-col items-end justify-between self-stretch shrink-0 gap-1"
                  >
                    <span
                      *ngIf="transcript_line.id === 1"
                      class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700"
                      title="Completed"
                      >✓</span
                    >
                    <div *ngIf="transcript_line.id !== 1" class="h-5"></div>
                    <span
                      class="whitespace-nowrap font-mono text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded"
                    >
                      {{ transcript_line.start }} - {{ transcript_line.end }}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="py-2 text-center text-gray-300 tracking-widest font-bold text-xs"
              >
                •••
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RecordingComponent implements OnDestroy {
  ngOnDestroy(): void {
    //throw new Error("Method not implemented.");
  }
  @ViewChild("resizeContainer") resizeContainer!: ElementRef<HTMLDivElement>;

  leftWidthPercent = 35; // default 35% of window width
  private isDragging = false;
  private dragStartX = 0;
  private dragStartPercent = 0;

  onDividerMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartPercent = this.leftWidthPercent;
    event.preventDefault();
  }

  @HostListener("document:mousemove", ["$event"])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const containerWidth = this.resizeContainer.nativeElement.offsetWidth;
    const deltaPercent =
      ((event.clientX - this.dragStartX) / containerWidth) * 100;
    this.leftWidthPercent = Math.min(
      80,
      Math.max(20, this.dragStartPercent + deltaPercent),
    );
  }

  @HostListener("document:mouseup")
  onMouseUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.onResizeDone(this.leftWidthPercent);
  }

  /** Called once when user releases the divider — wire your API call here */
  onResizeDone(leftWidthPercent: number): void {
    // e.g. this.settingsService.savePanelWidth(leftWidthPercent).subscribe();
    console.log("Resize done, left panel %:", leftWidthPercent);
  }

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

    this.jumpToUnrecorded()

    return result.data;
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

  getLastRecord(transcriptLine: TranscriptLine) {
    if (!transcriptLine || transcriptLine.records.length == 0) return;
    return transcriptLine.records[transcriptLine.records.length - 1];
  }

  async playMyRecord(): Promise<void> {
    if (!this.activeTranscriptLine) {
      messageUtils("activeTranscriptLine null");
      return;
    }

    const record_id = this.getLastRecord(this.activeTranscriptLine)?.id;

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
      onClose: async () => {
        await this.fetchTranscriptLines();
      },
      data: {
        transcriptLines: this.transcriptLines,
        videoId: this.videoId,
        fetchTranscriptLines: this.fetchTranscriptLines,
      },
    });
  }

  openSettingModal() {
    this.modal.open({
      title: "Setting Modal",
      component: SettingComponent,
      size: "lg",
      onClose: async () => {
        //await this.fetchTranscriptLines()
      },
      data: {},
    });
  }

  openRecordHistory() {
    if (!this.activeTranscriptLine) {
      messageUtils("activeTranscriptLine null!");
      return;
    }

    this.modal.open({
      title: "Record History Modal",
      component: RecordHistoryComponent,
      size: "lg",
      onClose: async () => {
        //await this.fetchTranscriptLines()
      },
      data: {
        records: this.activeTranscriptLine?.records,
      },
    });
  }
}
