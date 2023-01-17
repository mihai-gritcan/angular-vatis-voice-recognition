import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SpeechModule } from '../lib';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DemoVatisComponent } from './demo-vatis/demo-vatis.component';

@NgModule({
  declarations: [
    AppComponent,
    DemoVatisComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    SpeechModule
  ],
  providers: [
    { provide: 'SPEECH_LANG', useValue: 'en-US' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
