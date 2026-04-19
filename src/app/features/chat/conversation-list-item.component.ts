import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ConversationListItemViewModel {
  id: string;
  memberName: string;
  memberGoal: string;
  lastMessagePreview: string;
  timestamp: string;
  unreadCount: number;
  status: 'Active' | 'Needs attention';
}

@Component({
  selector: 'app-conversation-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conversation-list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationListItemComponent {
  readonly conversation = input.required<ConversationListItemViewModel>();
  readonly selected = input(false);

  protected statusClass(status: ConversationListItemViewModel['status']): string {
    if (status === 'Needs attention') {
      return 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
    }

    return 'bg-[rgba(36,122,82,0.1)] text-[var(--ncm-primary-strong)]';
  }
}
