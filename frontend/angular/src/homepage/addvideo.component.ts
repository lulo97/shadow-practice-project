import { Component } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { FormsModule } from "@angular/forms";

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `<div>
    <div>
      <label>Youtube Link</label>
      <input [(ngModel)]="youtube_link" id="ytb-link" />
    </div>
    <div>
      <button (click)="handleAdd()" id="add-btn">Add</button>
    </div>
  </div>`,
})
export class AddVideoComponent {
  youtube_link = "";

  async handleAdd() {
    if (!this.youtube_link) {
      alert("Youtube link null!");
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
  }
}
