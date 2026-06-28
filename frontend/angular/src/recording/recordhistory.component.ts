import { Component, inject } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { FormsModule } from "@angular/forms";
import { ModalService } from "../components/modal/modal.service";
import { TranscriptLine } from "./transcriptline.interface";
import { CommonModule } from "@angular/common";
import { Record } from "./transcriptline.interface";

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div
      id="table-container"
      class="relative w-[80vw] h-[60vh] overflow-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] font-mono select-none"
    >
      <table
        id="records-table"
        class="w-full text-left text-sm text-[#1A1A1A] border-collapse"
      >
        <thead
          id="table-header"
          class="bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest sticky top-0 border-b-4 border-black z-10 h-[5vh]"
        >
          <tr id="header-row">
            <th
              id="th-index"
              class="px-4 py-4 w-16 border-r-2 border-neutral-700"
            >
              No.
            </th>
            <th
              id="th-created-at"
              class="px-4 py-4 border-r-2 border-neutral-700"
            >
              Created at
            </th>
            <th
              id="th-heard-text"
              class="px-4 py-4 border-r-2 border-neutral-700"
            >
              Heard text
            </th>
            <th id="th-score" class="px-4 py-4 border-r-2 border-neutral-700">
              Score
            </th>
            <th id="th-model-key" class="px-4 py-4">STT Model Key</th>
          </tr>
        </thead>
        <tbody id="table-body" class="divide-y-2 divide-black bg-white">
          @if (records && records.length > 0) {
            @for (record of records; track record; let i = $index) {
              <tr
                id="record-row-{{ i }}"
                class="hover:bg-[#FFDE4D]/15 transition-colors group"
              >
                <td
                  id="td-index-{{ i }}"
                  class="px-4 py-3.5 font-black text-black border-r-2 border-black/10 bg-[#F4F3EF]/40 text-center"
                >
                  {{ i + 1 }}
                </td>
                <td
                  id="td-created-at-{{ i }}"
                  class="px-4 py-3.5 whitespace-nowrap font-bold text-neutral-700 border-r-2 border-black/10"
                >
                  {{ record.createdAt | date: "short" }}
                </td>
                <td
                  id="td-heard-text-{{ i }}"
                  class="px-4 py-3.5 max-w-xs truncate font-medium text-neutral-800 border-r-2 border-black/10"
                >
                  {{ record.sttText || "-" }}
                </td>
                <td
                  id="td-score-{{ i }}"
                  class="px-4 py-3.5 font-black text-black border-r-2 border-black/10"
                >
                  <span
                    class="inline-block px-2 py-0.5 bg-[#00E5FF] border-2 border-black text-xs font-black shadow-[1px_1px_0px_0px_#000]"
                  >
                    {{ record.score }}
                  </span>
                </td>
                <td
                  id="td-model-key-{{ i }}"
                  class="px-4 py-3.5 font-mono text-xs font-bold text-neutral-500 uppercase tracking-tight"
                >
                  {{ record.sttProviderKey }}
                </td>
              </tr>
            }
          } @else {
            <tr>
              <td id="td-empty-message" colspan="5" class="p-0">
                <div
                  class="absolute inset-0 top-[5vh] flex items-center justify-center bg-[#FF4E4E]/5 text-[#FF4E4E] font-black uppercase tracking-wider"
                >
                  !! NO_RECORDS_AVAILABLE // SYSTEM_EMPTY
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class RecordHistoryComponent {
  private modal = inject(ModalService);

  transcriptLineId: string = this.modal.config().data?.transcriptLineId;

  records: Record[] = [];

  ngOnInit() {
    //     [{
    //     "id": 1,
    //     "sttText": "*Pewds*",
    //     "score": 100,
    //     "sttProviderKey": "WHISPER_CPP",
    //     "createdAt": "2026-06-25T21:29:19.3838918Z"
    // }]
    console.log(this.transcriptLineId);

    this.fetchRecords();

    this.modal.ready();
  }

  async fetchRecords() {
    const result = await callApi({
      endpoint: `api/records/transcript-line/${this.transcriptLineId}`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.records = result.data;
  }
}
