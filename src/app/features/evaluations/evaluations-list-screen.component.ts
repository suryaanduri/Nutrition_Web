import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import {
  EVALUATION_RECORDS,
  EvaluationRecord,
  EvaluationStatus,
  EvaluationType,
  PriorityTone
} from './evaluations.data';

type DateFilter = 'All dates' | 'Today' | '7 days' | '30 days' | 'Upcoming';
type StatusFilter = 'All status' | EvaluationStatus;
type CoachFilter = 'All coaches' | 'Ava Nelson' | 'Mila Carter' | 'Rita Jones';
type TypeFilter = 'All types' | EvaluationType;
type SortFilter = 'Recent' | 'Priority' | 'Member name';
type ScreenState = 'default' | 'loading' | 'error';

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
  readonly addEvaluation = output<void>();
  readonly editEvaluation = output<string>();

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

  protected readonly records = signal<EvaluationRecord[]>(EVALUATION_RECORDS);

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

  protected requestAddEvaluation(): void {
    this.addEvaluation.emit();
  }

  protected requestEditEvaluation(recordId: string): void {
    this.editEvaluation.emit(recordId);
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
