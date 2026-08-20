import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/authService';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoPipe],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.css',
})
export class ConfirmEmail implements OnInit {
  readonly isLoading = signal<boolean>(true);
  readonly isSuccess = signal<boolean>(false);
  readonly errorString = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isLoading.set(false);
      this.errorString.set(this.translocoService.translate('CONFIRM_EMAIL.ERRORS.MISSING_TOKEN'));
      return;
    }

    this.confirmEmailToken(token);
  }

  private confirmEmailToken(token: string): void {
    this.authService.confirmEmail(token).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorString.set(
          error.error?.message ||
            this.translocoService.translate('CONFIRM_EMAIL.ERRORS.CONFIRMATION_FAILED'),
        );
      },
    });
  }
}
