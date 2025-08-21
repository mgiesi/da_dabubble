import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class SharedFunctionsService {
  private location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
