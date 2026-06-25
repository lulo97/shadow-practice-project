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
  styles: [`
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background-color: #f4f4f4; }
  `],
  template: `
    <table>
      <thead>
        <tr>
          <th>No.</th>
          <th>Created at</th>
          <th>Heard text</th>
          <th>Score</th>
          <th>STT Model Key</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let record of records; let i = index">
          <td>{{ i + 1 }}</td>
          <td>{{ record.createdAt | date:'short' }}</td>
          <td>{{ record.sttText }}</td>
          <td>{{ record.score }}</td>
          <td>{{ record.sttProviderKey }}</td>
        </tr>
      </tbody>
    </table>
  `,
})
export class RecordHistoryComponent {
  private modal = inject(ModalService);

  records: Record[] = this.modal.config().data?.records;

  ngOnInit() {
//     [{
//     "id": 1,
//     "sttText": "*Pewds*",
//     "score": 100,
//     "sttProviderKey": "WHISPER_CPP",
//     "createdAt": "2026-06-25T21:29:19.3838918Z"
// }]
    console.log(this.records)
  }
}
