import {
  computed,
  inject,
  Injectable,
  Injector,
  InputSignal,
  Signal,
} from '@angular/core';
import { UsersService } from '../repositories/users.service';
import { Auth } from '@angular/fire/auth';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  interval,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { User } from '../../shared/models/user';
import {
  UserPresence,
  UserPresenceService,
} from '../services/user-presence.service';

function nowSignal(injector: Injector, everyMs = 30_000): Signal<number> {
  // tickt alle 30s (reicht für Presence)
  return toSignal(
    interval(everyMs).pipe(map(() => Date.now())),
    { initialValue: Date.now(), injector }
  );
}

type UiPresence = 'online' | 'away' | 'offline';

const AWAY_AFTER_MS  = 30_000; // 30 seconds
const OFF_AFTER_MS   = 10 * 60_000;  // 10 min

@Injectable({
  providedIn: 'root',
})
/**
 * Facade over user-related data operations.
 */
export class UsersFacadeService {
  /** Repository that performs Firestore I/O for users. */
  private data = inject(UsersService);
  /** Firebase Auth instance used to determine the current user. */
  private auth = inject(Auth);
  /** User presence service to determine the current state of an user */
  private presence = inject(UserPresenceService);

  constructor() {}

  /** A shared observable of all users from the Firestore. */
  private readonly users$ = this.data
    .users$()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));
  /** Converts the shared users$ observable into an Angular Signal. */
  readonly users = toSignal<User[]>(this.users$, { initialValue: [] as any });

  /** A shared observable of all users from the Firestore (current user is first in the list). */
  private readonly usersWithCurrentFirst$ = this.data
    .usersWithCurrentFirst$()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));
  /** Converts the shared usersWithCurrentFirst$ observable into an Angular Signal. */
  readonly usersWithCurrentFirst = toSignal<User[]>(this.usersWithCurrentFirst$, { initialValue: [] as any });

  readonly currentUser$ = this.currentUser();
  readonly currentUserSig = toSignal<User | null>(this.currentUser$, {
    initialValue: null,
  });

  /**
   * Signs the user out.
   */
  signOut() {
    this.presence.signOutWithPresence();
  }

  /**
   * Returns the currently authenticated user as an observable of user.
   * This stream updates automatically when authentication state changes.
   */
  currentUser(): Observable<User | null> {
    return this.data.currentUser$();
  }

  getUsers$(): Observable<User[]> {
    return this.data.users$();
  }

  /** Returns a stream for a single user */
  getUser$(id: string): Observable<User | null> {
    return this.users$.pipe(
      map((list) => list.find((u) => u.id === id) ?? null),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /** Returns a single user as a signal */
  getUserSig(id: string): Signal<User | null> {
    return computed(() => this.users()?.find((u) => u.id === id) ?? null);
  }

  /**
   * Creates a new user document via the repository.
   *
   * @param uid Firebase Auth UID.
   * @param email User's primary email address.
   * @param displayName Human-friendly display name.
   * @param imgUrl Absolute URL to the user's avatar image.
   * @returns Promise that resolves when the write completes.
   */
  async createUser(
    uid: string,
    email: string,
    displayName: string,
    imgUrl: string
  ) {
    await this.data.createUser(uid, email, displayName, imgUrl);
  }

  /**
   * Updates the `displayName` for the specified user document.
   *
   * @param userId Firestore document ID (`users/{userId}`).
   * @param displayName New display name.
   * @returns Promise that resolves when the update completes.
   */
  async updateDisplayName(userId: string, displayName: string) {
    await this.data.updateDisplayName(userId, displayName);
  }

  /**
   * Updates the `imgUrl` (avatar) for the specified user document.
   *
   * @param userId Firestore document ID (`users/{userId}`).
   * @param imgUrl New absolute URL to the avatar image.
   * @returns Promise that resolves when the update completes.
   */
  async updateImgUrl(userId: string, imgUrl: string) {
    await this.data.updateImgUrl(userId, imgUrl);
  }

  /**
   * Returns a reactive, read-only computed signal indicating whether the
   * provided `user()` is the same as the current user.
   *
   * The computation tracks both the supplied `user()` accessor and
   * `this.currentUserSig()`, and re-evaluates automatically when either changes.
   *
   * @param user - A function that returns a `User` (or `null`/`undefined`) when called.
   * @returns A computed read-only signal (accessor) that yields `true` if both users exist
   *          and their `id` fields match; otherwise `false`.
   */
  isCurrentUser(user: () => User | null | undefined) {
    return computed(() => {
      const u = user();
      const me = this.currentUserSig();
      return !!u && !!me && u.id === me.id;
    });
  }

  /**
   * Performs a one-off, non-reactive check to determine whether the given
   * `user` is the current user.
   *
   * Unlike {@link isCurrentUser}, this method returns a plain boolean and does not
   * subscribe to changes of the current user or the argument.
   *
   * @param user - A `User` instance (or `null`/`undefined`) to compare.
   * @returns `true` if both `user` and the current user exist and their `id` fields match;
   *          otherwise `false`.
   */
  isCurrentUserValue(user: User | null | undefined): boolean {
    const me = this.currentUserSig();
    return !!user && !!me && user.id === me.id;
  }

  /**
   * Returns the user presence as an Signal object.
   *
   * @param userSig   Reactive auth state (`Signal<User | null>`).
   * @param injector  Angular `Injector` used by `toSignal` for lifecycle and cleanup.
   * @returns         A `Signal<UserPresence>` that updates with RTDB presence changes.
   */
  getUserPresence(
    userSig: Signal<User | null>,
    injector: Injector
  ): Signal<UserPresence> {
    const uid$ = toObservable(userSig, { injector }).pipe(
      map((u) => u?.uid ?? null),
      distinctUntilChanged()
    );

    const presence$: Observable<UserPresence> = uid$.pipe(
      switchMap(uid => uid ? this.presence.watchUserPresence(uid) : (EMPTY as Observable<UserPresence>)
      ),
      catchError(err => err?.code === 'PERMISSION_DENIED' ? (EMPTY as Observable<UserPresence>) : throwError(() => err)
      )
    );

    const INITIAL: UserPresence = { isOnline: false, lastSeenAt: null };

    return toSignal(presence$, { initialValue: INITIAL, injector });
  }

  /**
   * Derives an `isOnline` boolean signal from the presence signal.
   *
   * @param userSig   Reactive auth state (`Signal<User | null>`).
   * @param injector  Angular `Injector` used by `toSignal` in `getUserPresence`.
   * @returns         `Signal<boolean>` that is `true` when the user is online.
   */
  presenceState(userSig: Signal<User | null>, injector: Injector): Signal<UiPresence> {
    const p = this.getUserPresence(userSig, injector);
    const now = nowSignal(injector);

    return computed<UiPresence>(() => {
      const pres = p();
      if (!pres.isOnline) return 'offline';
      if (!pres.lastSeenAt) return 'online';

      const age = now() - pres.lastSeenAt;
      if (age >= OFF_AFTER_MS) return 'offline';
      if (age >= AWAY_AFTER_MS) return 'away';
      return 'online';
    });
  }

  /**
   * Derives a `lastSeenAt` signal (epoch millis or `null`) from the presence signal.
   *
   * @param userSig   Reactive auth state (`Signal<User | null>`).
   * @param injector  Angular `Injector` used by `toSignal` in `getUserPresence`.
   * @returns         `Signal<number | null>` representing the last seen server timestamp.
   */
  lastSeenAt(
    userSig: Signal<User | null>,
    injector: Injector
  ): Signal<number | null> {
    const p = this.getUserPresence(userSig, injector);
    return computed(() => p().lastSeenAt);
  }

  /**
   * Gets a user by ID from Firestore database
   */
  async getUserById(userId: string): Promise<User | null> {
    return await this.data.getUserById(userId);
  }
}
