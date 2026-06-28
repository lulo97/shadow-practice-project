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
      class="h-screen bg-[#F4F3EF] text-[#1A1A1A] font-mono antialiased overflow-hidden flex flex-col relative"
    >
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"
      ></div>

      <div
        id="header-bar"
        class="relative z-10 flex-none flex items-center justify-between border-b-4 border-black bg-white px-4 py-3 shadow-[0_2px_0px_0px_#000]"
      >
        <button
          id="btn-back"
          (click)="goBack()"
          class="px-4 py-1.5 font-black text-sm uppercase tracking-wider bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer flex items-center gap-2"
        >
          <i id="icon-back" class="fa-solid fa-arrow-left"></i> BACK_
        </button>

        <div id="header-actions" class="flex items-center gap-3">
          <button
            id="btn-translation"
            (click)="openTranslationModal()"
            class="px-4 py-1.5 font-black text-sm uppercase tracking-wider bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:bg-gray-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer flex items-center gap-2"
          >
            <i id="icon-translation" class="fa-solid fa-plus"></i> TRANSLATION
          </button>
          <button
            id="btn-settings"
            (click)="openSettingModal()"
            class="px-4 py-1.5 font-black text-sm uppercase tracking-wider bg-[#FFDE4D] border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer flex items-center gap-2"
          >
            <i id="icon-settings" class="fa-solid fa-gear"></i> SETTINGS
          </button>
        </div>
      </div>

      <div
        id="body-container"
        #resizeContainer
        class="relative z-10 flex-1 flex overflow-hidden min-h-0"
      >
        <div
          id="left-panel"
          [style.width]="setting.videoWidthSize + '%'"
          class="flex-none overflow-y-auto flex flex-col gap-3 p-3 min-w-0"
        >
          <div
            id="left-panel-card"
            class="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] h-full flex flex-col justify-center p-4"
          >
            <div class="mb-3">
              <span
                class="text-[10px] font-black text-gray-400 block tracking-widest"
                >// TARGET_MEDIA_NODE</span
              >
              <div
                id="video-title"
                class="font-black text-xl uppercase tracking-tight text-gray-900 truncate"
              >
                {{ videoMetadata ? videoMetadata.title : "Title" }}
              </div>
              <div
                id="video-description"
                class="line-clamp-2 text-xs font-bold text-gray-600 mt-1 leading-relaxed"
              >
                {{ videoMetadata ? videoMetadata.description : "Description" }}
              </div>
            </div>

            <div
              id="video-wrapper"
              class="relative overflow-hidden border-2 border-black bg-black aspect-video shadow-[inset_4px_4px_10px_rgba(0,0,0,0.8)]"
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

            <div id="controls-grid" class="mt-3 grid grid-cols-1 gap-2">
              <div
                id="current-transcript-index"
                class="text-center font-black text-xs uppercase bg-black text-white py-1 border border-black tracking-widest"
              >
                NODE_INDEX: {{ activeTranscriptLineIdx + 1 }}
              </div>

              <button
                id="btn-toggle-play"
                (click)="togglePlay()"
                class="flex items-center justify-center gap-2 px-4 py-2 font-black uppercase tracking-wider bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:bg-gray-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer text-sm"
              >
                <i
                  id="icon-toggle-play"
                  class="fa-solid"
                  [ngClass]="
                    isPlaying
                      ? 'fa-stop text-[#FF4E4E]'
                      : 'fa-play text-[#2FD673]'
                  "
                ></i>
                {{ isPlaying ? "STOP_STREAM" : "PLAY_STREAM" }}
              </button>

              <button
                id="btn-toggle-record"
                (click)="startRecord()"
                class="flex items-center justify-center gap-2 px-4 py-2 font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all cursor-pointer text-sm"
                [ngClass]="
                  (audioService.isRecording$ | async)
                    ? 'bg-[#FF4E4E] text-white animate-pulse'
                    : 'bg-[#2FD673] text-black hover:bg-[#25b861]'
                "
              >
                <button
                  id="btn-record-inner"
                  class="bg-transparent border-0 p-0 m-0 font-black flex items-center gap-2 cursor-pointer uppercase tracking-wider text-inherit"
                >
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
                class="flex items-center justify-center gap-2 px-4 py-2 font-black uppercase tracking-wider bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:bg-gray-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer text-sm"
              >
                <ng-container
                  id="skip-container"
                  *ngIf="activeTranscriptLine?.skip == 1; else skipLabel"
                >
                  <i
                    id="icon-skip-undo"
                    class="fa-solid fa-forward-step text-[#FF8A00]"
                  ></i>
                  UNDO_SKIP
                </ng-container>
                <ng-template #skipLabel>
                  <i id="icon-skip" class="fa-solid fa-forward-step"></i>
                  SKIP_LINE
                </ng-template>
              </button>

              <button
                id="btn-record-history"
                (click)="openRecordHistory()"
                class="flex items-center justify-center gap-2 px-4 py-2 font-black uppercase tracking-wider bg-[#00E5FF] border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer text-sm"
              >
                <i
                  id="icon-record-history"
                  class="fa-solid fa-clock-rotate-left"
                ></i>
                LOG_HISTORY
              </button>
            </div>

            <div
              id="audio-preview-container"
              class="mt-3 flex items-center justify-between border-2 border-black bg-[#F4F3EF] p-2 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]"
            >
              <div
                id="audio-label-wrapper"
                class="flex flex-col gap-0 shrink-0 border-r-2 border-black pr-2 mr-2"
              >
                <span
                  id="audio-label-mine"
                  class="text-xs font-black uppercase tracking-wider text-black"
                  >MINE_</span
                >
              </div>

              <div
                id="audio-controls-wrapper"
                class="flex flex-1 items-center justify-end gap-1.5"
              >
                <audio
                  id="audio-player-mine"
                  [src]="mineWavAudio || ''"
                  controls
                  class="h-8 w-full accent-black"
                ></audio>
              </div>
            </div>
          </div>
        </div>

        <div
          id="drag-divider"
          (mousedown)="onDividerMouseDown($event)"
          class="flex-none w-2 cursor-col-resize flex items-center justify-center group select-none relative z-20"
        >
          <div
            id="drag-divider-line"
            class="w-1 h-full bg-black group-hover:bg-[#FFDE4D] transition-colors duration-150 border-x border-gray-300"
          ></div>
        </div>

        <div id="right-panel" class="flex-1 overflow-hidden min-w-0 p-3">
          <div
            id="right-panel-card"
            class="h-full border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000] flex flex-col p-4"
          >
            <div
              id="right-panel-header"
              class="flex-none flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3 mb-3 bg-[#00E5FF]/5 -mx-4 -mt-4 p-4"
            >
              <div id="right-header-text">
                <h2
                  id="right-panel-title"
                  class="text-base font-black uppercase tracking-tight text-gray-900 flex items-center gap-2"
                >
                  <span class="px-2 py-0.5 bg-black text-white text-xs"
                    >TRACK_</span
                  >
                  Transcription Track ({{ this.activeTranscriptLineIdx + 1 }} /
                  {{ this.transcriptLines?.length }})
                </h2>
                <p
                  id="right-panel-subtitle"
                  class="text-[11px] font-bold text-gray-500 mt-0.5"
                >
                  // REVIEW, SKIP, OR SELECT BLOCKS TO SYNC RECORD TARGETS
                </p>
              </div>
              <button
                id="btn-jump-unrecorded"
                [ngClass]="{
                  'opacity-50 cursor-not-allowed shadow-none translate-x-[2px] translate-y-[2px]':
                    shouldNotMoveActiveTranscriptLine(),
                  'cursor-pointer hover:bg-blue-100 shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000]':
                    !shouldNotMoveActiveTranscriptLine(),
                }"
                (click)="jumpToUnrecorded()"
                class="inline-flex items-center justify-center border-2 border-black bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-blue-900 transition-all"
              >
                JUMP_TO_UNRECORDED
              </button>
            </div>

            <div
              id="transcript-list-container"
              #transcriptContainer
              class="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1"
            >
              <div
                id="transcript-row-item-{{ transcript_line.id }}"
                *ngFor="let transcript_line of transcriptLines; let i = index"
                (click)="selectTranscriptLine(transcript_line)"
                class="group relative border-2 border-black p-3 transition-all duration-150"
                [ngClass]="{
                  'bg-[#FFDE4D]/20 shadow-[4px_4px_0px_0px_#000] border-l-8 border-l-black':
                    activeTranscriptLine?.id === transcript_line.id,
                  'bg-white hover:bg-gray-50 hover:shadow-[3px_3px_0px_0px_#000]':
                    activeTranscriptLine?.id !== transcript_line.id,
                  'opacity-60 cursor-not-allowed':
                    shouldNotMoveActiveTranscriptLine(),
                  'cursor-pointer': !shouldNotMoveActiveTranscriptLine(),
                }"
              >
                <div
                  id="transcript-item-layout"
                  class="flex items-start justify-between gap-3"
                >
                  <div
                    id="transcript-content-column"
                    class="space-y-2 flex-1 min-w-0"
                  >
                    <div
                      id="transcript-text-display"
                      class="font-black text-sm text-gray-900 leading-snug tracking-tight"
                    >
                      [{{ i + 1 }}] // {{ transcript_line.text }}
                    </div>

                    <div
                      id="transcript-translation-block"
                      class="text-xs border-t-2 border-dashed border-gray-200 pt-2"
                    >
                      <div
                        id="translation-vi-wrapper"
                        class="flex items-start gap-1.5"
                      >
                        <span
                          id="translation-vi-prefix"
                          class="font-black uppercase tracking-widest text-gray-400 shrink-0"
                          >VI_</span
                        >
                        <span
                          id="translation-vi-text"
                          class="font-bold italic text-gray-700"
                          >{{ transcript_line.viText || "—" }}</span
                        >
                      </div>
                    </div>

                    <div id="transcript-status-block" class="pt-1">
                      <div
                        id="status-recorded-badge"
                        *ngIf="
                          this.getLastRecord(transcript_line) &&
                          this.getLastRecord(transcript_line)?.id
                        "
                        class="inline-flex items-center gap-1.5 border-2 border-black bg-[#2FD673] px-2 py-0.5 text-xs font-black text-black shadow-[2px_2px_0px_0px_#000]"
                      >
                        <span
                          id="status-recorded-dot"
                          class="w-2 h-2 rounded-none bg-black shrink-0"
                        ></span>
                        <span
                          id="status-recorded-label"
                          class="uppercase tracking-wider"
                          >HEARD:</span
                        >
                        <span
                          id="status-recorded-text"
                          class="font-bold text-gray-900"
                          >"{{
                            this.getLastRecord(transcript_line)?.sttText || "-"
                          }}"</span
                        >
                        <span
                          id="status-recorded-score"
                          class="bg-black text-[#2FD673] px-1 text-[10px] font-mono"
                          >SCORE:
                          {{ this.getLastRecord(transcript_line)?.score }}</span
                        >
                      </div>

                      <div
                        id="status-unrecorded-badge"
                        *ngIf="
                          !this.getLastRecord(transcript_line) &&
                          !transcript_line?.skip
                        "
                        class="inline-flex items-center gap-1.5 border border-gray-400 bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500"
                      >
                        <span
                          id="status-unrecorded-dot"
                          class="w-1.5 h-1.5 rounded-none bg-gray-400 shrink-0"
                        ></span>
                        <span
                          id="status-unrecorded-label"
                          class="uppercase tracking-wider"
                          >UNRECORDED</span
                        >
                      </div>

                      <div
                        id="status-skipped-badge"
                        *ngIf="
                          !this.getLastRecord(transcript_line) &&
                          transcript_line?.skip
                        "
                        class="inline-flex items-center gap-1.5 border-2 border-black bg-[#FF8A00] px-2 py-0.5 text-xs font-black text-white shadow-[2px_2px_0px_0px_#000]"
                      >
                        <span
                          id="status-skipped-dot"
                          class="w-2 h-2 rounded-none bg-white shrink-0"
                        ></span>
                        <span
                          id="status-skipped-label"
                          class="uppercase tracking-wider"
                          >SKIPPED_NODE</span
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
                      class="whitespace-nowrap font-mono text-[10px] font-black text-black bg-[#F4F3EF] border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_0px_#000]"
                    >
                      {{ transcript_line.start }} - {{ transcript_line.end }}
                    </span>
                  </div>
                </div>
              </div>

              <div
                id="transcript-list-ellipsis"
                class="py-4 text-center text-gray-400 tracking-widest font-black text-sm"
              >
                // EOF_MATRIX_STREAM //
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
        if (this.setting.loop === 1) {
          // Infinite loop: restart interval
          video.currentTime = this.activeTranscriptLine!!.start;
          video.play();
        } else {
          // No loop: stop
          video.pause();
          video.currentTime = this.activeTranscriptLine!!.start;
          this.isPlaying = false;
          video.removeEventListener("timeupdate", this._pauseAtEndTime);
        }
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
    this.loadMyRecord();
    this.mineWavAudio = null;
    console.log("Selected sentence", transcript_line.id);
  }

  jumpToUnrecorded(): void {
    if (!this.transcriptLines) return;

    const unrecorded_idx = this.transcriptLines.findIndex(
      (s) => s.records.length === 0 && s.skip == 0,
    );
    const unrecorded = this.transcriptLines[unrecorded_idx];

    if (unrecorded) {
      this.activeTranscriptLineIdx = unrecorded_idx;
      setTimeout(() => {
        document
          .querySelector(`[id="transcript-row-item-${unrecorded.id}"]`)
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
  ngOnDestroy(): void {
    // Stop tracks only when component is fully destroyed
    this.audioService.cleanup();
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
    await this.fetchTranscriptLines();
    await this.loadMyRecord();
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
      //messageUtils("Not recorded yet!");
      return;
    }

    //if (this.mineWavAudio) return;

    const result = await callApi({
      endpoint: `api/records/file/${record_id}/`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.mineWavAudio = result.data.url;

    //loadMyRecord run when active line change, later let user play mine audio themself
    // setTimeout(() => {
    //   this.playAudioElement();
    // }, 50);
  }

  private playAudioElement(): void {
    const audio = document.getElementById(
      "audio-player-mine",
    ) as HTMLAudioElement;

    if (!audio) return;

    if (!audio.src || audio.src === window.location.href) {
      console.log("Audio has no source loaded yet.");
      return;
    }

    audio.play().catch((err) => console.error("Playback failed:", err));
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
