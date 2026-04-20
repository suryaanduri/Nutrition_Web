import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-screen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-[var(--ncm-bg)] px-4 py-10">
      <section class="w-full max-w-md rounded-[32px] border border-[color:var(--ncm-border)] bg-white p-8 shadow-[var(--ncm-shadow-card)]">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ncm-text-soft)]">
          NCM Platform
        </p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[var(--ncm-text)]">
          Staff login
        </h1>
        <p class="mt-3 text-sm leading-6 text-[var(--ncm-text-muted)]">
          Sign in with your staff credentials to access the admin workspace.
        </p>

        <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-[var(--ncm-text)]">Email</span>
            <input
              formControlName="email"
              type="email"
              class="w-full rounded-2xl border border-[color:var(--ncm-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ncm-primary)]"
              placeholder="admin@ncm.local"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-[var(--ncm-text)]">Password</span>
            <input
              formControlName="password"
              type="password"
              class="w-full rounded-2xl border border-[color:var(--ncm-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ncm-primary)]"
              placeholder="Enter your password"
            />
          </label>

          @if (error()) {
            <p class="rounded-2xl border border-[rgba(194,65,59,0.18)] bg-[rgba(254,242,242,0.9)] px-4 py-3 text-sm text-[var(--ncm-danger)]">
              {{ error() }}
            </p>
          }

          <button
            type="submit"
            class="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--ncm-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--ncm-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="form.invalid || loading()"
          >
            {{ loading() ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginScreenComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error: { error?: { message?: string | string[] } }) => {
          const message = error.error?.message;
          this.error.set(Array.isArray(message) ? message.join(', ') : (message ?? 'Unable to sign in.'));
        }
      });
  }
}
