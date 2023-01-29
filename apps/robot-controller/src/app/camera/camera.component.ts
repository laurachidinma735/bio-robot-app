import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  takeWhile,
} from 'rxjs';

import * as tf from '@tensorflow/tfjs/dist/tf';
import '@tensorflow/tfjs-backend-webgl';
import * as handpose from '@tensorflow-models/handpose';
import * as fp from 'fingerpose';

@Component({
  selector: 'bio-robot-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  private readonly constraints: MediaStreamConstraints = {
    video: {
      facingMode: 'user',
      width: 640,
      height: 640,
    },
  };

  video!: HTMLVideoElement;
  usingCameraFlash = false;
  allowCapture = false;

  action = 'loading...';

  gesture = new BehaviorSubject<string>('loading...');
  @Output() outputAction = new EventEmitter();

  anim: AnimationOptions = {
    path: '/assets/animations/9844-loading-40-paperplane.json',
  };

  knownGestures: any[] = [];
  model: any;

  GE = new fp.GestureEstimator(this.knownGestures);
  isLive = true;

  async ngAfterViewInit(): Promise<void> {
    this.generateGestures();
    this.video = this.videoElement.nativeElement as HTMLVideoElement;

    const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
    if (stream) {
      this.video.srcObject = stream;
      await this.video.play();
      this.model = await handpose.load();

      this.capturePhoto();
    }
    this.gesture
      .pipe(
        takeWhile(() => this.isLive),
        distinctUntilChanged(),
        debounceTime(50)
      )
      .subscribe({
        next: (value) => {
          if (value === 'thumbs_up') {
            this.outputAction.next('flash');
          } else {
            this.outputAction.next(value);
          }
        },
      });
  }

  async capturePhoto(): Promise<void> {
    this.video = this.videoElement.nativeElement as HTMLVideoElement;
    const predictions = await this.model.estimateHands(this.video, true);

    if (predictions.length) {
      const est = this.GE.estimate(predictions[0].landmarks, 9);
      this.gesture.next(est?.gestures?.[0]?.name ?? 'stop');
    } else {
      this.gesture.next('stop');
    }
    // await lastValueFrom(timer(100));
    if (this.isLive) requestAnimationFrame(() => this.capturePhoto());
  }

  toggleRecord(): void {
    this.allowCapture = !this.allowCapture;
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }

  generateGestures(): void {
    const gestures: any[] = [];

    const forward = new fp.GestureDescription('forward');
    forward.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl);
    forward.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp);

    const backward = new fp.GestureDescription('backward');
    backward.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl);
    backward.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalDown);
    backward.addDirection(
      fp.Finger.Index,
      fp.FingerDirection.DiagonalDownRight
    );
    backward.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalDownLeft);

    const left = new fp.GestureDescription('left');
    left.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl);
    left.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalLeft);
    left.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft);

    const right = new fp.GestureDescription('right');
    right.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl);
    right.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalRight);
    right.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight);

    const stop = new fp.GestureDescription('flash');
    stop.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl);
    stop.addCurl(fp.Finger.Index, fp.FingerCurl.Thumb);
    stop.addCurl(fp.Finger.Index, fp.FingerCurl.Pinky);

    gestures.push(forward, backward, left, right, stop);

    this.GE = new fp.GestureEstimator(gestures);
  }

  ngOnDestroy(): void {
    this.video.pause();
    (this.video.srcObject as MediaStream).getTracks().forEach((s) => s.stop());
    this.isLive = false;
  }
}
