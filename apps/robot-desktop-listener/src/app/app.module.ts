import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbListModule,
  NbThemeModule,
} from '@nebular/theme';
import player, { LottiePlayer } from 'lottie-web';
import { LottieModule } from 'ngx-lottie';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SocketIoModule } from 'ngx-socket-io';
import { FormsModule } from '@angular/forms';
import { CameraComponent } from './camera/camera.component';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ServiceWorkerModule } from '@angular/service-worker';

function playerFactory(): LottiePlayer {
  return player;
}
@NgModule({
  declarations: [AppComponent, CameraComponent],
  imports: [
    BrowserModule,
    LottieModule.forRoot({ player: playerFactory }),
    HttpClientModule,
    // CoreModule,
    BrowserAnimationsModule,
    NbThemeModule.forRoot(),
    SocketIoModule.forRoot({
      url: 'https://socket-server-aw6pllafmq-nw.a.run.app',
      options: {},
    }),
    NbLayoutModule,
    NbIconModule,
    NbEvaIconsModule,
    NbButtonModule,
    NbCardModule,
    NbListModule,
    NbAlertModule,
    NbInputModule,
    FormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
