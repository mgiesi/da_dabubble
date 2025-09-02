import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { onValue, serverTimestamp, onDisconnect, ref, set, get } from '@angular/fire/database';
import { onAuthStateChanged, User} from 'firebase/auth';
import { Observable, shareReplay } from 'rxjs';

export type UserPresence = { isOnline: boolean; lastSeenAt: number | null };

/**
 * Tracks and exposes realtime "online/offline" presence for Firebase users
 * using the Realtime Database (RTDB).
 *
 * How it works:
 * - Listens to Firebase Auth state. When a user is signed in, the service
 *   starts monitoring RTDB's `.info/connected` meta path.
 * - When the client is connected, it:
 *     1) Registers an `onDisconnect` handler to mark the user "offline" and
 *        set `last_seen_at` to a server timestamp if the connection drops
 *        unexpectedly (tab close, network loss, app crash, etc.).
 *     2) Immediately sets the user "online" with `last_seen_at` stamped.
 * - Consumers subscribe to `watchUserPresence(uid)` to observe presence
 *   changes of any user at `status/{uid}`.
 * - `signOutWithPresence()` ensures the user is marked offline and
 *   cancels the `onDisconnect` hook *before* signing out.
 */
@Injectable({
  providedIn: 'root'
})
export class UserPresenceService {
  private auth = inject(Auth);
  private rtdb = inject(Database);;
  private env = inject(EnvironmentInjector);

  /** Cache to store the user presence state */
  private userPresenceCache = new Map<string, Observable<UserPresence>>();
  /** Guards `init()` so it runs exactly once. */
  private initialized = false;
  /** Unsubscribe function for `.info/connected` listener when user changes. */
  private connectedUnsub: (() => void) | null = null;

  constructor() { }
  
  /**
   * Runs an async function inside Angular's injection context.
   * Helpful for Firebase callbacks where DI context may not be active.
   */
  private inCtx<T>(work: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      runInInjectionContext(this.env, () => {
        work().then(resolve).catch(reject);
      });
    });
  }

  /**
   * Initializes presence tracking for the currently authenticated user.
   * Call once at app startup (see app.component.ts).
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    runInInjectionContext(this.env, () => {
      onAuthStateChanged(this.auth, (user) => {
        // Clean up previous `.info/connected` listener when auth state changes.
        this.checkConnectedUnsubscription();
        if (!user) return;

        // Start monitoring connection status for the signed-in user.
        runInInjectionContext(this.env, () => {
          this.createConnectedUnsubscription(user);
        });
      });
    });
  }

  /**
   * Removes the active `.info/connected` subscription (if any).
   * Called when auth state changes or during re-initialization.
   */
  private checkConnectedUnsubscription() {
    if (this.connectedUnsub) {
        this.connectedUnsub();
        this.connectedUnsub = null;
    }
  }

  /**
   * Subscribes to RTDB `.info/connected` and sets up presence writes for `user`.
   * - On connect: registers `onDisconnect(...offline...)` then sets `online`.
   * - On disconnect (server-side): RTDB writes the `offline` payload automatically.
   */
  private createConnectedUnsubscription(user: User) {
    const connectedRef = ref(this.rtdb, '.info/connected');
    const statusRef = ref(this.rtdb, `status/${user.uid}`);

    this.connectedUnsub = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return;
      this.inCtx(() =>
        onDisconnect(statusRef).set({
          state: 'offline',
          last_seen_at: serverTimestamp(),
        })
      ).then(() => {
        return this.inCtx(() =>
          set(statusRef, {
            state: 'online',
            last_seen_at: serverTimestamp(),
          })
        );
      }).catch((e) => {
        console.error('[Presence] failed to set presence:', e);
      });
    });
  }

  /** 
   * Returns an observable for the user presence.
   *
   * @param uid The Firebase Auth UID of the user to observe.
   * @throws Error if `uid` is empty.
   * @returns Observable<UserPresence> that emits on any change to `status/{uid}`.
   */
  watchUserPresence(uid: string): Observable<UserPresence> {
    if (!uid) throw new Error('User uid is required!');

    const cached = this.userPresenceCache.get(uid);
    if (cached) return cached;

    const obs = new Observable<UserPresence>((subscriber) => {
      let unsubscribe: (() => void) | null = null;

      runInInjectionContext(this.env, () => {
        const statusRef = ref(this.rtdb, `status/${uid}`);
        unsubscribe = onValue(
          statusRef,
          (snap) => {
            const v = snap.val();
            subscriber.next({
              isOnline: v?.state === 'online',
              lastSeenAt: typeof v?.last_seen_at === 'number' ? v.last_seen_at : null,
            });
          },
          (err) => subscriber.error(err)
        );
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.userPresenceCache.set(uid, obs);
    return obs;
  }

  /**
   * Signs the user out while cleanly recording "offline" presence.
   */
  async signOutWithPresence(): Promise<void> {
    await runInInjectionContext(this.env, async () => {
      const user = this.auth.currentUser;
      if (user) {
        const statusRef = ref(this.rtdb, `status/${user.uid}`);
        try {
          await this.inCtx(() =>
            set(statusRef, {
              state: 'offline',
              last_seen_at: serverTimestamp(),
            })
          );
          await this.inCtx(() => onDisconnect(statusRef).cancel());
        } catch {
        }
      }
      await this.auth.signOut();
    });    
  }
}
