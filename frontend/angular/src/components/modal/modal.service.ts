import { Injectable, signal, computed } from "@angular/core";

export interface ModalConfig {
  title?: string;
  message?: string;
  component?: any;
  data?: any;
  size?: "sm" | "md" | "lg";
  onClose?: (result?: any) => void;
}

type ModalState = "closed" | "entering" | "open" | "leaving";

@Injectable({ providedIn: "root" })
export class ModalService {
  private _state = signal<ModalState>("closed");
  private _config = signal<ModalConfig>({});
  private _ready = signal(false);
  private _readyWarnTimer: ReturnType<typeof setTimeout> | null = null;

  isOpen = computed(() => this._state() !== "closed");
  isReady = this._ready.asReadonly();
  config = this._config.asReadonly();
  state = this._state.asReadonly();

  open(config: ModalConfig) {
    this._ready.set(false);
    this._config.set(config);
    this._state.set("entering");
    requestAnimationFrame(() => this._state.set("open"));

    this._clearWarnTimer();
    this._readyWarnTimer = setTimeout(() => {
      if (!this._ready() && this._state() !== "closed") {
        console.error(
          `[ModalService] modal.ready() was never called after 3s.\n` +
            `Modal: "${config.title ?? config.component?.name ?? "unknown"}"\n` +
            `→ Call this.modal.ready() at the end of ngOnInit, even on error paths.`,
        );
      }
    }, 3000);
  }

  ready() {
    this._clearWarnTimer(); // called in time → cancel the warning
    this._ready.set(true);
  }

  close(result?: any) {
    this._clearWarnTimer(); // closed before 3s → no warning needed
    this._state.set("leaving");
    this._config().onClose?.(result);
    setTimeout(() => {
      this._state.set("closed");
      this._config.set({});
      this._ready.set(false);
    }, 200);
  }

  private _clearWarnTimer() {
    if (this._readyWarnTimer !== null) {
      clearTimeout(this._readyWarnTimer);
      this._readyWarnTimer = null;
    }
  }
}
