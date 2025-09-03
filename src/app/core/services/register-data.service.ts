import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RegisterDataService {
  displayName = signal('');
  email = signal('');
  pwd = signal('');
  checked = signal(false);
}
