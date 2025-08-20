import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: Auth) {}

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  async signIn(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    return result.user;
  }

  async signUp(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    return result.user;
  }

  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  isLoggedIn(): boolean {
    return this.auth.currentUser !== null;
  }
}