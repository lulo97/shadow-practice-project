import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SseService implements OnDestroy {
  private eventSource!: EventSource;
  private message$ = new Subject<any>();

  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.connect();
  }

  private connect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('SSE: max reconnect attempts reached');
      return;
    }

    this.eventSource = new EventSource(
      'http://localhost:3000/api/sse/stream'
    );

    this.eventSource.onopen = () => {
      console.log('SSE connected');
      this.reconnectAttempts = 0; // reset after successful connection
    };

    this.eventSource.onmessage = (event) => {
      console.log('SseService:', event.data);
      this.message$.next(event.data);
    };

    this.eventSource.onerror = () => {
      this.eventSource.close();

      this.reconnectAttempts++;

      console.log(
        `SSE reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
      );

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, 3000);
      } else {
        console.log('SSE stopped reconnecting');
      }
    };
  }

  onMessage(): Observable<any> {
    return this.message$.asObservable();
  }

  ngOnDestroy(): void {
    clearTimeout(this.reconnectTimer);
    this.eventSource?.close();
    this.message$.complete();
  }
}