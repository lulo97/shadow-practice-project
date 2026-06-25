import { Injectable, signal } from '@angular/core';

export interface ModalConfig {
  title?: string;
  message?: string;
  component?: any;
  data?: any;
  size?: 'sm' | 'md' | 'lg';
  onClose?: (result?: any) => void; // Add this
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private _isOpen = signal(false);
  private _config = signal<ModalConfig>({});

  isOpen = this._isOpen.asReadonly();
  config = this._config.asReadonly();

  open(config: ModalConfig) {
    this._config.set(config);
    this._isOpen.set(true);
  }

  close(result?: any) {
    this._config().onClose?.(result); // Call before clearing
    this._isOpen.set(false);
    this._config.set({});
  }
}