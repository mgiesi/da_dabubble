// src/app/shared/services/shared-funktions.service.ts
import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedFunctionsService {
  private location = inject(Location);
  private showAnimationSubject = new BehaviorSubject<boolean>(true);
  showAnimation$ = this.showAnimationSubject.asObservable();

  constructor() {
    const hasVisited = sessionStorage.getItem('firstPageVisit');
    if (hasVisited) {
      this.showAnimationSubject.next(false);
    }
  }

  setShowAnimation(value: boolean): void {
    this.showAnimationSubject.next(value);
  }

  goBack(): void {
    this.location.back();
  }
}
