import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';
import { timer } from 'rxjs';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'bio-robot-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  private readonly constraints: MediaStreamConstraints = {
    video: {
      facingMode: 'environment',
      width: 640,
      height: 640,
    },
  };

  video!: HTMLVideoElement;
  usingCameraFlash = false;
  allowCapture = false;

  @Output() photo = new EventEmitter();
  @Output() ocrPhoto = new EventEmitter();
  @Input() set toggleFlash(value: boolean | null) {
    this.toggleCameraFlashLight();
  }

  captureProcessingMessage!: string;

  anim: AnimationOptions = {
    path: '/assets/animations/9844-loading-40-paperplane.json',
  };

  async ngAfterViewInit(): Promise<void> {
    this.video = this.videoElement.nativeElement as HTMLVideoElement;

    const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
    if (stream) {
      this.video.srcObject = stream;
      await this.video.play();
      this.capturePhoto();
    }
  }

  toggleCameraFlashLight(): void {
    const track = (this.video.srcObject as MediaStream).getTracks()[0];
    const cameraCapabilities = track.getCapabilities();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!cameraCapabilities.torch) {
      return;
    }
    this.usingCameraFlash = !this.usingCameraFlash;
    track.applyConstraints({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      advanced: [{ torch: this.usingCameraFlash }],
    });
  }

  async capturePhoto(): Promise<void> {
    if (this.allowCapture) {
      this.video = this.videoElement.nativeElement as HTMLVideoElement;
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
      const ocrPhoto = canvas.toDataURL('image/jpeg');
      const compressedImage = canvas.toDataURL('image/jpeg', 0.5);
      this.photo.emit(compressedImage);
      this.ocrPhoto.emit(ocrPhoto);
    } else {
      this.photo.emit('');
      this.ocrPhoto.emit('');
    }

    await lastValueFrom(timer(100));
    this.capturePhoto();
  }

  toggleRecord(): void {
    this.allowCapture = !this.allowCapture;
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }

  ngOnDestroy(): void {
    this.video.pause();
    (this.video.srcObject as MediaStream).getTracks().forEach((s) => s.stop());
  }
}
