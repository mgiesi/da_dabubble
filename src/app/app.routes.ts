import { Routes } from '@angular/router';
import { authGuard, redirectIfAuthedGuard } from './core/guards/auth.guard';
import { WorkspaceMenuComponent } from './features/menu/workspace-menu/workspace-menu.component';
import { ChatAreaComponent } from './features/chat/chat-area/chat-area.component';
import { ThreadPanelComponent } from './features/chat/thread-panel/thread-panel.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (c) => c.LoginComponent
      ),
    canMatch: [redirectIfAuthedGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (c) => c.RegisterComponent
      ),
    canMatch: [redirectIfAuthedGuard],
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
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (c) => c.ResetPasswordComponent
      ),
  },

  {
    path: 'chat',
    loadComponent: () =>
      import('./features/shell/main-layout/main-layout.component').then(
        (c) => c.MainLayoutComponent
      ),
    canActivate: [authGuard],
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
