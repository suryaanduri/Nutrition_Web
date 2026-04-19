import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EVALUATION_RECORDS, EvaluationRecord, EvaluationType } from './evaluations.data';

type CoachFilter = 'All coaches' | 'Ava Nelson' | 'Mila Carter' | 'Rita Jones';
type TypeFilter = 'All types' | EvaluationType;
type DateFilter = 'All dates' | 'Last 7 days' | 'Last 30 days';
type SortFilter = 'Most recent' | 'Member name' | 'Coach';
type ScreenState = 'default' | 'loading' | 'error';

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
  protected readonly dateOptions: DateFilter[] = ['All dates', 'Last 7 days', 'Last 30 days'];
  protected readonly sortOptions: SortFilter[] = ['Most recent', 'Member name', 'Coach'];

  protected readonly records = signal<EvaluationRecord[]>(EVALUATION_RECORDS);

  protected readonly query = signal('');
  protected readonly selectedCoach = signal<CoachFilter>('All coaches');
  protected readonly selectedType = signal<TypeFilter>('All types');
  protected readonly selectedDate = signal<DateFilter>('All dates');
  protected readonly selectedSort = signal<SortFilter>('Most recent');
  protected readonly screenState = signal<ScreenState>('default');

  protected readonly filteredRecords = computed(() => {
    const query = this.query().trim().toLowerCase();
    const coach = this.selectedCoach();
    const type = this.selectedType();
    const date = this.selectedDate();
    const sort = this.selectedSort();

    let list = this.records().filter((record) => {
      const matchesQuery =
        !query ||
        record.memberName.toLowerCase().includes(query) ||
        record.memberId.toLowerCase().includes(query) ||
        record.id.toLowerCase().includes(query);
      const matchesCoach = coach === 'All coaches' || record.coach === coach;
      const matchesType = type === 'All types' || record.type === type;
      const matchesDate =
        date === 'All dates' ||
        (date === 'Last 7 days' && record.daysFromToday >= -7 && record.daysFromToday <= 0) ||
        (date === 'Last 30 days' && record.daysFromToday >= -30 && record.daysFromToday <= 0);

      return matchesQuery && matchesCoach && matchesType && matchesDate;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'Member name') {
        return a.memberName.localeCompare(b.memberName);
      }

      if (sort === 'Coach') {
        return a.coach.localeCompare(b.coach) || a.memberName.localeCompare(b.memberName);
      }

      return a.daysFromToday - b.daysFromToday;
    });

    return list;
  });

  protected readonly totalEvaluations = computed(() => this.records().length);
  protected readonly recentEntries = computed(
    () => this.records().filter((record) => record.daysFromToday >= -7 && record.daysFromToday <= 0).length
  );
  protected readonly resultsLabel = computed(
    () => `${this.filteredRecords().length} evaluation records`
  );
  protected readonly skeletonRows = Array.from({ length: 4 });

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected setCoach(value: string): void {
    this.selectedCoach.set(value as CoachFilter);
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
  }

  protected requestAddEvaluation(): void {
    this.addEvaluation.emit();
  }

  protected requestEditEvaluation(recordId: string): void {
    this.editEvaluation.emit(recordId);
  }
}
