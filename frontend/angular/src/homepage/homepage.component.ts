import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ModalService } from "../components/modal/modal.service";
import { AddVideoComponent } from "./addvideo.component";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { Video } from "./video.interface";
import { VideoProcessComponent } from "./videoprocess.component";
import { FormsModule } from "@angular/forms";
import { FilterComponent } from "./filter.component";

@Component({
  selector: "app-shadowing-homepage",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<div id="main-container">
    <nav id="sidebar" class="flex flex-col justify-between">
      <div id="project-title">Shadowing Project</div>
      <div id="nav-links" class="flex flex-col items-start flex-1">
        <button
          [class]="currentTab === 'MY_VIDEOS' ? 'font-bold' : ''"
          id="nav-my-videos"
          (click)="currentTab = 'MY_VIDEOS'"
        >
          My Videos
        </button>
        <button
          [class]="currentTab === 'SYSTEM_VIDEOS' ? 'font-bold' : ''"
          id="nav-system-videos"
          (click)="currentTab = 'SYSTEM_VIDEOS'"
        >
          System Videos
        </button>
        <button (click)="openModalAddVideo()" id="nav-add-video">
          + Add Video
        </button>
      </div>
      <hr />
      <div id="footer-actions" class="flex flex-col items-start">
        <span id="profile-link">Profile</span>
        <span id="logout-link">Logout</span>
      </div>
    </nav>

    <main id="content-area">
      <div id="search-bar-wrapper">
        <input
          [(ngModel)]="searchData.title"
          (ngModelChange)="fetchVideos()"
          id="video-search"
          type="text"
          placeholder="Search by title..."
        />
        <button (click)="openFilterModal()" id="filter-btn">Filter</button>
      </div>

      <div id="action-bar">
        <button id="jump-unfinished-btn">Jump to Unfinished</button>
      </div>

      <section id="videos-list">
        <h2>My Videos</h2>
        <div
          *ngFor="let video of videos"
          class="video-card"
          [id]="'video-' + video.title.replace(' ', '-')"
          (click)="toRecording(video.id)"
        >
          <div class="thumbnail-placeholder" id="thumb-{{ video.title }}">
            <img src="{{ video.thumbnail }}" />
          </div>
          <div class="video-details">
            <h3 id="title-{{ video.title }}">{{ video.title }}</h3>
            <span id="status-{{ video.title }}">{{ "finished" }}</span>
            <div class="progress-bar" id="progress-{{ video.title }}">
              <div [style.width.%]="65"></div>
            </div>
          </div>
          <div>
            <button
              (click)="openVideoProcessModal(video.jobId)"
              id="video-progress"
            >
              ⋮
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>`,
  styles: `
    /* Minimal layout structure */
    #main-container {
      display: flex;
      height: 100vh;
    }

    #sidebar {
      width: 250px;
      border-right: 1px solid #ccc;
      padding: 20px;
    }

    #content-area {
      flex-grow: 1;
      padding: 20px;
    }

    .video-card {
      display: flex;
      margin-bottom: 20px;
      border: 1px solid #ddd;
      padding: 10px;
    }

    .thumbnail-placeholder {
      width: 150px;
      aspect-ratio: 16 / 9;
      background-color: #eee;
      margin-right: 15px;
      overflow: hidden;
    }

    .thumbnail-placeholder img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .progress-bar {
      width: 100%;
      height: 10px;
      background-color: #eee;
    }
  `,
})
export class HomepageComponent {
  searchData = {
    title: "",
    fromDate: "",
    toDate: "",
  };

  videos: Video[] = [];

  ngOnInit(): void {
    this.fetchVideos();
  }

  async fetchVideos() {
    const queryParams = new URLSearchParams();

    // Only add parameters if they have values
    if (this.searchData.title) {
      queryParams.append("title", this.searchData.title);
    }
    if (this.searchData.fromDate) {
      queryParams.append("fromDate", this.searchData.fromDate);
    }
    if (this.searchData.toDate) {
      queryParams.append("toDate", this.searchData.toDate);
    }

    const queryString = queryParams.toString();
    const url = queryString ? `api/videos?${queryString}` : "api/videos";

    const result = await callApi({
      endpoint: url,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.videos = result.data;

    const thumbnailPromises = this.videos.map((video) =>
      this.fetchVideoThumbnail(video.id),
    );

    await Promise.all(thumbnailPromises);
  }

  async fetchVideoThumbnail(video_id: number) {
    const result = await callApi({
      endpoint: `api/videos/thumbnail/${video_id}`,
      method: "GET",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    if (result.contentType && !result.contentType.includes("image")) {
      console.log("thumbnail not ready yet");
      return;
    }

    // Update the specific video object
    const video = this.videos.find((ele) => ele.id === video_id);
    if (video) {
      video.thumbnail = result.data.url;
    }
  }

  currentTab = "MY_VIDEOS"; //SYSTEM_VIDEOS

  private modal = inject(ModalService);

  openModalAddVideo() {
    this.modal.open({
      title: "Add Video Modal",
      component: AddVideoComponent,
      size: "lg",
      onClose: (result) => {
        this.fetchVideos();
      },
    });
  }

  openVideoProcessModal(jobId: number | undefined) {
    if (!jobId) {
      messageUtils("Video don't have job id!");
      return;
    }

    this.modal.open({
      title: "Video Process Modal",
      component: VideoProcessComponent,
      size: "lg",
      data: { jobId },
      onClose: (result) => {
        this.fetchVideos();
      },
    });
  }

  toRecording(videoId: number) {
    window.location.href = `recording/${videoId}`;
  }

  openFilterModal() {
    this.modal.open({
      title: "Filter Modal",
      component: FilterComponent,
      size: "lg",
      onClose: async () => {
        //await this.fetchTranscriptLines()
      },
      data: {
        handleFilter: (fromDate: string, toDate: string) => {
          this.searchData.fromDate = fromDate;
          this.searchData.toDate = toDate;
          this.fetchVideos();
        },
        fromDate: this.searchData.fromDate,
        toDate: this.searchData.toDate,
      },
    });
  }
}
