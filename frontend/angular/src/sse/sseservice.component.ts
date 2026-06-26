import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SseService implements OnDestroy {
  private eventSource!: EventSource;
  private message$ = new Subject<any>();

  constructor() {
    this.connect();
  }

  private connect(): void {
    this.eventSource = new EventSource('http://localhost:3000/api/sse/stream');

    this.eventSource.onmessage = (event) => {
      console.log('SseService:', event.data);
      this.message$.next(event.data);
    };

    this.eventSource.onerror = () => {
      this.eventSource.close();
      // Auto-reconnect after 3s
      setTimeout(() => this.connect(), 3000);
    };
  }

  onMessage(): Observable<any> {
    return this.message$.asObservable();
  }

  ngOnDestroy(): void {
    this.eventSource?.close();
  }
}