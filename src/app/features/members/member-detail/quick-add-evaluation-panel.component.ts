import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';

export interface QuickAddEvaluationPayload {
  weight: number;
  bodyFat: number;
  visceralFat: number | null;
  notes: string;
}

type NumericField = 'weight' | 'bodyFat' | 'visceralFat';

@Component({
  selector: 'app-quick-add-evaluation-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-add-evaluation-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickAddEvaluationPanelComponent implements AfterViewInit {
  readonly lastWeight = input.required<number>();
  readonly lastBodyFat = input.required<number>();
  readonly lastVisceralFat = input<number | null>(null);

  readonly saved = output<QuickAddEvaluationPayload>();
  readonly cancelled = output<void>();

  protected readonly weight = signal('');
  protected readonly bodyFat = signal('');
  protected readonly visceralFat = signal('');
  protected readonly notes = signal('');
  protected readonly savedPulse = signal(false);
  protected readonly activeField = signal<NumericField | 'notes'>('weight');

  private savedPulseTimer?: ReturnType<typeof setTimeout>;

  private readonly weightInput = viewChild<ElementRef<HTMLInputElement>>('weightInput');
  private readonly bodyFatInput = viewChild<ElementRef<HTMLInputElement>>('bodyFatInput');
  private readonly visceralFatInput = viewChild<ElementRef<HTMLInputElement>>('visceralFatInput');
  private readonly notesInput = viewChild<ElementRef<HTMLTextAreaElement>>('notesInput');

  protected readonly canSave = computed(
    () => this.parseNumeric(this.weight()) !== null && this.parseNumeric(this.bodyFat()) !== null
  );

  protected readonly weightTrend = computed(() =>
    this.buildDeltaLabel(this.parseNumeric(this.weight()), this.lastWeight(), 'kg')
  );
  protected readonly bodyFatTrend = computed(() =>
    this.buildDeltaLabel(this.parseNumeric(this.bodyFat()), this.lastBodyFat(), '%')
  );
  protected readonly visceralFatTrend = computed(() =>
    this.buildDeltaLabel(this.parseNumeric(this.visceralFat()), this.lastVisceralFat(), 'score')
  );

  constructor() {
    effect(() => {
      this.weight.set(this.formatNumber(this.lastWeight()));
    });

    effect(() => {
      this.bodyFat.set(this.formatNumber(this.lastBodyFat()));
    });

    effect(() => {
      const value = this.lastVisceralFat();
      this.visceralFat.set(value === null ? '' : this.formatNumber(value));
    });
  }

  ngAfterViewInit(): void {
    this.focusField('weight');
  }

  protected updateNumeric(field: NumericField, rawValue: string): void {
    const sanitized = rawValue.replace(/[^0-9.]/g, '');
    this.getFieldSignal(field).set(sanitized);
  }

  protected adjustNumeric(field: NumericField, delta: number): void {
    const current = this.parseNumeric(this.getFieldSignal(field)());
    const nextValue = Math.max(0, Number(((current ?? 0) + delta).toFixed(1)));
    this.getFieldSignal(field).set(this.formatNumber(nextValue));
    this.focusField(field);
  }

  protected moveFocus(event: Event, next?: HTMLInputElement | HTMLTextAreaElement): void {
    event.preventDefault();
    if (next) {
      next.focus();
      if ('select' in next) {
        next.select();
      }
      return;
    }

    this.submit(false);
  }

  protected setActiveField(field: NumericField | 'notes'): void {
    this.activeField.set(field);
  }

  protected updateNotes(value: string): void {
    this.notes.set(value);
  }

  protected submitFromNotes(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit(false);
    }
  }

  protected submit(addAnother: boolean): void {
    const weight = this.parseNumeric(this.weight());
    const bodyFat = this.parseNumeric(this.bodyFat());

    if (weight === null || bodyFat === null) {
      return;
    }

    const visceralFat = this.parseNumeric(this.visceralFat());

    this.saved.emit({
      weight,
      bodyFat,
      visceralFat,
      notes: this.notes().trim()
    });

    this.savedPulse.set(true);
    if (this.savedPulseTimer) {
      clearTimeout(this.savedPulseTimer);
    }
    this.savedPulseTimer = setTimeout(() => this.savedPulse.set(false), 1400);

    if (addAnother) {
      this.notes.set('');
      this.focusField('weight');
    }
  }

  protected resetToLastValues(): void {
    this.weight.set(this.formatNumber(this.lastWeight()));
    this.bodyFat.set(this.formatNumber(this.lastBodyFat()));
    const visceral = this.lastVisceralFat();
    this.visceralFat.set(visceral === null ? '' : this.formatNumber(visceral));
    this.notes.set('');
    this.cancelled.emit();
    this.focusField('weight');
  }

  protected trendTone(trend: string): string {
    if (trend.startsWith('↓')) {
      return 'text-emerald-700';
    }
    if (trend.startsWith('↑')) {
      return 'text-rose-700';
    }
    return 'text-[var(--ncm-text-muted)]';
  }

  private getFieldSignal(field: NumericField) {
    if (field === 'weight') {
      return this.weight;
    }
    if (field === 'bodyFat') {
      return this.bodyFat;
    }
    return this.visceralFat;
  }

  private parseNumeric(value: string): number | null {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private formatNumber(value: number): string {
    return value.toFixed(1);
  }

  private focusField(field: NumericField | 'notes'): void {
    this.activeField.set(field);

    queueMicrotask(() => {
      if (field === 'weight') {
        this.weightInput()?.nativeElement.focus();
        this.weightInput()?.nativeElement.select();
        return;
      }

      if (field === 'bodyFat') {
        this.bodyFatInput()?.nativeElement.focus();
        this.bodyFatInput()?.nativeElement.select();
        return;
      }

      if (field === 'visceralFat') {
        this.visceralFatInput()?.nativeElement.focus();
        this.visceralFatInput()?.nativeElement.select();
        return;
      }

      this.notesInput()?.nativeElement.focus();
    });
  }

  private buildDeltaLabel(
    currentValue: number | null,
    previousValue: number | null,
    unit: string
  ): string {
    if (currentValue === null || previousValue === null) {
      return `Last: unavailable`;
    }

    const delta = Number((currentValue - previousValue).toFixed(1));
    if (delta === 0) {
      return `No change since last entry`;
    }

    const arrow = delta > 0 ? '↑' : '↓';
    return `${arrow} ${Math.abs(delta).toFixed(1)} ${unit} since last entry`;
  }
}
