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
      id="main-container"
      class="h-screen bg-gray-50 text-gray-800 antialiased overflow-hidden flex flex-col"
    >
      <div
        id="header-bar"
        class="flex-none flex items-center justify-between border-b bg-white px-3 py-1.5 shadow-sm"
      >
        <button
          id="btn-back"
          (click)="goBack()"
          class="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 shadow-sm"
        >
          <i id="icon-back" class="fa-solid fa-arrow-left"></i> Back
        </button>

        <div id="header-actions" class="flex items-center gap-1.5">
          <button
            id="btn-translation"
            (click)="openTranslationModal()"
            class="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 shadow-sm"
          >
            <i id="icon-translation" class="fa-solid fa-plus"></i> Translation
          </button>
          <button
            id="btn-settings"
            (click)="openSettingModal()"
            class="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 shadow-sm"
          >
            <i id="icon-settings" class="fa-solid fa-gear"></i> Settings
          </button>
        </div>
      </div>

      <div
        id="body-container"
        #resizeContainer
        class="flex-1 flex overflow-hidden min-h-0"
      >
        <div
          id="left-panel"
          [style.width]="setting.videoWidthSize + '%'"
          class="flex-none overflow-y-auto flex flex-col gap-1.5 p-1.5 min-w-0"
        >
          <div
            id="left-panel-card"
            class="rounded-xl bg-white p-1.5 shadow-sm border border-gray-200 h-full flex flex-col justify-center"
          >
            <div id="video-title" class="font-bold text-gray-900">
              {{ videoMetadata ? videoMetadata.title : "Title" }}
            </div>
            <div id="video-description">
              {{ videoMetadata ? videoMetadata.description : "Description" }}
            </div>

            <div
              id="video-wrapper"
              class="relative overflow-hidden rounded-lg bg-black aspect-video shadow-inner"
            >
              <video
                id="video-player"
                #videoPlayer
                controls
                class="h-full w-full object-contain"
              >
                <source
                  id="video-source-mp4"
                  [src]="videoMp4Data"
                  type="video/mp4"
                />
              </video>
            </div>

            <div id="controls-grid" class="mt-1.5 grid grid-cols-1 gap-1">
              <div id="current-transcript-index" class="text-center font-bold">
                Current {{ activeTranscriptLineIdx + 1 }}
              </div>
              <button
                id="btn-toggle-play"
                (click)="togglePlay()"
                class="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
              >
                <i
                  id="icon-toggle-play"
                  class="fa-solid"
                  [ngClass]="isPlaying ? 'fa-stop' : 'fa-play'"
                ></i>

                {{ isPlaying ? "Stop" : "Play" }}
              </button>

              <button
                id="btn-toggle-record"
                (click)="startRecord()"
                class="flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-sm font-medium transition active:scale-[0.98]"
                [ngClass]="
                  (audioService.isRecording$ | async)
                    ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                "
              >
                <button id="btn-record-inner">
                  <i
                    id="icon-record"
                    class="fa-solid"
                    [ngClass]="recordButtonIcon"
                  ></i>
                  {{ recordButtonText }}
                </button>
              </button>

              <button
                id="btn-skip-line"
                (click)="skipTranscriptLine()"
                class="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <ng-container
                  id="skip-container"
                  *ngIf="activeTranscriptLine?.skip == 1; else skipLabel"
                  ><i id="icon-skip-undo" class="fa-solid fa-forward-step"></i>
                  Skip Undo skip</ng-container
                >
                <ng-template #skipLabel
                  ><i id="icon-skip" class="fa-solid fa-forward-step"></i>
                  Skip</ng-template
                >
              </button>

              <button
                id="btn-record-history"
                (click)="openRecordHistory()"
                class="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <i
                  id="icon-record-history"
                  class="fa-solid fa-clock-rotate-left"
                ></i>
                Record History
              </button>
            </div>

            <div
              id="audio-preview-container"
              class="mt-1.5 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5"
            >
              <div
                id="audio-label-wrapper"
                class="flex flex-col gap-0 shrink-0"
              >
                <span
                  id="audio-label-mine"
                  class="text-xs font-semibold text-gray-700"
                  >Mine</span
                >
              </div>

              <div
                id="audio-controls-wrapper"
                class="flex flex-1 items-center justify-end gap-1.5 ml-4"
              >
                <audio
                  id="audio-player-mine"
                  *ngIf="mineWavAudio"
                  [src]="mineWavAudio"
                  [loop]="setting.loop === 1"
                  controls
                  class="h-8 w-full"
                ></audio>

                <button
                  id="btn-load-my-record"
                  *ngIf="!mineWavAudio"
                  (click)="loadMyRecord()"
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow transition hover:bg-blue-700 hover:scale-105 active:scale-95"
                  title="Load Audio"
                >
                  <span id="btn-load-my-record-text" class="text-xs font-bold">
                    <i id="icon-load-record" class="fa-solid fa-play"></i>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          id="drag-divider"
          (mousedown)="onDividerMouseDown($event)"
          class="flex-none w-1.5 cursor-col-resize flex items-center justify-center group select-none"
        >
          <div
            id="drag-divider-line"
            class="w-px h-full bg-gray-200 group-hover:bg-blue-400 transition-colors duration-150"
          ></div>
        </div>

        <div id="right-panel" class="flex-1 overflow-hidden min-w-0 p-1.5">
          <div
            id="right-panel-card"
            class="h-full rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm flex flex-col"
          >
            <div
              id="right-panel-header"
              class="flex-none flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-1.5 mb-1.5"
            >
              <div id="right-header-text">
                <h2
                  id="right-panel-title"
                  class="text-base font-bold text-gray-900"
                >
                  Transcription Track (Current
                  {{ this.activeTranscriptLineIdx + 1 }} in total
                  {{ this.transcriptLines?.length }})
                </h2>
                <p id="right-panel-subtitle" class="text-xs text-gray-500">
                  Review, skip, or select blocks to sync record targets
                </p>
              </div>
              <button
                id="btn-jump-unrecorded"
                [ngClass]="{
                  'cursor-not-allowed': shouldNotMoveActiveTranscriptLine(),
                  'cursor-pointer': !shouldNotMoveActiveTranscriptLine(),
                }"
                (click)="jumpToUnrecorded()"
                class="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Jump to unrecorded
              </button>
            </div>

            <div
              id="transcript-list-container"
              #transcriptContainer
              class="flex-1 overflow-y-auto min-h-0 space-y-1 pr-0.5"
            >
              <div
                id="transcript-row-item-{{ transcript_line.id }}"
                *ngFor="let transcript_line of transcriptLines; let i = index"
                (click)="selectTranscriptLine(transcript_line)"
                class="group relative rounded-lg border p-2 transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
                [ngClass]="{
                  'bg-blue-50': activeTranscriptLine?.id === transcript_line.id,
                  'bg-white': activeTranscriptLine?.id !== transcript_line.id,
                  'cursor-not-allowed': shouldNotMoveActiveTranscriptLine(),
                  'cursor-pointer': !shouldNotMoveActiveTranscriptLine(),
                }"
              >
                <div
                  id="transcript-item-layout"
                  class="flex items-start justify-between gap-2"
                >
                  <div
                    id="transcript-content-column"
                    class="space-y-1 flex-1 min-w-0"
                  >
                    <div
                      id="transcript-text-display"
                      class="font-semibold text-sm text-gray-900 leading-snug"
                    >
                      {{ i + 1 }}: {{ transcript_line.text }}
                    </div>

                    <div
                      id="transcript-translation-block"
                      class="gap-x-2 gap-y-0.5 text-xs border-t border-gray-100 pt-1"
                    >
                      <div
                        id="translation-vi-wrapper"
                        class="flex items-start gap-1 text-gray-600"
                      >
                        <span
                          id="translation-vi-prefix"
                          class="font-bold uppercase tracking-wide text-gray-400 shrink-0"
                          >VI:</span
                        >
                        <span
                          id="translation-vi-text"
                          class="italic text-gray-700"
                          >{{ transcript_line.viText || "—" }}</span
                        >
                      </div>
                    </div>

                    <div id="transcript-status-block" class="pt-0.5">
                      <div
                        id="status-recorded-badge"
                        *ngIf="
                          this.getLastRecord(transcript_line) &&
                          this.getLastRecord(transcript_line)?.id
                        "
                        class="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-100"
                      >
                        <span
                          id="status-recorded-dot"
                          class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                        ></span>
                        <span id="status-recorded-label">Heard:</span>
                        <span
                          id="status-recorded-text"
                          class="font-semibold text-gray-900"
                          >"{{
                            this.getLastRecord(transcript_line)?.sttText || "-"
                          }}"</span
                        >
                        <span
                          id="status-recorded-score"
                          class="text-emerald-600 font-mono"
                          >(Score:
                          {{
                            this.getLastRecord(transcript_line)?.score
                          }})</span
                        >
                      </div>

                      <div
                        id="status-unrecorded-badge"
                        *ngIf="!this.getLastRecord(transcript_line)"
                        class="inline-flex items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-400 border border-gray-200"
                      >
                        <span
                          id="status-unrecorded-dot"
                          class="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"
                        ></span>
                        <span id="status-unrecorded-label"
                          >Not recorded yet</span
                        >
                      </div>
                    </div>
                  </div>

                  <div
                    id="transcript-metadata-column"
                    class="flex flex-col items-end justify-between self-stretch shrink-0 gap-1"
                  >
                    <span
                      id="transcript-time-badge"
                      class="whitespace-nowrap font-mono text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded"
                    >
                      {{ transcript_line.start }} - {{ transcript_line.end }}
                    </span>
                  </div>
                </div>
              </div>

              <div
                id="transcript-list-ellipsis"
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
  // ==================== INFRASTRUCTURE ====================

  videoId = window.location.pathname.split("/").filter(Boolean).pop();
  private modal = inject(ModalService);
  audioService = inject(AudioService);

  ngOnInit(): void {
    this.fetchVideoMp4Data();
    this.fetchTranscriptLines("ON_INIT");
    this.fetchVideoMetadata();
    this.fetchSetting();
    this.audioService.isRecording$.subscribe((value) => {
      this.isRecording = value;
    });
  }

  ngOnDestroy(): void {}

  goBack(): void {
    console.log("Navigate back");
    window.location.href = "/";
  }

  // ==================== FEATURE: PANEL RESIZE ====================

  @ViewChild("resizeContainer") resizeContainer!: ElementRef<HTMLDivElement>;

  setting = {
    videoWidthSize: 35,
    loop: 0,
  };

  private isDragging = false;
  private dragStartX = 0;
  private dragStartPercent = 0;
  private debounceTimer: any;

  onDividerMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartPercent = this.setting.videoWidthSize;
    event.preventDefault();
  }

  @HostListener("document:mousemove", ["$event"])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const containerWidth = this.resizeContainer.nativeElement.offsetWidth;
    const deltaPercent =
      ((event.clientX - this.dragStartX) / containerWidth) * 100;

    const newLeftWidthPercent = Math.min(
      80,
      Math.max(20, this.dragStartPercent + deltaPercent),
    );

    this.setting.videoWidthSize = newLeftWidthPercent;
    this.setLeftWidthPercentDatabaseDebounce(newLeftWidthPercent);
  }

  @HostListener("document:mouseup")
  onMouseUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.onResizeDone(this.setting.videoWidthSize);
  }

  onResizeDone(videoWidthSize: number): void {
    console.log("Resize done, left panel %:", videoWidthSize);
  }

  async setLeftWidthPercentDatabaseDebounce(percent: number) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.setLeftWidthPercentDatabase(percent);
    }, 500);
  }

  async setLeftWidthPercentDatabase(percent: number) {
    const result = await callApi({
      endpoint: "api/usersettings/update-property",
      method: "POST",
      body: { key: "VideoWidthSize", value: percent },
      credentials: "include",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }
  }

  // ==================== FEATURE: VIDEO PLAYBACK ====================

  @ViewChild("videoPlayer") videoPlayer!: ElementRef<HTMLVideoElement>;

  videoMp4Data = null;
  videoMetadata: Video | null = null;
  isPlaying = false;
  private _pauseAtEndTime: () => void = () => {};

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

  togglePlay(): void {
    const video = this.videoPlayer.nativeElement;

    if (this.isPlaying) {
      video.pause();
      if (this.activeTranscriptLine)
        video.currentTime = this.activeTranscriptLine.start;
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
        video.currentTime = this.activeTranscriptLine!!.start;
        this.isPlaying = false;
        video.removeEventListener("timeupdate", this._pauseAtEndTime);
      }
    };

    video.addEventListener("timeupdate", this._pauseAtEndTime);
  }

  // ==================== FEATURE: TRANSCRIPT ====================

  @ViewChild("transcriptContainer")
  transcriptContainer!: ElementRef<HTMLDivElement>;

  transcriptLines: TranscriptLine[] | null = null;
  activeTranscriptLineIdx: number = 0;
  showTranslation = true;

  get activeTranscriptLine(): TranscriptLine | null {
    if (this.activeTranscriptLineIdx === null || !this.transcriptLines)
      return null;
    return this.transcriptLines[this.activeTranscriptLineIdx] ?? null;
  }

  async fetchTranscriptLines(action?: string) {
    const result = await callApi({
      endpoint: `api/transcripts/${this.videoId}`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.transcriptLines = result.data;
    if (action == "ON_INIT") {
      if (this.jumpToUnrecorded) this.jumpToUnrecorded();
    }
    return result.data;
  }

  selectTranscriptLine(transcript_line: TranscriptLine): void {
    if (!this.transcriptLines) {
      messageUtils("transcriptLines null");
      return;
    }

    const idx = this.transcriptLines.findIndex(
      (ele) => ele.id == transcript_line.id,
    );
    if (idx < 0) {
      messageUtils("idx null");
      return;
    }

    this.activeTranscriptLineIdx = idx;
    this.mineWavAudio = null;
    console.log("Selected sentence", transcript_line.id);
  }

  jumpToUnrecorded(): void {
    if (!this.transcriptLines) return;

    const unrecorded_idx = this.transcriptLines.findIndex(
      (s) => s.records.length === 0,
    );
    const unrecorded = this.transcriptLines[unrecorded_idx];

    if (unrecorded) {
      this.activeTranscriptLineIdx = unrecorded_idx;
      setTimeout(() => {
        document
          .querySelector(`[data-id="${unrecorded.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      console.log("Jumped to unrecorded sentence", unrecorded.id);
    }
  }

  shouldNotMoveActiveTranscriptLine() {
    if (this.isGenerateStt) return true;
    if (this.isRecording) return true;
    return false;
  }

  async skipTranscriptLine(): Promise<void> {
    if (!this.activeTranscriptLine || !this.transcriptLines) return;

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

  openTranslationModal() {
    this.modal.open({
      title: "Translation Modal",
      component: TranslationComponent,
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

  // ==================== FEATURE: RECORDING ====================

  isRecording = false;
  isGenerateStt = false;

  get recordButtonText() {
    if (this.isGenerateStt) return "Loading...";
    return this.isRecording ? "Stop Recording" : "Record";
  }

  get recordButtonIcon() {
    if (this.isGenerateStt) return "fa-spinner fa-spin";
    return this.isRecording ? "fa-stop" : "fa-microphone";
  }

  async startRecord(): Promise<void> {
    if (!this.activeTranscriptLine?.id) {
      messageUtils("activeTranscriptLine null");
      return;
    }

    let blob;
    if (this.audioService.isRecordingValue) {
      blob = await this.audioService.stopRecording();
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

    this.isGenerateStt = true;
    const result = await callApi({
      endpoint: "api/records",
      method: "POST",
      body: formData,
      credentials: "include",
    });
    this.isGenerateStt = false;

    if (!result.success) {
      messageUtils(result.message);
      return;
    }
    this.fetchTranscriptLines();
  }

  getLastRecord(transcriptLine: TranscriptLine) {
    if (!transcriptLine || transcriptLine.records.length == 0) return;
    return transcriptLine.records[transcriptLine.records.length - 1];
  }

  deleteMyRecord(): void {
    console.log("Deleted my recording");
  }

  openRecordHistory() {
    if (!this.activeTranscriptLine) {
      messageUtils("activeTranscriptLine null!");
      return;
    }

    this.modal.open({
      title: "Record History Modal",
      component: RecordHistoryComponent,
      onClose: async () => {},
      data: { transcriptLineId: this.activeTranscriptLine?.id },
    });
  }

  // ==================== FEATURE: MY AUDIO PLAYBACK ====================

  mineWavAudio: string | null = null;

  async loadMyRecord(): Promise<void> {
    if (!this.activeTranscriptLine) {
      messageUtils("activeTranscriptLine null");
      return;
    }

    const record_id = this.getLastRecord(this.activeTranscriptLine)?.id;
    if (!record_id) {
      messageUtils("Not recorded yet!");
      return;
    }

    if (this.mineWavAudio) return; // already loaded

    const result = await callApi({
      endpoint: `api/records/file/${record_id}/`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.mineWavAudio = result.data.url;
  }

  // ==================== FEATURE: SETTINGS ====================

  async fetchSetting() {
    const result = await callApi({
      endpoint: "api/usersettings",
      method: "GET",
      credentials: "include",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.setting = result.data ?? this.setting;
  }

  openSettings(): void {
    console.log("Open settings");
  }

  openSettingModal() {
    this.modal.open({
      title: "Setting Modal",
      component: SettingComponent,
      size: "lg",
      onClose: async () => {
        await this.fetchSetting();
      },
      data: {},
    });
  }
}
