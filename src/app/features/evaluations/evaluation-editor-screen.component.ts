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
  EvaluationEditorPreset,
  EvaluationEditorViewState,
  EvaluationHistoryEntry
} from './evaluations.data';

interface EvaluationEditorPayload {
  weightKg: number | null;
  visceralFat: number | null;
  trunkSubcutaneousFatPercent: number | null;
  bodyFatPercent: number | null;
  bodyAgeYears: number | null;
  bmi: number | null;
  bmrKcal: number | null;
  skeletalMuscleKg: number | null;
}

interface MeasurementField {
  key:
    | 'weight'
    | 'visceralFat'
    | 'trunkSubcutaneousFat'
    | 'bodyFat'
    | 'bodyAge'
    | 'bmr'
    | 'skeletalMuscle';
  label: string;
  unit: string;
  previous: string;
  value: string;
  step: number;
  digits: number;
  required?: boolean;
  prominent?: boolean;
}

@Component({
  selector: 'app-evaluation-editor-screen',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './evaluation-editor-screen.component.html',
  styleUrl: './evaluation-editor-screen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaluationEditorScreenComponent {
  readonly preset = input.required<EvaluationEditorPreset>();

  readonly saved = output<EvaluationEditorPayload>();
  readonly cancelled = output<void>();

  protected readonly viewState = signal<EvaluationEditorViewState>('default');
  protected readonly savedPulse = signal(false);

  protected readonly weightKg = signal('');
  protected readonly visceralFat = signal('');
  protected readonly trunkSubcutaneousFatPercent = signal('');
  protected readonly bodyFatPercent = signal('');
  protected readonly bodyAgeYears = signal('');
  protected readonly bmrKcal = signal('');
  protected readonly skeletalMuscleKg = signal('');

  private savePulseTimer?: ReturnType<typeof setTimeout>;

  protected readonly isEditMode = computed(() => this.preset().mode === 'edit');
  protected readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Edit Evaluation' : 'New Evaluation'
  );
  protected readonly actionLabel = computed(() =>
    this.isEditMode() ? 'Save Changes' : 'Save Evaluation'
  );
  protected readonly modeChip = computed(() => (this.isEditMode() ? 'Edit mode' : 'New entry'));
  protected readonly bmiValue = computed(() => {
    const height = this.preset().member.heightCm;
    const weight = this.parseNumber(this.weightKg());
    if (weight === null || height <= 0) {
      return null;
    }

    const meters = height / 100;
    return Number((weight / (meters * meters)).toFixed(1));
  });
  protected readonly isDirty = computed(() => {
    const preset = this.preset();
    return (
      this.weightKg() !== this.formatNullable(preset.weightKg) ||
      this.visceralFat() !== this.formatNullable(preset.visceralFat) ||
      this.trunkSubcutaneousFatPercent() !== this.formatNullable(preset.trunkSubcutaneousFatPercent) ||
      this.bodyFatPercent() !== this.formatNullable(preset.bodyFatPercent) ||
      this.bodyAgeYears() !== this.formatNullable(preset.bodyAgeYears, 0) ||
      this.bmrKcal() !== this.formatNullable(preset.bmrKcal, 0) ||
      this.skeletalMuscleKg() !== this.formatNullable(preset.skeletalMuscleKg)
    );
  });
  protected readonly canSave = computed(() => {
    return (
      this.parseNumber(this.weightKg()) !== null &&
      this.parseNumber(this.bodyFatPercent()) !== null &&
      this.parseNumber(this.visceralFat()) !== null &&
      this.parseNumber(this.trunkSubcutaneousFatPercent()) !== null &&
      this.parseNumber(this.bodyAgeYears()) !== null &&
      this.parseNumber(this.bmrKcal()) !== null &&
      this.parseNumber(this.skeletalMuscleKg()) !== null
    );
  });
  protected readonly recentHistory = computed(() => this.preset().history.slice(0, 2));
  protected readonly latestPrevious = computed(() => this.preset().history[0] ?? null);
  protected readonly measurementFields = computed<MeasurementField[]>(() => {
    const previous = this.latestPrevious();
    return [
      {
        key: 'weight',
        label: 'Weight',
        unit: 'kg',
        previous: previous?.weight ? `Last: ${previous.weight}` : 'No prior entry',
        value: this.weightKg(),
        step: 0.1,
        digits: 1,
        required: true,
        prominent: true
      },
      {
        key: 'visceralFat',
        label: 'Visceral Fat %',
        unit: '%',
        previous: previous?.visceralFat ? `Last: ${previous.visceralFat}` : 'No prior entry',
        value: this.visceralFat(),
        step: 0.1,
        digits: 1,
        required: true
      },
      {
        key: 'trunkSubcutaneousFat',
        label: 'Trunk Subcutaneous Fat',
        unit: '%',
        previous: 'Enrollment scan reference',
        value: this.trunkSubcutaneousFatPercent(),
        step: 0.1,
        digits: 1,
        required: true
      },
      {
        key: 'bodyFat',
        label: 'Body Fat',
        unit: '%',
        previous: previous?.bodyFat ? `Last: ${previous.bodyFat}` : 'No prior entry',
        value: this.bodyFatPercent(),
        step: 0.1,
        digits: 1,
        required: true
      },
      {
        key: 'bodyAge',
        label: 'Body Age',
        unit: 'yrs',
        previous: 'Use device readout',
        value: this.bodyAgeYears(),
        step: 1,
        digits: 0,
        required: true
      },
      {
        key: 'bmr',
        label: 'BMR',
        unit: 'kcal',
        previous: 'Use device readout',
        value: this.bmrKcal(),
        step: 10,
        digits: 0,
        required: true
      },
      {
        key: 'skeletalMuscle',
        label: 'Skeletal Muscle',
        unit: 'kg',
        previous: 'Compare to last scan',
        value: this.skeletalMuscleKg(),
        step: 0.1,
        digits: 1,
        required: true
      }
    ];
  });

  constructor() {
    effect(() => {
      const preset = this.preset();
      this.viewState.set(preset.viewState ?? 'default');
      this.hydrateFromPreset(preset);
    });
  }

  protected updateField(
    field:
      | 'weightKg'
      | 'visceralFat'
      | 'trunkSubcutaneousFatPercent'
      | 'bodyFatPercent'
      | 'bodyAgeYears'
      | 'bmrKcal'
      | 'skeletalMuscleKg',
    rawValue: string
  ): void {
    this.signalFor(field).set(rawValue.replace(/[^0-9.\-]/g, ''));
  }

  protected saveEvaluation(): void {
    if (!this.canSave()) {
      return;
    }

    const payload: EvaluationEditorPayload = {
      weightKg: this.parseNumber(this.weightKg()),
      visceralFat: this.parseNumber(this.visceralFat()),
      trunkSubcutaneousFatPercent: this.parseNumber(this.trunkSubcutaneousFatPercent()),
      bodyFatPercent: this.parseNumber(this.bodyFatPercent()),
      bodyAgeYears: this.parseNumber(this.bodyAgeYears()),
      bmi: this.bmiValue(),
      bmrKcal: this.parseNumber(this.bmrKcal()),
      skeletalMuscleKg: this.parseNumber(this.skeletalMuscleKg())
    };

    this.saved.emit(payload);
    this.savedPulse.set(true);
    if (this.savePulseTimer) {
      clearTimeout(this.savePulseTimer);
    }
    this.savePulseTimer = setTimeout(() => this.savedPulse.set(false), 1800);
  }

  protected resetForm(): void {
    this.hydrateFromPreset(this.preset());
  }

  protected adjustField(
    field:
      | 'weightKg'
      | 'visceralFat'
      | 'trunkSubcutaneousFatPercent'
      | 'bodyFatPercent'
      | 'bodyAgeYears'
      | 'bmrKcal'
      | 'skeletalMuscleKg',
    delta: number,
    digits: number
  ): void {
    const target = this.signalFor(field);
    const current = this.parseNumber(target());
    const baseline = current ?? this.previousNumericValue(field) ?? 0;
    const next = Math.max(0, Number((baseline + delta).toFixed(digits)));
    target.set(next.toFixed(digits));
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  protected retry(): void {
    this.viewState.set('default');
  }

  protected badgeClass(tone: EvaluationHistoryEntry['trendTone']): string {
    if (tone === 'up') {
      return 'bg-[rgba(25,135,84,0.1)] text-[var(--ncm-success)]';
    }
    if (tone === 'down') {
      return 'bg-[rgba(194,65,59,0.1)] text-[var(--ncm-danger)]';
    }
    return 'bg-[var(--ncm-surface-soft)] text-[var(--ncm-text-muted)]';
  }

  private hydrateFromPreset(preset: EvaluationEditorPreset): void {
    this.weightKg.set(this.seedValue(preset.weightKg, this.previousNumericValue('weightKg')));
    this.visceralFat.set(this.seedValue(preset.visceralFat, this.previousNumericValue('visceralFat')));
    this.trunkSubcutaneousFatPercent.set(
      this.seedValue(
        preset.trunkSubcutaneousFatPercent,
        this.previousNumericValue('trunkSubcutaneousFatPercent')
      )
    );
    this.bodyFatPercent.set(
      this.seedValue(preset.bodyFatPercent, this.previousNumericValue('bodyFatPercent'))
    );
    this.bodyAgeYears.set(this.seedValue(preset.bodyAgeYears, this.previousNumericValue('bodyAgeYears'), 0));
    this.bmrKcal.set(this.seedValue(preset.bmrKcal, this.previousNumericValue('bmrKcal'), 0));
    this.skeletalMuscleKg.set(
      this.seedValue(preset.skeletalMuscleKg, this.previousNumericValue('skeletalMuscleKg'))
    );
    this.savedPulse.set(false);
  }

  private signalFor(
    field:
      | 'weightKg'
      | 'visceralFat'
      | 'trunkSubcutaneousFatPercent'
      | 'bodyFatPercent'
      | 'bodyAgeYears'
      | 'bmrKcal'
      | 'skeletalMuscleKg'
  ) {
    switch (field) {
      case 'weightKg':
        return this.weightKg;
      case 'visceralFat':
        return this.visceralFat;
      case 'trunkSubcutaneousFatPercent':
        return this.trunkSubcutaneousFatPercent;
      case 'bodyFatPercent':
        return this.bodyFatPercent;
      case 'bodyAgeYears':
        return this.bodyAgeYears;
      case 'bmrKcal':
        return this.bmrKcal;
      case 'skeletalMuscleKg':
        return this.skeletalMuscleKg;
    }
  }

  private parseNumber(value: string): number | null {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private previousNumericValue(
    field:
      | 'weightKg'
      | 'visceralFat'
      | 'trunkSubcutaneousFatPercent'
      | 'bodyFatPercent'
      | 'bodyAgeYears'
      | 'bmrKcal'
      | 'skeletalMuscleKg'
  ): number | null {
    const previous = this.latestPrevious();
    if (!previous) {
      return null;
    }

    switch (field) {
      case 'weightKg':
        return this.parseMetricValue(previous.weight);
      case 'visceralFat':
        return this.parseMetricValue(previous.visceralFat);
      case 'bodyFatPercent':
        return this.parseMetricValue(previous.bodyFat);
      default:
        return null;
    }
  }

  private parseMetricValue(metric: string): number | null {
    const parsed = Number.parseFloat(metric);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private seedValue(value: number | null, fallback: number | null, digits = 1): string {
    const resolved = value ?? fallback;
    return resolved === null ? '' : this.formatNumber(resolved, digits);
  }

  private formatNullable(value: number | null, digits = 1): string {
    return value === null ? '' : this.formatNumber(value, digits);
  }

  private formatNumber(value: number, digits = 1): string {
    return value.toFixed(digits);
  }
}
