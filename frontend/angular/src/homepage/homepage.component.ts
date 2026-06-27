import { CommonModule } from "@angular/common";
import { Component, inject, NgZone } from "@angular/core";
import { ModalService } from "../components/modal/modal.service";
import { AddVideoComponent } from "./addvideo.component";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { Video } from "./video.interface";
import { VideoProcessComponent } from "./videoprocess.component";
import { FormsModule } from "@angular/forms";
import { FilterComponent } from "./filter.component";
import { SseService } from "../sse/sseservice.component";
import { Subscription } from "rxjs";

@Component({
  selector: "app-shadowing-homepage",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<div id="main-container" class="flex min-h-screen bg-gray-50">
    <nav
      id="sidebar"
      class="w-52 min-w-[208px] bg-white border-r border-gray-200 flex flex-col justify-between py-5"
    >
      <div id="sidebar-menu-wrapper" class="flex flex-col flex-1">
        <div
          id="project-title"
          class="flex items-center gap-2.5 px-4 pb-5 font-medium text-gray-900 text-[15px]"
        >
          <div
            id="logo-icon-wrapper"
            class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"
          >
            <i id="logo-icon" class="fa-solid fa-play text-sm"></i>
          </div>
          Shadowing Project
        </div>

        <div id="nav-links" class="flex flex-col px-2 gap-0.5">
          <button
            [class]="
              currentTab === 'MY_VIDEOS'
                ? 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium text-blue-600 bg-blue-50 w-full text-left'
                : 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 w-full text-left transition-colors'
            "
            id="nav-my-videos"
            (click)="setCurrentTab('MY_VIDEOS')"
          >
            <i
              id="nav-my-videos-icon"
              class="fa-regular fa-folder text-base"
            ></i>
            My Videos
          </button>

          <button
            [class]="
              currentTab === 'SYSTEM_VIDEOS'
                ? 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium text-blue-600 bg-blue-50 w-full text-left'
                : 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 w-full text-left transition-colors'
            "
            id="nav-system-videos"
            (click)="setCurrentTab('SYSTEM_VIDEOS')"
          >
            <i id="nav-system-videos-icon" class="fas fa-tv text-base"></i>
            System Videos
          </button>
        </div>
      </div>

      <div id="sidebar-footer-wrapper">
        <hr id="sidebar-divider" class="border-gray-200 mx-2 mb-2" />
        <div id="footer-actions" class="flex flex-col px-2 gap-0.5">
          <span
            id="profile-link"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors"
          >
            <i id="profile-icon" class="fa-regular fa-user text-base"></i>
            Profile
          </span>
          <span
            (click)="logOut()"
            id="logout-link"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors"
          >
            <i id="logout-icon" class="fas fa-right-from-bracket text-base"></i>
            Logout
          </span>
        </div>
      </div>
    </nav>

    <main id="content-area" class="flex-1 p-6 flex flex-col gap-4">
      <div id="search-bar-wrapper" class="flex items-center gap-2.5">
        <div id="search-input-container" class="relative flex-1">
          <i
            id="search-icon"
            class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
          ></i>

          <input
            [(ngModel)]="searchData.title"
            (ngModelChange)="fetchVideosDebounce()"
            id="video-search"
            type="text"
            placeholder="Search by title..."
            class="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-[13.5px] bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <button
          (click)="openFilterModal()"
          id="filter-btn"
          class="h-9 px-3 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-1.5 text-[13.5px]"
        >
          <i id="filter-icon" class="fa-solid fa-sliders text-sm"></i>
        </button>
      </div>

      <div id="action-bar" class="flex items-center justify-between">
        <button
          (click)="openModalAddVideo()"
          id="add-video-btn"
          class="h-9 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-[13.5px] font-medium rounded-lg flex items-center gap-1.5 transition-all"
        >
          <i id="add-video-icon" class="fa-solid fa-plus text-sm"></i> Add Video
        </button>
        <button
          id="jump-unfinished-btn"
          class="h-9 px-4 border border-blue-600 text-blue-600 text-[13.5px] rounded-lg hover:bg-blue-50 transition-colors"
        >
          Jump to Unfinished
        </button>
      </div>

      <section id="videos-list">
        <h2
          id="videos-list-heading"
          class="text-[14px] font-medium text-gray-900 mb-3"
        >
          {{ currentTab == "MY_VIDEOS" ? "My Videos" : "System Videos" }}
        </h2>

        <div
          *ngFor="let video of videos"
          [id]="'video-' + video.id"
        >
          <div
            [id]="'video-card-' + video.id"
            class="flex items-center gap-3.5 p-3.5 border border-gray-200 rounded-xl bg-white hover:border-gray-300 hover:shadow-sm transition-all mb-2.5"
          >
            <div
              class="relative h-[100px] aspect-video rounded-lg bg-gray-900 flex items-center justify-center transition-transform duration-300 hover:scale-105 hover:z-10"
              id="thumb-{{ video.title }}"
            >
              <ng-template #loadingThumb>
                <div
                  id="loading-thumb-container-{{ video.id }}"
                  class="flex flex-col items-center justify-center gap-2 text-gray-400"
                >
                  <i
                    id="loading-thumb-spinner-{{ video.id }}"
                    class="fa-solid fa-spinner fa-spin text-xl"
                  ></i>
                  <span
                    id="loading-thumb-text-{{ video.id }}"
                    class="text-[11px]"
                    >Loading...</span
                  >
                </div>
              </ng-template>

              <ng-container *ngIf="video.thumbnail; else loadingThumb">
                <img
                  [id]="'img-thumb-' + video.id"
                  (click)="toRecording(video.id)"
                  [src]="video.thumbnail"
                  class="w-full h-full object-cover cursor-pointer rounded-lg"
                />
              </ng-container>
            </div>

            <div
              [id]="'details-container-' + video.id"
              class="flex-1 min-w-0 flex flex-col gap-1"
            >
              <div
                [id]="'header-wrapper-' + video.id"
                class="flex items-center gap-2 flex-wrap"
              >
                <h3
                  class="text-[14px] font-medium text-gray-900 cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10"
                  id="video-title-id-{{ video.id }}"
                  (click)="toRecording(video.id)"
                >
                  {{ video.title ? video.title : "Title" }}
                </h3>

                <span
                  *ngIf="video.status == 'UNFINISHED'"
                  class="flex items-center gap-1 text-[12px] font-medium text-amber-600"
                  id="status-unfinished-{{ video.id }}"
                >
                  <i
                    [id]="'status-unfinished-icon-' + video.id"
                    class="fa-regular fa-clock text-[12px]"
                  ></i>
                  Unfinished
                </span>

                <span
                  *ngIf="video.status === 'FINISHED'"
                  class="flex items-center gap-1 text-[12px] font-medium text-green-600"
                  id="status-finished-{{ video.id }}"
                >
                  <i
                    [id]="'status-finished-icon-' + video.id"
                    class="fa-regular fa-circle-check text-[12px]"
                  ></i>
                  Finished
                </span>

                <span
                  *ngIf="video.status === 'NOT_STARTED'"
                  class="flex items-center gap-1 text-[12px] font-medium text-gray-400"
                  id="status-not-started-{{ video.title }}"
                >
                  <i
                    [id]="'status-not-started-icon-' + video.id"
                    class="fa-regular fa-circle text-[12px]"
                  ></i>
                  Not started
                </span>
              </div>

              <div
                *ngIf="video.status !== 'NOT_STARTED'"
                class="flex items-center gap-2"
                id="progress-{{ video.id }}"
              >
                <div
                  [id]="'progress-bar-bg-' + video.id"
                  class="flex-1 h-[5px] bg-gray-100 rounded-full border border-gray-200 overflow-hidden"
                >
                  <div
                    [id]="'progress-bar-fill-' + video.id"
                    class="h-full bg-blue-600 rounded-full"
                    [style.width.%]="video.processPercent"
                  ></div>
                </div>

                <span
                  [id]="'progress-text-' + video.id"
                  class="text-[12px] text-gray-500 min-w-[28px] text-right"
                >
                  {{ video.processPercent }}%
                </span>
              </div>

              <div
                *ngIf="video.status === 'NOT_STARTED'"
                class="flex items-center gap-2"
                id="progress-not-started-{{ video.id }}"
              >
                <div
                  [id]="'progress-bar-ns-bg-' + video.id"
                  class="flex-1 h-[5px] bg-gray-100 rounded-full border border-gray-200 overflow-hidden"
                >
                  <div
                    [id]="'progress-bar-ns-fill-' + video.id"
                    class="h-full bg-blue-600 rounded-full"
                    [style.width.%]="0"
                  ></div>
                </div>

                <span
                  [id]="'progress-ns-text-' + video.id"
                  class="text-[12px] text-gray-500 min-w-[28px] text-right"
                >
                  0%
                </span>
              </div>

              <div
                *ngIf="1"
                [id]="'last-practiced-container-' + video.id"
                class="flex items-center gap-1 text-[12px] text-gray-400"
              >
                <i
                  [id]="'last-practiced-icon-' + video.id"
                  class="fa-regular fa-user-circle text-[11px]"
                ></i>
                Last practiced:
                <span [id]="'last-practiced-date-' + video.id">{{
                  video.lastPracticed | date: "HH:mm:ss dd/MM/yyyy"
                }}</span>
              </div>
            </div>

            <button
              (click)="
                openVideoProcessModal(video.jobId); $event.stopPropagation()
              "
              id="video-progress-{{ video.id }}"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors border-none bg-transparent"
              aria-label="More options"
            >
              <i
                [id]="'video-progress-icon-' + video.id"
                class="fa-solid fa-ellipsis-vertical text-base"
              ></i>
            </button>
          </div>
        </div>
        <p id="videos-count-summary" class="text-[12px] text-gray-400 mt-1">
          Showing 1–{{ videos.length }} of {{ videos.length }} videos
        </p>
      </section>
    </main>
  </div>`,
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

    this.sub = this.sse.onMessage().subscribe((data) => {
      this.zone.run(() => {
        const message = JSON.parse(data).message;

        console.log({ message });

        if (message === "RESET_HOMEPAGE") {
          this.fetchVideos();
          console.log("RUN fetchVideos by SSE");
        }
      });
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
  private sub!: Subscription;
  constructor(
    private sse: SseService,
    private zone: NgZone,
  ) {}

  private debounceTimer: any;

  async fetchVideosDebounce() {
    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.fetchVideos();
    }, 500);
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

    queryParams.append("videoType", this.currentTab);

    const queryString = queryParams.toString();
    const url = queryString ? `api/videos?${queryString}` : "api/videos";

    const result = await callApi({
      endpoint: url,
      method: "GET",
      credentials: "include",
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

  setCurrentTab(tab: string) {
    this.currentTab = tab;
    this.fetchVideos();
  }

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

  async logOut() {
    const result = await callApi({
      endpoint: `api/auth/logout`,
      method: "POST",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    } else {
      window.location.href = "/login";
    }
  }
}
