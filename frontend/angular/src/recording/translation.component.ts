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
    <div>
      <div class="flex gap-2 items-stretch">
        <div id="left-layout" class="w-1/2 h-full">
          <div class="flex justify-between">
            <div id="tab-english">English transcript</div>
            <button id="tab-copy-prompt" (click)="copyPrompt()">
              Copy + Prompt
            </button>
          </div>

          <div id="panel-english" class="panel">
            <div *ngFor="let ele of transcriptLines; let i = index">
              <div>{{ i + 1 }}: {{ ele.text }}</div>
              <hr />
            </div>
          </div>
        </div>

        <div id="right-layout" class="w-1/2 h-full flex flex-col">
          <div id="tab-vietnamese">Vietnamese transcript</div>

          <!-- Right: Vietnamese transcript (editable) -->
          <textarea
            id="vietnamese-transcript-textarea"
            [(ngModel)]="vietnameseText"
            placeholder="Paste Vietnamese translation here..."
            class="w-full h-[300px]"
          ></textarea>
        </div>
      </div>

      <!-- Footer actions -->
      <div id="translation-footer" class="footer">
        <button id="btn-auto-translation" class="btn" (click)="autoTranslate()">
          Auto translation
        </button>
        <button id="btn-save" class="btn btn-primary" (click)="save()">
          Save
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .panels {
        display: flex;
        gap: 8px;
        height: 220px;
      }
      .panel {
        flex: 1;
        border: 1px solid #ccc;
        padding: 8px;
        /* Constrain height to enable internal scrolling */
        height: 300px;
        overflow-y: auto;
      }
      .sentence-list {
        margin: 0;
        padding-left: 20px;
        font-size: 13px;
      }
      .viet-textarea {
        width: 100%;
        height: 100%;
        border: none;
        resize: none;
        font-size: 13px;
        outline: none;
      }
      .footer {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      .btn {
        padding: 6px 14px;
        border: 1px solid #ccc;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
      }
      .btn-primary {
        background: #1a73e8;
        color: #fff;
        border-color: #1a73e8;
      }
    `,
  ],
})
export class TranslationComponent {
  private modal = inject(ModalService);

  transcriptLines: TranscriptLine[] = [];

  ngOnInit() {
    this.reset()
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

  autoTranslate() {
    /* call LLM API */
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
  }
}
