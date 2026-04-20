import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EvaluationsService, EvaluationResponse } from './evaluations.service';

type CoachFilter = 'All coaches' | string;
type TypeFilter = 'All types' | 'Recorded';
type DateFilter = 'All dates' | 'Last 7 days' | 'Last 30 days';
type SortFilter = 'Most recent' | 'Member name' | 'Coach';
type ScreenState = 'default' | 'loading' | 'error';

interface EvaluationRecordView {
  id: string;
  memberId: string;
  memberName: string;
  type: 'Recorded';
  summary: string;
  scheduledLabel: string;
  timeLabel: string;
  coach: string;
  relativeLabel: string;
  daysFromToday: number;
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
  private readonly router = inject(Router);
  private readonly evaluationsService = inject(EvaluationsService);

  protected readonly coachOptions: CoachFilter[] = ['All coaches'];
  protected readonly typeOptions: TypeFilter[] = ['All types', 'Recorded'];
  protected readonly dateOptions: DateFilter[] = ['All dates', 'Last 7 days', 'Last 30 days'];
  protected readonly sortOptions: SortFilter[] = ['Most recent', 'Member name', 'Coach'];

  protected readonly records = signal<EvaluationRecordView[]>([]);
  protected readonly query = signal('');
  protected readonly selectedCoach = signal<CoachFilter>('All coaches');
  protected readonly selectedType = signal<TypeFilter>('All types');
  protected readonly selectedDate = signal<DateFilter>('All dates');
  protected readonly selectedSort = signal<SortFilter>('Most recent');
  protected readonly screenState = signal<ScreenState>('loading');

  protected readonly filteredRecords = computed(() => {
    const query = this.query().trim().toLowerCase();
    const coach = this.selectedCoach();
    const date = this.selectedDate();
    const sort = this.selectedSort();

    let list = this.records().filter((record) => {
      const matchesQuery =
        !query ||
        record.memberName.toLowerCase().includes(query) ||
        record.memberId.toLowerCase().includes(query) ||
        record.id.toLowerCase().includes(query);
      const matchesCoach = coach === 'All coaches' || record.coach === coach;
      const matchesDate =
        date === 'All dates' ||
        (date === 'Last 7 days' && record.daysFromToday <= 7) ||
        (date === 'Last 30 days' && record.daysFromToday <= 30);

      return matchesQuery && matchesCoach && matchesDate;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'Member name') {
        return a.memberName.localeCompare(b.memberName);
      }
      if (sort === 'Coach') {
        return a.coach.localeCompare(b.coach);
      }
      return a.daysFromToday - b.daysFromToday;
    });

    return list;
  });

  protected readonly totalEvaluations = computed(() => this.records().length);
  protected readonly recentEntries = computed(
    () => this.records().filter((record) => record.daysFromToday <= 7).length
  );
  protected readonly resultsLabel = computed(
    () => `${this.filteredRecords().length} evaluation records`
  );
  protected readonly skeletonRows = Array.from({ length: 4 });

  constructor() {
    this.loadEvaluations();
  }

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected setCoach(value: string): void {
    this.selectedCoach.set(value);
  }

  protected setType(value: string): void {
    this.selectedType.set(value as TypeFilter);
  }

  protected setDate(value: string): void {
    this.selectedDate.set(value as DateFilter);
  }

  protected setSort(value: string): void {
    this.selectedSort.set(value as SortFilter);
  }

  protected resetFilters(): void {
    this.query.set('');
    this.selectedCoach.set('All coaches');
    this.selectedType.set('All types');
    this.selectedDate.set('All dates');
    this.selectedSort.set('Most recent');
  }

  protected setScreenState(state: ScreenState): void {
    this.screenState.set(state);
    if (state === 'default') {
      this.loadEvaluations();
    }
  }

  protected requestAddEvaluation(): void {
    void this.router.navigate(['/evaluations/new']);
  }

  protected requestEditEvaluation(recordId: string): void {
    void this.router.navigate(['/evaluations', recordId, 'edit']);
  }

  private loadEvaluations(): void {
    this.screenState.set('loading');
    this.evaluationsService.listEvaluations({ limit: 100 }).subscribe({
      next: (response) => {
        this.records.set(response.items.map((item) => this.mapRecord(item)));
        this.screenState.set('default');
      },
      error: () => this.screenState.set('error')
    });
  }

  private mapRecord(item: EvaluationResponse): EvaluationRecordView {
    const recordedAt = new Date(item.recordedAt);
    return {
      id: item.id,
      memberId: item.memberId,
      memberName: item.member.fullName,
      type: 'Recorded',
      summary: `Weight ${item.weight} kg · BMI ${item.bmi}`,
      scheduledLabel: recordedAt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      timeLabel: recordedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
      coach: item.member.assignedCoach?.fullName ?? 'Assigned staff',
      relativeLabel: recordedAt.toLocaleString('en-IN'),
      daysFromToday: Math.max(
        0,
        Math.floor((Date.now() - recordedAt.getTime()) / (1000 * 60 * 60 * 24))
      )
    };
  }
}
