import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type IconName =
  | 'dashboard'
  | 'members'
  | 'evaluations'
  | 'feed'
  | 'approvals'
  | 'chat'
  | 'search'
  | 'bell'
  | 'chevron-left'
  | 'phone'
  | 'menu'
  | 'spark'
  | 'trend'
  | 'calendar'
  | 'target'
  | 'close'
  | 'logout';

@Component({
  selector: 'ncm-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="icon().viewBox"
      fill="none"
      [style.width.rem]="size() / 16"
      [style.height.rem]="size() / 16"
      aria-hidden="true"
      class="shrink-0"
    >
      @for (path of icon().paths; track path.d) {
        <path
          [attr.d]="path.d"
          [attr.fill]="path.fill ?? 'none'"
          [attr.stroke]="path.stroke ?? 'currentColor'"
          [attr.stroke-linecap]="path.linecap ?? 'round'"
          [attr.stroke-linejoin]="path.linejoin ?? 'round'"
          [attr.stroke-width]="path.width ?? 1.8"
        />
      }
    </svg>
  `
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(18);

  protected readonly icon = computed(() => ICONS[this.name()]);
}

const ICONS: Record<
  IconName,
  {
    viewBox: string;
    paths: Array<{
      d: string;
      fill?: string;
      stroke?: string;
      width?: number;
      linecap?: 'round' | 'square' | 'butt';
      linejoin?: 'round' | 'bevel' | 'miter';
    }>;
  }
> = {
  dashboard: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M4 5.5C4 4.672 4.672 4 5.5 4h4C10.328 4 11 4.672 11 5.5v4c0 .828-.672 1.5-1.5 1.5h-4C4.672 11 4 10.328 4 9.5v-4Z' },
      { d: 'M13 5.5c0-.828.672-1.5 1.5-1.5h4c.828 0 1.5.672 1.5 1.5v7c0 .828-.672 1.5-1.5 1.5h-4c-.828 0-1.5-.672-1.5-1.5v-7Z' },
      { d: 'M4 14.5c0-.828.672-1.5 1.5-1.5h4c.828 0 1.5.672 1.5 1.5v5c0 .828-.672 1.5-1.5 1.5h-4C4.672 21 4 20.328 4 19.5v-5Z' },
      { d: 'M13 17.5c0-.828.672-1.5 1.5-1.5h4c.828 0 1.5.672 1.5 1.5v2c0 .828-.672 1.5-1.5 1.5h-4c-.828 0-1.5-.672-1.5-1.5v-2Z' }
    ]
  },
  members: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M15.5 19.5a4.5 4.5 0 0 0-9 0' },
      { d: 'M11 13a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z' },
      { d: 'M17.5 8a2.5 2.5 0 1 1 0 5' },
      { d: 'M19.5 19.5a3.5 3.5 0 0 0-2.75-3.42' }
    ]
  },
  evaluations: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M7 4.5h10' },
      { d: 'M8 3h8a1 1 0 0 1 1 1v16l-5-2-5 2V4a1 1 0 0 1 1-1Z' },
      { d: 'M10 9h4' },
      { d: 'M10 12h4' }
    ]
  },
  feed: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M6.5 7A2.5 2.5 0 1 0 6.5 2a2.5 2.5 0 0 0 0 5Z' },
      { d: 'M17.5 13A2.5 2.5 0 1 0 17.5 8a2.5 2.5 0 0 0 0 5Z' },
      { d: 'M6.5 22a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z' },
      { d: 'M8.7 6.2l6.6 2.6' },
      { d: 'M8.7 17.8l6.6-2.6' }
    ]
  },
  approvals: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M6 7.5 12 4l6 3.5v9L12 20l-6-3.5v-9Z' },
      { d: 'm9.25 12 1.75 1.75L14.75 10' }
    ]
  },
  chat: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M6 18.5 3.5 20V6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 17H8l-2 1.5Z' },
      { d: 'M8 9h8' },
      { d: 'M8 12.5h5' }
    ]
  },
  search: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z' },
      { d: 'm20 20-3.5-3.5' }
    ]
  },
  bell: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M6 16.5h12' },
      { d: 'M8 16.5v-4a4 4 0 1 1 8 0v4' },
      { d: 'M10 19a2 2 0 0 0 4 0' }
    ]
  },
  phone: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M7.8 4.5h1.7c.38 0 .72.26.82.62l.76 2.77a.94.94 0 0 1-.27.95l-1.36 1.22a13.72 13.72 0 0 0 4.44 4.44l1.22-1.36a.94.94 0 0 1 .95-.27l2.77.76c.36.1.62.44.62.82v1.7a1.3 1.3 0 0 1-1.3 1.3h-.9C10.12 19.25 4.75 13.88 4.75 7.1v-.9a1.3 1.3 0 0 1 1.3-1.3Z'
      }
    ]
  },
  'chevron-left': {
    viewBox: '0 0 24 24',
    paths: [{ d: 'm14.5 6-6 6 6 6' }]
  },
  menu: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'M4 7h16' }, { d: 'M4 12h16' }, { d: 'M4 17h16' }]
  },
  spark: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'm12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z' },
      { d: 'm19 3 .7 1.8L21.5 5.5l-1.8.7L19 8l-.7-1.8-1.8-.7 1.8-.7L19 3Z', width: 1.5 },
      { d: 'm5 15 .7 1.8L7.5 17.5l-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7L5 15Z', width: 1.5 }
    ]
  },
  trend: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M4 16.5 9.2 11l3.2 3.2 6.1-6.7' },
      { d: 'M15.5 7.5H18.5V10.5' }
    ]
  },
  calendar: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M7 3.5v3' },
      { d: 'M17 3.5v3' },
      { d: 'M4.5 8.5h15' },
      { d: 'M6.5 5h11A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-11A1.5 1.5 0 0 1 6.5 5Z' }
    ]
  },
  target: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z' },
      { d: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
      { d: 'M12 12h.01', width: 3 }
    ]
  },
  close: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'm7 7 10 10' }, { d: 'm17 7-10 10' }]
  },
  logout: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M10 5H7.5A1.5 1.5 0 0 0 6 6.5v11A1.5 1.5 0 0 0 7.5 19H10' },
      { d: 'M14.5 8.5 18 12l-3.5 3.5' },
      { d: 'M11 12h7' }
    ]
  }
};
