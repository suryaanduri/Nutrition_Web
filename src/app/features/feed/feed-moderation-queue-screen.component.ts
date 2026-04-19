import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';

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
  protected readonly statusOptions: StatusFilter[] = ['Pending', 'Approved', 'Rejected'];
  protected readonly typeOptions: TypeFilter[] = ['All content', 'Text', 'Image', 'Text + Image'];
  protected readonly sortOptions: SortFilter[] = ['Newest first', 'Oldest first', 'Priority'];

  protected readonly posts = signal<ModerationPost[]>([
    {
      id: 'POST-1009',
      memberId: 'MBR-1042',
      memberName: 'Rhea Sharma',
      memberGoal: 'PCOS-focused fat loss',
      submittedAt: 'Today · 9:18 AM',
      submittedMinutesAgo: 58,
      contentType: 'Text + Image',
      status: 'Pending',
      textPreview: 'Morning meal prep is finally feeling sustainable. Sharing my breakfast and hydration check-in for accountability.',
      fullText:
        'Morning meal prep is finally feeling sustainable. Sharing my breakfast and hydration check-in for accountability. I stayed within plan yesterday and hit my water target for the first time this week.',
      imageLabel: 'Breakfast bowl and hydration tracker',
      imageTone: 'from-emerald-100 via-lime-50 to-white',
      priority: 'priority',
      flags: ['Pending approval', 'Member submission'],
      reviewReason: 'Strong community post, but image and caption should be reviewed together before publishing.'
    },
    {
      id: 'POST-1008',
      memberId: 'MBR-0871',
      memberName: 'Sana Qureshi',
      memberGoal: 'Wedding cut support',
      submittedAt: 'Today · 8:42 AM',
      submittedMinutesAgo: 94,
      contentType: 'Text',
      status: 'Pending',
      textPreview: 'Week 6 reflection: energy is better, cravings are lower, and the community check-ins kept me consistent.',
      fullText:
        'Week 6 reflection: energy is better, cravings are lower, and the community check-ins kept me consistent. This is the first week I felt genuinely steady instead of forcing the routine.',
      priority: 'standard',
      flags: ['Pending approval'],
      reviewReason: 'Text-only reflection with low moderation risk and clear community value.'
    },
    {
      id: 'POST-1007',
      memberId: 'MBR-0612',
      memberName: 'Nadia Khan',
      memberGoal: 'Postpartum recomposition',
      submittedAt: 'Yesterday · 7:10 PM',
      submittedMinutesAgo: 980,
      contentType: 'Image',
      status: 'Pending',
      textPreview: 'Shared a progress snapshot from the evening walk and meal routine.',
      fullText:
        'Shared a progress snapshot from the evening walk and meal routine. The caption is short, but the image needs the main review attention.',
      imageLabel: 'Evening walk progress photo',
      imageTone: 'from-stone-100 via-orange-50 to-white',
      priority: 'priority',
      flags: ['Pending approval', 'Image review'],
      reviewReason: 'Image-only submission needs a quick check for appropriateness and community tone.'
    },
    {
      id: 'POST-1006',
      memberId: 'MBR-0987',
      memberName: 'Arjun Menon',
      memberGoal: 'Metabolic reset',
      submittedAt: 'Yesterday · 4:35 PM',
      submittedMinutesAgo: 1135,
      contentType: 'Text + Image',
      status: 'Pending',
      textPreview: 'Posting my grocery haul after coach feedback. It feels easier to plan the week when the staples are visible.',
      fullText:
        'Posting my grocery haul after coach feedback. It feels easier to plan the week when the staples are visible. Keeping this here so I stay committed through the weekend too.',
      imageLabel: 'Grocery haul layout on kitchen counter',
      imageTone: 'from-sky-100 via-cyan-50 to-white',
      priority: 'standard',
      flags: ['Pending approval', 'Member submission'],
      reviewReason: 'Encouraging community content with both image and caption context.'
    },
    {
      id: 'POST-1005',
      memberId: 'MBR-0439',
      memberName: 'Rahul Sethi',
      memberGoal: 'Prediabetes reversal',
      submittedAt: '2 days ago · 1:14 PM',
      submittedMinutesAgo: 2940,
      contentType: 'Text',
      status: 'Pending',
      textPreview: 'Quick note on staying steady through business travel and getting back to routine.',
      fullText:
        'Quick note on staying steady through business travel and getting back to routine. I wanted to share what helped me reset after three off-plan meals in a row.',
      priority: 'priority',
      flags: ['Pending approval', 'Needs closer look'],
      reviewReason: 'Helpful member reflection, but the queue should surface it because it has been waiting the longest.'
    }
  ]);

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

    const nextStatus: ModerationStatus = action === 'approve' ? 'Approved' : 'Rejected';
    this.posts.update((posts) =>
      posts.map((post) => (post.id === selected.id ? { ...post, status: nextStatus } : post))
    );

    this.feedback.set({
      tone: 'success',
      message:
        action === 'approve'
          ? `${selected.memberName}'s post was approved for the feed.`
          : `${selected.memberName}'s post was rejected and removed from the queue.`
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
}

function priorityWeight(priority: PriorityTone): number {
  return priority === 'priority' ? 2 : 1;
}
