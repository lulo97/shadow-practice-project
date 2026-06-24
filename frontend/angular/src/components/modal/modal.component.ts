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
      <div class="modal-backdrop" (click)="modal.close()"></div>

      <!-- Modal -->
      <div
        class="modal-container"
        [class]="'modal-' + (modal.config().size ?? 'md')"
      >
        <div class="modal-header">
          <h2>{{ modal.config().title }}</h2>
          <button (click)="modal.close()">✕</button>
        </div>
        <div class="modal-body">
          {{ modal.config().message }}
          <!-- For dynamic components, use NgComponentOutlet -->
          @if (modal.config().component) {
            <ng-container *ngComponentOutlet="modal.config().component" />
          }
        </div>
      </div>
    }
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }
    .modal-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 8px;
      z-index: 1000;
      padding: 24px;
      min-width: 320px;
    }
    .modal-sm {
      width: 360px;
    }
    .modal-md {
      width: 520px;
    }
    .modal-lg {
      width: 720px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
  `,
})
export class ModalComponent {
  modal = inject(ModalService);
}
