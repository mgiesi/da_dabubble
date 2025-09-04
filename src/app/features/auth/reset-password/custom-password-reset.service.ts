import { Injectable } from '@angular/core';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteField
} from 'firebase/firestore';
import { 
  getAuth,
  updatePassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class CustomPasswordResetService {
  private db = getFirestore();
  private auth = getAuth();

  constructor() {}

  async generatePasswordResetToken(email: string): Promise<string> {
    const token = this.generateSecureToken();
    await this.cleanupOldTokens(email);
    const resetDoc = {
      email: email.toLowerCase().trim(),
      token: token,
      createdAt: serverTimestamp(),
      used: false,
      expiresAt: new Date(Date.now() + 3600000),
      attempts: 0,
      maxAttempts: 3
    };
    await setDoc(doc(this.db, 'passwordResets', token), resetDoc);
    return token;
  }

  async sendCustomPasswordResetEmail(email: string): Promise<void> {
    try {
      const token = await this.generatePasswordResetToken(email);
      const resetUrl = `${window.location.origin}/reset-password?token=${token}`;
      const emailData = {
        to: email,
        subject: 'Passwort zurücksetzen - Ihre App',
        html: this.generateCustomEmailTemplate(email, resetUrl, token),
        text: this.generateTextVersion(email, resetUrl)
      };
      const response = await fetch('/api/send-custom-reset-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
      if (!response.ok) {
        throw new Error('Fehler beim Senden der E-Mail');
      }
    } catch (error) {
      console.error('Error sending custom reset email:', error);
      throw new Error('Fehler beim Senden der Reset-E-Mail');
    }
  }

  async validateResetToken(token: string): Promise<{valid: boolean, email?: string, error?: string}> {
    try {
      const resetDoc = await getDoc(doc(this.db, 'passwordResets', token));
      if (!resetDoc.exists()) {
        return { valid: false, error: 'Ungültiger oder abgelaufener Link' };
      }
      const data = resetDoc.data();
      const now = new Date();
      const expiresAt = data['expiresAt'].toDate();
      if (now > expiresAt) {
        await deleteDoc(doc(this.db, 'passwordResets', token));
        return { valid: false, error: 'Der Link ist abgelaufen' };
      }
      if (data['used']) {
        return { valid: false, error: 'Dieser Link wurde bereits verwendet' };
      }
      if (data['attempts'] >= data['maxAttempts']) {
        return { valid: false, error: 'Zu viele Versuche. Link wurde deaktiviert' };
      }
      return { valid: true, email: data['email'] };
    } catch (error) {
      console.error('Error validating token:', error);
      return { valid: false, error: 'Fehler bei der Validierung' };
    }
  }

  async resetPasswordWithToken(token: string, newPassword: string, currentPassword?: string): Promise<{success: boolean, error?: string}> {
    try {
      const validation = await this.validateResetToken(token);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      const email = validation.email!;
      await this.incrementTokenAttempts(token);
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
      }
      if (currentPassword) {
        const user = this.auth.currentUser;
        if (user && user.email === email) {
          await updatePassword(user, newPassword);
        } else {
          return { success: false, error: 'Benutzer nicht authentifiziert' };
        }
      } else {
        const response = await fetch('/api/reset-password-with-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, newPassword })
        });
        if (!response.ok) {
          const errorData = await response.json();
          return { success: false, error: errorData.message || 'Fehler beim Zurücksetzen' };
        }
      }
      await this.markTokenAsUsed(token);
      return { success: true };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { success: false, error: 'Unerwarteter Fehler beim Zurücksetzen des Passworts' };
    }
  }

  private async markTokenAsUsed(token: string): Promise<void> {
    await setDoc(doc(this.db, 'passwordResets', token), 
      { used: true, usedAt: serverTimestamp() }, 
      { merge: true }
    );
  }

  private async incrementTokenAttempts(token: string): Promise<void> {
    const resetDoc = await getDoc(doc(this.db, 'passwordResets', token));
    if (resetDoc.exists()) {
      const currentAttempts = resetDoc.data()['attempts'] || 0;
      await setDoc(doc(this.db, 'passwordResets', token), 
        { attempts: currentAttempts + 1 }, 
        { merge: true }
      );
    }
  }

  private async cleanupOldTokens(email: string): Promise<void> {
    const q = query(
      collection(this.db, 'passwordResets'),
      where('email', '==', email.toLowerCase().trim())
    );
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }

  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private validatePasswordStrength(password: string): {valid: boolean, error?: string} {
    if (password.length < 8) {
      return { valid: false, error: 'Passwort muss mindestens 8 Zeichen lang sein' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, error: 'Passwort muss mindestens einen Kleinbuchstaben enthalten' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, error: 'Passwort muss mindestens einen Großbuchstaben enthalten' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, error: 'Passwort muss mindestens eine Zahl enthalten' };
    }
    return { valid: true };
  }

  private generateCustomEmailTemplate(email: string, resetUrl: string, token: string): string {
    const userName = email.split('@')[0];
    return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Passwort zurücksetzen</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background-color: #f5f7fa; 
                color: #333; 
                line-height: 1.6; 
            }
            .email-container { 
                max-width: 600px; 
                margin: 20px auto; 
                background: white; 
                border-radius: 12px; 
                overflow: hidden; 
                box-shadow: 0 8px 32px rgba(0,0,0,0.1); 
            }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                padding: 40px 30px; 
                text-align: center; 
                color: white; 
            }
            .header h1 { 
                font-size: 28px; 
                font-weight: 300; 
                margin-bottom: 10px; 
            }
            .header p { 
                opacity: 0.9; 
                font-size: 16px; 
            }
            .content { 
                padding: 40px 30px; 
            }
            .greeting { 
                font-size: 22px; 
                color: #2c3e50; 
                margin-bottom: 20px; 
                font-weight: 600; 
            }
            .message { 
                font-size: 16px; 
                color: #555; 
                margin-bottom: 30px; 
                line-height: 1.7; 
            }
            .cta-container { 
                text-align: center; 
                margin: 35px 0; 
            }
            .reset-button { 
                display: inline-block; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                text-decoration: none; 
                padding: 18px 35px; 
                border-radius: 50px; 
                font-weight: bold; 
                font-size: 16px; 
                transition: all 0.3s ease; 
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); 
            }
            .reset-button:hover { 
                transform: translateY(-2px); 
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6); 
            }
            .info-box { 
                background: #e8f4fd; 
                border-left: 4px solid #3498db; 
                padding: 20px; 
                margin: 30px 0; 
                border-radius: 6px; 
            }
            .info-box h3 { 
                color: #2980b9; 
                margin-bottom: 10px; 
                font-size: 18px; 
            }
            .info-box ul { 
                margin-left: 20px; 
                color: #34495e; 
            }
            .info-box li { 
                margin: 8px 0; 
            }
            .security-notice { 
                background: #fff3cd; 
                border: 1px solid #ffeaa7; 
                padding: 15px; 
                border-radius: 6px; 
                margin: 25px 0; 
            }
            .security-notice strong { 
                color: #856404; 
            }
            .footer { 
                background: #34495e; 
                color: #ecf0f1; 
                padding: 30px; 
                text-align: center; 
            }
            .footer p { 
                margin: 5px 0; 
                opacity: 0.8; 
            }
            .link-fallback { 
                background: #f8f9fa; 
                padding: 20px; 
                border-radius: 6px; 
                margin: 25px 0; 
                word-break: break-all; 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                color: #6c757d; 
            }
            .divider { 
                height: 1px; 
                background: linear-gradient(to right, transparent, #ddd, transparent); 
                margin: 30px 0; 
            }
            @media (max-width: 600px) {
                .email-container { margin: 10px; border-radius: 8px; }
                .content { padding: 20px; }
                .header { padding: 30px 20px; }
                .reset-button { padding: 15px 25px; font-size: 14px; }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>🔐 Passwort zurücksetzen</h1>
                <p>Ihre Sicherheit ist uns wichtig</p>
            </div>
            <div class="content">
                <div class="greeting">Hallo ${userName}! 👋</div>
                <div class="message">
                    Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für das Konto 
                    <strong>${email}</strong> gestellt.
                </div>
                <div class="cta-container">
                    <a href="${resetUrl}" class="reset-button">
                        ✨ Neues Passwort erstellen
                    </a>
                </div>
                <div class="info-box">
                    <h3>🛡️ Wichtige Sicherheitshinweise:</h3>
                    <ul>
                        <li>Dieser Link ist nur <strong>60 Minuten</strong> gültig</li>
                        <li>Der Link kann nur <strong>einmal</strong> verwendet werden</li>
                        <li>Maximal <strong>3 Versuche</strong> sind erlaubt</li>
                        <li>Nach Verwendung wird der Link automatisch deaktiviert</li>
                    </ul>
                </div>
                <div class="security-notice">
                    <strong>⚠️ Haben Sie diese Anfrage nicht gestellt?</strong><br>
                    Falls Sie kein neues Passwort angefordert haben, ignorieren Sie diese E-Mail einfach. 
                    Ihr Account bleibt sicher und es werden keine Änderungen vorgenommen.
                </div>
                <div class="divider"></div>
                <p style="color: #666; font-size: 14px;">
                    <strong>Falls der Button nicht funktioniert,</strong> kopieren Sie den folgenden Link in Ihren Browser:
                </p>
                <div class="link-fallback">
                    ${resetUrl}
                </div>
                <p style="margin-top: 30px; color: #666; font-style: italic;">
                    Mit freundlichen Grüßen,<br>
                    <strong>Ihr Team von [App Name]</strong>
                </p>
            </div>
            <div class="footer">
                <p><strong>© 2025 Ihre App Name</strong></p>
                <p>Diese E-Mail wurde automatisch generiert.</p>
                <p style="font-size: 12px; margin-top: 15px;">
                    Token-ID: ${token.substring(0, 8)}...
                    | Erstellt: ${new Date().toLocaleString('de-DE')}
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateTextVersion(email: string, resetUrl: string): string {
    const userName = email.split('@')[0];
    return `
Passwort zurücksetzen - Ihre App

Hallo ${userName}!

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für das Konto ${email} gestellt.

Besuchen Sie folgenden Link, um ein neues Passwort zu erstellen:
${resetUrl}

WICHTIGE SICHERHEITSHINWEISE:
- Dieser Link ist nur 60 Minuten gültig
- Der Link kann nur einmal verwendet werden  
- Maximal 3 Versuche sind erlaubt
- Nach Verwendung wird der Link automatisch deaktiviert

Haben Sie diese Anfrage nicht gestellt?
Falls Sie kein neues Passwort angefordert haben, ignorieren Sie diese E-Mail einfach. 
Ihr Account bleibt sicher und es werden keine Änderungen vorgenommen.

Mit freundlichen Grüßen,
Ihr Team von [App Name]

© 2025 Ihre App Name
Diese E-Mail wurde automatisch generiert.
    `;
  }
}
