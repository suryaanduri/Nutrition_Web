import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import {
  MemberDrawerMode,
  MemberFormDrawerComponent,
  MemberFormValue
} from './member-form-drawer.component';

type MemberStatus = 'Active' | 'Needs attention' | 'Inactive';
type MemberTrend = 'up' | 'down' | 'steady';
type GoalFilter = 'All goals' | 'Weight Loss' | 'Weight Gain' | 'PCOS' | 'Metabolic Reset';
type GoalOption = Exclude<GoalFilter, 'All goals'>;
type VisitFilter = 'Any time' | 'Today' | '7 days' | '30 days';
type SortFilter = 'Recent' | 'Name' | 'Risk';
type StatusFilter = 'All status' | MemberStatus;

interface MemberRecord {
  id: string;
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
  readonly createRequestToken = input(0);
  readonly memberSelected = output<string>();

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

  protected readonly members = signal<MemberRecord[]>([
    {
      id: 'MBR-1042',
      name: 'Rhea Sharma',
      email: 'rhea.sharma@nourish.app',
      phone: '+91 98765 10245',
      dob: '1996-05-14',
      height: '164',
      gender: 'Female',
      goal: 'PCOS',
      coach: 'Ava Nelson',
      joinedOn: 'Joined 12 Jan 2026',
      tagLine: 'Cycle regularity and fat loss phase',
      lastWeight: '68.4 kg',
      bodyFat: '31.2%',
      lastVisitLabel: 'Today, 10:30 AM',
      lastVisitDays: 0,
      status: 'Needs attention',
      flags: ['Needs attention', 'Missed follow-up'],
      trend: 'down'
    },
    {
      id: 'MBR-0987',
      name: 'Arjun Menon',
      email: 'arjun.menon@nourish.app',
      phone: '+91 99887 44321',
      dob: '1992-11-02',
      height: '178',
      gender: 'Male',
      goal: 'Metabolic Reset',
      coach: 'Ava Nelson',
      joinedOn: 'Joined 03 Feb 2026',
      tagLine: 'Energy recovery and insulin sensitivity',
      lastWeight: '82.1 kg',
      bodyFat: '24.8%',
      lastVisitLabel: '2 days ago',
      lastVisitDays: 2,
      status: 'Active',
      flags: ['New member'],
      trend: 'up'
    },
    {
      id: 'MBR-0871',
      name: 'Sana Qureshi',
      email: 'sana.qureshi@nourish.app',
      phone: '+91 98111 77223',
      dob: '1994-08-28',
      height: '160',
      gender: 'Female',
      goal: 'Weight Loss',
      coach: 'Mila Carter',
      joinedOn: 'Joined 08 Mar 2026',
      tagLine: 'Wedding cut with high adherence',
      lastWeight: '59.8 kg',
      bodyFat: '26.1%',
      lastVisitLabel: 'Today, 8:45 AM',
      lastVisitDays: 0,
      status: 'Active',
      flags: ['Progressing well'],
      trend: 'up'
    },
    {
      id: 'MBR-0773',
      name: 'Kavya Iyer',
      email: 'kavya.iyer@nourish.app',
      phone: '+91 98454 88771',
      dob: '1998-01-17',
      height: '167',
      gender: 'Female',
      goal: 'Weight Gain',
      coach: 'Rita Jones',
      joinedOn: 'Joined 14 Mar 2026',
      tagLine: 'Strength gain and recovery nutrition',
      lastWeight: '51.3 kg',
      bodyFat: '19.4%',
      lastVisitLabel: '6 days ago',
      lastVisitDays: 6,
      status: 'Active',
      flags: ['New member'],
      trend: 'steady'
    },
    {
      id: 'MBR-0612',
      name: 'Nadia Khan',
      email: 'nadia.khan@nourish.app',
      phone: '+91 97000 11226',
      dob: '1991-03-21',
      height: '162',
      gender: 'Female',
      goal: 'Weight Loss',
      coach: 'Mila Carter',
      joinedOn: 'Joined 19 Feb 2026',
      tagLine: 'Postpartum recomposition and sleep support',
      lastWeight: '72.6 kg',
      bodyFat: '34.7%',
      lastVisitLabel: '13 days ago',
      lastVisitDays: 13,
      status: 'Needs attention',
      flags: ['Needs attention'],
      trend: 'down'
    },
    {
      id: 'MBR-0439',
      name: 'Rahul Sethi',
      email: 'rahul.sethi@nourish.app',
      phone: '+91 99550 21087',
      dob: '1989-09-09',
      height: '175',
      gender: 'Male',
      goal: 'Metabolic Reset',
      coach: 'Coach Mila',
      joinedOn: 'Joined 25 Jan 2026',
      tagLine: 'Prediabetes reversal protocol',
      lastWeight: '89.4 kg',
      bodyFat: '29.8%',
      lastVisitLabel: '27 days ago',
      lastVisitDays: 27,
      status: 'Inactive',
      flags: ['Missed follow-up'],
      trend: 'steady'
    }
  ]);

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

