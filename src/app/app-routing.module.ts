import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'rec-with-pause' },
  { path: 'new-demo', loadComponent: () => import('./new-demo-vatis/new-demo-vatis.component').then(m => m.NewDemoVatisComponent) },
  { path: 'rec-with-pause', loadComponent: () => import('./rec-with-pause-vatis/rec-with-pause-vatis.component').then(m => m.RecWithPauseVatisComponent) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
