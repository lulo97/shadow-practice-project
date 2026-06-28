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
  template: `
    @if (modal.isOpen()) {
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999] transition-opacity duration-200 ease-out"
        (click)="modal.close()"
        [style.pointer-events]="modal.isReady() ? 'auto' : 'none'"
        [class.opacity-100]="modal.isReady()"
        [class.opacity-0]="!modal.isReady()"
      ></div>

      <div
        class="fixed top-1/2 left-1/2 -translate-x-1/2 bg-[#F4F3EF] border-4 border-black shadow-[12px_12px_0px_0px_#000] font-mono text-[#1A1A1A] z-[1000] transition-all duration-200 ease-out"
        [ngClass]="[
          sizeClass,
          modal.isReady()
            ? '-translate-y-1/2 opacity-100'
            : '-translate-y-[48%] opacity-0',
        ]"
        [style.pointer-events]="modal.isReady() ? 'auto' : 'none'"
      >
        <div
          class="p-4 bg-[#1A1A1A] text-white border-b-4 border-black flex items-center justify-between"
        >
          <h2
            class="text-sm font-black tracking-wider uppercase m-0 flex items-center gap-2"
          >
            <span class="text-[#FFDE4D]">//</span>
            {{ modal.config().title || "SYSTEM_LOG" }}
          </h2>
          <button
            id="close-modal"
            class="bg-[#FF4E4E] text-white w-6 h-6 flex items-center justify-center font-black border-2 border-black shadow-[2px_2px_0px_0px_#FFF] hover:bg-[#e03a3a] transition-all cursor-pointer"
            (click)="modal.close()"
          >
            &times;
          </button>
        </div>

        <div class="p-6 font-bold text-sm bg-white">
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
