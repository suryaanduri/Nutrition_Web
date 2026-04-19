import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  protected readonly summaryCards: SummaryCard[] = [
    {
      label: 'Active members',
      value: '1,284',
      change: '+71',
      hint: 'vs last 30 days',
      trend: 'up',
      icon: 'members'
    },
    {
      label: 'Recent evaluations',
      value: '46',
      change: '12 today',
      hint: 'records captured today',
      trend: 'steady',
      icon: 'evaluations'
    },
    {
      label: 'Pending feed approvals',
      value: '5',
      change: '1 aging',
      hint: 'member posts waiting review',
      trend: 'steady',
      icon: 'approvals'
    },
    {
      label: 'Unread priority chats',
      value: '14',
      change: '-18%',
      hint: 'response time improving',
      trend: 'down',
      icon: 'chat'
    }
  ];

  protected readonly priorityActions: PriorityAction[] = [
    {
      title: 'Members need follow-up',
      detail: '5 members are below adherence threshold and should be reviewed before the evening wave.',
      meta: 'Members queue',
      cta: 'Open members',
      tone: 'danger',
      icon: 'members'
    },
    {
      title: 'Feed queue waiting',
      detail: '5 pending member posts include 3 with images. One post has been waiting more than 24 hours.',
      meta: 'Moderation queue',
      cta: 'Review feed',
      tone: 'warning',
      icon: 'approvals'
    },
    {
      title: 'Priority chats unread',
      detail: 'Unread coaching conversations are clustered around plateau and adherence concerns.',
      meta: 'Chat workspace',
      cta: 'Open chat',
      tone: 'success',
      icon: 'chat'
    }
  ];

  protected readonly quickActions: QuickAction[] = [
    { label: 'Add member', icon: 'members', tone: 'primary' },
    { label: 'Add evaluation', icon: 'evaluations', tone: 'neutral' },
    { label: 'Open chat', icon: 'chat', tone: 'neutral' },
    { label: 'Review feed', icon: 'approvals', tone: 'neutral' }
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

  protected readonly activity: ActivityItem[] = [
    {
      title: 'Transformation story submitted for approval',
      detail: 'Member feed post is ready for moderation review.',
      time: '9 min ago',
      icon: 'approvals'
    },
    {
      title: 'High-risk member flagged',
      detail: 'Protein targets were missed for 5 consecutive days.',
      time: '24 min ago',
      icon: 'trend'
    },
    {
      title: 'Coach follow-up window opened',
      detail: 'One reschedule created a 90-minute buffer this afternoon.',
      time: '51 min ago',
      icon: 'calendar'
    },
    {
      title: 'Priority chat received',
      detail: 'Member requested help tightening dinner structure this week.',
      time: '1 h ago',
      icon: 'chat'
    }
  ];
}
