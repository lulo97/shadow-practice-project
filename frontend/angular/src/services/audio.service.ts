import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  // Expose state as Observables
  private isRecording = new BehaviorSubject<boolean>(false);
  public isRecording$ = this.isRecording.asObservable();

  async startRecording(): Promise<void> {
    console.log("[AudioService] startRecording called");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log(
      "[AudioService] got stream, tracks:",
      stream.getTracks().length,
    );
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event) => {
      console.log(
        "[AudioService] ondataavailable, chunk size:",
        event.data.size,
      );
      this.audioChunks.push(event.data);
    };
    this.mediaRecorder.start(100); // timeslice to force chunks every 100ms
    console.log(
      "[AudioService] recorder started, state:",
      this.mediaRecorder.state,
    );
    this.isRecording.next(true);
  }
  get isRecordingValue(): boolean {
    return this.isRecording.getValue();
  }
  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return;

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        console.log("Blob size before upload:", audioBlob.size);

        this.isRecording.next(false);
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      //This line make playwright error
      //this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    });
  }

  cleanup(): void {
    this.mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}
