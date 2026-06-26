import { Component, inject } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { FormsModule } from "@angular/forms";
import { ModalService } from "../components/modal/modal.service";
import { TranscriptLine } from "./transcriptline.interface";
import { CommonModule } from "@angular/common";
import { expectedPrefixSymbol } from "./utils";

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
  <div class="w-[90vw] h-[80vh]">
  <div class="flex gap-2 items-stretch">
    <!-- Left Layout -->
    <div id="left-layout" class="w-1/2 h-full">
      <div class="flex justify-between mb-2 h-[5vh]">
        <div id="tab-english" class="font-bold">English transcript</div>
        <button 
          id="tab-copy-prompt" 
          (click)="copyPrompt()"
          class="px-3.5 py-1.5 border border-gray-300 bg-white cursor-pointer text-sm hover:bg-gray-50 transition-colors"
        >
          Copy + Prompt
        </button>
      </div>

      <div 
        id="panel-english" 
        class="flex-1 border border-gray-300 p-2 h-[65vh] overflow-y-auto"
      >
        <div *ngFor="let ele of transcriptLines; let i = index">
          <div class="text-sm">{{ i + 1 }}: {{ ele.text }}</div>
          <hr class="my-1 border-gray-200" />
        </div>
      </div>
    </div>

    <!-- Right Layout -->
    <div id="right-layout" class="w-1/2 h-full flex flex-col">
      <div id="tab-vietnamese" class="mb-2 font-medium h-[5vh]">Vietnamese transcript</div>

      <!-- Vietnamese transcript textarea -->
      <textarea
        id="vietnamese-transcript-textarea"
        [(ngModel)]="vietnameseText"
        placeholder="Paste Vietnamese translation here..."
        class="w-full h-[65vh] border border-gray-300 p-2 resize-none text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      ></textarea>
    </div>
  </div>

  <!-- Footer actions -->
  <div 
    id="translation-footer" 
    class="flex gap-2 justify-end mt-4"
  >
    <button 
      id="btn-auto-translation" 
      (click)="autoTranslate()"
      class="px-3.5 py-1.5 border border-gray-300 bg-white cursor-pointer text-sm hover:bg-gray-50 transition-colors"
    >
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

  transcriptLines: TranscriptLine[] = [];

  ngOnInit() {
    this.reset();
    this.modal.ready();
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

  async autoTranslate() {
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
