import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import {
  MemberEvaluationPayload,
  MemberEvaluationSnapshot
} from './member-evaluation-panel.component';
import { MemberEvaluationWorkspaceComponent } from './member-evaluation-workspace.component';

type RangeKey = '7D' | '30D' | '90D';
type TrendType = 'up' | 'down' | 'neutral';

interface MetricCard {
  label: string;
  value: string;
  trend: string;
  trendType: TrendType;
  helper: string;
  emphasized?: boolean;
}

interface EvaluationHistoryItem {
  id: number;
  date: string;
  weight: string;
  bodyFat: string;
  visceralFat: string;
  notes: string;
  enteredBy: string;
  trend: string;
  trendType: TrendType;
  highlighted?: boolean;
}

interface TrendPoint {
  label: string;
  value: number;
}

interface InsightItem {
  title: string;
  detail: string;
}

interface ActionSignal {
  label: string;
  value: string;
}

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, IconComponent, MemberEvaluationWorkspaceComponent],
  templateUrl: './member-detail.html',
  styleUrl: './member-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberDetail {
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly selectedRange = signal<RangeKey>('30D');
  readonly showSaveToast = signal(false);
  readonly saveToastMessage = signal('Evaluation added');
  readonly isEvaluationWorkspaceOpen = signal(false);

  readonly rangeOptions: RangeKey[] = ['7D', '30D', '90D'];

  readonly member = {
    name: 'Rhea Sharma',
    phone: '+91 98765 10245',
    age: 29,
    gender: 'Female',
    goal: 'PCOS-focused fat loss',
    coach: 'Ava Nelson',
    status: 'Needs attention',
    summary: 'PCOS-focused fat loss plan with strong early adherence, but recent follow-up consistency dropped.',
    tags: ['Needs attention', 'Missed follow-up', 'Progressing'],
    program: 'PCOS Reset Intensive',
    joinedOn: 'Joined 12 Jan 2026'
  };

  readonly evaluationSnapshot = signal<MemberEvaluationSnapshot>({
    date: '10 Apr 2026',
    heightCm: 164,
    lastFullAssessmentDate: '2026-03-01',
    notes: 'Good adherence overall. Slight appetite drop this week.',
    values: {
      weight: { label: 'Weight', value: 68.4, unit: 'kg', step: 0.1 },
      bodyFat: { label: 'Body Fat %', value: 31.2, unit: '%', step: 0.1 },
      visceralFat: { label: 'Visceral Fat', value: 8.4, unit: 'score', step: 0.1 },
      skeletalMuscle: { label: 'Skeletal Muscle', value: 26.8, unit: 'kg', step: 0.1 },
      bmr: { label: 'BMR', value: 1380, unit: 'kcal', step: 10 },
      bodyAge: { label: 'Body Age', value: 31, unit: 'yrs', step: 1 },
      trunkSubcutaneousFat: { label: 'Trunk Subcutaneous Fat', value: 16.4, unit: '%', step: 0.1 },
      refNo: { label: 'Ref No', value: 'REF-3128' },
      invitedBy: { label: 'Invited By', value: 'Dr. Neha Patel' }
    }
  });

  readonly weightData = signal<Record<RangeKey, TrendPoint[]>>({
    '7D': [
      { label: 'Mon', value: 69.1 },
      { label: 'Tue', value: 68.9 },
      { label: 'Wed', value: 68.8 },
      { label: 'Thu', value: 68.7 },
      { label: 'Fri', value: 68.6 },
      { label: 'Sat', value: 68.5 },
      { label: 'Sun', value: 68.4 }
    ],
    '30D': [
      { label: 'W1', value: 70.2 },
      { label: 'W2', value: 69.6 },
      { label: 'W3', value: 69.0 },
      { label: 'W4', value: 68.4 }
    ],
    '90D': [
      { label: 'M1', value: 73.5 },
      { label: 'M2', value: 71.2 },
      { label: 'M3', value: 68.4 }
    ]
  });

  readonly bodyFatData = signal<Record<RangeKey, TrendPoint[]>>({
    '7D': [
      { label: 'Mon', value: 32.1 },
      { label: 'Tue', value: 31.9 },
      { label: 'Wed', value: 31.8 },
      { label: 'Thu', value: 31.7 },
      { label: 'Fri', value: 31.5 },
      { label: 'Sat', value: 31.4 },
      { label: 'Sun', value: 31.2 }
    ],
    '30D': [
      { label: 'W1', value: 33.0 },
      { label: 'W2', value: 32.5 },
      { label: 'W3', value: 31.8 },
      { label: 'W4', value: 31.2 }
    ],
    '90D': [
      { label: 'M1', value: 35.1 },
      { label: 'M2', value: 33.7 },
      { label: 'M3', value: 31.2 }
    ]
  });

  readonly history = signal<EvaluationHistoryItem[]>([
    {
      id: 1,
      date: '10 Apr 2026 · 10:30 AM',
      weight: '68.4 kg',
      bodyFat: '31.2%',
      visceralFat: '8.4',
      notes:
        'Good adherence overall. Slight appetite drop this week. Asked to improve sleep consistency and hydration.',
      enteredBy: 'Ava Nelson',
      trend: 'Improving',
      trendType: 'up',
      highlighted: true
    },
    {
      id: 2,
      date: '03 Apr 2026 · 09:10 AM',
      weight: '69.1 kg',
      bodyFat: '31.9%',
      visceralFat: '8.7',
      notes:
        'Weight plateau noted. Recommended higher protein breakfast and tighter weekend meal tracking.',
      enteredBy: 'Ava Nelson',
      trend: 'Plateau',
      trendType: 'neutral'
    },
    {
      id: 3,
      date: '27 Mar 2026 · 11:05 AM',
      weight: '69.8 kg',
      bodyFat: '32.6%',
      visceralFat: '9.0',
      notes:
        'Initial positive drop from previous cycle. Energy levels better. Continue current plan.',
      enteredBy: 'Coach Admin',
      trend: 'Strong start',
      trendType: 'up'
    }
  ]);

  readonly quickActions = [
    { label: 'Message member', icon: 'chat' as const },
    { label: 'Call now', icon: 'phone' as const },
    { label: 'Open feed note', icon: 'feed' as const },
    { label: 'Mark follow-up complete', icon: 'approvals' as const }
  ];

  readonly insightItems: InsightItem[] = [
    {
      title: 'Weight down 1.8 kg this month',
      detail: 'Pace remains healthy and aligned with the current nutrition phase.'
    },
    {
      title: 'Body fat trending in the right direction',
      detail: 'Reduction is gradual but consistent across the last four check-ins.'
    },
    {
      title: 'Follow-up consistency: high',
      detail: 'Minor dip appeared last week, so today’s evaluation should reset momentum.'
    }
  ];

  readonly actionSignals: ActionSignal[] = [
    { label: 'Attention score', value: 'High' },
    { label: 'Follow-up gap', value: '6 days' },
    { label: 'Momentum', value: 'Recoverable' }
  ];

  readonly latestEvaluation = computed(() => this.history()[0]);
  readonly previousEvaluation = computed(() => this.history()[1] ?? null);
  readonly latestWeightValue = computed(() => this.valueFromMetric(this.latestEvaluation().weight));
  readonly latestBodyFatValue = computed(() => this.valueFromMetric(this.latestEvaluation().bodyFat));
  readonly latestVisceralFatValue = computed(() => {
    const value = Number.parseFloat(this.latestEvaluation().visceralFat);
    return Number.isFinite(value) ? value : null;
  });
  readonly evaluationSummary = computed(() => {
    const latest = this.latestEvaluation();
    return [
      { label: 'Last captured', value: latest.date },
      { label: 'Weight', value: latest.weight },
      { label: 'Body fat', value: latest.bodyFat },
      { label: 'Visceral fat', value: latest.visceralFat }
    ];
  });

  readonly metricCards = computed<MetricCard[]>(() => {
    const latest = this.latestEvaluation();
    const previous = this.previousEvaluation();

    const latestWeight = this.valueFromMetric(latest.weight);
    const previousWeight = previous ? this.valueFromMetric(previous.weight) : latestWeight;
    const latestBodyFat = this.valueFromMetric(latest.bodyFat);
    const previousBodyFat = previous ? this.valueFromMetric(previous.bodyFat) : latestBodyFat;
    const baselineWeight = this.valueFromMetric(this.history()[this.history().length - 1].weight);
    const weightProgress = Math.max(
      0,
      Math.min(100, Math.round(((baselineWeight - latestWeight) / Math.max(baselineWeight - 64, 1)) * 100))
    );

    return [
      {
        label: 'Current Weight',
        value: latest.weight,
        trend: this.deltaSummary(previousWeight, latestWeight, 'kg'),
        trendType: latestWeight <= previousWeight ? 'down' : 'up',
        helper: latestWeight <= previousWeight ? 'On track for fat-loss target' : 'Review adherence and retention',
        emphasized: true
      },
      {
        label: 'Body Fat %',
        value: latest.bodyFat,
        trend: this.deltaSummary(previousBodyFat, latestBodyFat, '%'),
        trendType: latestBodyFat <= previousBodyFat ? 'down' : 'up',
        helper:
          latestBodyFat <= previousBodyFat
            ? 'Trending in the right direction'
            : 'Use today’s review to reset consistency'
      },
      {
        label: 'Last Visit',
        value: this.relativeVisitLabel(latest.date),
        trend: 'Coach reviewed',
        trendType: 'neutral',
        helper: `Entered by ${latest.enteredBy}`
      },
      {
        label: 'Goal Progress',
        value: `${weightProgress}%`,
        trend: weightProgress >= 60 ? '↑ pace improving' : '→ steady recovery',
        trendType: weightProgress >= 60 ? 'up' : 'neutral',
        helper: 'Strong early adherence with room to tighten follow-up'
      }
    ];
  });

  readonly weightPoints = computed(() => this.weightData()[this.selectedRange()]);
  readonly bodyFatPoints = computed(() => this.bodyFatData()[this.selectedRange()]);

  readonly weightPath = computed(() => this.buildPath(this.weightPoints().map((point) => point.value)));
  readonly bodyFatPath = computed(() =>
    this.buildPath(this.bodyFatPoints().map((point) => point.value))
  );

  readonly weightDots = computed(() => this.buildDots(this.weightPoints().map((point) => point.value)));
  readonly bodyFatDots = computed(() =>
    this.buildDots(this.bodyFatPoints().map((point) => point.value))
  );

  setRange(range: RangeKey): void {
    this.selectedRange.set(range);
  }

  openEvaluationWorkspace(): void {
    this.isEvaluationWorkspaceOpen.set(true);
  }

  closeEvaluationWorkspace(): void {
    this.isEvaluationWorkspaceOpen.set(false);
  }

  handleEvaluationSaved(payload: MemberEvaluationPayload): void {
    const previous = this.history()[0];
    const nextEntry: EvaluationHistoryItem = {
      id: this.history().length + 1,
      date: this.formatEvaluationDate(new Date()),
      weight: `${Number(payload.values.weight).toFixed(1)} kg`,
      bodyFat: `${Number(payload.values.bodyFat).toFixed(1)}%`,
      visceralFat:
        payload.values.visceralFat === null ? 'Not recorded' : Number(payload.values.visceralFat).toFixed(1),
      notes: payload.notes || 'Evaluation saved during live consultation.',
      enteredBy: this.member.coach,
      trend: this.historyTrendLabel(previous, payload),
      trendType: this.historyTrendType(previous, payload),
      highlighted: true
    };

    this.history.update((entries) => [
      nextEntry,
      ...entries.map((entry) => ({
        ...entry,
        highlighted: false
      }))
    ]);

    this.weightData.update((series) => this.updateSeries(series, Number(payload.values.weight), 'Now'));
    this.bodyFatData.update((series) => this.updateSeries(series, Number(payload.values.bodyFat), 'Now'));
    this.evaluationSnapshot.update((snapshot) => ({
      ...snapshot,
      date: payload.date,
      lastFullAssessmentDate:
        payload.values.skeletalMuscle !== null ||
        payload.values.bmr !== null ||
        payload.values.bodyAge !== null ||
        payload.values.trunkSubcutaneousFat !== null
          ? new Date().toISOString().slice(0, 10)
          : snapshot.lastFullAssessmentDate,
      notes: payload.notes,
      values: {
        ...snapshot.values,
        weight: { ...snapshot.values.weight, value: payload.values.weight as number },
        bodyFat: { ...snapshot.values.bodyFat, value: payload.values.bodyFat as number },
        visceralFat: { ...snapshot.values.visceralFat, value: payload.values.visceralFat as number | null },
        skeletalMuscle: {
          ...snapshot.values.skeletalMuscle,
          value: payload.values.skeletalMuscle as number | null
        },
        bmr: { ...snapshot.values.bmr, value: payload.values.bmr as number | null },
        bodyAge: { ...snapshot.values.bodyAge, value: payload.values.bodyAge as number | null },
        trunkSubcutaneousFat: {
          ...snapshot.values.trunkSubcutaneousFat,
          value: payload.values.trunkSubcutaneousFat as number | null
        },
        refNo: { ...snapshot.values.refNo, value: payload.values.refNo as string | null },
        invitedBy: { ...snapshot.values.invitedBy, value: payload.values.invitedBy as string | null }
      }
    }));

    this.saveToastMessage.set('Evaluation added');
    this.showSaveToast.set(true);

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => this.showSaveToast.set(false), 2200);
    this.closeEvaluationWorkspace();
  }

  badgeClass(type: TrendType): string {
    if (type === 'up') {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100';
    }
    if (type === 'down') {
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100';
    }
    return 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200';
  }

  private deltaSummary(previous: number, current: number, unit: string): string {
    const delta = Number((current - previous).toFixed(1));
    if (delta === 0) {
      return '→ no change since last entry';
    }

    return `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)} ${unit} vs last entry`;
  }

  private relativeVisitLabel(dateLabel: string): string {
    const [datePart, timePart] = dateLabel.split(' · ');
    const todayLabel = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date());

    if (datePart === todayLabel) {
      return `Today, ${timePart}`;
    }

    return dateLabel;
  }

  private historyTrendLabel(
    previous: EvaluationHistoryItem | undefined,
    payload: MemberEvaluationPayload
  ): string {
    if (!previous) {
      return 'Saved';
    }

    const weightDelta = Number(payload.values.weight) - this.valueFromMetric(previous.weight);
    const bodyFatDelta = Number(payload.values.bodyFat) - this.valueFromMetric(previous.bodyFat);

    if (weightDelta < 0 || bodyFatDelta < 0) {
      return 'Improving';
    }

    if (weightDelta === 0 && bodyFatDelta === 0) {
      return 'Stable';
    }

    return 'Needs review';
  }

  private historyTrendType(
    previous: EvaluationHistoryItem | undefined,
    payload: MemberEvaluationPayload
  ): TrendType {
    if (!previous) {
      return 'neutral';
    }

    const weightDelta = Number(payload.values.weight) - this.valueFromMetric(previous.weight);
    const bodyFatDelta = Number(payload.values.bodyFat) - this.valueFromMetric(previous.bodyFat);

    if (weightDelta < 0 || bodyFatDelta < 0) {
      return 'up';
    }

    if (weightDelta === 0 && bodyFatDelta === 0) {
      return 'neutral';
    }

    return 'down';
  }

  private formatEvaluationDate(date: Date): string {
    const datePart = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
    const timePart = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);

    return `${datePart} · ${timePart}`;
  }

  private updateSeries(
    source: Record<RangeKey, TrendPoint[]>,
    nextValue: number,
    label: string
  ): Record<RangeKey, TrendPoint[]> {
    return {
      '7D': this.replaceLastPoint(source['7D'], nextValue, label),
      '30D': this.replaceLastPoint(source['30D'], nextValue, label),
      '90D': this.replaceLastPoint(source['90D'], nextValue, label)
    };
  }

  private replaceLastPoint(points: TrendPoint[], value: number, label: string): TrendPoint[] {
    return points.map((point, index) =>
      index === points.length - 1 ? { label, value } : point
    );
  }

  private valueFromMetric(metric: string): number {
    return Number.parseFloat(metric);
  }

  private buildPath(values: number[]): string {
    if (!values.length) {
      return '';
    }

    const width = 360;
    const height = 140;
    const padding = 14;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

    return values
      .map((value, index) => {
        const x = padding + index * stepX;
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }

  private buildDots(values: number[]): Array<{ x: number; y: number }> {
    if (!values.length) {
      return [];
    }

    const width = 360;
    const height = 140;
    const padding = 14;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

    return values.map((value, index) => ({
      x: padding + index * stepX,
      y: height - padding - ((value - min) / range) * (height - padding * 2)
    }));
  }
}
