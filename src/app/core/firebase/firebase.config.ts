import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import {
  provideAuth,
  getAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
} from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

const firebaseConfig = {
  ...environment.firebase,
  databaseURL: environment.databaseURL,
};

export const firebaseProviders = [
  provideFirebaseApp(() => initializeApp(firebaseConfig)),
  provideAuth(() => {
    const platformId = inject(PLATFORM_ID);
    const app = getApp();
    if (!isPlatformBrowser(platformId)) {
      return getAuth(app);
    }
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  }),
  provideDatabase(() => getDatabase()),
  provideFirestore(() => getFirestore()),
];
