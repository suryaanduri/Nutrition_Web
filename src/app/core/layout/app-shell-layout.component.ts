import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  signal
} from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { DashboardScreenComponent } from '../../features/dashboard/dashboard-screen.component';
import { EvaluationsListScreenComponent } from '../../features/evaluations/evaluations-list-screen.component';
import { MembersListScreenComponent } from '../../features/members/members-list-screen.component';
import { MemberDetail } from '../../features/members/member-detail/member-detail';

type NavKey = 'dashboard' | 'members' | 'evaluations' | 'feed' | 'approvals' | 'chat';

interface NavItem {
  key: NavKey;
  label: string;
  description: string;
  badge?: string;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    DashboardScreenComponent,
    EvaluationsListScreenComponent,
    MembersListScreenComponent,
    MemberDetail
  ],
  templateUrl: './app-shell-layout.component.html',
  styleUrl: './app-shell-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellLayoutComponent {
  protected readonly navItems: NavItem[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      description: 'Performance, schedule, and operational signals'
    },
    {
      key: 'members',
      label: 'Members',
      description: 'Track onboarding, adherence, and engagement'
    },
    {
      key: 'evaluations',
      label: 'Evaluations',
      description: 'Review assessments, goals, and follow-ups'
    },
    {
      key: 'feed',
      label: 'Feed',
      description: 'Content calendar, publishing, and reach'
    },
    {
      key: 'approvals',
      label: 'Approvals',
      description: 'Coach reviews and pending publishing checks',
      badge: '8'
    },
    {
      key: 'chat',
      label: 'Chat',
      description: 'Priority conversations and live member support',
      badge: '14'
    }
  ];

  protected readonly activeNav = signal<NavKey>('dashboard');
  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileNavOpen = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly selectedMemberId = signal<string | null>(null);

  protected readonly currentNav = computed(
    () => this.navItems.find((item) => item.key === this.activeNav()) ?? this.navItems[0]
  );

  protected readonly pageTitle = computed(() =>
    this.isMemberDetail() ? 'Member Detail' : this.currentNav().label
  );
  protected readonly pageDescription = computed(() =>
    this.isMemberDetail()
      ? 'Progress, evaluations, adherence, and next best actions for this member'
      : this.currentNav().description
  );
  protected readonly isDashboard = computed(() => this.activeNav() === 'dashboard');
  protected readonly isMembers = computed(() => this.activeNav() === 'members');
  protected readonly isEvaluations = computed(() => this.activeNav() === 'evaluations');
  protected readonly isMemberDetail = computed(
    () => this.activeNav() === 'members' && this.selectedMemberId() !== null
  );
  protected readonly desktopSidebarWidth = computed(() => (this.sidebarCollapsed() ? 96 : 288));

  constructor() {
    this.syncViewportState();
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.syncViewportState();
  }

  protected selectNavItem(key: NavKey): void {
    this.activeNav.set(key);
    if (key !== 'members') {
      this.selectedMemberId.set(null);
    }
    if (this.isMobile()) {
      this.mobileNavOpen.set(false);
    }
  }

  protected openMemberDetail(memberId: string): void {
    this.activeNav.set('members');
    this.selectedMemberId.set(memberId);
    if (this.isMobile()) {
      this.mobileNavOpen.set(false);
    }
  }

  protected closeMemberDetail(): void {
    this.selectedMemberId.set(null);
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

  private syncViewportState(): void {
    const mobile = window.innerWidth < 1024;
    this.isMobile.set(mobile);

    if (!mobile) {
      this.mobileNavOpen.set(false);
    }
  }
}
