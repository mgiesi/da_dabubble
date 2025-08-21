import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (c) => c.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (c) => c.RegisterComponent
      ),
  },
  {
    path: 'avatar-selection',
    loadComponent: () =>
      import(
        './features/auth/avatar-selection/avatar-selection.component'
      ).then((c) => c.AvatarSelectionComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (c) => c.ForgotPasswordComponent
      ),
  },

  {
    path: 'chat',
    loadComponent: () =>
      import('./features/shell/main-layout/main-layout.component').then(
        (c) => c.MainLayoutComponent
      ),
    // canActivate: [authGuard],
  },

  {
    path: 'imprint',
    loadComponent: () =>
      import('./legal/imprint/imprint.component').then(
        (c) => c.ImprintComponent
      ),
  },

  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./legal/privacy-policy/privacy-policy.component').then(
        (c) => c.PrivacyPolicyComponent
      ),
  },

  { path: '**', redirectTo: '/login' },
];
