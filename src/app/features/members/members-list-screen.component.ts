import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';

type MemberStatus = 'Active' | 'Needs attention' | 'Inactive';
type MemberTrend = 'up' | 'down' | 'steady';
type GoalFilter = 'All goals' | 'Weight Loss' | 'Weight Gain' | 'PCOS' | 'Metabolic Reset';
type VisitFilter = 'Any time' | 'Today' | '7 days' | '30 days';
type SortFilter = 'Recent' | 'Name' | 'Risk';
type StatusFilter = 'All status' | MemberStatus;

interface MemberRecord {
  id: string;
  name: string;
  phone: string;
  goal: Exclude<GoalFilter, 'All goals'>;
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
  imports: [CommonModule, IconComponent],
  templateUrl: './members-list-screen.component.html',
  styleUrl: './members-list-screen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MembersListScreenComponent {
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
      phone: '+91 98765 10245',
      goal: 'PCOS',
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
      phone: '+91 99887 44321',
      goal: 'Metabolic Reset',
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
      phone: '+91 98111 77223',
      goal: 'Weight Loss',
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
      phone: '+91 98454 88771',
      goal: 'Weight Gain',
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
      phone: '+91 97000 11226',
      goal: 'Weight Loss',
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
      phone: '+91 99550 21087',
      goal: 'Metabolic Reset',
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

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected setStatus(value: StatusFilter): void {
    this.selectedStatus.set(value);
  }

  protected setGoal(value: GoalFilter): void {
    this.selectedGoal.set(value);
  }

  protected setVisit(value: VisitFilter): void {
    this.selectedVisit.set(value);
  }

  protected setSort(value: SortFilter): void {
    this.selectedSort.set(value);
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
