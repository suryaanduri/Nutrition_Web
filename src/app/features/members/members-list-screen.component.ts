import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import {
  AssignableStaffOption,
  MemberDrawerMode,
  MemberFormDrawerComponent,
  MemberFormValue
} from './member-form-drawer.component';
import { MembersService, MemberResponse } from './members.service';
import { UsersService } from '../users/users.service';
import { forkJoin } from 'rxjs';

type MemberStatus = 'Active' | 'Needs attention' | 'Inactive';
type MemberTrend = 'up' | 'down' | 'steady';
type GoalFilter = 'All goals' | 'Weight Loss' | 'Weight Gain' | 'PCOS' | 'Metabolic Reset';
type VisitFilter = 'Any time' | 'Today' | '7 days' | '30 days';
type SortFilter = 'Recent' | 'Name' | 'Risk';
type StatusFilter = 'All status' | MemberStatus;

interface MemberRecord {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  height: string;
  gender: 'Female' | 'Male' | 'Other';
  goal: Exclude<GoalFilter, 'All goals'>;
  coach: string;
  joinedOn: string;
  tagLine: string;
  lastWeight: string;
  bodyFat: string;
  lastVisitLabel: string;
  lastVisitDays: number;
  status: MemberStatus;
  flags: string[];
  trend: MemberTrend;
  assignedCoachUserId?: string | null;
}

