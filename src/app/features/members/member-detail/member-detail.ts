import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import {
  GenderOption,
  MemberFormDrawerComponent,
  MemberFormValue
} from '../member-form-drawer.component';
import { MembersService } from '../members.service';
import { EvaluationsService } from '../../evaluations/evaluations.service';

type RangeKey = '7D' | '30D' | '90D';
type TrendType = 'up' | 'down' | 'neutral';

interface MetricCard {
  label: string;
  value: string;
  trend: string;
  trendType: TrendType;
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
  imports: [CommonModule, IconComponent, MemberFormDrawerComponent],
  templateUrl: './member-detail.html',
  styleUrl: './member-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly membersService = inject(MembersService);
  private readonly evaluationsService = inject(EvaluationsService);

  readonly selectedRange = signal<RangeKey>('30D');
  readonly rangeOptions: RangeKey[] = ['7D', '30D', '90D'];
  readonly editDrawerOpen = signal(false);

  readonly member = signal({
    id: '',
    name: 'Member',
    email: '',
    phone: '',
    dob: '1996-05-14',
    height: '164',
    age: 0,
    gender: 'Female' as GenderOption,
    goal: '',
    coach: 'Unassigned',
    status: 'Active',
    tags: ['Active'],
    program: '',
    joinedOn: ''
  });

  readonly history = signal<EvaluationHistoryItem[]>([]);

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

  readonly latestEvaluation = computed(() => this.history()[0]);
  readonly previousEvaluation = computed(() => this.history()[1] ?? null);
  readonly memberDrawerValue = computed<MemberFormValue>(() => ({
    id: this.member().id,
    joinedOn: this.member().joinedOn,
    fullName: this.member().name,
    dob: this.member().dob,
    height: this.member().height,
    email: this.member().email,
    phone: this.member().phone,
    gender: this.member().gender,
    goal: this.goalOptionFromGoal(this.member().program),
    coach: this.member().coach
  }));

