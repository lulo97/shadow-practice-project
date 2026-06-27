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
    <div id="main-container" class="w-[80vw] h-[80vh] flex flex-col">
      <div id="layout-wrapper" class="flex gap-2 flex-1 min-h-0">
        <!-- Left Panel -->
        <div id="left-layout" class="w-1/2 flex flex-col min-h-0">
          <div
            id="left-header"
            class="flex justify-between items-start mb-2 shrink-0"
          >
            <div>
              <div id="tab-english" class="font-bold">English transcript</div>
              <div class="text-sm text-gray-500 italic">
                Paste to ChatGPT by copy prompt
              </div>
            </div>
          </div>

          <div
            id="panel-english"
            class="flex-1 border border-gray-300 p-2 overflow-y-auto min-h-0"
          >
            <div
              id="transcript-loop"
              *ngFor="let ele of transcriptLines; let i = index"
            >
              <div id="transcript-line-{{ i }}" class="text-sm">
                {{ i + 1 }}: {{ ele.text }}
              </div>
              <hr
                id="transcript-divider-{{ i }}"
                class="my-1 border-gray-200"
              />
            </div>
          </div>
        </div>

        <!-- Right Panel -->
        <div id="right-layout" class="w-1/2 flex flex-col min-h-0">
          <div class="mb-2 shrink-0">
            <div id="tab-vietnamese" class="font-medium">
              Vietnamese transcript
            </div>
            <div class="text-sm text-gray-500 italic">
              Edit vietnamese translation freely and click saved!
            </div>
          </div>

          <textarea
            id="vietnamese-transcript-textarea"
            [(ngModel)]="vietnameseText"
            placeholder="Paste Vietnamese translation here..."
            class="flex-1 w-full border border-gray-300 p-2 resize-none text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-0"
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div
        id="translation-footer"
        class="flex gap-2 justify-end items-center mt-3 shrink-0"
      >
        <div class="flex-1 text-gray-500 italic text-sm">
          {{ this.autoTranslationInfo }}
        </div>
        <button
          id="tab-copy-prompt"
          (click)="copyPrompt()"
          class="px-3.5 py-1.5 border border-gray-300 bg-white cursor-pointer text-sm hover:bg-gray-50 transition-colors shrink-0"
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
          class="px-3.5 py-1.5 border border-gray-300 bg-white cursor-pointer text-sm hover:bg-gray-50 transition-colors"
        >
          <i
            *ngIf="isAutoTranslate"
            class="fa-solid fa-spinner fa-spin mr-1"
          ></i>
          Auto translation
        </button>

        <button
          id="btn-save"
          (click)="save()"
          class="px-3.5 py-1.5 border border-blue-600 bg-blue-600 text-white cursor-pointer text-sm hover:bg-blue-700 transition-colors"
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
