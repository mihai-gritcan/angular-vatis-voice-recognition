import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'new-demo' },
  { path: 'new-demo', loadComponent: () => import('./new-demo-vatis/new-demo-vatis.component').then(m => m.NewDemoVatisComponent) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