  readonly metricCards = computed<MetricCard[]>(() => {
    const latest = this.latestEvaluation();
    const previous = this.previousEvaluation();
    const latestWeight = this.valueFromMetric(latest.weight);
    const previousWeight = previous ? this.valueFromMetric(previous.weight) : latestWeight;
    const latestBodyFat = this.valueFromMetric(latest.bodyFat);
    const previousBodyFat = previous ? this.valueFromMetric(previous.bodyFat) : latestBodyFat;
    const baselineWeight = this.valueFromMetric(this.history()[this.history().length - 1].weight);
    const progress = Math.max(
      0,
      Math.min(100, Math.round(((baselineWeight - latestWeight) / Math.max(baselineWeight - 64, 1)) * 100))
    );

    return [
      {
        label: 'Current Weight',
        value: latest.weight,
        trend: this.deltaSummary(previousWeight, latestWeight, 'kg'),
        trendType: latestWeight <= previousWeight ? 'down' : 'up'
      },
      {
        label: 'Body Fat %',
        value: latest.bodyFat,
        trend: this.deltaSummary(previousBodyFat, latestBodyFat, '%'),
        trendType: latestBodyFat <= previousBodyFat ? 'down' : 'up'
      },
      {
        label: 'Last Visit',
        value: this.relativeVisitLabel(latest.date),
        trend: `Entered by ${latest.enteredBy}`,
        trendType: 'neutral'
      },
      {
        label: 'Goal Progress',
        value: `${progress}%`,
        trend: progress >= 60 ? 'On track' : 'Needs follow-up',
        trendType: progress >= 60 ? 'up' : 'neutral'
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

  constructor() {
    const memberId = this.route.snapshot.paramMap.get('memberId');
    if (memberId) {
      this.loadMember(memberId);
      this.loadHistory(memberId);
    }
  }

  setRange(range: RangeKey): void {
    this.selectedRange.set(range);
  }

  openAddEvaluation(): void {
    void this.router.navigate(['/evaluations/new'], {
      queryParams: { memberId: this.member().id }
    });
  }

  openEditMember(): void {
    this.editDrawerOpen.set(true);
  }

  closeEditMember(): void {
    this.editDrawerOpen.set(false);
  }

  saveMember(payload: MemberFormValue): void {
    this.membersService
      .updateMember(this.member().id, {
        fullName: payload.fullName,
        dob: payload.dob,
        email: payload.email,
        phone: payload.phone.replace(/\D/g, ''),
        heightCm: Number(payload.height),
        gender: payload.gender,
        goal: payload.goal
      })
      .subscribe({
        next: () => {
          this.loadMember(this.member().id);
          this.closeEditMember();
        }
      });
  }

  goBack(): void {
    void this.router.navigate(['/members']);
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
      return 'No change';
    }

    return `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)} ${unit}`;
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

  private valueFromMetric(metric: string): number {
    return Number.parseFloat(metric);
  }

  private ageFromDob(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age;
  }

  private goalOptionFromGoal(program: string): MemberFormValue['goal'] {
    if (program.includes('PCOS')) {
      return 'PCOS';
    }
    if (program.includes('Weight Gain')) {
      return 'Weight Gain';
    }
    if (program.includes('Metabolic')) {
      return 'Metabolic Reset';
    }
    return 'Weight Loss';
  }

  private programLabel(goal: MemberFormValue['goal']): string {
    if (goal === 'PCOS') {
      return 'PCOS Reset Intensive';
    }
    if (goal === 'Weight Gain') {
      return 'Weight Gain Intensive';
    }
    if (goal === 'Metabolic Reset') {
      return 'Metabolic Reset Intensive';
    }
    return 'Weight Loss Intensive';
  }

  private goalLabel(goal: MemberFormValue['goal']): string {
    if (goal === 'PCOS') {
      return 'PCOS-focused fat loss';
    }
    if (goal === 'Weight Gain') {
      return 'Strength and recovery gain';
    }
    if (goal === 'Metabolic Reset') {
      return 'Metabolic reset and insulin stability';
    }
    return 'Sustainable fat loss';
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

  private loadMember(memberId: string): void {
    this.membersService.getMember(memberId).subscribe({
      next: (member) =>
        this.member.set({
          id: member.id,
          name: member.fullName,
          email: member.email,
          phone: member.phone,
          dob: member.dob.slice(0, 10),
          height: member.heightCm,
          age: this.ageFromDob(member.dob),
          gender: (['Female', 'Male', 'Other'].includes(member.gender) ? member.gender : 'Other') as GenderOption,
          goal: member.goal,
          coach: member.assignedCoach?.fullName ?? 'Unassigned',
          status: member.status === 'ACTIVE' ? 'Active' : 'Needs attention',
          tags: [member.status === 'ACTIVE' ? 'Active' : 'Needs attention'],
          program: member.goal,
          joinedOn: `Joined ${new Date(member.createdAt).toLocaleDateString('en-IN')}`
        })
    });
  }

  private loadHistory(memberId: string): void {
    this.evaluationsService.listMemberEvaluations(memberId).subscribe({
      next: (items) => {
        const history = items.map((item, index) => ({
          id: index + 1,
          date: new Date(item.recordedAt).toLocaleString('en-IN'),
          weight: `${item.weight} kg`,
          bodyFat: item.bodyFat ? `${item.bodyFat}%` : '--',
          visceralFat: item.visceralFatPercent ?? '--',
          notes: `BMI ${item.bmi}`,
          enteredBy: item.member.assignedCoach?.fullName ?? 'Staff',
          trend: 'Recorded',
          trendType: 'neutral' as TrendType,
          highlighted: index === 0
        }));

        this.history.set(history);
        const weightData = history
          .slice(0, 4)
          .reverse()
          .map((entry, index) => ({ label: `W${index + 1}`, value: this.valueFromMetric(entry.weight) }));
        const bodyFatData = history
          .slice(0, 4)
          .reverse()
          .map((entry, index) => ({ label: `W${index + 1}`, value: this.valueFromMetric(entry.bodyFat) || 0 }));

        this.weightData.update((data) => ({ ...data, '30D': weightData.length ? weightData : data['30D'] }));
        this.bodyFatData.update((data) => ({ ...data, '30D': bodyFatData.length ? bodyFatData : data['30D'] }));
      }
    });
  }
}
