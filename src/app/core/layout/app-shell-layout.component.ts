import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';

type NavKey = 'dashboard' | 'members' | 'centers' | 'evaluations' | 'chat' | 'feed';

interface NavItem {
  key: NavKey;
  label: string;
  description: string;
  route: string;
  badge?: string;
  roles?: Array<'SUPER_ADMIN' | 'CENTER_ADMIN' | 'COACH'>;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, IconComponent],
  templateUrl: './app-shell-layout.component.html',
  styleUrl: './app-shell-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellLayoutComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  protected readonly session = inject(SessionService);

  protected readonly workspaceName = 'NCM Platform';
  protected readonly workspaceSubtitle = 'Nutrition operations workspace';

  protected readonly navItems = computed<NavItem[]>(() => {
    const role = this.session.role();

    const items: NavItem[] = [
      {
        key: 'dashboard',
        label: 'Dashboard',
        description: 'Performance, schedule, and operational signals',
        route: '/dashboard'
      },
      {
        key: 'members',
        label: 'Members',
        description: 'Track onboarding, adherence, and engagement',
        route: '/members'
      },
      {
        key: 'centers',
        label: 'Centers',
        description: 'Manage locations, center admins, and onboarding',
        route: '/centers',
        roles: ['SUPER_ADMIN']
      },
      {
        key: 'evaluations',
        label: 'Evaluations',
        description: 'Review assessments, goals, and follow-ups',
        route: '/evaluations'
      },
      {
        key: 'chat',
        label: 'Chat',
        description: 'Priority conversations and live member support',
        route: '/chat',
        badge: role === 'SUPER_ADMIN' ? undefined : 'Live',
        roles: ['CENTER_ADMIN', 'COACH']
      },
      {
        key: 'feed',
        label: 'Feed',
        description: 'Content calendar, publishing, and reach',
        route: '/feed'
      }
    ];

    return items.filter((item) => !item.roles || (role ? item.roles.includes(role) : false));
  });

  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileNavOpen = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly activeNav = signal<NavKey>('dashboard');
  protected readonly desktopSidebarWidth = computed(() => (this.sidebarCollapsed() ? 96 : 288));

  constructor() {
    this.syncViewportState();
    this.syncActiveNav(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => this.syncActiveNav((event as NavigationEnd).urlAfterRedirects));
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.syncViewportState();
  }

  protected toggleSidebar(): void {
    if (this.isMobile()) {
      this.mobileNavOpen.update((value) => !value);
      return;
    }

    this.sidebarCollapsed.update((value) => !value);
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  private syncViewportState(): void {
    const mobile = window.innerWidth < 1024;
    this.isMobile.set(mobile);

    if (!mobile) {
      this.mobileNavOpen.set(false);
    }
  }

  private syncActiveNav(url: string): void {
    if (url.startsWith('/members')) {
      this.activeNav.set('members');
      return;
    }

    if (url.startsWith('/centers')) {
      this.activeNav.set('centers');
      return;
    }

    if (url.startsWith('/evaluations')) {
      this.activeNav.set('evaluations');
      return;
    }

    if (url.startsWith('/chat')) {
      this.activeNav.set('chat');
      return;
    }

    if (url.startsWith('/feed')) {
      this.activeNav.set('feed');
      return;
    }

    this.activeNav.set('dashboard');
  }
}
