import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { FeedService } from './feed.service';

type ModerationStatus = 'Pending' | 'Approved' | 'Rejected';
type ContentType = 'Text' | 'Image' | 'Text + Image';
type QueueState = 'default' | 'loading' | 'error';
type ModerationAction = 'approve' | 'reject';
type FeedbackTone = 'success' | 'error';
type PriorityTone = 'priority' | 'standard';

type StatusFilter = 'Pending' | 'Approved' | 'Rejected';
type TypeFilter = 'All content' | ContentType;
type SortFilter = 'Newest first' | 'Oldest first' | 'Priority';

interface ModerationPost {
  id: string;
  memberId: string;
  memberName: string;
  memberGoal: string;
  submittedAt: string;
  submittedMinutesAgo: number;
  contentType: ContentType;
  status: ModerationStatus;
  textPreview: string;
  fullText: string;
  imageLabel?: string;
  imageTone?: string;
  priority: PriorityTone;
  flags: string[];
  reviewReason: string;
}

interface FeedbackMessage {
  tone: FeedbackTone;
  message: string;
}

@Component({
  selector: 'app-feed-moderation-queue-screen',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './feed-moderation-queue-screen.component.html',
  styleUrl: './feed-moderation-queue-screen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedModerationQueueScreenComponent {
  private readonly feedService = inject(FeedService);

  protected readonly statusOptions: StatusFilter[] = ['Pending', 'Approved', 'Rejected'];
  protected readonly typeOptions: TypeFilter[] = ['All content', 'Text', 'Image', 'Text + Image'];
  protected readonly sortOptions: SortFilter[] = ['Newest first', 'Oldest first', 'Priority'];

  protected readonly posts = signal<ModerationPost[]>([]);

  protected readonly queueState = signal<QueueState>('default');
  protected readonly query = signal('');
  protected readonly selectedStatus = signal<StatusFilter>('Pending');
  protected readonly selectedType = signal<TypeFilter>('All content');
  protected readonly selectedSort = signal<SortFilter>('Newest first');
  protected readonly selectedPostId = signal<string>('POST-1009');
  protected readonly feedback = signal<FeedbackMessage | null>(null);

  protected readonly filteredPosts = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.selectedStatus();
    const type = this.selectedType();
    const sort = this.selectedSort();

    let list = this.posts().filter((post) => {
      const matchesQuery =
        !query ||
        post.memberName.toLowerCase().includes(query) ||
        post.memberId.toLowerCase().includes(query) ||
        post.textPreview.toLowerCase().includes(query);
      const matchesStatus = post.status === status;
      const matchesType = type === 'All content' || post.contentType === type;

      return matchesQuery && matchesStatus && matchesType;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'Oldest first') {
        return b.submittedMinutesAgo - a.submittedMinutesAgo;
      }

      if (sort === 'Priority') {
        return (
          priorityWeight(b.priority) - priorityWeight(a.priority) ||
          b.submittedMinutesAgo - a.submittedMinutesAgo
        );
      }

      return a.submittedMinutesAgo - b.submittedMinutesAgo;
    });

    return list;
  });

  protected readonly selectedPost = computed(
    () =>
      this.filteredPosts().find((post) => post.id === this.selectedPostId()) ??
      this.filteredPosts()[0] ??
      this.posts().find((post) => post.id === this.selectedPostId()) ??
      this.posts()[0]
  );

  protected readonly pendingCount = computed(
    () => this.posts().filter((post) => post.status === 'Pending').length
  );
  protected readonly imagePendingCount = computed(
    () =>
      this.posts().filter(
        (post) =>
          post.status === 'Pending' &&
          (post.contentType === 'Image' || post.contentType === 'Text + Image')
      ).length
  );
  protected readonly waitingLongCount = computed(
    () => this.posts().filter((post) => post.status === 'Pending' && post.submittedMinutesAgo > 1440).length
  );
  protected readonly queueLabel = computed(
    () => `${this.filteredPosts().length} posts awaiting review`
  );
  protected readonly skeletonRows = Array.from({ length: 4 });

  constructor() {
    this.loadQueue();
  }

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected setStatus(value: StatusFilter): void {
    this.selectedStatus.set(value);
  }

  protected setType(value: TypeFilter): void {
    this.selectedType.set(value);
  }

  protected setSort(value: SortFilter): void {
    this.selectedSort.set(value);
  }

  protected selectPost(postId: string): void {
    this.selectedPostId.set(postId);
    this.feedback.set(null);
  }

  protected resetFilters(): void {
    this.query.set('');
    this.selectedStatus.set('Pending');
    this.selectedType.set('All content');
    this.selectedSort.set('Newest first');
  }

  protected setQueueState(state: QueueState): void {
    this.queueState.set(state);
    if (state === 'default') {
      this.loadQueue();
    }
  }

  protected moderateSelected(action: ModerationAction): void {
    const selected = this.selectedPost();
    if (!selected || selected.status !== 'Pending') {
      return;
    }

    if (selected.id === 'POST-1005' && action === 'approve') {
      this.feedback.set({
        tone: 'error',
        message: 'Approval could not be completed. Reopen the preview and review this long-waiting post once more.'
      });
      return;
    }

    const request =
      action === 'approve'
        ? this.feedService.approvePost(selected.id)
        : this.feedService.rejectPost(selected.id);

    request.subscribe({
      next: () => {
        this.feedback.set({
          tone: 'success',
          message:
            action === 'approve'
              ? `${selected.memberName}'s post was approved for the feed.`
              : `${selected.memberName}'s post was rejected and removed from the queue.`
        });
        this.loadQueue();
      },
      error: () =>
        this.feedback.set({
          tone: 'error',
          message: 'Moderation action failed. Please retry.'
        })
    });
  }

  protected statusClass(status: ModerationStatus): string {
    if (status === 'Approved') {
      return 'bg-[rgba(25,135,84,0.1)] text-[var(--ncm-success)]';
    }
    if (status === 'Rejected') {
      return 'bg-[rgba(194,65,59,0.1)] text-[var(--ncm-danger)]';
    }
    return 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
  }

  protected flagClass(flag: string): string {
    if (flag === 'Image review' || flag === 'Needs closer look') {
      return 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
    }
    return 'bg-[var(--ncm-primary-soft)] text-[var(--ncm-primary-strong)]';
  }

  protected priorityClass(priority: PriorityTone): string {
    if (priority === 'priority') {
      return 'border-[rgba(183,121,31,0.16)] bg-[linear-gradient(180deg,#ffffff_0%,#fffbf6_100%)]';
    }

    return 'border-[color:var(--ncm-border)] hover:border-[rgba(36,122,82,0.18)]';
  }

  private loadQueue(): void {
    this.queueState.set('loading');
    this.feedService.getModerationQueue().subscribe({
      next: (posts) => {
        const mapped = posts.map((post, index) => ({
          id: post.id,
          memberId: post.authorMember?.id ?? post.id,
          memberName: post.authorMember?.fullName ?? 'Staff post',
          memberGoal: post.center.name,
          submittedAt: new Date(post.createdAt).toLocaleString('en-IN'),
          submittedMinutesAgo: Math.max(
            0,
            Math.floor((Date.now() - new Date(post.createdAt).getTime()) / 60000)
          ),
          contentType: 'Text',
          status: post.status === 'APPROVED' ? 'Approved' : post.status === 'REJECTED' ? 'Rejected' : 'Pending',
          textPreview: post.content,
          fullText: post.content,
          priority: index < 2 ? 'priority' : 'standard',
          flags: ['Pending approval'],
          reviewReason: `Submitted in ${post.center.name}`
        } satisfies ModerationPost));

        this.posts.set(mapped);
        this.selectedPostId.set(mapped[0]?.id ?? '');
        this.queueState.set('default');
      },
      error: () => this.queueState.set('error')
    });
  }
}

function priorityWeight(priority: PriorityTone): number {
  return priority === 'priority' ? 2 : 1;
}
