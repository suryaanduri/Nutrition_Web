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
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import {
  MemberEvaluationPayload,
  MemberEvaluationSnapshot
} from './member-evaluation-panel.component';

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

interface MemberWorkspaceIdentity {
  name: string;
  goal: string;
  status: string;
}

interface MetricTile {
  key: MetricKey;
  label: string;
  unit: string;
  previousText: string;
  currentValue: string;
  trend: string;
  numeric: boolean;
  step: number;
  prominent?: boolean;
}

@Component({
  selector: 'app-member-evaluation-workspace',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './member-evaluation-workspace.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberEvaluationWorkspaceComponent {
  readonly snapshot = input.required<MemberEvaluationSnapshot>();
  readonly member = input.required<MemberWorkspaceIdentity>();

  readonly saved = output<MemberEvaluationPayload>();
  readonly cancelled = output<void>();

  protected readonly activeField = signal<FocusField>('weight');
  protected readonly notes = signal('');
  protected readonly savedPulse = signal(false);

  private savePulseTimer?: ReturnType<typeof setTimeout>;

  private readonly primaryMetricKeys: MetricKey[] = [
    'weight',
    'bodyFat',
    'visceralFat',
    'skeletalMuscle'
  ];
  private readonly secondaryMetricKeys: MetricKey[] = [
    'trunkSubcutaneousFat',
    'bodyAge',
    'bmr'
  ];
  private readonly referenceMetricKeys: MetricKey[] = ['refNo', 'invitedBy'];

  protected readonly weight = signal('');
  protected readonly bodyFat = signal('');
  protected readonly visceralFat = signal('');
  protected readonly skeletalMuscle = signal('');
  protected readonly bmr = signal('');
  protected readonly bodyAge = signal('');
  protected readonly trunkSubcutaneousFat = signal('');
  protected readonly refNo = signal('');
  protected readonly invitedBy = signal('');

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

  protected readonly primaryMetrics = computed(() =>
    this.primaryMetricKeys.map((key, index) => this.metricTile(key, index === 0))
  );
  protected readonly secondaryMetrics = computed(() =>
    this.secondaryMetricKeys.map((key) => this.metricTile(key))
  );
  protected readonly referenceMetrics = computed(() =>
    this.referenceMetricKeys.map((key) => this.metricTile(key))
  );
  protected readonly bmiTrend = computed(() => {
    const bmi = this.bmiValue();
    return bmi === null ? 'Waiting for weight' : bmi < 25 ? 'Within target direction' : `BMI ${bmi}`;
  });

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

  protected setActiveField(field: FocusField): void {
    this.activeField.set(field);
  }

  protected updateMetric(key: MetricKey, rawValue: string): void {
    const signalRef = this.signalFor(key);
    const currentValue = this.snapshot().values[key].value;

    if (typeof currentValue === 'number') {
      signalRef.set(rawValue.replace(/[^0-9.\-]/g, ''));
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

    const precision = config.step && config.step >= 1 ? 0 : 1;
    const current = this.parseNumber(this.signalFor(key)());
    const nextValue = Math.max(0, Number(((current ?? 0) + delta).toFixed(precision)));
    this.signalFor(key).set(nextValue.toFixed(precision));
    this.activeField.set(key);
  }

  protected save(addAnother: boolean): void {
    if (!this.canSave()) {
      return;
    }

    this.saved.emit({
      date: this.snapshot().date,
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
    }
  }

  protected cancel(): void {
    this.cancelled.emit();
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

  private metricTile(key: MetricKey, prominent = false): MetricTile {
    const config = this.snapshot().values[key];
    const currentValue = this.signalFor(key)();
    const numeric = typeof config.value === 'number';

    return {
      key,
      label: config.label,
      unit: config.unit ?? '',
      previousText: this.previousValueText(key, config.unit),
      currentValue,
      trend: this.metricTrend(key),
      numeric,
      step: config.step ?? 0.1,
      prominent
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
      return 'No change';
    }

    const unit = this.snapshot().values[key].unit ?? '';
    return `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)}${unit ? ` ${unit}` : ''}`;
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
    return value === null ? '' : `${value}`;
  }

  private parseNumber(value: string): number | null {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
