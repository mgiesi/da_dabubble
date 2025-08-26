// src/app/shared/services/shared-funktions.service.ts
import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { BehaviorSubject } from 'rxjs'; // Wichtig: BehaviorSubject importieren

@Injectable({
  providedIn: 'root',
})
export class SharedFunctionsService {
  private location = inject(Location);

  // BehaviorSubject für den Animationsstatus
  private showAnimationSubject = new BehaviorSubject<boolean>(true);
  showAnimation$ = this.showAnimationSubject.asObservable();

  constructor() {
    // Initialen Status setzen, basierend auf sessionStorage
    const hasVisited = sessionStorage.getItem('firstPageVisit');
    if (hasVisited) {
      this.showAnimationSubject.next(false);
    }
  }

  // Methode zur Aktualisierung des Animationsstatus
  setShowAnimation(value: boolean): void {
    this.showAnimationSubject.next(value);
  }

  goBack(): void {
    this.location.back();
  }
}
