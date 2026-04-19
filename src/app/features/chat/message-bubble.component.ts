import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface MessageBubbleViewModel {
  id: string;
  sender: 'member' | 'coach';
  senderLabel: string;
  body: string;
  time: string;
}

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageBubbleComponent {
  readonly message = input.required<MessageBubbleViewModel>();
}
