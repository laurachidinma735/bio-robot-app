import { Component } from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';
import { SocketIoService } from './socket.service';

@Component({
  selector: 'bio-robot-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'robot-desktop-listener';

  public get imgSrc(): string {
    return 'http://' + this.socketService.ip + ':81/stream';
  }

  showImage = true;
  showCamera = false;

  public options: AnimationOptions = {
    path: './assets/39701-robot-bot-3d.json',
  };

  public isConnected$ = this.socketService.isConnected$.asObservable();
  public input$ = this.socketService.input$.asObservable();
  public toggleFlash$ = this.socketService.toggleFlash$.asObservable();
  imageLoaded = false;
  constructor(public readonly socketService: SocketIoService) {
    this.socketService.bootstrapServices();
    this.showCamera = location.href.includes('camera');
  }

  public onErrorLoadingImg(): void {
    this.showImage = false;
    this.imageLoaded = false;
    setTimeout(() => {
      this.showImage = true;
      console.log('here');
    }, 5000);
  }

  public onImgLoad() {
    this.imageLoaded = true;
  }

  public processImages(image: string) {
    this.imageLoaded = !!image.length;
    this.socketService.cameraFeed$.next(image);
  }
}
