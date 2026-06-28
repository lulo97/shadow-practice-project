import { Component, inject } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { FormsModule } from "@angular/forms";
import { ModalService } from "../components/modal/modal.service";

@Component({
  standalone: true,
  imports: [FormsModule],
  template: ` <div id="add-video-container">
    <div class="space-y-6">
      <div id="form-group-link">
        <label
          id="lbl-ytb-link"
          class="block font-black text-sm font-mono uppercase mb-2 text-[#1A1A1A]"
        >
          YouTube Link
        </label>
        <input
          [(ngModel)]="youtube_link"
          id="ytb-link"
          type="text"
          placeholder="https://www.youtube.com/watch?v=xxxxxxxxxxx"
          class="w-full p-3 border-2 border-black bg-[#F4F3EF] focus:bg-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFDE4D] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-colors"
        />
      </div>

      <button
        (click)="handleAdd()"
        id="add-btn"
        class="w-full px-6 py-3 font-mono font-black uppercase tracking-wider bg-[#FFDE4D] text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
      >
        Add_Link
      </button>

      <p
        id="desc-note"
        class="p-3 bg-[#F4F3EF] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] font-mono font-bold text-xs text-neutral-600 leading-relaxed"
      >
        <span class="text-[#FF4E4E] font-black">WARN //</span> We will download
        the video, extract English subtitles (or use ASR if needed), and process
        it in the background.
      </p>
    </div>
  </div>`,
})
export class AddVideoComponent {
  youtube_link = "";
  private modal = inject(ModalService);

  ngOnInit() {
    this.modal.ready();
  }

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
