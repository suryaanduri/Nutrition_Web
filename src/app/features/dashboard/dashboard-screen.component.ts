import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';

interface KpiCard {
  label: string;
  value: string;
  delta: string;
  context: string;
  trend: 'up' | 'down' | 'steady';
  icon: 'members' | 'evaluations' | 'approvals' | 'chat';
}

interface QuickAction {
  title: string;
  description: string;
  tone: 'primary' | 'neutral' | 'soft';
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

interface FeedActivity {
  title: string;
  detail: string;
  time: string;
  icon: 'spark' | 'calendar' | 'trend' | 'approvals';
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
  protected readonly kpis: KpiCard[] = [
    {
      label: 'Active members',
      value: '1,284',
      delta: '+8.2%',
      context: '71 new members joined in the last 30 days',
      trend: 'up',
      icon: 'members'
    },
    {
      label: 'Evaluations due',
      value: '46',
      delta: '12 today',
      context: 'Highest load is in metabolic reset and thyroid care',
      trend: 'steady',
      icon: 'evaluations'
    },
    {
      label: 'Pending approvals',
      value: '08',
      delta: '3 urgent',
      context: 'Two stories and one carousel are blocking tonight’s queue',
      trend: 'steady',
      icon: 'approvals'
    },
    {
      label: 'Unread priority chats',
      value: '14',
      delta: '-18%',
      context: 'Response time improved after triaging plateau escalations',
      trend: 'down',
      icon: 'chat'
    }
  ];

  protected readonly quickActions: QuickAction[] = [
    {
      title: 'Add member',
      description: 'Create a new profile and assign the right care pathway',
      tone: 'primary'
    },
    {
      title: 'Schedule evaluation',
      description: 'Book a follow-up, baseline assessment, or goal review',
      tone: 'neutral'
    },
    {
      title: 'Review approvals',
      description: 'Clear content approvals before the evening posting window',
      tone: 'soft'
    }
  ];

  protected readonly recentMembers: MemberRow[] = [
    {
      name: 'Rhea Sharma',
      program: 'PCOS Reset',
      coach: 'Ava Nelson',
      lastCheckIn: '42 min ago',
      risk: 'Priority'
    },
    {
      name: 'Sana Qureshi',
      program: 'Fat Loss Pro',
      coach: 'Mila Carter',
      lastCheckIn: '2h ago',
      risk: 'On track'
    },
    {
      name: 'Arjun Menon',
      program: 'Metabolic Recovery',
      coach: 'Ava Nelson',
      lastCheckIn: '3h ago',
      risk: 'Needs review'
    },
    {
      name: 'Kavya Iyer',
      program: 'Prenatal Wellness',
      coach: 'Rita Jones',
      lastCheckIn: '5h ago',
      risk: 'On track'
    }
  ];

  protected readonly evaluations: EvaluationRow[] = [
    {
      member: 'Rhea Sharma',
      type: 'Progress evaluation',
      time: '11:30 AM',
      coach: 'Ava Nelson',
      status: 'Confirmed'
    },
    {
      member: 'Arjun Menon',
      type: 'Body composition review',
      time: '1:00 PM',
      coach: 'Ava Nelson',
      status: 'Pending review'
    },
    {
      member: 'Nadia Khan',
      type: 'Metabolic reset follow-up',
      time: '4:15 PM',
      coach: 'Mila Carter',
      status: 'Confirmed'
    },
    {
      member: 'Priya Dsouza',
      type: 'Lifestyle coaching check-in',
      time: '6:00 PM',
      coach: 'Rita Jones',
      status: 'Rescheduled'
    }
  ];

  protected readonly feed: FeedActivity[] = [
    {
      title: 'Transformation story submitted for approval',
      detail: 'Ava tagged the post for “Women’s fat loss” and scheduled it for 6:30 PM.',
      time: '9 min ago',
      icon: 'approvals'
    },
    {
      title: 'High-risk member flagged by adherence engine',
      detail: 'Rhea Sharma missed protein targets for 5 consecutive days.',
      time: '24 min ago',
      icon: 'trend'
    },
    {
      title: 'Coach block opened for follow-up calls',
      detail: 'A 90-minute window is now free after one evaluation reschedule.',
      time: '51 min ago',
      icon: 'calendar'
    },
    {
      title: 'Community challenge crossed 80% participation',
      detail: 'The hydration sprint is driving unusually strong check-in completion.',
      time: '1h ago',
      icon: 'spark'
    }
  ];
}
