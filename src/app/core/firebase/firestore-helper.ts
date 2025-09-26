// firestore-helpers.ts
import { inject, EnvironmentInjector, runInInjectionContext, Inject, Injectable } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, Query, DocumentReference } from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { EMPTY, Observable, catchError, defer, shareReplay, switchMap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirestoreHelpers {
  private env  = inject(EnvironmentInjector);
  private auth = inject(Auth);
  private fs   = inject(Firestore);

  authedCollection$<T>(makeQuery: () => Query): Observable<T[]> {
    const src$ = defer(() =>
      runInInjectionContext(this.env, () =>
        authState(this.auth).pipe(
          switchMap(u =>
            u
              ? defer(() =>
                  runInInjectionContext(this.env, () =>
                    collectionData(makeQuery(), { idField: 'id' }) as Observable<T[]>
                  )
                )
              : EMPTY
          ),
          catchError(err =>
            (err?.code === 'permission-denied' || err?.code === 'unauthenticated')
              ? EMPTY
              : throwError(() => err)
          )
        )
      )
    );

    return src$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  authedCollectionWithUid$<T>(makeQuery: (uid: string) => Query): Observable<T[]> {
    const src$ = defer(() =>
      runInInjectionContext(this.env, () =>
        authState(this.auth).pipe(
          switchMap(u =>
            u
              ? defer(() =>
                  runInInjectionContext(this.env, () =>
                    collectionData(makeQuery(u.uid), { idField: 'id' }) as Observable<T[]>
                  )
                )
              : EMPTY
          ),
          catchError(err =>
            (err?.code === 'permission-denied' || err?.code === 'unauthenticated')
              ? EMPTY
              : throwError(() => err)
          )
        )
      )
    );

    return src$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  authedDoc$<T>(makeRef: () => DocumentReference): Observable<T | null> {
    const src$ = defer(() =>
      runInInjectionContext(this.env, () =>
        authState(this.auth).pipe(
          switchMap(u =>
            u
              ? defer(() =>
                  runInInjectionContext(this.env, () =>
                    docData(makeRef(), { idField: 'id' }) as Observable<T>
                  )
                )
              : EMPTY
          ),
          catchError(err =>
            (err?.code === 'permission-denied' || err?.code === 'unauthenticated')
              ? EMPTY
              : throwError(() => err)
          )
        )
      )
    );

    return src$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }
}
