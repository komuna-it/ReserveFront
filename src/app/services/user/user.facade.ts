import { inject, Injectable } from '@angular/core';
import { UserApi } from './user.api';
import { UserStore } from './user.store';
import { AuthService } from '../../auth/authService';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { SettingsFacade } from '../../settings/settingsFacade';
import { SettingsStore } from '../../settings/settingsStore';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ViewController } from '../view/view.controller';
import { ViewStore } from '../view/view.store';
import { ErrorType } from '../../model/error/errorType';

@Injectable({ providedIn: 'root' })
export class UserFacade {
  private api = inject(UserApi);
  private loco = inject(TranslocoService);
  private userStore = inject(UserStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  public settingsFacade = inject(SettingsFacade);
  public settingsStore = inject(SettingsStore);
  public viewController = inject(ViewController);
  private viewStore = inject(ViewStore);
  private readonly route = inject(ActivatedRoute);
  readonly textFormatingTool = inject(TextFormatingTool);

  constructor() {
    this.settingsFacade.getSettings(null, true);
    this.getAllUsers();
  }

  getAllUsers() {
    const sortBy = this.userStore.currentSortBy();
    const sortDir = this.userStore.currentSortDir();
    const page = this.userStore.currentUsersPage();
    const size = this.userStore.currentUsersSize();
    const sortParam = `${sortBy},${sortDir}`;

    return this.api.getAllUsers(page, size, sortParam).subscribe({
      next: (pageData) => {
        this.userStore.usersPage.set(pageData);
      },
      error: (e) => {
        console.error('Error fetching usersPage: ', e);
        this.viewController.showError(ErrorType.ACTION_FAILED);
      },
    });
  }

  changeUsersPage(newPage: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [this.userStore.usersPageQueryParamName()]: newPage },
      queryParamsHandling: 'merge',
    });
  }

  changeUsersSize(newSize: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [this.userStore.usersSizeQueryParamName()]: newSize,
        [this.userStore.usersPageQueryParamName()]: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  getUserByEmail(email: string) {
    this.api.getUserByEmail(email).subscribe({
      next: (u) => console.log('fetched user by email: ', u),
      error: (e) => {
        console.error('error fetching user by email: ', e);
        this.viewController.showError(ErrorType.USER_NOT_FOUND);
      },
    });
  }

  closeModals(): void {
    this.viewController.closeModals();
  }

  handleClickBanUsers() {
    this.viewStore.isBanUsersModalActive.set(true);
  }

  banUsers() {
    const userIds = this.userStore.toolbarSelectedIds();
    const reason = this.userStore.banReason();
    const duration = this.userStore.banDuration();

    this.api.banUsers(userIds, reason, duration).subscribe({
      next: () => {
        this.getAllUsers();
        this.viewStore.isBanUsersModalActive.set(false);
        this.viewController.showSuccess('SUCCESS' as any);
        this.userStore.clearSelection();
      },
      error: (e) => {
        console.error('Error banning users: ', e);
        this.viewController.showError(ErrorType.ACTION_FAILED);
      },
    });
  }

  unbanUsers() {
    const userIds = this.userStore.toolbarSelectedIds();
    this.api.unbanUsers(userIds).subscribe({
      next: () => {
        this.getAllUsers();
        this.userStore.clearSelection();
      },
      error: (e) => {
        console.error('Error unbanning users: ', e);
        this.viewController.showError(ErrorType.ACTION_FAILED);
      },
    });
  }

  markUsersTrusted() {
    this.api.markUsersTrusted(this.userStore.toolbarSelectedIds()).subscribe({
      next: () => this.getAllUsers(),
      error: (e) => {
        console.error('Error marking user as trusted: ', e);
        this.viewController.showError(ErrorType.ACTION_FAILED);
      },
    });
  }

  markUsersUntrusted() {
    this.api.markUsersUntrusted(this.userStore.toolbarSelectedIds()).subscribe({
      next: () => this.getAllUsers(),
      error: (e) => {
        console.error('Error marking user as untrusted: ', e);
        this.viewController.showError(ErrorType.ACTION_FAILED);
      },
    });
  }

  promoteUserToAdmin(userId: number): void {
    this.api.promoteUserToAdmin(userId).subscribe({
      next: () => {
        const selected = this.userStore.selectedUser();
        if (selected && selected.id === userId) {
          this.userStore.selectedUser.set({ ...selected, role: 'ADMIN' });
        }
        this.getAllUsers();
      },
      error: (e) => {
        console.error('Error promoting user to admin: ', e);
        this.viewController.showError(ErrorType.ACTION_FAILED);
      },
    });
  }

  demoteAdminToUser(userId: number): void {
    this.api.demoteAdminToUser(userId).subscribe({
      next: () => {
        const selected = this.userStore.selectedUser();
        if (selected && selected.id === userId) {
          this.userStore.selectedUser.set({ ...selected, role: 'USER' });
        }
        this.getAllUsers();
      },
      error: (e) => {
        console.error('Error demoting user from admin: ', e);
        this.viewController.showError(ErrorType.ACTION_FAILED);
      },
    });
  }

  setPreferredLanguage(language: string) {
    const user = this.authService.currentUser();
    if (user && user.email) {
      this.api.setPreferredLanguage(language).subscribe({
        next: () => {
          this.authService.updateUserLanguage(language);
          console.log(`set language for ${user.email}: ${language}`);
        },
        error: (e) => {
          console.error('Error setPreferredLanguage: ', e);
          this.viewController.showError(ErrorType.ACTION_FAILED);
        },
      });
    }
  }
}
