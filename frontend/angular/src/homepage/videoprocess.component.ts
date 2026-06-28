import { Component, inject } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { FormsModule } from "@angular/forms";
import { ModalService } from "../components/modal/modal.service";
import { Job, JobStep } from "./job.interface";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="max-w-md h-[70vh] overflow-auto mx-auto font-mono text-black antialiased p-4">
      <div
        *ngIf="!data"
        class="flex items-center justify-center py-10 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000]"
      >
        <div
          class="w-5 h-5 border-2 border-black border-t-transparent animate-spin inline-block"
        ></div>
        <span class="ml-3 text-sm font-black uppercase tracking-widest"
          >Loading_Data...</span
        >
      </div>

      <ol *ngIf="data" class="space-y-4">
        <li
          *ngFor="let step of data.jobSteps; let i = index"
          class="flex items-start gap-4 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000]"
        >
          <div class="mt-0.5 flex-shrink-0">
            <span
              *ngIf="step.status === 'DONE'"
              class="flex items-center justify-center w-6 h-6 border-2 border-black bg-[#2FD673] text-black font-black shadow-[1px_1px_0px_0px_#000]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 stroke-[3]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
            <span
              *ngIf="step.status === 'IN_PROGRESS'"
              class="flex items-center justify-center w-6 h-6 border-2 border-black bg-[#00E5FF] text-black shadow-[1px_1px_0px_0px_#000]"
            >
              <span class="w-2 h-2 bg-black animate-pulse"></span>
            </span>
            <span
              *ngIf="step.status === 'ERROR'"
              class="flex items-center justify-center w-6 h-6 border-2 border-black bg-[#FF4E4E] text-white font-black shadow-[1px_1px_0px_0px_#000]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 stroke-[3]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
            <span
              *ngIf="step.status === 'PENDING' || !step.status"
              class="flex items-center justify-center w-6 h-6 border-2 border-black bg-gray-200 shadow-[1px_1px_0px_0px_#000]"
            >
            </span>
          </div>

          <div class="flex-1">
            <p
              class="text-sm font-black uppercase tracking-tight"
              [ngClass]="{
                'text-black':
                  step.status === 'DONE' || step.status === 'IN_PROGRESS',
                'text-neutral-400': step.status === 'PENDING' || !step.status,
                'text-[#FF4E4E]': step.status === 'ERROR',
              }"
            >
              {{ i + 1 }} // {{ step.stepName }}
            </p>
            <p
              class="text-xs font-bold uppercase mt-1 tracking-wider"
              [ngClass]="{
                'text-[#2FD673]': step.status === 'DONE',
                'text-[#00E5FF] font-black': step.status === 'IN_PROGRESS',
                'text-neutral-400': step.status === 'PENDING' || !step.status,
                'text-[#FF4E4E]': step.status === 'ERROR',
              }"
            >
              <ng-container *ngIf="step.status === 'DONE'"
                >>> COMPLETED<ng-container *ngIf="step.note">
                  :: {{ step.note }}</ng-container
                ></ng-container
              >
              <ng-container *ngIf="step.status === 'IN_PROGRESS'"
                >>> PROCESSING_</ng-container
              >
              <ng-container *ngIf="step.status === 'ERROR'"
                >!! {{ step.errorMsg || "FAILED_EXECUTION" }}</ng-container
              >
              <ng-container *ngIf="step.status === 'PENDING' || !step.status"
                >>> PENDING_NODE</ng-container
              >
            </p>
          </div>
        </li>
      </ol>

      <div
        *ngIf="data"
        class="mt-6 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-between gap-2"
      >
        <span
          class="px-3 py-1 font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000]"
          [ngClass]="{
            'bg-[#2FD673] text-black': data.job.status === 'Done',
            'bg-[#00E5FF] text-black': data.job.status === 'InProgress',
            'bg-[#FF4E4E] text-white': data.job.status === 'Error',
            'bg-[#FFDE4D] text-black': data.job.status === 'Pending',
          }"
        >
          {{ data.job.status }}
        </span>
        <span class="text-xs font-black tracking-widest text-neutral-500"
          >JOB_ID // #{{ data.job.id }}</span
        >
      </div>
    </div>
  `,
})
export class VideoProcessComponent {
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

    this.modal.ready();
  }
}
