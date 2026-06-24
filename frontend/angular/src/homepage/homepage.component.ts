import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ModalService } from "../components/modal/modal.service";
import { AddVideoComponent } from "./addvideo.component";

@Component({
  selector: "app-shadowing-homepage",
  standalone: true,
  imports: [CommonModule],
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
        <input id="video-search" type="text" placeholder="Search by title..." />
        <button id="filter-btn">Filter</button>
      </div>

      <div id="action-bar">
        <button id="add-video-btn">+ Add Video</button>
        <button id="jump-unfinished-btn">Jump to Unfinished</button>
      </div>

      <section id="videos-list">
        <h2>My Videos</h2>
        <div
          *ngFor="let video of videos"
          class="video-card"
          [id]="'video-' + video.title.replace(' ', '-')"
        >
          <div class="thumbnail-placeholder" id="thumb-{{ video.title }}"></div>
          <div class="video-details">
            <h3 id="title-{{ video.title }}">{{ video.title }}</h3>
            <span id="status-{{ video.title }}">{{ video.status }}</span>
            <div class="progress-bar" id="progress-{{ video.title }}">
              <div [style.width.%]="video.progress"></div>
            </div>
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
      height: 80px;
      background-color: #eee;
      margin-right: 15px;
    }

    .progress-bar {
      width: 100%;
      height: 10px;
      background-color: #eee;
    }
  `,
})
export class HomepageComponent {
  // You would typically fetch this data from a service
  videos = [
    {
      title: "TedTalk video about cats!",
      status: "Unfinished",
      progress: 65,
      duration: "12:35",
    },
    {
      title: "How to build good habits",
      status: "Finished",
      progress: 100,
      duration: "08:42",
    },
    {
      title: "The future of space exploration",
      status: "Not started",
      progress: 0,
      duration: "15:20",
    },
  ];

  currentTab = "MY_VIDEOS"; //SYSTEM_VIDEOS

  private modal = inject(ModalService);

  openModalAddVideo() {
    this.modal.open({
      title: "Add Video Modal",
      component: AddVideoComponent, // renders any component
      size: "lg",
    });
  }
}
