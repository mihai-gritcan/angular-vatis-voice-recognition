import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DemoVatisComponent } from './demo-vatis/demo-vatis.component';

const routes: Routes = [
  { path: 'demo3', component: DemoVatisComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
