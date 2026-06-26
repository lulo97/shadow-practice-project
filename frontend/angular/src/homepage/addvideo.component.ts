import { Component, inject } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { FormsModule } from "@angular/forms";
import { ModalService } from "../components/modal/modal.service";

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `<div class="p-4 max-w-lg">
  <div class="mb-3">
    <label class="block text-sm font-medium text-gray-900 mb-2">
      YouTube Link
    </label>
    <input
      [(ngModel)]="youtube_link"
      id="ytb-link"
      type="text"
      placeholder="https://www.youtube.com/watch?v=xxxxxxxxxxx"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
  <button
    (click)="handleAdd()"
    id="add-btn"
    class="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-lg transition-colors"
  >
    Add
  </button>
  <p class="mt-4 text-sm text-gray-500 leading-relaxed">
    We will download the video, extract English subtitles (or use ASR if needed), and process it in the background.
  </p>
</div>`,
})
export class AddVideoComponent {
  youtube_link = "";
  private modal = inject(ModalService);

  async handleAdd() {
    if (!this.youtube_link) {
      messageUtils("Youtube link null!");
      return;
    }

    const result = await callApi({
      endpoint: "api/job/video",
      body: {
        YoutubeLink: this.youtube_link,
      },
      method: "POST",
      credentials: "include",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.modal.close({});
  }
}
