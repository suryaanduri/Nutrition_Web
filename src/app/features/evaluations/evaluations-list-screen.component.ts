import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';

type EvaluationStatus = 'Pending review' | 'Completed' | 'Scheduled' | 'Overdue';
type EvaluationType =
  | 'Baseline'
  | 'Progress'
  | 'Body composition'
  | 'Follow-up';
type DateFilter = 'All dates' | 'Today' | '7 days' | '30 days' | 'Upcoming';
type StatusFilter = 'All status' | EvaluationStatus;
type CoachFilter = 'All coaches' | 'Ava Nelson' | 'Mila Carter' | 'Rita Jones';
type TypeFilter = 'All types' | EvaluationType;
type SortFilter = 'Recent' | 'Priority' | 'Member name';
type ScreenState = 'default' | 'loading' | 'error';
type PriorityTone = 'critical' | 'warning' | 'normal';

interface EvaluationRecord {
  id: string;
  memberId: string;
  memberName: string;
  type: EvaluationType;
  status: EvaluationStatus;
  coach: Exclude<CoachFilter, 'All coaches'>;
  scheduledLabel: string;
  timeLabel: string;
  relativeLabel: string;
  summary: string;
  nextAction: string;
  flags: string[];
  daysFromToday: number;
  priority: PriorityTone;
}

interface SupportSignal {
  label: string;
  value: string;
  detail: string;
}

