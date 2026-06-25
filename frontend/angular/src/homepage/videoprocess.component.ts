import { Component, inject } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { FormsModule } from "@angular/forms";
import { ModalService } from "../components/modal/modal.service";
import { Job, JobStep } from "./job.interface";
import { JsonPipe } from "@angular/common";

@Component({
  standalone: true,
  imports: [FormsModule, JsonPipe],
  template: `
    <div class="json-container">
      <pre>{{ data | json }}</pre>
    </div>
  `,
  styles: [
    `
      .json-container {
        max-height: 300px; /* Adjust height as needed */
        overflow-y: auto; /* Adds vertical scrollbar when content is too long */
        background-color: #f4f4f4;
        padding: 10px;
        border: 1px solid #ccc;
      }
    `,
  ],
})
export class VideoProcessComponent {
  youtube_link = "";
  private modal = inject(ModalService);
  data: {
    job: Job;
    jobSteps: JobStep[];
  } | null = null;

  async ngOnInit(): Promise<void> {
    const jobId = this.modal.config().data?.jobId;

    const result = await callApi({
      endpoint: `api/job/video-detail/${jobId}`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.data = result.data;
  }
}
