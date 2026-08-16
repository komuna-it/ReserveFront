import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-cookie-bar',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './cookie-bar.html',
})
export class CookieBarComponent implements OnInit {
  private readonly COOKIE_BAR_KEY = 'app-cookie-bar';

  readonly isVisible = signal<boolean>(false);

  ngOnInit(): void {
    const consent = localStorage.getItem(this.COOKIE_BAR_KEY);
    if (!consent) {
      this.isVisible.set(true);
    }
  }

  acceptAll(): void {
    this.saveConsent('all');
  }

  acceptNecessary(): void {
    this.saveConsent('necessary');
  }

  private saveConsent(type: 'all' | 'necessary'): void {
    localStorage.setItem(
      this.COOKIE_BAR_KEY,
      JSON.stringify({ type, date: new Date().toISOString() }),
    );
    this.isVisible.set(false);
  }
}
