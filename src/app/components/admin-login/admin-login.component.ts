import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAuthService } from '../../services/admin-auth.service';
import { STORE_CONFIG } from '../../config/store.config';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-login-backdrop" (click)="onBackdropClick($event)">
      <div class="admin-login-card">
        <button class="close-btn" type="button" (click)="cancel.emit()" aria-label="Close">×</button>
        
        <div class="login-header">
          <div class="brand-badge">🔐 {{ config.storeName }}</div>
          <h2>Admin Access</h2>
          <p>Enter your 4-digit security PIN to access the manager dashboard.</p>
        </div>

        <form (submit)="onSubmit($event)" class="login-form">
          <div class="pin-field-wrapper">
            <input 
              #pinInput
              [type]="showPin() ? 'text' : 'password'" 
              id="adminPin"
              [(ngModel)]="pin" 
              name="pin" 
              maxlength="12"
              placeholder="Enter PIN" 
              autocomplete="current-password"
              autofocus
              required />
            <button 
              type="button" 
              class="eye-btn" 
              (click)="showPin.update(v => !v)" 
              [attr.aria-label]="showPin() ? 'Hide PIN' : 'Show PIN'">
              {{ showPin() ? '👁️' : '🔒' }}
            </button>
          </div>

          @if (errorMessage()) {
            <div class="err-box" role="alert">
              ⚠️ {{ errorMessage() }}
            </div>
          }

          <div class="form-actions">
            <button type="submit" class="btn btn-login">
              Unlock Dashboard
            </button>
            <button type="button" class="btn btn-cancel" (click)="cancel.emit()">
              Return to Store
            </button>
          </div>

          <div class="pin-hint">
            <small>Default PIN is <code>1234</code>. You can change this anytime in Admin Settings.</small>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .admin-login-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10, 24, 21, 0.75);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 16px;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .admin-login-card {
      position: relative;
      background: var(--card, #fff);
      color: var(--ink, #12302b);
      width: 100%;
      max-width: 420px;
      border-radius: 20px;
      padding: 32px 28px 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
      border: 1px solid var(--line, #d5e0da);
      animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes scaleUp {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .close-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 0;
      background: var(--paper, #f2f6f3);
      color: var(--ink, #12302b);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: grid;
      place-items: center;
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .brand-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 4px 12px;
      background: var(--paper, #f2f6f3);
      color: var(--muted, #5d726c);
      border-radius: 99px;
      margin-bottom: 12px;
    }

    .login-header h2 {
      margin: 0 0 8px;
      font: 700 24px/1.2 "Bricolage Grotesque", sans-serif;
    }

    .login-header p {
      margin: 0;
      font-size: 13.5px;
      color: var(--muted, #5d726c);
      line-height: 1.45;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pin-field-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .pin-field-wrapper input {
      width: 100%;
      height: 52px;
      font-size: 20px;
      letter-spacing: 0.15em;
      text-align: center;
      font-weight: 700;
      padding: 0 44px 0 16px;
      border-radius: 12px;
      border: 2px solid var(--line, #d5e0da);
      background: var(--paper, #f2f6f3);
      color: var(--ink, #12302b);
      outline: none;
      transition: border-color 0.15s ease;
    }

    .pin-field-wrapper input:focus {
      border-color: var(--accent, #f2b138);
      background: var(--card, #fff);
    }

    .eye-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: 0;
      font-size: 18px;
      cursor: pointer;
      padding: 6px;
    }

    .err-box {
      background: #fdf2f2;
      border: 1px solid #f8b4b4;
      color: #9b1c1c;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      text-align: center;
      font-weight: 600;
    }

    .form-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .btn-login {
      background: var(--ink, #12302b);
      color: var(--paper, #f2f6f3);
      font-size: 15px;
      font-weight: 700;
      height: 48px;
      border-radius: 12px;
      border: 0;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }

    .btn-login:hover {
      opacity: 0.92;
    }

    .btn-cancel {
      background: transparent;
      color: var(--muted, #5d726c);
      font-size: 14px;
      border: 1.5px solid var(--line, #d5e0da);
      height: 42px;
      border-radius: 12px;
      cursor: pointer;
    }

    .btn-cancel:hover {
      background: var(--paper, #f2f6f3);
      color: var(--ink, #12302b);
    }

    .pin-hint {
      text-align: center;
      margin-top: 8px;
      color: var(--muted, #5d726c);
      font-size: 12px;
    }

    .pin-hint code {
      background: var(--paper, #f2f6f3);
      padding: 2px 6px;
      border-radius: 6px;
      font-weight: bold;
    }
  `]
})
export class AdminLoginComponent {
  @Output() success = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private readonly adminAuth = inject(AdminAuthService);
  readonly config = STORE_CONFIG;

  pin = '';
  showPin = signal<boolean>(false);
  errorMessage = signal<string>('');

  onSubmit(e: Event): void {
    e.preventDefault();
    if (!this.pin.trim()) {
      this.errorMessage.set('Please enter the admin PIN.');
      return;
    }

    const ok = this.adminAuth.login(this.pin);
    if (ok) {
      this.errorMessage.set('');
      this.success.emit();
    } else {
      this.errorMessage.set('Incorrect PIN. Please try again.');
      this.pin = '';
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('admin-login-backdrop')) {
      this.cancel.emit();
    }
  }
}
