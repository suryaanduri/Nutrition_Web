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
  evaluationDate: string;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  bodyFatPercent: number | null;
  visceralFat: number | null;
  skeletalMuscleKg: number | null;
  bmrKcal: number | null;
  bodyAgeYears: number | null;
  notes: string;
}

interface MetricCard {
  key: 'height' | 'weight' | 'bodyFat' | 'visceralFat' | 'skeletalMuscle' | 'bmr' | 'bodyAge';
  label: string;
  unit: string;
  hint: string;
  previous: string;
  value: string;
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

  protected readonly evaluationDate = signal('');
  protected readonly heightCm = signal('');
  protected readonly weightKg = signal('');
  protected readonly bodyFatPercent = signal('');
  protected readonly visceralFat = signal('');
  protected readonly skeletalMuscleKg = signal('');
  protected readonly bmrKcal = signal('');
  protected readonly bodyAgeYears = signal('');
  protected readonly notes = signal('');

  private savePulseTimer?: ReturnType<typeof setTimeout>;

  protected readonly isEditMode = computed(() => this.preset().mode === 'edit');
  protected readonly pageEyebrow = computed(() =>
    this.isEditMode() ? 'Edit evaluation' : 'Add evaluation'
  );
  protected readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Update evaluation details' : 'Capture a new evaluation'
  );
  protected readonly modeChip = computed(() => (this.isEditMode() ? 'Edit mode' : 'Add mode'));
  protected readonly bmiValue = computed(() => {
    const height = this.parseNumber(this.heightCm());
    const weight = this.parseNumber(this.weightKg());
    if (height === null || weight === null || height <= 0) {
      return null;
    }

    const meters = height / 100;
    return Number((weight / (meters * meters)).toFixed(1));
  });
  protected readonly isDirty = computed(() => {
    const preset = this.preset();
    return (
      this.evaluationDate() !== preset.evaluationDate ||
      this.heightCm() !== this.formatNumber(preset.heightCm, 0) ||
      this.weightKg() !== this.formatNullable(preset.weightKg) ||
      this.bodyFatPercent() !== this.formatNullable(preset.bodyFatPercent) ||
      this.visceralFat() !== this.formatNullable(preset.visceralFat) ||
      this.skeletalMuscleKg() !== this.formatNullable(preset.skeletalMuscleKg) ||
      this.bmrKcal() !== this.formatNullable(preset.bmrKcal, 0) ||
      this.bodyAgeYears() !== this.formatNullable(preset.bodyAgeYears, 0) ||
      this.notes() !== preset.notes
    );
  });
  protected readonly canSave = computed(() => {
    return (
      this.evaluationDate().trim().length > 0 &&
      this.parseNumber(this.heightCm()) !== null &&
      this.parseNumber(this.weightKg()) !== null &&
      this.parseNumber(this.bodyFatPercent()) !== null
    );
  });
  protected readonly previousEvaluation = computed(() => this.preset().history[0] ?? null);
  protected readonly recentHistory = computed(() => this.preset().history.slice(0, 3));
  protected readonly metricCards = computed<MetricCard[]>(() => {
    const previous = this.previousEvaluation();
    return [
      {
        key: 'height',
        label: 'Height',
        unit: 'cm',
        hint: 'Used for BMI calculation',
        previous: previous ? `Last BMI context: ${previous.bmi}` : 'No prior reference',
        value: this.heightCm(),
        required: true
      },
      {
        key: 'weight',
        label: 'Weight',
        unit: 'kg',
        hint: 'Core consultation metric',
        previous: previous?.weight ? `Last: ${previous.weight}` : 'No prior reference',
        value: this.weightKg(),
        required: true,
        prominent: true
      },
      {
        key: 'bodyFat',
        label: 'Body Fat',
        unit: '%',
        hint: 'Manual entry',
        previous: previous?.bodyFat ? `Last: ${previous.bodyFat}` : 'No prior reference',
        value: this.bodyFatPercent(),
        required: true
      },
      {
        key: 'visceralFat',
        label: 'Visceral Fat',
        unit: 'score',
        hint: 'Manual entry',
        previous: previous?.visceralFat ? `Last: ${previous.visceralFat}` : 'No prior reference',
        value: this.visceralFat()
      },
      {
        key: 'skeletalMuscle',
        label: 'Skeletal Muscle',
        unit: 'kg',
        hint: 'Manual entry',
        previous: previous ? 'Compare with latest scan' : 'No prior reference',
        value: this.skeletalMuscleKg()
      },
      {
        key: 'bmr',
        label: 'BMR',
        unit: 'kcal',
        hint: 'Manual entry',
        previous: previous ? 'Use device readout if available' : 'Optional on first capture',
        value: this.bmrKcal()
      },
      {
        key: 'bodyAge',
        label: 'Body Age',
        unit: 'yrs',
        hint: 'Manual entry',
        previous: previous ? 'Capture only if available' : 'Optional on first capture',
        value: this.bodyAgeYears()
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
      | 'evaluationDate'
      | 'heightCm'
      | 'weightKg'
      | 'bodyFatPercent'
      | 'visceralFat'
      | 'skeletalMuscleKg'
      | 'bmrKcal'
      | 'bodyAgeYears'
      | 'notes',
    rawValue: string
  ): void {
    if (field === 'evaluationDate' || field === 'notes') {
      this.signalFor(field).set(rawValue);
      return;
    }

    this.signalFor(field).set(rawValue.replace(/[^0-9.\-]/g, ''));
  }

  protected saveEvaluation(): void {
    if (!this.canSave()) {
      return;
    }

    const payload: EvaluationEditorPayload = {
      evaluationDate: this.evaluationDate().trim(),
      heightCm: this.parseNumber(this.heightCm()),
      weightKg: this.parseNumber(this.weightKg()),
      bmi: this.bmiValue(),
      bodyFatPercent: this.parseNumber(this.bodyFatPercent()),
      visceralFat: this.parseNumber(this.visceralFat()),
      skeletalMuscleKg: this.parseNumber(this.skeletalMuscleKg()),
      bmrKcal: this.parseNumber(this.bmrKcal()),
      bodyAgeYears: this.parseNumber(this.bodyAgeYears()),
      notes: this.notes().trim()
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
    this.evaluationDate.set(preset.evaluationDate);
    this.heightCm.set(this.formatNumber(preset.heightCm, 0));
    this.weightKg.set(this.formatNullable(preset.weightKg));
    this.bodyFatPercent.set(this.formatNullable(preset.bodyFatPercent));
    this.visceralFat.set(this.formatNullable(preset.visceralFat));
    this.skeletalMuscleKg.set(this.formatNullable(preset.skeletalMuscleKg));
    this.bmrKcal.set(this.formatNullable(preset.bmrKcal, 0));
    this.bodyAgeYears.set(this.formatNullable(preset.bodyAgeYears, 0));
    this.notes.set(preset.notes);
    this.savedPulse.set(false);
  }

  private signalFor(
    field:
      | 'evaluationDate'
      | 'heightCm'
      | 'weightKg'
      | 'bodyFatPercent'
      | 'visceralFat'
      | 'skeletalMuscleKg'
      | 'bmrKcal'
      | 'bodyAgeYears'
      | 'notes'
  ) {
    switch (field) {
      case 'evaluationDate':
        return this.evaluationDate;
      case 'heightCm':
        return this.heightCm;
      case 'weightKg':
        return this.weightKg;
      case 'bodyFatPercent':
        return this.bodyFatPercent;
      case 'visceralFat':
        return this.visceralFat;
      case 'skeletalMuscleKg':
        return this.skeletalMuscleKg;
      case 'bmrKcal':
        return this.bmrKcal;
      case 'bodyAgeYears':
        return this.bodyAgeYears;
      case 'notes':
        return this.notes;
    }
  }

  private parseNumber(value: string): number | null {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private formatNullable(value: number | null, digits = 1): string {
    return value === null ? '' : this.formatNumber(value, digits);
  }

  private formatNumber(value: number, digits = 1): string {
    return value.toFixed(digits);
  }
}
