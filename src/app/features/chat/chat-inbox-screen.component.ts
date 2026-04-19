import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import {
  ConversationListItemComponent,
  ConversationListItemViewModel
} from './conversation-list-item.component';
import { MessageBubbleComponent, MessageBubbleViewModel } from './message-bubble.component';

type InboxFilter = 'All' | 'Unread';
type InboxState = 'default' | 'loading' | 'error';
type FeedbackTone = 'success' | 'error';

interface ConversationRecord extends ConversationListItemViewModel {
  memberId: string;
  memberStatus: string;
  latestEvaluation: string;
  lastEvaluationDate: string;
  quickInsight: string;
  messages: MessageBubbleViewModel[];
}

interface FeedbackMessage {
  tone: FeedbackTone;
  message: string;
}

@Component({
  selector: 'app-chat-inbox-screen',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    ConversationListItemComponent,
    MessageBubbleComponent
  ],
  templateUrl: './chat-inbox-screen.component.html',
  styleUrl: './chat-inbox-screen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatInboxScreenComponent {
  readonly openMember = output<string>();
  readonly addEvaluation = output<void>();

  protected readonly filterOptions: InboxFilter[] = ['All', 'Unread'];
  protected readonly inboxState = signal<InboxState>('default');
  protected readonly query = signal('');
  protected readonly selectedFilter = signal<InboxFilter>('All');
  protected readonly selectedConversationId = signal<string>('CONV-1042');
  protected readonly draftMessage = signal('');
  protected readonly feedback = signal<FeedbackMessage | null>(null);

  protected readonly conversations = signal<ConversationRecord[]>([
    {
      id: 'CONV-1042',
      memberId: 'MBR-1042',
      memberName: 'Rhea Sharma',
      memberGoal: 'PCOS-focused fat loss',
      lastMessagePreview: 'Hydration improved, but evenings are still difficult. Can we tighten dinner structure this week?',
      timestamp: '9:12 AM',
      unreadCount: 2,
      status: 'Needs attention',
      memberStatus: 'Needs attention',
      latestEvaluation: '68.2 kg · 31.0% body fat',
      lastEvaluationDate: '19 Apr 2026',
      quickInsight: 'Follow-up softened this week, so a fast reply now should recover adherence momentum.',
      messages: [
        {
          id: 'MSG-1042-1',
          sender: 'member',
          senderLabel: 'Rhea',
          body: 'Morning coach, I stayed on plan yesterday but hydration dropped again after 6 PM.',
          time: 'Yesterday · 7:18 PM'
        },
        {
          id: 'MSG-1042-2',
          sender: 'coach',
          senderLabel: 'Coach Ava',
          body: 'That is still recoverable. Keep lunch steady and send me what dinner looked like tonight.',
          time: 'Yesterday · 7:32 PM'
        },
        {
          id: 'MSG-1042-3',
          sender: 'member',
          senderLabel: 'Rhea',
          body: 'Hydration improved, but evenings are still difficult. Can we tighten dinner structure this week?',
          time: 'Today · 9:12 AM'
        }
      ]
    },
    {
      id: 'CONV-0871',
      memberId: 'MBR-0871',
      memberName: 'Sana Qureshi',
      memberGoal: 'Wedding cut support',
      lastMessagePreview: 'Check-in done. Energy is stable and cravings were low through the weekend.',
      timestamp: '8:03 AM',
      unreadCount: 1,
      status: 'Active',
      memberStatus: 'Active',
      latestEvaluation: '59.8 kg · 26.1% body fat',
      lastEvaluationDate: '15 Apr 2026',
      quickInsight: 'Low-risk conversation with strong momentum. A quick acknowledgment is usually enough.',
      messages: [
        {
          id: 'MSG-0871-1',
          sender: 'member',
          senderLabel: 'Sana',
          body: 'Check-in done. Energy is stable and cravings were low through the weekend.',
          time: 'Today · 8:03 AM'
        }
      ]
    },
    {
      id: 'CONV-0612',
      memberId: 'MBR-0612',
      memberName: 'Nadia Khan',
      memberGoal: 'Postpartum recomposition',
      lastMessagePreview: 'I missed the follow-up yesterday. Can we reopen the next available slot this week?',
      timestamp: 'Yesterday',
      unreadCount: 0,
      status: 'Needs attention',
      memberStatus: 'Needs attention',
      latestEvaluation: '72.6 kg · 34.7% body fat',
      lastEvaluationDate: '06 Apr 2026',
      quickInsight: 'Conversation is quiet, but the missed follow-up means this member still belongs near the top of the queue.',
      messages: [
        {
          id: 'MSG-0612-1',
          sender: 'member',
          senderLabel: 'Nadia',
          body: 'I missed the follow-up yesterday. Can we reopen the next available slot this week?',
          time: 'Yesterday · 6:21 PM'
        },
        {
          id: 'MSG-0612-2',
          sender: 'coach',
          senderLabel: 'Coach Mila',
          body: 'Yes. I am holding a consultation block for you tomorrow afternoon if that works.',
          time: 'Yesterday · 6:40 PM'
        }
      ]
    },
    {
      id: 'CONV-0987',
      memberId: 'MBR-0987',
      memberName: 'Arjun Menon',
      memberGoal: 'Metabolic reset',
      lastMessagePreview: 'Shared the grocery haul and wanted to confirm the weekend staples before I prep tonight.',
      timestamp: 'Mon',
      unreadCount: 0,
      status: 'Active',
      memberStatus: 'Active',
      latestEvaluation: '82.1 kg · 24.8% body fat',
      lastEvaluationDate: '09 Apr 2026',
      quickInsight: 'Good operational conversation to keep motivation high, but it is not urgent.',
      messages: []
    }
  ]);

  protected readonly filteredConversations = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.selectedFilter();

    return this.conversations().filter((conversation) => {
      const matchesQuery =
        !query ||
        conversation.memberName.toLowerCase().includes(query) ||
        conversation.memberGoal.toLowerCase().includes(query);
      const matchesFilter = filter === 'All' || conversation.unreadCount > 0;
      return matchesQuery && matchesFilter;
    });
  });

  protected readonly selectedConversation = computed(
    () =>
      this.filteredConversations().find((conversation) => conversation.id === this.selectedConversationId()) ??
      this.conversations().find((conversation) => conversation.id === this.selectedConversationId()) ??
      this.filteredConversations()[0] ??
      this.conversations()[0] ??
      null
  );

  protected readonly inboxSummary = computed(() => {
    const total = this.conversations().length;
    const unread = this.conversations().filter((conversation) => conversation.unreadCount > 0).length;
    const attention = this.conversations().filter(
      (conversation) => conversation.status === 'Needs attention'
    ).length;
    return { total, unread, attention };
  });

  protected readonly queueLabel = computed(
    () => `${this.filteredConversations().length} conversations in view`
  );
  protected readonly hasAnyConversations = computed(() => this.conversations().length > 0);
  protected readonly skeletonRows = Array.from({ length: 5 });

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected setFilter(value: InboxFilter): void {
    this.selectedFilter.set(value);
  }

  protected selectConversation(conversationId: string): void {
    this.selectedConversationId.set(conversationId);
    this.feedback.set(null);
  }

  protected resetFilters(): void {
    this.query.set('');
    this.selectedFilter.set('All');
  }

  protected setInboxState(state: InboxState): void {
    this.inboxState.set(state);
  }

  protected updateDraft(value: string): void {
    this.draftMessage.set(value);
  }

  protected sendMessage(): void {
    const activeConversation = this.selectedConversation();
    const draft = this.draftMessage().trim();

    if (!activeConversation || !draft) {
      return;
    }

    const nextMessage: MessageBubbleViewModel = {
      id: `MSG-${activeConversation.memberId}-${activeConversation.messages.length + 1}`,
      sender: 'coach',
      senderLabel: 'Coach Console',
      body: draft,
      time: 'Now'
    };

    this.conversations.update((conversations) =>
      conversations.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              lastMessagePreview: draft,
              timestamp: 'Now',
              unreadCount: 0,
              messages: [...conversation.messages, nextMessage]
            }
          : conversation
      )
    );

    this.draftMessage.set('');
    this.feedback.set({
      tone: 'success',
      message: `Reply sent to ${activeConversation.memberName}.`
    });
  }

  protected openSelectedMember(): void {
    const activeConversation = this.selectedConversation();
    if (!activeConversation) {
      return;
    }

    this.openMember.emit(activeConversation.memberId);
  }

  protected openEvaluationForSelectedMember(): void {
    this.addEvaluation.emit();
  }

  protected statusClass(status: ConversationRecord['status']): string {
    if (status === 'Needs attention') {
      return 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
    }

    return 'bg-[rgba(36,122,82,0.1)] text-[var(--ncm-primary-strong)]';
  }
}
