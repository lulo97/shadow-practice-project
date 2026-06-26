import { Component, inject } from "@angular/core";
import { CommonModule, NgComponentOutlet } from "@angular/common";
import { ModalService } from "./modal.service";

@Component({
  selector: "app-modal",
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  template: `
    @if (modal.isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 z-[999]"
        (click)="modal.close()"
      ></div>

      <!-- Modal -->
      <div
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg z-[1000] p-6 min-w-80"
        [class]="sizeClass"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-[18px] font-medium text-gray-900">{{ modal.config().title }}</h2>
          <button
            class="text-gray-500 hover:text-gray-900 transition-colors"
            (click)="modal.close()"
          >✕</button>
        </div>
        <div>
          {{ modal.config().message }}
          @if (modal.config().component) {
            <ng-container *ngComponentOutlet="modal.config().component" />
          }
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  modal = inject(ModalService);

  get sizeClass(): string {
    const sizes: Record<string, string> = {
      sm: "w-[360px]",
      md: "w-[520px]",
      lg: "w-[720px]",
    };
    return sizes[this.modal.config().size ?? "md"] ?? sizes["md"];
  }
}