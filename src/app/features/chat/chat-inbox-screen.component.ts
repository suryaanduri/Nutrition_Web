import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import {
  ConversationListItemComponent,
  ConversationListItemViewModel
} from './conversation-list-item.component';
import { MessageBubbleComponent, MessageBubbleViewModel } from './message-bubble.component';
import { ChatService } from './chat.service';

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
  private readonly chatService = inject(ChatService);
  private readonly router = inject(Router);

  protected readonly filterOptions: InboxFilter[] = ['All', 'Unread'];
  protected readonly inboxState = signal<InboxState>('default');
  protected readonly query = signal('');
  protected readonly selectedFilter = signal<InboxFilter>('All');
  protected readonly selectedConversationId = signal<string>('CONV-1042');
  protected readonly draftMessage = signal('');
  protected readonly feedback = signal<FeedbackMessage | null>(null);

  protected readonly conversations = signal<ConversationRecord[]>([]);

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

  constructor() {
    this.loadConversations();
  }

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
    if (state === 'default') {
      this.loadConversations();
    }
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

    this.chatService.sendMessage(activeConversation.id, draft).subscribe({
      next: () => {
        this.draftMessage.set('');
        this.feedback.set({
          tone: 'success',
          message: `Reply sent to ${activeConversation.memberName}.`
        });
        this.loadMessages(activeConversation.id);
      }
    });
  }

  protected openSelectedMember(): void {
    const activeConversation = this.selectedConversation();
    if (!activeConversation) {
      return;
    }

    void this.router.navigate(['/members', activeConversation.memberId]);
  }

  protected openEvaluationForSelectedMember(): void {
    const activeConversation = this.selectedConversation();
    if (!activeConversation) {
      return;
    }

    void this.router.navigate(['/evaluations/new'], {
      queryParams: { memberId: activeConversation.memberId }
    });
  }

  protected statusClass(status: ConversationRecord['status']): string {
    if (status === 'Needs attention') {
      return 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
    }

    return 'bg-[rgba(36,122,82,0.1)] text-[var(--ncm-primary-strong)]';
  }

  private loadConversations(): void {
    this.inboxState.set('loading');
    this.chatService.listConversations({ limit: 100 }).subscribe({
      next: (response) => {
        const items = response.items.map((conversation) => ({
          id: conversation.id,
          memberId: conversation.member.id,
          memberName: conversation.member.fullName,
          memberGoal: 'Member support',
          lastMessagePreview: conversation.latestMessage?.content ?? 'No messages yet',
          timestamp: conversation.latestMessage
            ? new Date(conversation.latestMessage.createdAt).toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit'
              })
            : '--',
          unreadCount: 0,
          status: conversation.member.status === 'ACTIVE' ? 'Active' : 'Needs attention',
          memberStatus: conversation.member.status === 'ACTIVE' ? 'Active' : 'Needs attention',
          latestEvaluation: 'Evaluation history available',
          lastEvaluationDate: conversation.lastMessageAt
            ? new Date(conversation.lastMessageAt).toLocaleDateString('en-IN')
            : '--',
          quickInsight: 'Conversation connected to live backend data.',
          messages: []
        } satisfies ConversationRecord));

        this.conversations.set(items);
        const selectedId = items[0]?.id ?? '';
        this.selectedConversationId.set(selectedId);
        this.inboxState.set('default');

        if (selectedId) {
          this.loadMessages(selectedId);
        }
      },
      error: () => this.inboxState.set('error')
    });
  }

  private loadMessages(conversationId: string): void {
    this.chatService.getConversationMessages(conversationId, { limit: 100 }).subscribe({
      next: (response) => {
        this.conversations.update((conversations) =>
          conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messages: response.items
                    .slice()
                    .reverse()
                    .map(
                      (message) =>
                        ({
                          id: message.id,
                          sender: message.senderType === 'MEMBER' ? 'member' : 'coach',
                          senderLabel:
                            message.senderMember?.fullName ??
                            message.senderUser?.fullName ??
                            'Staff',
                          body: message.content,
                          time: new Date(message.createdAt).toLocaleString('en-IN')
                        }) satisfies MessageBubbleViewModel
                    )
                }
              : conversation
          )
        );
      }
    });
  }
}
