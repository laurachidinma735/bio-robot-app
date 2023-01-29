import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { delay, skip } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SocketIoService {
  public isConnected$ = new BehaviorSubject<boolean>(false);
  public cameraFeed$ = new BehaviorSubject<string>('');

  public subscriptions: Subscription[] = [];

  public input$ = new BehaviorSubject<string>('stop');
  public ip = '192.168.0.1';

  public toggleFlash$ = new BehaviorSubject<boolean>(false);

  public constructor(private socket: Socket, private http: HttpClient) {}

  public bootstrapServices(): void {
    // on connect
    this.socket
      .fromEvent('connect')
      .pipe(delay(2000))
      .subscribe(() => {
        this.isConnected$.next(true);
        this.join('listener');
        this.subscribeToEvents();
      });

    // on disconnect
    this.socket.fromEvent('disconnect').subscribe(() => {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions = [];
      this.isConnected$.next(false);
    });

    // on move
    this.socket.fromEvent('controller:input').subscribe((event) => {
      this.input$.next(event as string);
    });
  }

  private subscribeToEvents() {
    // url changes
    this.subscriptions.push(
      this.input$
        .asObservable()
        .pipe(skip(1))
        .subscribe((input) => this.sendMovement(input))
    );

    this.subscriptions.push(
      this.cameraFeed$
        .asObservable()
        .pipe(skip(1))
        .subscribe((input) => this.broadcastCameraFeed(input))
    );
  }

  private async join(room: string) {
    await timer(100).toPromise();

    this.socket.emit('joinRoom', room);
  }

  private async sendMovement(input: string): Promise<void> {
    if (input === 'flash') {
      this.toggleFlash$.next(!this.toggleFlash$.value);
      return;
    }
    this.http
      .get(`http://${this.ip}/action?go=${input}`)
      .subscribe({ next: () => this.socket.emit('listener:move', input) });
  }

  public async broadcastCameraFeed(feed: string) {
    this.socket.emit('listener:camera-feed', feed);
  }
}
