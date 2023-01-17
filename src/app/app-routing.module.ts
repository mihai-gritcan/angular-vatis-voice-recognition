import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Demo3Component } from './demo3/demo3.component';

const routes: Routes = [
  { path: 'demo3', component: Demo3Component },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
