import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map } from 'rxjs';

/**
 * Guard that prevents authenticated users from accessing guest-only routes
 * (e.g., `/login`, `/register`). If the user is already authenticated, it
 * returns an `UrlTree` redirecting to `/chat`; otherwise it allows the route
 * to match.
 *
 * Uses a one-shot auth check (`isAuthenticatedOnce$`) to avoid hanging the
 * navigation and to keep the guard deterministic on app start.
 */
export const redirectIfAuthedGuard: CanMatchFn = (route, state): Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticatedOnce$.pipe(
    map((ok) => {
      return ok ? router.createUrlTree(['/chat']) : true;
    })
  );
}

/**
 * Guard that protects authenticated-only routes. If the user is authenticated,
 * activation proceeds; if not, it returns an `UrlTree` redirecting to `/login`.
 */
export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticatedOnce$.pipe(
    map((ok) => {
      return ok ? true : router.createUrlTree(['/login']);
    })
  );
}