@Component({
  selector: 'app-evaluations-list-screen',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './evaluations-list-screen.component.html',
  styleUrl: './evaluations-list-screen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaluationsListScreenComponent {
  protected readonly statusOptions: StatusFilter[] = [
    'All status',
    'Pending review',
    'Completed',
    'Scheduled',
    'Overdue'
  ];
  protected readonly coachOptions: CoachFilter[] = [
    'All coaches',
    'Ava Nelson',
    'Mila Carter',
    'Rita Jones'
  ];
  protected readonly typeOptions: TypeFilter[] = [
    'All types',
    'Baseline',
    'Progress',
    'Body composition',
    'Follow-up'
  ];
  protected readonly dateOptions: DateFilter[] = ['All dates', 'Today', '7 days', '30 days', 'Upcoming'];
  protected readonly sortOptions: SortFilter[] = ['Recent', 'Priority', 'Member name'];

  protected readonly records = signal<EvaluationRecord[]>([
    {
      id: 'EVAL-2408',
      memberId: 'MBR-1042',
      memberName: 'Rhea Sharma',
      type: 'Progress',
      status: 'Pending review',
      coach: 'Ava Nelson',
      scheduledLabel: 'Today',
      timeLabel: '10:30 AM',
      relativeLabel: 'Captured 38 min ago',
      summary: 'Weight and body-fat moved in the right direction, but sleep and hydration dipped this week.',
      nextAction: 'Review notes and confirm the next 7-day adjustment before noon.',
      flags: ['Today', 'Needs coach review'],
      daysFromToday: 0,
      priority: 'critical'
    },
    {
      id: 'EVAL-2397',
      memberId: 'MBR-0612',
      memberName: 'Nadia Khan',
      type: 'Follow-up',
      status: 'Overdue',
      coach: 'Mila Carter',
      scheduledLabel: '14 Apr 2026',
      timeLabel: '4:00 PM',
      relativeLabel: 'Missed 2 days ago',
      summary: 'Postpartum recomposition review was not completed and follow-up momentum is softening.',
      nextAction: 'Reschedule immediately and notify the assigned coach before the evening block.',
      flags: ['Overdue', 'Priority member'],
      daysFromToday: -2,
      priority: 'critical'
    },
    {
      id: 'EVAL-2411',
      memberId: 'MBR-0987',
      memberName: 'Arjun Menon',
      type: 'Body composition',
      status: 'Scheduled',
      coach: 'Ava Nelson',
      scheduledLabel: 'Today',
      timeLabel: '1:00 PM',
      relativeLabel: 'Starts in 1h 20m',
      summary: 'Metabolic reset checkpoint with composition scan and adherence review.',
      nextAction: 'Prepare the comparison snapshot before the consultation starts.',
      flags: ['Today'],
      daysFromToday: 0,
      priority: 'warning'
    },
    {
      id: 'EVAL-2388',
      memberId: 'MBR-0871',
      memberName: 'Sana Qureshi',
      type: 'Progress',
      status: 'Completed',
      coach: 'Rita Jones',
      scheduledLabel: '15 Apr 2026',
      timeLabel: '8:45 AM',
      relativeLabel: 'Completed yesterday',
      summary: 'Wedding cut plan remains on track with strong adherence and improved energy.',
      nextAction: 'No escalation needed. Keep the current pace and schedule the next weekly review.',
      flags: ['Stable'],
      daysFromToday: -1,
      priority: 'normal'
    },
    {
      id: 'EVAL-2379',
      memberId: 'MBR-0773',
      memberName: 'Kavya Iyer',
      type: 'Baseline',
      status: 'Scheduled',
      coach: 'Rita Jones',
      scheduledLabel: '18 Apr 2026',
      timeLabel: '11:15 AM',
      relativeLabel: 'Scheduled in 2 days',
      summary: 'Initial strength-gain baseline assessment with body composition and goal capture.',
      nextAction: 'Confirm intake readiness and make sure onboarding notes are complete.',
      flags: ['New member'],
      daysFromToday: 2,
      priority: 'normal'
    },
    {
      id: 'EVAL-2365',
      memberId: 'MBR-0439',
      memberName: 'Rahul Sethi',
      type: 'Follow-up',
      status: 'Pending review',
      coach: 'Mila Carter',
      scheduledLabel: '13 Apr 2026',
      timeLabel: '6:15 PM',
      relativeLabel: 'Awaiting sign-off for 3 days',
      summary: 'Prediabetes reversal follow-up was entered, but coach sign-off is still pending.',
      nextAction: 'Close the review so medication-support notes can be finalized.',
      flags: ['Pending sign-off'],
      daysFromToday: -3,
      priority: 'warning'
    }
  ]);

  protected readonly query = signal('');
  protected readonly selectedStatus = signal<StatusFilter>('All status');
  protected readonly selectedCoach = signal<CoachFilter>('All coaches');
  protected readonly selectedType = signal<TypeFilter>('All types');
  protected readonly selectedDate = signal<DateFilter>('All dates');
  protected readonly selectedSort = signal<SortFilter>('Recent');
  protected readonly screenState = signal<ScreenState>('default');
  protected readonly selectedEvaluationId = signal<string>('EVAL-2408');

  protected readonly filteredRecords = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.selectedStatus();
    const coach = this.selectedCoach();
    const type = this.selectedType();
    const date = this.selectedDate();
    const sort = this.selectedSort();

    let list = this.records().filter((record) => {
      const matchesQuery =
        !query ||
        record.memberName.toLowerCase().includes(query) ||
        record.memberId.toLowerCase().includes(query) ||
        record.id.toLowerCase().includes(query) ||
        record.type.toLowerCase().includes(query);
      const matchesStatus = status === 'All status' || record.status === status;
      const matchesCoach = coach === 'All coaches' || record.coach === coach;
      const matchesType = type === 'All types' || record.type === type;
      const matchesDate =
        date === 'All dates' ||
        (date === 'Today' && record.daysFromToday === 0) ||
        (date === '7 days' && record.daysFromToday >= -7 && record.daysFromToday <= 0) ||
        (date === '30 days' && record.daysFromToday >= -30 && record.daysFromToday <= 0) ||
        (date === 'Upcoming' && record.daysFromToday > 0);

      return matchesQuery && matchesStatus && matchesCoach && matchesType && matchesDate;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'Member name') {
        return a.memberName.localeCompare(b.memberName);
      }

      if (sort === 'Priority') {
        return priorityWeight(b.priority) - priorityWeight(a.priority) || a.daysFromToday - b.daysFromToday;
      }

      return a.daysFromToday - b.daysFromToday;
    });

    return list;
  });

  protected readonly selectedRecord = computed(
    () =>
      this.records().find((record) => record.id === this.selectedEvaluationId()) ??
      this.filteredRecords()[0] ??
      this.records()[0]
  );

  protected readonly pendingCount = computed(
    () => this.records().filter((record) => record.status === 'Pending review').length
  );
  protected readonly todayCount = computed(
    () => this.records().filter((record) => record.daysFromToday === 0).length
  );
  protected readonly completedCount = computed(
    () => this.records().filter((record) => record.status === 'Completed').length
  );
  protected readonly overdueCount = computed(
    () => this.records().filter((record) => record.status === 'Overdue').length
  );
  protected readonly resultsLabel = computed(
    () => `${this.filteredRecords().length} evaluations in the active queue`
  );
  protected readonly attentionSignals = computed<SupportSignal[]>(() => [
    {
      label: 'Needs attention now',
      value: `${this.overdueCount() + this.pendingCount()}`,
      detail: 'Overdue follow-ups and pending reviews should be cleared before the next coach block.'
    },
    {
      label: 'Today’s workload',
      value: `${this.todayCount()} records`,
      detail: 'Blend same-day reviews with scheduled consultations to avoid evening backlog.'
    },
    {
      label: 'Selected next step',
      value: this.selectedRecord().status,
      detail: this.selectedRecord().nextAction
    }
  ]);
  protected readonly priorityRecords = computed(() =>
    this.records().filter((record) => record.priority !== 'normal').slice(0, 3)
  );

  protected readonly skeletonRows = Array.from({ length: 3 });

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected setStatus(value: StatusFilter): void {
    this.selectedStatus.set(value);
  }

  protected setCoach(value: CoachFilter): void {
    this.selectedCoach.set(value);
  }

  protected setType(value: TypeFilter): void {
    this.selectedType.set(value);
  }

  protected setDate(value: DateFilter): void {
    this.selectedDate.set(value);
  }

  protected setSort(value: SortFilter): void {
    this.selectedSort.set(value);
  }

  protected selectEvaluation(recordId: string): void {
    this.selectedEvaluationId.set(recordId);
  }

  protected resetFilters(): void {
    this.query.set('');
    this.selectedStatus.set('All status');
    this.selectedCoach.set('All coaches');
    this.selectedType.set('All types');
    this.selectedDate.set('All dates');
    this.selectedSort.set('Recent');
  }

  protected setScreenState(state: ScreenState): void {
    this.screenState.set(state);
  }

  protected statusClass(status: EvaluationStatus): string {
    if (status === 'Completed') {
      return 'bg-[rgba(25,135,84,0.1)] text-[var(--ncm-success)]';
    }

    if (status === 'Overdue') {
      return 'bg-[rgba(194,65,59,0.1)] text-[var(--ncm-danger)]';
    }

    if (status === 'Pending review') {
      return 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
    }

    return 'bg-[var(--ncm-primary-soft)] text-[var(--ncm-primary-strong)]';
  }

  protected flagClass(flag: string): string {
    if (flag === 'Overdue' || flag === 'Priority member') {
      return 'bg-[rgba(194,65,59,0.1)] text-[var(--ncm-danger)]';
    }

    if (flag === 'Needs coach review' || flag === 'Pending sign-off') {
      return 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
    }

    if (flag === 'Today' || flag === 'New member') {
      return 'bg-[rgba(36,122,82,0.1)] text-[var(--ncm-primary-strong)]';
    }

    return 'bg-[var(--ncm-surface-soft)] text-[var(--ncm-text-muted)]';
  }

  protected priorityCardClass(priority: PriorityTone): string {
    if (priority === 'critical') {
      return 'border-[rgba(194,65,59,0.22)] ring-1 ring-[rgba(194,65,59,0.08)] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f7_100%)]';
    }

    if (priority === 'warning') {
      return 'border-[rgba(183,121,31,0.18)] ring-1 ring-[rgba(183,121,31,0.08)] bg-[linear-gradient(180deg,#ffffff_0%,#fffbf4_100%)]';
    }

    return 'border-[color:var(--ncm-border)] hover:border-[rgba(36,122,82,0.18)]';
  }
}

function priorityWeight(priority: PriorityTone): number {
  if (priority === 'critical') {
    return 3;
  }

  if (priority === 'warning') {
    return 2;
  }

  return 1;
}
