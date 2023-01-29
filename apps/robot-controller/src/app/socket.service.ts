import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { delay, skip } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SocketIoService {
  public isConnected$ = new BehaviorSubject<boolean>(false);
  public movesList$ = new BehaviorSubject<string[]>([]);
  public cameraFeed$ = new BehaviorSubject<string>('');

  public subscriptions: Subscription[] = [];

  public input$ = new BehaviorSubject<
    'forward' | 'backward' | 'stop' | 'left' | 'right' | 'flash'
  >('stop');

  public constructor(private socket: Socket, private router: Router) {}

  public bootstrapServices(): void {
    // on connect
    this.socket
      .fromEvent('connect')
      .pipe(delay(2000))
      .subscribe(() => {
        this.isConnected$.next(true);
        this.join('controller');
        this.subscribeToEvents();
      });

    // on disconnect
    this.socket.fromEvent('disconnect').subscribe(() => {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions = [];
      this.isConnected$.next(false);
    });

    // on move
    this.socket.fromEvent('listener:move').subscribe((event) => {
      this.movesList$.next([...this.movesList$.value, event as string]);
    });

    // on camera input
    this.socket.fromEvent('listener:camera-feed').subscribe((event) => {
      this.cameraFeed$.next(event as string);
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
  }

  private async join(room: string) {
    await timer(100).toPromise();

    this.socket.emit('joinRoom', room);
  }

  private async sendMovement(input: string): Promise<void> {
    await timer(100).toPromise();

    this.socket.emit('controller:input', input);
  }
}
