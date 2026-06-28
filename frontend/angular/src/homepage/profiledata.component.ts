import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ModalService } from "../components/modal/modal.service";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { UserProfileData } from "./profiledata.inteface";

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="font-mono p-0 w-[80vw] h-[70vh] overflow-auto" *ngIf="data">
      <!-- 01 Stats -->
      <div
        class="inline-block px-3 py-0.5 text-xs font-black uppercase tracking-widest border-2 border-black bg-[#FFDE4D] mb-2"
      >
        01 // Summary Stats
      </div>
      <h2 class="text-2xl font-black uppercase tracking-tight mb-4">
        USER_METRICS
      </h2>

      <div class="grid grid-cols-3 gap-2 mb-6">
        <div class="bg-[#1A1A1A] border-2 border-black p-3">
          <div
            class="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1"
          >
            Videos
          </div>
          <div class="text-2xl font-black text-[#FFDE4D]">
            {{ data.stats.totalVideosLearned }}
          </div>
        </div>
        <div class="bg-[#1A1A1A] border-2 border-black p-3">
          <div
            class="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1"
          >
            Recordings
          </div>
          <div class="text-2xl font-black text-[#00E5FF]">
            {{ data.stats.totalRecordingsMade }}
          </div>
        </div>
        <div class="bg-[#1A1A1A] border-2 border-black p-3">
          <div
            class="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1"
          >
            Avg Score
          </div>
          <div class="text-2xl font-black text-[#2FD673]">
            {{ data.stats.averageScore }}
          </div>
        </div>
        <div class="bg-[#1A1A1A] border-2 border-black p-3">
          <div
            class="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1"
          >
            Jobs Run
          </div>
          <div class="text-2xl font-black text-white">
            {{ data.stats.totalJobsRun }}
          </div>
        </div>
        <div class="bg-[#1A1A1A] border-2 border-black p-3">
          <div
            class="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1"
          >
            Completed
          </div>
          <div class="text-2xl font-black text-[#2FD673]">
            {{ data.stats.completedJobs }}
          </div>
        </div>
        <div class="bg-[#1A1A1A] border-2 border-black p-3">
          <div
            class="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1"
          >
            Failed
          </div>
          <div class="text-2xl font-black text-[#FF4E4E]">
            {{ data.stats.failedJobs }}
          </div>
        </div>
      </div>

      <hr class="border-t-[3px] border-black my-6" />

      <!-- 02 Videos -->
      <div
        class="inline-block px-3 py-0.5 text-xs font-black uppercase tracking-widest border-2 border-black bg-[#2FD673] mb-2"
      >
        02 // Video Progress
      </div>
      <h2 class="text-2xl font-black uppercase tracking-tight mb-4">
        VIDEO_ACTIVITY
      </h2>

      <div
        *ngFor="let v of data.videos"
        class="bg-white border-[3px] border-black mb-3"
      >
        <!-- header -->
        <div
          class="flex justify-between items-center px-4 py-2 bg-[#F4F3EF] border-b-2 border-black"
        >
          <span class="text-sm font-black uppercase">{{ v.title }}</span>
          <span
            class="text-[10px] font-black bg-[#1A1A1A] text-[#FFDE4D] px-2 py-0.5 border-[1.5px] border-black"
          >
            {{ v.youtubeId }}
          </span>
        </div>
        <!-- body -->
        <div class="grid grid-cols-2 gap-3 p-4">
          <div class="col-span-2">
            <div
              class="flex justify-between text-[10px] font-bold uppercase text-[#888] mb-1"
            >
              <span>Lines practiced</span>
              <span>{{ v.practicedLines }} / {{ v.totalLines }}</span>
            </div>
            <div class="h-2.5 bg-[#F4F3EF] border-2 border-black">
              <div
                class="h-full transition-all"
                [style.width.%]="(v.practicedLines / v.totalLines) * 100"
                [class]="v.averageScore >= 70 ? 'bg-[#2FD673]' : 'bg-[#FFDE4D]'"
              ></div>
            </div>
          </div>
          <div>
            <div class="text-[10px] font-bold uppercase text-[#888]">
              Best Score
            </div>
            <div
              class="text-xl font-black"
              [class]="v.bestScore >= 80 ? 'text-[#2FD673]' : 'text-[#FFDE4D]'"
            >
              {{ v.bestScore }}
            </div>
          </div>
          <div>
            <div class="text-[10px] font-bold uppercase text-[#888]">
              Avg Score
            </div>
            <div class="text-xl font-black">{{ v.averageScore }}</div>
          </div>
        </div>
        <!-- footer -->
        <div
          class="flex justify-between items-center px-4 py-2 bg-[#1A1A1A] border-t-2 border-black text-[10px] font-bold text-[#666]"
        >
          <span>
            <span
              class="inline-block w-2 h-2 rounded-full bg-[#2FD673] border-2 border-black mr-1"
            ></span>
            ACTIVE
          </span>
          <span
            >Last practiced:
            {{ v.lastPracticedAt | date: "yyyy-MM-dd HH:mm" }}</span
          >
        </div>
      </div>

      <hr class="border-t-[3px] border-black my-6" />

      <!-- 03 Recent Records -->
      <div
        class="inline-block px-3 py-0.5 text-xs font-black uppercase tracking-widest border-2 border-black bg-[#00E5FF] mb-2"
      >
        03 // Recent Activity
      </div>
      <h2 class="text-2xl font-black uppercase tracking-tight mb-4">
        RECENT_RECORDS
      </h2>

      <div class="flex flex-col gap-3">
        <div
          *ngFor="let r of data.recentRecords"
          class="bg-white border-2 border-black"
        >
          <!-- header -->
          <div
            class="flex justify-between items-center px-3 py-2 bg-[#1A1A1A] border-b-2 border-black"
          >
            <span class="text-[10px] font-bold uppercase text-[#888]">{{
              r.videoTitle
            }}</span>
            <span
              class="text-xs font-black px-2 py-0.5 border-2"
              [ngClass]="{
                'bg-[#2FD673] border-black text-black': r.score >= 80,
                'bg-[#FFDE4D] border-black text-black':
                  r.score >= 50 && r.score < 80,
                'bg-[#FF4E4E] border-black text-white': r.score < 50,
              }"
            >
              {{ r.score }} / 100
            </span>
          </div>
          <!-- body -->
          <div class="px-3 py-3 flex flex-col gap-2">
            <div class="text-sm font-bold leading-snug">
              {{ r.transcriptText }}
            </div>
            <div *ngIf="r.viText" class="text-xs text-gray-500">
              {{ r.viText }}
            </div>
            <div *ngIf="r.sttText" class="flex gap-2 items-start">
              <span
                class="text-[10px] font-black uppercase bg-[#FF8A00] text-black px-1.5 py-0.5 border-[1.5px] border-black shrink-0 mt-0.5"
                >STT</span
              >
              <span class="text-xs text-gray-500">{{ r.sttText }}</span>
            </div>
          </div>
          <!-- footer -->
          <div
            class="flex justify-between px-3 py-1.5 bg-[#F4F3EF] border-t-2 border-black text-[10px] font-bold text-[#888]"
          >
            <span>ID #{{ r.recordId }}</span>
            <span>{{ r.createdAt | date: "yyyy-MM-dd HH:mm" }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileDataComponent {
  modal = inject(ModalService);
  data: UserProfileData | null = null;
  async ngOnInit() {
    await this.fetchData();
    this.modal.ready();
  }

  async fetchData() {
    const result = await callApi({
      endpoint: "api/profiledata",
      method: "GET",
      credentials: "include",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    }

    this.data = result.data;
  }
}
