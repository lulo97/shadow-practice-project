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
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th class="border border-gray-300 px-2 py-1 text-left bg-gray-100">
            No.
          </th>
          <th class="border border-gray-300 px-2 py-1 text-left bg-gray-100">
            Created at
          </th>
          <th class="border border-gray-300 px-2 py-1 text-left bg-gray-100">
            Heard text
          </th>
          <th class="border border-gray-300 px-2 py-1 text-left bg-gray-100">
            Score
          </th>
          <th class="border border-gray-300 px-2 py-1 text-left bg-gray-100">
            STT Model Key
          </th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let record of records; let i = index">
          <td class="border border-gray-300 px-2 py-1">{{ i + 1 }}</td>
          <td class="border border-gray-300 px-2 py-1">
            {{ record.createdAt | date: "short" }}
          </td>
          <td class="border border-gray-300 px-2 py-1">{{ record.sttText || "-" }}</td>
          <td class="border border-gray-300 px-2 py-1">{{ record.score }}</td>
          <td class="border border-gray-300 px-2 py-1">
            {{ record.sttProviderKey }}
          </td>
        </tr>
      </tbody>
    </table>
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
  }

  async fetchRecords() {
    const result = await callApi({
      endpoint: `api/records/transcript-line/${this.transcriptLineId}`,
      method: "GET"
    })

    if (!result.success) {
      messageUtils(result.message)
      return;
    }

    this.records = result.data;
  }
}
