import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { IconComponent } from '../../../shared/ui/icon/icon.component';

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

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './member-detail.html',
  styleUrl: './member-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberDetail {
  readonly selectedRange = signal<RangeKey>('30D');

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

  readonly metricCards: MetricCard[] = [
    {
      label: 'Current Weight',
      value: '68.4 kg',
      trend: '↓ 1.2 kg in 14 days',
      trendType: 'down',
      helper: 'On track for fat-loss target',
      emphasized: true
    },
    {
      label: 'Body Fat %',
      value: '31.2%',
      trend: '↓ 0.8% this month',
      trendType: 'down',
      helper: 'Trending in the right direction'
    },
    {
      label: 'Last Visit',
      value: 'Today, 10:30 AM',
      trend: 'On time',
      trendType: 'neutral',
      helper: 'Coach review completed'
    },
    {
      label: 'Goal Progress',
      value: '62%',
      trend: '↑ +8% vs last month',
      trendType: 'up',
      helper: 'Strong early adherence'
    }
  ];

  readonly weightData: Record<RangeKey, TrendPoint[]> = {
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
  };

  readonly bodyFatData: Record<RangeKey, TrendPoint[]> = {
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
  };

  readonly history: EvaluationHistoryItem[] = [
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
  ];

  readonly quickActions = [
    { label: 'Message member', icon: 'chat' as const },
    { label: 'Call now', icon: 'phone' as const },
    { label: 'Open feed note', icon: 'feed' as const },
    { label: 'Mark follow-up complete', icon: 'approvals' as const }
  ];

  readonly weightPoints = computed(() => this.weightData[this.selectedRange()]);
  readonly bodyFatPoints = computed(() => this.bodyFatData[this.selectedRange()]);

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

  badgeClass(type: TrendType): string {
    if (type === 'up') {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100';
    }
    if (type === 'down') {
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100';
    }
    return 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200';
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
