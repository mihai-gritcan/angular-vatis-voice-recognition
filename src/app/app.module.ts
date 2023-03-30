import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DemoVatisComponent } from './demo-vatis/demo-vatis.component';
import { NewDemoVatisComponent } from './new-demo-vatis/new-demo-vatis.component';

@NgModule({
  declarations: [
    AppComponent,
    DemoVatisComponent,
    NewDemoVatisComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [
    { provide: 'SPEECH_LANG', useValue: 'en-US' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
