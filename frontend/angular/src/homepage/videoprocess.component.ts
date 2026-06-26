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
    <div class="max-w-md mx-auto">
      <div *ngIf="!data" class="flex items-center justify-center py-10">
        <div class="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-3 text-sm text-gray-500">Loading...</span>
      </div>

      <ol *ngIf="data" class="space-y-5">
        <li
          *ngFor="let step of data.jobSteps; let i = index"
          class="flex items-start gap-4"
        >
          <!-- Step icon -->
          <div class="mt-0.5 flex-shrink-0">
            <!-- Done -->
            <span *ngIf="step.status === 'DONE'" class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-green-500 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </span>
            <!-- In progress -->
            <span *ngIf="step.status === 'IN_PROGRESS'" class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-indigo-500">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            </span>
            <!-- Error -->
            <span *ngIf="step.status === 'ERROR'" class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-red-500 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </span>
            <!-- Pending -->
            <span *ngIf="step.status === 'PENDING' || !step.status" class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-300">
            </span>
          </div>

          <!-- Step text -->
          <div>
            <p class="text-sm font-medium" [ngClass]="{
              'text-gray-800': step.status === 'DONE' || step.status === 'IN_PROGRESS',
              'text-gray-400': step.status === 'PENDING' || !step.status,
              'text-red-600': step.status === 'ERROR'
            }">
              {{ i + 1 }}. {{ step.stepName }}
            </p>
            <p class="text-xs mt-0.5" [ngClass]="{
              'text-green-500': step.status === 'DONE',
              'text-indigo-400': step.status === 'IN_PROGRESS',
              'text-gray-400': step.status === 'PENDING' || !step.status,
              'text-red-400': step.status === 'ERROR'
            }">
              <ng-container *ngIf="step.status === 'DONE'">Completed<ng-container *ngIf="step.note"> · {{ step.note }}</ng-container></ng-container>
              <ng-container *ngIf="step.status === 'IN_PROGRESS'">In progress...</ng-container>
              <ng-container *ngIf="step.status === 'ERROR'">{{ step.errorMsg || 'Failed' }}</ng-container>
              <ng-container *ngIf="step.status === 'PENDING' || !step.status">Pending</ng-container>
            </p>
          </div>
        </li>
      </ol>

      <!-- Overall status badge -->
      <div *ngIf="data" class="mt-8 flex items-center gap-2">
        <span class="text-xs font-medium px-2.5 py-1 rounded-full" [ngClass]="{
          'bg-green-100 text-green-700': data.job.status === 'Done',
          'bg-indigo-100 text-indigo-700': data.job.status === 'InProgress',
          'bg-red-100 text-red-700': data.job.status === 'Error',
          'bg-gray-100 text-gray-500': data.job.status === 'Pending'
        }">
          {{ data.job.status }}
        </span>
        <span class="text-xs text-gray-400">Job #{{ data.job.id }}</span>
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