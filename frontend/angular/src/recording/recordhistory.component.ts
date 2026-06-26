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
    <div class="w-[80vw] h-[60vh] overflow-x-auto rounded-lg border border-gray-200">
      <table class="w-full text-left text-sm text-gray-600">
        <thead
          class="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700 border-b border-gray-200"
        >
          <tr>
            <th class="px-4 py-3 w-16">No.</th>
            <th class="px-4 py-3">Created at</th>
            <th class="px-4 py-3">Heard text</th>
            <th class="px-4 py-3">Score</th>
            <th class="px-4 py-3">STT Model Key</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-200 bg-white">
          @if (records && records.length > 0) {
            @for (record of records; track record; let i = $index) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-medium text-gray-900">{{ i + 1 }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  {{ record.createdAt | date: "short" }}
                </td>
                <td class="px-4 py-3 max-w-xs truncate">
                  {{ record.sttText || "-" }}
                </td>
                <td class="px-4 py-3">{{ record.score }}</td>
                <td class="px-4 py-3 font-mono text-xs text-gray-500">
                  {{ record.sttProviderKey }}
                </td>
              </tr>
            }
          } @else {
            <tr>
              <td
                colspan="5"
                class="px-4 py-8 text-center text-gray-400 italic"
              >
                No records available.
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
