import { Injectable, signal } from '@angular/core';
import { STORE_CONFIG } from '../config/store.config';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private readonly SESSION_KEY = 'bm_admin_auth_session';
  private readonly PIN_STORAGE_KEY = 'bm_admin_custom_pin';

  readonly isAuthenticated = signal<boolean>(this.checkInitialAuth());

  private checkInitialAuth(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(this.SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  }

  getEffectivePin(): string {
    if (typeof window !== 'undefined') {
      try {
        const customPin = localStorage.getItem(this.PIN_STORAGE_KEY);
        if (customPin && customPin.trim()) {
          return customPin.trim();
        }
      } catch {
        // Ignore storage error
      }
    }
    return STORE_CONFIG.adminPin || '1234';
  }

  login(enteredPin: string): boolean {
    const clean = (enteredPin || '').trim();
    if (clean === this.getEffectivePin()) {
      this.isAuthenticated.set(true);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(this.SESSION_KEY, 'true');
        } catch {
          // Ignore
        }
      }
      return true;
    }
    return false;
  }

  logout(): void {
    this.isAuthenticated.set(false);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(this.SESSION_KEY);
      } catch {
        // Ignore
      }
    }
  }

  changePin(currentPin: string, newPin: string): { success: boolean; error?: string } {
    const cleanCurrent = (currentPin || '').trim();
    const cleanNew = (newPin || '').trim();

    if (cleanCurrent !== this.getEffectivePin()) {
      return { success: false, error: 'Current PIN is incorrect.' };
    }

    if (!cleanNew || cleanNew.length < 4) {
      return { success: false, error: 'New PIN must be at least 4 digits.' };
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.PIN_STORAGE_KEY, cleanNew);
      } catch {
        return { success: false, error: 'Could not save new PIN to storage.' };
      }
    }

    return { success: true };
  }

  resetPin(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.PIN_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }
}
