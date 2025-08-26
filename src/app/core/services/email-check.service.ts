import { Injectable, inject } from '@angular/core';
import { Auth, fetchSignInMethodsForEmail } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class EmailCheckService {
  private auth = inject(Auth);

  /**
   * Checks if an email is already registered in Firebase Auth.
   * Returns true if the email exists, false otherwise.
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const methods = await fetchSignInMethodsForEmail(this.auth, email);
      return methods && methods.length > 0;
    } catch (e) {
      // Optionally handle invalid email format
      return false;
    }
  }
}
