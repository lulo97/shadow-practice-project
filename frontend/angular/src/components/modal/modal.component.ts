import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  Renderer2,
  EffectRef,
  effect,
} from "@angular/core";
import { CommonModule, NgComponentOutlet } from "@angular/common";
import { ModalService } from "./modal.service";

@Component({
  selector: "app-modal",
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        transition: opacity 200ms ease;
        opacity: 0;
      }
      .modal-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -48%);
        background: white;
        border-radius: 8px;
        z-index: 1000;
        padding: 24px;
        min-width: 320px;
        transition:
          opacity 200ms ease,
          transform 200ms ease;
        opacity: 0;
      }

      /* entering/open: animate in */
      :host-context(.modal-entering) .modal-backdrop,
      :host-context(.modal-open) .modal-backdrop {
        opacity: 1;
      }

      :host-context(.modal-entering) .modal-panel,
      :host-context(.modal-open) .modal-panel {
        opacity: 1;
        transform: translate(-50%, -50%);
      }

      /* leaving: fade out */
      :host-context(.modal-leaving) .modal-backdrop {
        opacity: 0;
      }
      :host-context(.modal-leaving) .modal-panel {
        opacity: 0;
        transform: translate(-50%, -48%);
      }

      .modal-sm {
        max-width: 360px;
      }
      .modal-md {
        max-width: 520px;
      }
      .modal-lg {
        max-width: 720px;
      }
    `,
  ],
  template: `
    @if (modal.isOpen()) {
      <div
        class="modal-backdrop"
        (click)="modal.close()"
        [style.pointer-events]="modal.isReady() ? 'auto' : 'none'"
        [style.opacity]="modal.isReady() ? '' : '0'"
      ></div>
      <div
        class="modal-panel"
        [class]="sizeClass"
        [style.opacity]="modal.isReady() ? '' : '0'"
        [style.pointer-events]="modal.isReady() ? 'auto' : 'none'"
      >
        <div
          style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px"
        >
          <h2 style="font-size:18px; font-weight:500; color:#111; margin:0">
            {{ modal.config().title }}
          </h2>
          <button
            id="close-modal"
            style="background:none; border:none; cursor:pointer; color:#6b7280; font-size:16px; padding:4px"
            (click)="modal.close()"
          >
            ✕
          </button>
        </div>
        <div>
          @if (modal.config().component; as component) {
            <ng-container *ngComponentOutlet="component"></ng-container>
          }
        </div>
      </div>
    }
  `,
})
export class ModalComponent implements OnDestroy {
  modal = inject(ModalService);
  private renderer = inject(Renderer2);
  private stateClass = "";
  private effectRef: EffectRef;

  constructor() {
    this.effectRef = effect(() => {
      const s = this.modal.state();
      if (this.stateClass)
        this.renderer.removeClass(document.body, this.stateClass);
      this.stateClass = s !== "closed" ? `modal-${s}` : "";
      if (this.stateClass)
        this.renderer.addClass(document.body, this.stateClass);
    });
  }

  ngOnDestroy() {
    this.effectRef.destroy();
    if (this.stateClass)
      this.renderer.removeClass(document.body, this.stateClass);
  }

  get sizeClass(): string {
    const size = this.modal.config().size;
    return size ? `modal-${size}` : "";
  }
}
