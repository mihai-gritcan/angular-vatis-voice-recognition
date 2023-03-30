import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DemoVatisComponent } from './demo-vatis/demo-vatis.component';
import { NewDemoVatisComponent } from './new-demo-vatis/new-demo-vatis.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'new-demo' },
  { path: 'demo', component: DemoVatisComponent },
  { path: 'new-demo', component: NewDemoVatisComponent },
  { path: 'focus-play', loadComponent: () => import('./play-with-focus/play-with-focus.component').then(m => m.PlayWithFocusComponent) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
