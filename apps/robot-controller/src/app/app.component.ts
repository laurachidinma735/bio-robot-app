import { Component, OnInit } from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';
import { interval } from 'rxjs';
import { SocketIoService } from './socket.service';


@Component({
  selector: 'bio-robot-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'robot-desktop-listener';

  imgSrc$ = this.socketService.cameraFeed$.asObservable();
  showImage = true;
  imageLoaded = false;

  isGestureMode = false;

  public options: AnimationOptions = {
    path: './assets/39701-robot-bot-3d.json',
  };

  public isConnected$ = this.socketService.isConnected$.asObservable();
  public input$ = this.socketService.input$.asObservable();
  constructor(public readonly socketService: SocketIoService) {
    this.socketService.bootstrapServices();
  }

  public move(
    direction: 'forward' | 'backward' | 'stop' | 'left' | 'right' | 'flash'
  ): void {
    this.socketService.input$.next(direction);
  }

  public onErrorLoadingImg(): void {
    this.showImage = false;
    this.imageLoaded = false;
    setTimeout(() => {
      this.showImage =  true
    }, 5000);
  }

  public onImgLoad(): void {
    this.imageLoaded = true;
  }
}
