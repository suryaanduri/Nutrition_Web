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

type MetricKey =
  | 'weight'
  | 'bodyFat'
  | 'visceralFat'
  | 'skeletalMuscle'
  | 'bmr'
  | 'bodyAge'
  | 'trunkSubcutaneousFat'
  | 'refNo'
  | 'invitedBy';

type FocusField = MetricKey | 'notes';

interface EvaluationMetricValue {
  label: string;
  value: number | string | null;
  unit?: string;
  step?: number;
  editable?: boolean;
}

interface MetricViewModel {
  key: MetricKey;
  label: string;
  unit: string;
  previousText: string;
  currentValue: string;
  trend: string;
}

interface DerivedMetricViewModel {
  key: 'bmi';
  label: string;
  unit: string;
  previousText: string;
  currentValue: string;
  trend: string;
}

export interface MemberEvaluationSnapshot {
  date: string;
  heightCm: number;
  lastFullAssessmentDate: string;
  values: Record<MetricKey, EvaluationMetricValue>;
  notes: string;
}

export interface MemberEvaluationPayload {
  date: string;
  notes: string;
  values: Record<MetricKey, number | string | null>;
  bmi: number | null;
}

@Component({
  selector: 'app-member-evaluation-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-evaluation-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberEvaluationPanelComponent {
  readonly snapshot = input.required<MemberEvaluationSnapshot>();

  readonly saved = output<MemberEvaluationPayload>();

  protected readonly expanded = signal(false);
  protected readonly activeField = signal<FocusField>('weight');
  protected readonly notes = signal('');
  protected readonly savedPulse = signal(false);

  private savePulseTimer?: ReturnType<typeof setTimeout>;

  private readonly defaultMetricKeys: MetricKey[] = ['weight', 'bodyFat', 'visceralFat'];
  private readonly advancedMetricKeys: MetricKey[] = [
    'skeletalMuscle',
    'bodyAge',
    'bmr',
    'trunkSubcutaneousFat',
    'refNo',
    'invitedBy'
  ];

  protected readonly weight = signal('');
  protected readonly bodyFat = signal('');
  protected readonly visceralFat = signal('');
  protected readonly skeletalMuscle = signal('');
  protected readonly bmr = signal('');
  protected readonly bodyAge = signal('');
  protected readonly trunkSubcutaneousFat = signal('');
  protected readonly refNo = signal('');
  protected readonly invitedBy = signal('');

  protected readonly currentDate = computed(() => this.snapshot().date);
  protected readonly canSave = computed(
    () => this.parseNumber(this.weight()) !== null && this.parseNumber(this.bodyFat()) !== null
  );
  protected readonly bmiValue = computed(() => {
    const weight = this.parseNumber(this.weight());
    const heightMeters = this.snapshot().heightCm / 100;
    if (weight === null || !heightMeters) {
      return null;
    }

    return Number((weight / (heightMeters * heightMeters)).toFixed(1));
  });

  protected readonly defaultMetrics = computed<MetricViewModel[]>(() =>
    this.defaultMetricKeys.map((key) => this.metricViewModel(key))
  );
  protected readonly advancedMetrics = computed<MetricViewModel[]>(() =>
    this.advancedMetricKeys.map((key) => this.metricViewModel(key))
  );
  protected readonly derivedBmiMetric = computed<DerivedMetricViewModel>(() => ({
    key: 'bmi',
    label: 'BMI',
    unit: '',
    previousText: this.previousValueText('weight', 'kg'),
    currentValue: this.bmiValue() === null ? 'Auto' : `${this.bmiValue()}`,
    trend: this.bmiTrend()
  }));

  constructor() {
    effect(() => {
      const snapshot = this.snapshot();
      this.weight.set(this.formatFromSnapshot(snapshot.values.weight.value));
      this.bodyFat.set(this.formatFromSnapshot(snapshot.values.bodyFat.value));
      this.visceralFat.set(this.formatFromSnapshot(snapshot.values.visceralFat.value));
      this.skeletalMuscle.set(this.formatFromSnapshot(snapshot.values.skeletalMuscle.value));
      this.bmr.set(this.formatFromSnapshot(snapshot.values.bmr.value));
      this.bodyAge.set(this.formatFromSnapshot(snapshot.values.bodyAge.value));
      this.trunkSubcutaneousFat.set(this.formatFromSnapshot(snapshot.values.trunkSubcutaneousFat.value));
      this.refNo.set(this.formatFromSnapshot(snapshot.values.refNo.value));
      this.invitedBy.set(this.formatFromSnapshot(snapshot.values.invitedBy.value));
      this.notes.set(snapshot.notes);
    });
  }

  ngAfterViewInit(): void {
    this.focusField('weight');
  }

  protected toggleExpanded(): void {
    this.expanded.update((value) => !value);
  }

  protected setActiveField(field: FocusField): void {
    this.activeField.set(field);
  }

  protected updateMetric(key: MetricKey, rawValue: string): void {
    const signalRef = this.signalFor(key);
    const config = this.snapshot().values[key];

    if (typeof config.value === 'number' || key !== 'refNo') {
      signalRef.set(rawValue.replace(/[^0-9A-Za-z.\s-]/g, ''));
      return;
    }

    signalRef.set(rawValue);
  }

  protected updateNotes(value: string): void {
    this.notes.set(value);
  }

  protected adjustMetric(key: MetricKey, delta: number): void {
    const config = this.snapshot().values[key];
    if (typeof config.value !== 'number') {
      return;
    }

    const current = this.parseNumber(this.signalFor(key)());
    const nextValue = Math.max(0, Number(((current ?? 0) + delta).toFixed(1)));
    this.signalFor(key).set(nextValue.toFixed(key === 'bmr' || key === 'bodyAge' ? 0 : 1));
    this.focusField(key);
  }

  protected save(addAnother: boolean): void {
    if (!this.canSave()) {
      return;
    }

    this.saved.emit({
      date: this.currentDate(),
      notes: this.notes().trim(),
      bmi: this.bmiValue(),
      values: {
        weight: this.parseNumber(this.weight()),
        bodyFat: this.parseNumber(this.bodyFat()),
        visceralFat: this.parseNumber(this.visceralFat()),
        skeletalMuscle: this.parseNumber(this.skeletalMuscle()),
        bmr: this.parseNumber(this.bmr()),
        bodyAge: this.parseNumber(this.bodyAge()),
        trunkSubcutaneousFat: this.parseNumber(this.trunkSubcutaneousFat()),
        refNo: this.refNo().trim() || null,
        invitedBy: this.invitedBy().trim() || null
      }
    });

    this.savedPulse.set(true);
    if (this.savePulseTimer) {
      clearTimeout(this.savePulseTimer);
    }
    this.savePulseTimer = setTimeout(() => this.savedPulse.set(false), 1600);

    if (addAnother) {
      this.notes.set('');
      this.focusField('weight');
    }
  }

  protected reset(): void {
    const snapshot = this.snapshot();
    this.weight.set(this.formatFromSnapshot(snapshot.values.weight.value));
    this.bodyFat.set(this.formatFromSnapshot(snapshot.values.bodyFat.value));
    this.visceralFat.set(this.formatFromSnapshot(snapshot.values.visceralFat.value));
    this.skeletalMuscle.set(this.formatFromSnapshot(snapshot.values.skeletalMuscle.value));
    this.bmr.set(this.formatFromSnapshot(snapshot.values.bmr.value));
    this.bodyAge.set(this.formatFromSnapshot(snapshot.values.bodyAge.value));
    this.trunkSubcutaneousFat.set(this.formatFromSnapshot(snapshot.values.trunkSubcutaneousFat.value));
    this.refNo.set(this.formatFromSnapshot(snapshot.values.refNo.value));
    this.invitedBy.set(this.formatFromSnapshot(snapshot.values.invitedBy.value));
    this.notes.set(snapshot.notes);
    this.focusField('weight');
  }

  private metricViewModel(key: MetricKey): MetricViewModel {
    const config = this.snapshot().values[key];
    const current = this.signalFor(key)();

    return {
      key,
      label: config.label,
      unit: config.unit ?? '',
      previousText: this.previousValueText(key, config.unit),
      currentValue: current,
      trend: this.metricTrend(key)
    };
  }

  private previousValueText(key: MetricKey, unit?: string): string {
    const value = this.snapshot().values[key].value;
    if (value === null || value === '') {
      return 'Last: not captured';
    }
    return `Last: ${value}${unit ? ` ${unit}` : ''}`;
  }

  private metricTrend(key: MetricKey): string {
    const previous = this.snapshot().values[key].value;
    const current = this.signalFor(key)();

    if (typeof previous !== 'number') {
      return current.trim() ? 'Updated for this visit' : 'Optional';
    }

    const parsed = this.parseNumber(current);
    if (parsed === null) {
      return 'Waiting for value';
    }

    const delta = Number((parsed - previous).toFixed(1));
    if (delta === 0) {
      return 'No change since last entry';
    }

    const unit = this.snapshot().values[key].unit ?? '';
    return `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)}${unit ? ` ${unit}` : ''} since last visit`;
  }

  protected trendTone(text: string): string {
    if (text.startsWith('↓')) {
      return 'text-emerald-700';
    }
    if (text.startsWith('↑')) {
      return 'text-rose-700';
    }
    return 'text-[var(--ncm-text-muted)]';
  }

  protected trendBadgeClass(text: string): string {
    if (text.startsWith('↓')) {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100';
    }
    if (text.startsWith('↑')) {
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100';
    }
    return 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200';
  }

  protected metricChanged(key: MetricKey): boolean {
    const previous = this.snapshot().values[key].value;
    const current = this.signalFor(key)();

    if (typeof previous === 'number') {
      const parsed = this.parseNumber(current);
      return parsed !== null && parsed !== previous;
    }

    return current.trim() !== `${previous ?? ''}`.trim();
  }

  private bmiTrend(): string {
    const bmi = this.bmiValue();
    if (bmi === null) {
      return 'Auto-calculates from stored height';
    }

    return bmi < 25 ? 'Within target direction' : `BMI ${bmi.toFixed(1)} from stored height`;
  }

  protected focusField(field: FocusField): void {
    this.activeField.set(field);

    queueMicrotask(() => {
      const target = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[data-focus="${field}"]`
      );
      target?.focus();
      if ('select' in (target ?? {})) {
        target?.select?.();
      }
    });
  }

  private signalFor(key: MetricKey) {
    switch (key) {
      case 'weight':
        return this.weight;
      case 'bodyFat':
        return this.bodyFat;
      case 'visceralFat':
        return this.visceralFat;
      case 'skeletalMuscle':
        return this.skeletalMuscle;
      case 'bmr':
        return this.bmr;
      case 'bodyAge':
        return this.bodyAge;
      case 'trunkSubcutaneousFat':
        return this.trunkSubcutaneousFat;
      case 'refNo':
        return this.refNo;
      case 'invitedBy':
        return this.invitedBy;
    }
  }

  private formatFromSnapshot(value: number | string | null): string {
    if (value === null) {
      return '';
    }
    return `${value}`;
  }

  private parseNumber(value: string): number | null {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

}
