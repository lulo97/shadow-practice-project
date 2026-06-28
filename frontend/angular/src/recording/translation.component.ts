import { Component, inject, NgZone } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { FormsModule } from "@angular/forms";
import { ModalService } from "../components/modal/modal.service";
import { TranscriptLine } from "./transcriptline.interface";
import { CommonModule } from "@angular/common";
import { expectedPrefixSymbol } from "./utils";
import { SseService } from "../sse/sseservice.component";
import { Subscription } from "rxjs";

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div
      id="main-container"
      class="w-[80vw] h-[70vh] flex flex-col font-mono selection:bg-[#FFDE4D] antialiased text-[#1A1A1A]"
    >
      <div id="layout-wrapper" class="flex gap-4 flex-1 min-h-0">
        <div
          id="left-layout"
          class="w-1/2 flex flex-col min-h-0 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000]"
        >
          <div
            id="left-header"
            class="flex justify-between items-center p-4 bg-[#FF8A00]/10 border-b-2 border-black shrink-0"
          >
            <div>
              <div
                id="tab-english"
                class="font-black text-sm uppercase tracking-wider"
              >
                // English transcript
              </div>
              <div class="text-xs font-bold text-neutral-500 mt-0.5">
                Paste to ChatGPT by copy prompt
              </div>
            </div>
          </div>

          <div
            id="panel-english"
            class="flex-1 p-4 overflow-y-auto min-h-0 bg-[#F4F3EF]/30"
          >
            <div
              id="transcript-loop"
              *ngFor="let ele of transcriptLines; let i = index"
            >
              <div
                id="transcript-line-{{ i }}"
                class="text-sm font-bold py-1 leading-relaxed"
              >
                <span class="text-neutral-400 font-mono select-none"
                  >{{ i + 1 }}:</span
                >
                {{ ele.text }}
              </div>
              <hr
                id="transcript-divider-{{ i }}"
                class="my-1 border-t-2 border-black/10 border-dashed"
              />
            </div>
          </div>
        </div>

        <div
          id="right-layout"
          class="w-1/2 flex flex-col min-h-0 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000]"
        >
          <div class="p-4 bg-[#00E5FF]/10 border-b-2 border-black shrink-0">
            <div
              id="tab-vietnamese"
              class="font-black text-sm uppercase tracking-wider"
            >
              // Vietnamese transcript
            </div>
            <div class="text-xs font-bold text-neutral-500 mt-0.5">
              Edit vietnamese translation freely and click saved!
            </div>
          </div>

          <textarea
            id="vietnamese-transcript-textarea"
            [(ngModel)]="vietnameseText"
            placeholder="Paste Vietnamese translation here..."
            class="flex-1 w-full p-4 bg-[#F4F3EF]/10 border-none resize-none text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#FFDE4D] transition-colors min-h-0"
          ></textarea>
        </div>
      </div>

      <div
        id="translation-footer"
        class="flex gap-4 justify-end items-center mt-4 shrink-0"
      >
        <div
          class="flex-1 text-neutral-500 font-bold text-xs uppercase tracking-wider"
        >
          // {{ this.autoTranslationInfo }}
        </div>
        <button
          id="tab-copy-prompt"
          (click)="copyPrompt()"
          class="px-4 py-2 font-black uppercase tracking-wider text-xs bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shrink-0"
        >
          Copy + Prompt
        </button>
        <button
          [id]="
            isAutoTranslate
              ? 'btn-auto-translation-loading'
              : 'btn-auto-translation'
          "
          (click)="autoTranslate()"
          class="px-4 py-2 font-black uppercase tracking-wider text-xs border-2 border-black transition-all flex items-center gap-2"
          [class.bg-neutral-200]="isAutoTranslate"
          [class.text-neutral-400]="isAutoTranslate"
          [class.border-neutral-400]="isAutoTranslate"
          [class.cursor-not-allowed]="isAutoTranslate"
          [class.bg-[#2FD673]]="!isAutoTranslate"
          [class.shadow-[2px_2px_0px_0px_#000]]="!isAutoTranslate"
          [class.hover:translate-x-[1px]]="!isAutoTranslate"
          [class.hover:translate-y-[1px]]="!isAutoTranslate"
          [class.hover:shadow-[1px_1px_0px_0px_#000]]="!isAutoTranslate"
          [class.cursor-pointer]="!isAutoTranslate"
        >
          <span
            *ngIf="isAutoTranslate"
            class="w-3 h-3 border-2 border-neutral-400 border-t-transparent animate-spin inline-block"
          ></span>
          Auto translation
        </button>

        <button
          id="btn-save"
          (click)="save()"
          class="px-5 py-2 font-black uppercase tracking-wider text-xs bg-[#FFDE4D] text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          Save
        </button>
      </div>
    </div>
  `,
})
export class TranslationComponent {
  private modal = inject(ModalService);

  autoTranslationInfo = "";

  transcriptLines: TranscriptLine[] = [];
  private sub!: Subscription;
  constructor(
    private sse: SseService,
    private zone: NgZone,
  ) {}
  ngOnInit() {
    this.reset();
    this.modal.ready();
    this.autoTranslationInfo = "";
    this.sub = this.sse.onMessage().subscribe((data) => {
      this.zone.run(() => {
        const message = JSON.parse(data).message;
        const data_sse = JSON.parse(data).data;

        if (message === "UPDATE_TRANSLATION") {
          this.autoTranslationInfo = `Progress: translate ${data_sse} lines...`;
        }
        if (message == "UPDATE_TRANSLATION_LINE_BY_LINE") {
          this.autoTranslationInfo = `Progress line by line: translate ${data_sse} lines...`;
        }
      });
    });
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
  }
  videoId: number = this.modal.config().data?.videoId;

  vietnameseText = "";

  copyPrompt() {
    const prompt =
      `Translate the following to Vietnamese, output line by line in format "index${expectedPrefixSymbol} vi-text" only, no extra text or explanation:\n` +
      this.transcriptLines
        .map((s, i) => `${i + 1}${expectedPrefixSymbol} ${s.text}`)
        .join("\n");
    navigator.clipboard.writeText(prompt);

    messageUtils("Copy prompt!");
  }

  isAutoTranslate = false;

  async autoTranslate() {
    this.isAutoTranslate = true;
    this.autoTranslationInfo = "Thinking...";

    const result = await callApi({
      endpoint: `api/transcripts/llm/${this.videoId}`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    messageUtils(result.message);

    await this.reset();

    await this.modal.config().data.fetchTranscriptLines();

    this.isAutoTranslate = false;
  }

  async reset() {
    const freshData = await this.modal.config().data?.fetchTranscriptLines();

    this.transcriptLines = freshData;

    this.vietnameseText = this.transcriptLines
      .map((s, i) => `${i + 1}${expectedPrefixSymbol} ${s.viText || ""}`)
      .join("\n");
  }

  async save() {
    if (!this.videoId) {
      messageUtils("videoId null");
      return;
    }

    const result = await callApi({
      endpoint: `api/transcripts/translate/${this.videoId}`,
      method: "POST",
      body: {
        ViText: this.vietnameseText,
      },
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    messageUtils(result.message);

    await this.reset();

    await this.modal.config().data.fetchTranscriptLines();
  }
}
