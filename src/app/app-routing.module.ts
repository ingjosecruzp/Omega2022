import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from './services/auth-guard.service';

const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'home', 
    pathMatch: 'full' ,
    canActivate: [AuthGuardService]
  },
  { 
    path: 'home', 
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
    canActivate: [AuthGuardService]
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'home-director',
    loadChildren: () => import('./pages/home-director/home-director.module').then( m => m.HomeDirectorPageModule),
    canActivate: [AuthGuardService]
  },
  {
    path: 'home-universidad',
    loadChildren: () => import('./pages/home-universidad/home-universidad.module').then( m => m.HomeUniversidadPageModule),
    canActivate: [AuthGuardService]
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
