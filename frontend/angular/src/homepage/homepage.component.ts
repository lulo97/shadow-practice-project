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
  template: ` <div
    id="main-container"
    class="relative z-10 flex h-screen bg-[#F4F3EF] text-[#1A1A1A] font-mono overflow-hidden"
  >
    <div
      class="fixed inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"
    ></div>

    <nav
      id="sidebar"
      class="relative z-10 w-64 min-w-[256px] bg-[#1A1A1A] text-white border-r-4 border-black flex flex-col justify-between py-6"
    >
      <div id="sidebar-menu-wrapper" class="flex flex-col flex-1">
        <div
          id="project-title"
          class="flex items-center gap-2.5 px-4 pb-6 font-black tracking-tighter"
        >
          <div
            id="logo-icon-wrapper"
            class="w-8 h-8 bg-[#FF4E4E] border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-black"
          >
            <i id="logo-icon" class="fa-solid fa-play text-xs"></i>
          </div>
          <span class="text-md uppercase tracking-tight text-[#FFDE4D]"
            >Shadowing_Proj //</span
          >
        </div>

        <div id="nav-links" class="flex flex-col px-3 gap-2">
          <button
            [class]="
              currentTab === 'MY_VIDEOS'
                ? 'flex items-center gap-2.5 px-4 py-2.5 border-2 border-black bg-[#FFDE4D] text-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] w-full text-left cursor-pointer transition-all'
                : 'flex items-center gap-2.5 px-4 py-2.5 font-bold uppercase text-xs text-[#A3A3A3] hover:text-[#FFDE4D] hover:bg-[#2A2A2A] w-full text-left cursor-pointer transition-all'
            "
            id="nav-my-videos"
            (click)="setCurrentTab('MY_VIDEOS')"
          >
            <i id="nav-my-videos-icon" class="fa-regular fa-folder text-sm"></i>
            >> MY_VIDEOS
          </button>

          <button
            [class]="
              currentTab === 'SYSTEM_VIDEOS'
                ? 'flex items-center gap-2.5 px-4 py-2.5 border-2 border-black bg-[#FFDE4D] text-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] w-full text-left cursor-pointer transition-all'
                : 'flex items-center gap-2.5 px-4 py-2.5 font-bold uppercase text-xs text-[#A3A3A3] hover:text-[#FFDE4D] hover:bg-[#2A2A2A] w-full text-left cursor-pointer transition-all'
            "
            id="nav-system-videos"
            (click)="setCurrentTab('SYSTEM_VIDEOS')"
          >
            <i id="nav-system-videos-icon" class="fas fa-tv text-sm"></i>
            >> SYSTEM_VIDEOS
          </button>
        </div>
      </div>

      <div id="sidebar-footer-wrapper">
        <hr id="sidebar-divider" class="border-[#333] mx-3 mb-4" />
        <div id="footer-actions" class="flex flex-col px-3 gap-1">
          <span
            id="profile-link"
            class="flex items-center gap-2.5 px-4 py-2 text-xs font-bold uppercase text-[#A3A3A3] hover:text-[#00E5FF] hover:bg-[#2A2A2A] cursor-pointer transition-colors"
          >
            <i id="profile-icon" class="fa-regular fa-user text-sm"></i>
            User_Profile
          </span>
          <span
            (click)="logOut()"
            id="logout-link"
            class="flex items-center gap-2.5 px-4 py-2 text-xs font-bold uppercase text-[#A3A3A3] hover:text-[#FF4E4E] hover:bg-[#2A2A2A] cursor-pointer transition-colors"
          >
            <i id="logout-icon" class="fas fa-right-from-bracket text-sm"></i>
            Term_Logout
          </span>
        </div>
        <div class="px-7 pt-4 text-[10px] text-[#666] uppercase tracking-wider">
          ENV: PROD_STAGE // MAIN_CORE
        </div>
      </div>
    </nav>

    <main
      id="content-area"
      class="relative z-10 flex-1 min-h-0 p-8 flex flex-col gap-6 overflow-hidden"
    >
      <div id="search-bar-wrapper" class="flex items-center gap-4">
        <div id="search-input-container" class="relative flex-1">
          <i
            id="search-icon"
            class="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-black text-sm"
          ></i>

          <input
            [(ngModel)]="searchData.title"
            (ngModelChange)="fetchVideosDebounce()"
            id="video-search"
            type="text"
            placeholder="Registry search by title..."
            class="w-full h-12 pl-11 pr-4 border-2 border-black bg-white focus:bg-[#FFDE4D]/10 font-black uppercase text-xs placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#FFDE4D] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)] transition-all"
          />
        </div>
        <button
          (click)="openFilterModal()"
          id="filter-btn"
          class="h-12 px-4 border-2 border-black bg-white hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] transition-all flex items-center justify-center text-black cursor-pointer"
        >
          <i id="filter-icon" class="fa-solid fa-sliders text-sm"></i>
        </button>
      </div>

      <div id="action-bar" class="flex items-center gap-4">
        <button
          (click)="openModalAddVideo()"
          id="add-video-btn"
          class="h-12 px-6 bg-[#FFDE4D] border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none font-black uppercase text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer"
        >
          <i id="add-video-icon" class="fa-solid fa-plus text-sm"></i>
          Add_Video_Stream
        </button>
        <button
          (click)="jumpToUnfinished()"
          id="jump-unfinished-btn"
          class="h-12 px-6 border-2 border-black bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:bg-neutral-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] font-black uppercase text-xs transition-all cursor-pointer"
        >
          Jump_To_Unfinished
        </button>
      </div>

      <section id="videos-list" class="flex-1 min-h-0 overflow-y-auto pr-2">
        <div
          class="inline-block bg-black text-white px-3 py-1 text-[11px] font-black border-2 border-black uppercase tracking-widest mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
        >
          {{
            currentTab == "MY_VIDEOS"
              ? "INDEX // MY_VIDEOS"
              : "INDEX // SYSTEM_VIDEOS"
          }}
        </div>

        <div
          *ngFor="let video of videos"
          [id]="'video-' + video.id"
          class="mb-4"
        >
          <div
            [id]="'video-card-' + video.id"
            class="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] transition-all"
          >
            <div
              class="relative h-[90px] aspect-video border-2 border-black bg-black flex items-center justify-center overflow-hidden shrink-0"
              id="thumb-{{ video.title }}"
            >
              <ng-template #loadingThumb>
                <div
                  id="loading-thumb-container-{{ video.id }}"
                  class="flex flex-col items-center justify-center gap-1.5 text-[#A3A3A3]"
                >
                  <i
                    id="loading-thumb-spinner-{{ video.id }}"
                    class="fa-solid fa-spinner fa-spin text-md text-[#FFDE4D]"
                  ></i>
                  <span
                    id="loading-thumb-text-{{ video.id }}"
                    class="text-[10px] font-bold tracking-tight"
                    >PARSING...</span
                  >
                </div>
              </ng-template>

              <ng-container *ngIf="video.thumbnail; else loadingThumb">
                <img
                  [id]="'img-thumb-' + video.id"
                  (click)="toRecording(video.id)"
                  [src]="video.thumbnail"
                  class="w-full h-full object-cover cursor-pointer grayscale hover:grayscale-0 transition-all"
                />
              </ng-container>
            </div>

            <div
              [id]="'details-container-' + video.id"
              class="flex-1 min-w-0 flex flex-col gap-2"
            >
              <div
                [id]="'header-wrapper-' + video.id"
                class="flex items-center gap-3 flex-wrap"
              >
                <h3
                  class="text-[15px] font-black uppercase text-black cursor-pointer hover:underline tracking-tight"
                  id="video-title-id-{{ video.id }}"
                  (click)="toRecording(video.id)"
                >
                  {{ video.title ? video.title : "Unassigned_Title.raw" }}
                </h3>

                <span
                  *ngIf="video.status == 'UNFINISHED'"
                  class="px-2 py-0.5 font-black text-[10px] uppercase bg-[#FF8A00] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                  id="status-unfinished-{{ video.id }}"
                >
                  Unfinished
                </span>

                <span
                  *ngIf="video.status === 'FINISHED'"
                  class="px-2 py-0.5 font-black text-[10px] uppercase bg-[#2FD673] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                  id="status-finished-{{ video.id }}"
                >
                  Finished
                </span>

                <span
                  *ngIf="video.status === 'NOT_STARTED'"
                  class="px-2 py-0.5 font-bold text-[10px] uppercase bg-black text-white border border-black"
                  id="status-not-started-{{ video.title }}"
                >
                  Not_Started
                </span>
              </div>

              <div
                *ngIf="video.status !== 'NOT_STARTED'"
                class="flex items-center gap-3"
                id="progress-{{ video.id }}"
              >
                <div
                  [id]="'progress-bar-bg-' + video.id"
                  class="flex-1 h-3 bg-[#F4F3EF] border-2 border-black overflow-hidden"
                >
                  <div
                    [id]="'progress-bar-fill-' + video.id"
                    class="h-full bg-[#00E5FF] border-r-2 border-black"
                    [style.width.%]="video.processPercent"
                  ></div>
                </div>

                <span
                  [id]="'progress-text-' + video.id"
                  class="text-[11px] font-black text-black min-w-[32px] text-right bg-[#00E5FF] px-1 border border-black"
                >
                  {{ video.processPercent }}%
                </span>
              </div>

              <div
                *ngIf="video.status === 'NOT_STARTED'"
                class="flex items-center gap-3"
                id="progress-not-started-{{ video.id }}"
              >
                <div
                  [id]="'progress-bar-ns-bg-' + video.id"
                  class="flex-1 h-3 bg-[#F4F3EF] border-2 border-black overflow-hidden"
                >
                  <div
                    [id]="'progress-bar-ns-fill-' + video.id"
                    class="h-full bg-neutral-400"
                    [style.width.%]="0"
                  ></div>
                </div>

                <span
                  [id]="'progress-ns-text-' + video.id"
                  class="text-[11px] font-bold text-neutral-400 min-w-[32px] text-right"
                >
                  0%
                </span>
              </div>

              <div
                *ngIf="1"
                [id]="'last-practiced-container-' + video.id"
                class="flex items-center gap-1 text-[11px] font-bold text-neutral-500 uppercase"
              >
                <i
                  [id]="'last-practiced-icon-' + video.id"
                  class="fa-regular fa-user-circle text-[11px]"
                ></i>
                Sync_Stamp:
                <span
                  [id]="'last-practiced-date-' + video.id"
                  class="text-black font-black"
                  >{{ video.lastPracticed | date: "HH:mm:ss dd/MM/yyyy" }}</span
                >
              </div>
            </div>

            <button
              (click)="
                openVideoProcessModal(video.jobId); $event.stopPropagation()
              "
              id="video-progress-{{ video.id }}"
              class="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-[#FF4E4E] hover:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0"
              aria-label="More options"
            >
              <i
                [id]="'video-progress-icon-' + video.id"
                class="fa-solid fa-ellipsis-vertical text-md"
              ></i>
            </button>
          </div>
        </div>

        <p
          id="videos-count-summary"
          class="inline-block p-2 bg-white border-2 border-black font-bold text-[11px] text-black uppercase mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
        >
          LOG_METRIC: Showing 1–{{ videos.length }} of
          {{ videos.length }} matrices loaded
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

  jumpToUnfinished() {
    const latestUnfinished = this.videos.find(
      (ele) => ele.status !== "FINISHED",
    );

    if (!latestUnfinished) return;

    const el = document.getElementById(`video-${latestUnfinished.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
