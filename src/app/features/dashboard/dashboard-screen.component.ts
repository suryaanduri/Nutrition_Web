import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';

interface SummaryCard {
  label: string;
  value: string;
  change: string;
  hint: string;
  trend: 'up' | 'down' | 'steady';
  icon: 'members' | 'evaluations' | 'approvals' | 'chat';
}

interface PriorityAction {
  title: string;
  detail: string;
  meta: string;
  cta: string;
  tone: 'danger' | 'warning' | 'success' | 'neutral';
  icon: 'members' | 'evaluations' | 'approvals' | 'chat';
}

interface MemberRow {
  name: string;
  program: string;
  coach: string;
  lastCheckIn: string;
  risk: 'On track' | 'Needs review' | 'Priority';
}

interface EvaluationRow {
  member: string;
  type: string;
  time: string;
  coach: string;
  status: 'Confirmed' | 'Pending review' | 'Rescheduled';
}

interface ActivityItem {
  title: string;
  detail: string;
  time: string;
  icon: 'approvals' | 'trend' | 'calendar' | 'chat';
}

interface QuickAction {
  label: string;
  icon: 'members' | 'evaluations' | 'chat' | 'approvals';
  tone: 'primary' | 'neutral';
}

@Component({
  selector: 'app-dashboard-screen',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './dashboard-screen.component.html',
  styleUrl: './dashboard-screen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardScreenComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  protected readonly summaryCards = signal<SummaryCard[]>([]);
  protected readonly priorityActions = signal<PriorityAction[]>([]);
  protected readonly recentMembers = signal<MemberRow[]>([]);
  protected readonly evaluations = signal<EvaluationRow[]>([]);
  protected readonly activity = signal<ActivityItem[]>([]);

  protected readonly quickActions: QuickAction[] = [
    { label: 'Add member', icon: 'members', tone: 'primary' },
    { label: 'Add evaluation', icon: 'evaluations', tone: 'neutral' },
    { label: 'Open chat', icon: 'chat', tone: 'neutral' },
    { label: 'Review feed', icon: 'approvals', tone: 'neutral' }
  ];

  constructor() {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.dashboardService.loadDashboard().subscribe({
      next: ({ summary, recentMembers, recentEvaluations, membersNeedingAttention, activity }) => {
        this.summaryCards.set([
          {
            label: 'Active members',
            value: String(summary.activeMembers),
            change: `${summary.totalMembers}`,
            hint: 'total members in scope',
            trend: 'up',
            icon: 'members'
          },
          {
            label: 'Recent evaluations',
            value: String(summary.recentEvaluationsCount),
            change: 'Last 7 days',
            hint: 'records captured recently',
            trend: 'steady',
            icon: 'evaluations'
          },
          {
            label: 'Pending follow-up',
            value: String(summary.membersNeedingAttentionCount),
            change: 'Needs review',
            hint: 'members needing attention',
            trend: summary.membersNeedingAttentionCount > 0 ? 'down' : 'steady',
            icon: 'approvals'
          },
          {
            label: 'Centers',
            value: String(summary.totalCenters ?? 0),
            change: summary.totalCenters === null ? 'Scoped view' : 'All centers',
            hint: 'visible to current role',
            trend: 'steady',
            icon: 'chat'
          }
        ]);

        this.priorityActions.set(membersNeedingAttention.slice(0, 3).map((member) => ({
          title: member.fullName,
          detail:
            member.reason === 'NO_EVALUATION_YET'
              ? 'This member has not completed an evaluation yet.'
              : 'This member is overdue for a fresh evaluation.',
          meta: member.center.name,
          cta: 'Open members',
          tone: member.reason === 'NO_EVALUATION_YET' ? 'warning' : 'danger',
          icon: 'members'
        })));

        this.recentMembers.set(recentMembers.slice(0, 4).map((member) => ({
          name: member.fullName,
          program: member.center.name,
          coach: 'Assigned staff',
          lastCheckIn: this.relativeTime(member.createdAt),
          risk: member.status === 'ACTIVE' ? 'On track' : 'Needs review'
        })));

        this.evaluations.set(recentEvaluations.slice(0, 4).map((evaluation) => ({
          member: evaluation.memberName,
          type: `BMI ${evaluation.bmi}`,
          time: this.dateLabel(evaluation.recordedAt),
          coach: 'Assigned coach',
          status: 'Confirmed'
        })));

        this.activity.set(activity.slice(0, 4).map((item) => ({
          title: item.type === 'MEMBER_CREATED' ? 'Member enrolled' : 'Evaluation recorded',
          detail: item.message,
          time: this.relativeTime(item.createdAt),
          icon: item.type === 'MEMBER_CREATED' ? 'calendar' : 'trend'
        })));
      }
    });
  }

  private relativeTime(value: string): string {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
    return diffHours < 1 ? 'Just now' : `${diffHours}h ago`;
  }

  private dateLabel(value: string): string {
    return new Date(value).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}