@Component({
  selector: 'app-members-list-screen',
  standalone: true,
  imports: [CommonModule, IconComponent, MemberFormDrawerComponent],
  templateUrl: './members-list-screen.component.html',
  styleUrl: './members-list-screen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MembersListScreenComponent {
  private readonly router = inject(Router);
  private readonly membersService = inject(MembersService);
  private readonly usersService = inject(UsersService);

  protected readonly statusOptions: StatusFilter[] = [
    'All status',
    'Active',
    'Needs attention',
    'Inactive'
  ];
  protected readonly goalOptions: GoalFilter[] = [
    'All goals',
    'Weight Loss',
    'Weight Gain',
    'PCOS',
    'Metabolic Reset'
  ];
  protected readonly visitOptions: VisitFilter[] = ['Any time', 'Today', '7 days', '30 days'];
  protected readonly sortOptions: SortFilter[] = ['Recent', 'Name', 'Risk'];

  protected readonly members = signal<MemberRecord[]>([]);
  protected readonly coachOptions = signal<AssignableStaffOption[]>([]);
  protected readonly query = signal('');
  protected readonly selectedStatus = signal<StatusFilter>('All status');
  protected readonly selectedGoal = signal<GoalFilter>('All goals');
  protected readonly selectedVisit = signal<VisitFilter>('Any time');
  protected readonly selectedSort = signal<SortFilter>('Recent');
  protected readonly drawerOpen = signal(false);
  protected readonly drawerMode = signal<MemberDrawerMode>('create');
  protected readonly editingMemberId = signal<string | null>(null);
  protected readonly saveFeedback = signal('');

  protected readonly filteredMembers = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.selectedStatus();
    const goal = this.selectedGoal();
    const visit = this.selectedVisit();
    const sort = this.selectedSort();

    let list = this.members().filter((member) => {
      const matchesQuery =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.phone.includes(query) ||
        member.goal.toLowerCase().includes(query);
      const matchesStatus = status === 'All status' || member.status === status;
      const matchesGoal = goal === 'All goals' || member.goal === goal;
      const matchesVisit =
        visit === 'Any time' ||
        (visit === 'Today' && member.lastVisitDays === 0) ||
        (visit === '7 days' && member.lastVisitDays <= 7) ||
        (visit === '30 days' && member.lastVisitDays <= 30);

      return matchesQuery && matchesStatus && matchesGoal && matchesVisit;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'Name') {
        return a.name.localeCompare(b.name);
      }

      if (sort === 'Risk') {
        return riskWeight(b.status) - riskWeight(a.status);
      }

      return a.lastVisitDays - b.lastVisitDays;
    });

    return list;
  });

  protected readonly memberCountLabel = computed(() => `${this.filteredMembers().length} members`);
  protected readonly editingMember = computed(
    () => this.members().find((member) => member.id === this.editingMemberId()) ?? null
  );
  protected readonly drawerInitialValue = computed<MemberFormValue | null>(() => {
    const member = this.editingMember();
    if (!member) {
      return null;
    }

    return {
      id: member.id,
      joinedOn: member.joinedOn,
      fullName: member.name,
      dob: member.dob,
      height: member.height,
      email: member.email,
      phone: member.phone,
      gender: member.gender,
      goal: member.goal,
      coach: member.coach
    };
  });

  constructor() {
    this.loadMembers();
    this.loadCoaches();
  }

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected setStatus(value: string): void {
    this.selectedStatus.set(value as StatusFilter);
  }

  protected setGoal(value: string): void {
    this.selectedGoal.set(value as GoalFilter);
  }

  protected setVisit(value: string): void {
    this.selectedVisit.set(value as VisitFilter);
  }

  protected setSort(value: string): void {
    this.selectedSort.set(value as SortFilter);
  }

  protected resetFilters(): void {
    this.query.set('');
    this.selectedStatus.set('All status');
    this.selectedGoal.set('All goals');
    this.selectedVisit.set('Any time');
    this.selectedSort.set('Recent');
  }

  protected openMember(memberId: string): void {
    void this.router.navigate(['/members', memberId]);
  }

  protected openAddMemberDrawer(): void {
    this.drawerMode.set('create');
    this.editingMemberId.set(null);
    this.drawerOpen.set(true);
  }

  protected openEditMemberDrawer(memberId: string): void {
    this.drawerMode.set('edit');
    this.editingMemberId.set(memberId);
    this.drawerOpen.set(true);
  }

  protected closeMemberDrawer(): void {
    this.drawerOpen.set(false);
  }

  protected saveMember(payload: MemberFormValue): void {
    const coach = this.coachOptions().find((item) => item.fullName === payload.coach);
    if (!coach) {
      return;
    }

    const request = {
      fullName: payload.fullName,
      dob: payload.dob,
      gender: payload.gender,
      email: payload.email,
      phone: payload.phone.replace(/\D/g, ''),
      heightCm: Number(payload.height),
      goal: payload.goal,
      assignedCoachUserId: coach.id
    };

    const action =
      this.drawerMode() === 'edit' && payload.id
        ? this.membersService.updateMember(payload.id, request)
        : this.membersService.createMember(request);

    action.subscribe({
      next: () => {
        this.saveFeedback.set(
          this.drawerMode() === 'edit' ? 'Member updated successfully.' : 'Member created successfully.'
        );
        this.drawerOpen.set(false);
        this.loadMembers();
        setTimeout(() => this.saveFeedback.set(''), 2200);
      }
    });
  }

  private loadMembers(): void {
    this.membersService.listMembers({ limit: 100 }).subscribe({
      next: (response) => this.members.set(response.items.map((member) => this.mapMember(member)))
    });
  }

  private loadCoaches(): void {
    forkJoin([
      this.usersService.listUsers({ limit: 100, role: 'COACH', status: 'ACTIVE' }),
      this.usersService.listUsers({ limit: 100, role: 'CENTER_ADMIN', status: 'ACTIVE' })
    ]).subscribe({
      next: ([coachesResponse, adminsResponse]) =>
        this.coachOptions.set(
          [...coachesResponse.items, ...adminsResponse.items]
            .map((user) => ({
              id: user.id,
              fullName: user.fullName,
              role: user.role as AssignableStaffOption['role']
            }))
            .sort((left, right) => left.fullName.localeCompare(right.fullName))
        )
    });
  }

  private mapMember(member: MemberResponse): MemberRecord {
    return {
      id: member.id,
      memberCode: member.memberCode,
      name: member.fullName,
      email: member.email,
      phone: member.phone,
      dob: member.dob.slice(0, 10),
      height: member.heightCm,
      gender: (['Female', 'Male', 'Other'].includes(member.gender) ? member.gender : 'Other') as
        | 'Female'
        | 'Male'
        | 'Other',
      goal: toGoalOption(member.goal),
      coach: member.assignedCoach?.fullName ?? 'Unassigned',
      joinedOn: `Joined ${new Date(member.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })}`,
      tagLine: member.goal,
      lastWeight: '--',
      bodyFat: '--',
      lastVisitLabel: new Date(member.updatedAt).toLocaleDateString('en-IN'),
      lastVisitDays: daysAgo(member.updatedAt),
      status: toMemberStatus(member.status),
      flags: member.status === 'ACTIVE' ? ['Active'] : ['Needs attention'],
      trend: 'steady',
      assignedCoachUserId: member.assignedCoach?.id ?? null
    };
  }
}

function daysAgo(value: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)));
}

function riskWeight(status: MemberStatus): number {
  return status === 'Needs attention' ? 3 : status === 'Active' ? 2 : 1;
}

function toMemberStatus(status: string): MemberStatus {
  if (status === 'ACTIVE') {
    return 'Active';
  }

  if (status === 'INACTIVE') {
    return 'Inactive';
  }

  return 'Needs attention';
}

function toGoalOption(goal: string): Exclude<GoalFilter, 'All goals'> {
  if (goal.includes('Gain')) {
    return 'Weight Gain';
  }
  if (goal.includes('PCOS')) {
    return 'PCOS';
  }
  if (goal.includes('Metabolic')) {
    return 'Metabolic Reset';
  }
  return 'Weight Loss';
}