  protected readonly drawerSuccessMessage = computed(() =>
    this.drawerMode() === 'edit' ? 'Member details updated.' : 'added to the member list.'
  );

  constructor() {
    effect(() => {
      if (this.createRequestToken() > 0) {
        this.openAddMemberDrawer();
      }
    });
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
    this.memberSelected.emit(memberId);
  }

  protected openAddMemberDrawer(): void {
    this.drawerMode.set('create');
    this.editingMemberId.set(null);
    this.drawerOpen.set(true);
    this.saveFeedback.set('');
  }

  protected openEditMemberDrawer(memberId: string): void {
    this.drawerMode.set('edit');
    this.editingMemberId.set(memberId);
    this.drawerOpen.set(true);
    this.saveFeedback.set('');
  }

  protected closeMemberDrawer(clearFeedback = true): void {
    this.drawerOpen.set(false);
    this.editingMemberId.set(null);
    if (clearFeedback) {
      this.saveFeedback.set('');
    }
  }

  protected saveMember(payload: MemberFormValue): void {
    if (this.drawerMode() === 'edit' && payload.id) {
      this.members.update((members) =>
        members.map((member) =>
          member.id === payload.id
            ? {
                ...member,
                name: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                dob: payload.dob,
                height: payload.height,
                gender: payload.gender,
                goal: payload.goal,
                coach: payload.coach,
                tagLine: this.tagLineForGoal(payload.goal)
              }
            : member
        )
      );
      this.closeMemberDrawer(false);
      this.saveFeedback.set(`${payload.fullName} updated successfully.`);
      return;
    }

    const newMember: MemberRecord = {
      id: `MBR-${Math.floor(1000 + Math.random() * 8999)}`,
      name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      dob: payload.dob,
      height: payload.height,
      gender: payload.gender,
      goal: payload.goal as GoalOption,
      coach: payload.coach,
      joinedOn: 'Joined today',
      tagLine: `Newly onboarded with ${payload.goal.toLowerCase()} care plan`,
      lastWeight: '--',
      bodyFat: '--',
      lastVisitLabel: 'New member',
      lastVisitDays: 0,
      status: 'Active',
      flags: ['New member'],
      trend: 'steady'
    };

    this.members.update((members) => [newMember, ...members]);
    this.closeMemberDrawer(false);
    this.saveFeedback.set(`${payload.fullName} added to the member list.`);
  }

  private tagLineForGoal(goal: GoalOption): string {
    if (goal === 'PCOS') {
      return 'Cycle regularity and fat loss phase';
    }

    if (goal === 'Weight Gain') {
      return 'Strength gain and recovery nutrition';
    }

    if (goal === 'Metabolic Reset') {
      return 'Energy recovery and insulin sensitivity';
    }

    return 'Sustainable fat loss and adherence support';
  }
}

function riskWeight(status: MemberStatus): number {
  if (status === 'Needs attention') {
    return 3;
  }

  if (status === 'Inactive') {
    return 2;
  }

  return 1;
}
