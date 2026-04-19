export type EvaluationStatus = 'Pending review' | 'Completed' | 'Scheduled' | 'Overdue';
export type EvaluationType = 'Baseline' | 'Progress' | 'Body composition' | 'Follow-up';
export type PriorityTone = 'critical' | 'warning' | 'normal';
export type EvaluationEditorMode = 'add' | 'edit';
export type EvaluationEditorViewState = 'default' | 'loading' | 'error';

export interface EvaluationRecord {
  id: string;
  memberId: string;
  memberName: string;
  type: EvaluationType;
  status: EvaluationStatus;
  coach: 'Ava Nelson' | 'Mila Carter' | 'Rita Jones';
  scheduledLabel: string;
  timeLabel: string;
  relativeLabel: string;
  summary: string;
  nextAction: string;
  flags: string[];
  daysFromToday: number;
  priority: PriorityTone;
}

export interface EvaluationMemberContext {
  id: string;
  name: string;
  age: number;
  gender: string;
  heightCm: number;
  goal: string;
  program: string;
  status: string;
  coach: string;
  joinedOn: string;
  summary: string;
  tags: string[];
}

export interface EvaluationHistoryEntry {
  id: string;
  date: string;
  weight: string;
  bmi: string;
  bodyFat: string;
  visceralFat: string;
  note: string;
  enteredBy: string;
  trend: string;
  trendTone: 'up' | 'down' | 'neutral';
}

export interface EvaluationEditorPreset {
  mode: EvaluationEditorMode;
  viewState?: EvaluationEditorViewState;
  evaluationId: string | null;
  member: EvaluationMemberContext;
  recordedAtLabel: string;
  weightKg: number | null;
  trunkSubcutaneousFatPercent: number | null;
  bodyFatPercent: number | null;
  visceralFat: number | null;
  skeletalMuscleKg: number | null;
  bmrKcal: number | null;
  bodyAgeYears: number | null;
  history: EvaluationHistoryEntry[];
}

export const EVALUATION_RECORDS: EvaluationRecord[] = [
  {
    id: 'EVAL-2408',
    memberId: 'MBR-1042',
    memberName: 'Rhea Sharma',
    type: 'Progress',
    status: 'Pending review',
    coach: 'Ava Nelson',
    scheduledLabel: 'Today',
    timeLabel: '10:30 AM',
    relativeLabel: 'Captured 38 min ago',
    summary: 'Weight and body-fat moved in the right direction, but sleep and hydration dipped this week.',
    nextAction: 'Review notes and confirm the next 7-day adjustment before noon.',
    flags: ['Today', 'Needs coach review'],
    daysFromToday: 0,
    priority: 'critical'
  },
  {
    id: 'EVAL-2397',
    memberId: 'MBR-0612',
    memberName: 'Nadia Khan',
    type: 'Follow-up',
    status: 'Overdue',
    coach: 'Mila Carter',
    scheduledLabel: '14 Apr 2026',
    timeLabel: '4:00 PM',
    relativeLabel: 'Missed 2 days ago',
    summary: 'Postpartum recomposition review was not completed and follow-up momentum is softening.',
    nextAction: 'Reschedule immediately and notify the assigned coach before the evening block.',
    flags: ['Overdue', 'Priority member'],
    daysFromToday: -2,
    priority: 'critical'
  },
  {
    id: 'EVAL-2411',
    memberId: 'MBR-0987',
    memberName: 'Arjun Menon',
    type: 'Body composition',
    status: 'Scheduled',
    coach: 'Ava Nelson',
    scheduledLabel: 'Today',
    timeLabel: '1:00 PM',
    relativeLabel: 'Starts in 1h 20m',
    summary: 'Metabolic reset checkpoint with composition scan and adherence review.',
    nextAction: 'Prepare the comparison snapshot before the consultation starts.',
    flags: ['Today'],
    daysFromToday: 0,
    priority: 'warning'
  },
  {
    id: 'EVAL-2388',
    memberId: 'MBR-0871',
    memberName: 'Sana Qureshi',
    type: 'Progress',
    status: 'Completed',
    coach: 'Rita Jones',
    scheduledLabel: '15 Apr 2026',
    timeLabel: '8:45 AM',
    relativeLabel: 'Completed yesterday',
    summary: 'Wedding cut plan remains on track with strong adherence and improved energy.',
    nextAction: 'No escalation needed. Keep the current pace and schedule the next weekly review.',
    flags: ['Stable'],
    daysFromToday: -1,
    priority: 'normal'
  },
  {
    id: 'EVAL-2379',
    memberId: 'MBR-0773',
    memberName: 'Kavya Iyer',
    type: 'Baseline',
    status: 'Scheduled',
    coach: 'Rita Jones',
    scheduledLabel: '18 Apr 2026',
    timeLabel: '11:15 AM',
    relativeLabel: 'Scheduled in 2 days',
    summary: 'Initial strength-gain baseline assessment with body composition and goal capture.',
    nextAction: 'Confirm intake readiness and make sure onboarding notes are complete.',
    flags: ['New member'],
    daysFromToday: 2,
    priority: 'normal'
  },
  {
    id: 'EVAL-2365',
    memberId: 'MBR-0439',
    memberName: 'Rahul Sethi',
    type: 'Follow-up',
    status: 'Pending review',
    coach: 'Mila Carter',
    scheduledLabel: '13 Apr 2026',
    timeLabel: '6:15 PM',
    relativeLabel: 'Awaiting sign-off for 3 days',
    summary: 'Prediabetes reversal follow-up was entered, but coach sign-off is still pending.',
    nextAction: 'Close the review so medication-support notes can be finalized.',
    flags: ['Pending sign-off'],
    daysFromToday: -3,
    priority: 'warning'
  }
];

const MEMBER_CONTEXTS: Record<string, EvaluationMemberContext> = {
  'MBR-1042': {
    id: 'MBR-1042',
    name: 'Rhea Sharma',
    age: 29,
    gender: 'Female',
    heightCm: 164,
    goal: 'PCOS-focused fat loss',
    program: 'PCOS Reset Intensive',
    status: 'Needs attention',
    coach: 'Ava Nelson',
    joinedOn: 'Joined 12 Jan 2026',
    summary: 'Momentum is positive overall, but recent hydration and sleep consistency need tighter coaching.',
    tags: ['Needs attention', 'Missed follow-up', 'Progressing']
  },
  'MBR-0612': {
    id: 'MBR-0612',
    name: 'Nadia Khan',
    age: 33,
    gender: 'Female',
    heightCm: 160,
    goal: 'Postpartum recomposition',
    program: 'Restore & Reset',
    status: 'Needs attention',
    coach: 'Mila Carter',
    joinedOn: 'Joined 02 Feb 2026',
    summary: 'Follow-up cadence softened after a strong first phase and the missed review now needs quick recovery.',
    tags: ['Needs attention', 'Priority member']
  },
  'MBR-0987': {
    id: 'MBR-0987',
    name: 'Arjun Menon',
    age: 35,
    gender: 'Male',
    heightCm: 175,
    goal: 'Metabolic reset',
    program: 'Metabolic Recovery',
    status: 'Active',
    coach: 'Ava Nelson',
    joinedOn: 'Joined 20 Mar 2026',
    summary: 'Upcoming composition review should confirm whether adherence gains are translating into stable improvement.',
    tags: ['New member', 'On track']
  },
  'MBR-0773': {
    id: 'MBR-0773',
    name: 'Kavya Iyer',
    age: 26,
    gender: 'Female',
    heightCm: 167,
    goal: 'Strength gain',
    program: 'Strength Nutrition Start',
    status: 'New member',
    coach: 'Rita Jones',
    joinedOn: 'Joined 11 Apr 2026',
    summary: 'Baseline capture should establish the first complete body-composition reference point for this member.',
    tags: ['New member']
  }
};

const HISTORY_BY_MEMBER: Record<string, EvaluationHistoryEntry[]> = {
  'MBR-1042': [
    {
      id: 'HX-1042-1',
      date: '10 Apr 2026',
      weight: '68.4 kg',
      bmi: '25.4',
      bodyFat: '31.2%',
      visceralFat: '8.4',
      note: 'Sleep softened, but body composition continued improving.',
      enteredBy: 'Ava Nelson',
      trend: 'Improving',
      trendTone: 'up'
    },
    {
      id: 'HX-1042-2',
      date: '03 Apr 2026',
      weight: '69.1 kg',
      bmi: '25.7',
      bodyFat: '31.9%',
      visceralFat: '8.7',
      note: 'Weight plateau noted. Asked for higher protein breakfast and better weekend compliance.',
      enteredBy: 'Ava Nelson',
      trend: 'Plateau',
      trendTone: 'neutral'
    },
    {
      id: 'HX-1042-3',
      date: '27 Mar 2026',
      weight: '69.8 kg',
      bmi: '26.0',
      bodyFat: '32.6%',
      visceralFat: '9.0',
      note: 'First positive drop from previous cycle with stronger energy levels.',
      enteredBy: 'Coach Admin',
      trend: 'Strong start',
      trendTone: 'up'
    }
  ],
  'MBR-0612': [
    {
      id: 'HX-0612-1',
      date: '06 Apr 2026',
      weight: '72.6 kg',
      bmi: '28.4',
      bodyFat: '34.7%',
      visceralFat: '9.3',
      note: 'Appetite and sleep were both unstable. Needed closer postpartum support.',
      enteredBy: 'Mila Carter',
      trend: 'Needs reset',
      trendTone: 'down'
    },
    {
      id: 'HX-0612-2',
      date: '28 Mar 2026',
      weight: '73.1 kg',
      bmi: '28.6',
      bodyFat: '35.1%',
      visceralFat: '9.5',
      note: 'Slight progress, but consistency weakened after travel.',
      enteredBy: 'Mila Carter',
      trend: 'Slow progress',
      trendTone: 'neutral'
    }
  ],
  'MBR-0987': [
    {
      id: 'HX-0987-1',
      date: '09 Apr 2026',
      weight: '82.1 kg',
      bmi: '26.7',
      bodyFat: '24.8%',
      visceralFat: '8.2',
      note: 'Early metabolic markers are moving in a stable direction.',
      enteredBy: 'Ava Nelson',
      trend: 'Stable',
      trendTone: 'up'
    }
  ],
  'MBR-0773': []
};

const EDITOR_PRESETS: Record<string, EvaluationEditorPreset> = {
  'EVAL-2408': {
    mode: 'edit',
    evaluationId: 'EVAL-2408',
    member: MEMBER_CONTEXTS['MBR-1042'],
    recordedAtLabel: '19 Apr 2026',
    weightKg: 68.2,
    trunkSubcutaneousFatPercent: 16.1,
    bodyFatPercent: 31.0,
    visceralFat: 8.3,
    skeletalMuscleKg: 26.9,
    bmrKcal: 1390,
    bodyAgeYears: 30,
    history: HISTORY_BY_MEMBER['MBR-1042']
  },
  'EVAL-2397': {
    mode: 'edit',
    evaluationId: 'EVAL-2397',
    member: MEMBER_CONTEXTS['MBR-0612'],
    recordedAtLabel: '14 Apr 2026',
    weightKg: 72.6,
    trunkSubcutaneousFatPercent: 18.4,
    bodyFatPercent: 34.7,
    visceralFat: 9.3,
    skeletalMuscleKg: 24.1,
    bmrKcal: 1360,
    bodyAgeYears: 34,
    history: HISTORY_BY_MEMBER['MBR-0612']
  },
  'EVAL-2411': {
    mode: 'edit',
    evaluationId: 'EVAL-2411',
    member: MEMBER_CONTEXTS['MBR-0987'],
    recordedAtLabel: '19 Apr 2026',
    weightKg: 82.1,
    trunkSubcutaneousFatPercent: 14.8,
    bodyFatPercent: 24.8,
    visceralFat: 8.2,
    skeletalMuscleKg: 33.6,
    bmrKcal: 1690,
    bodyAgeYears: 32,
    history: HISTORY_BY_MEMBER['MBR-0987']
  }
};

function createAddPreset(memberId?: string | null): EvaluationEditorPreset {
  const member = MEMBER_CONTEXTS[memberId ?? 'MBR-0773'] ?? MEMBER_CONTEXTS['MBR-0773'];
  return {
    mode: 'add',
    evaluationId: null,
    member,
    recordedAtLabel: formatSystemDate(),
    weightKg: null,
    trunkSubcutaneousFatPercent: null,
    bodyFatPercent: null,
    visceralFat: null,
    skeletalMuscleKg: null,
    bmrKcal: null,
    bodyAgeYears: null,
    history: HISTORY_BY_MEMBER[member.id] ?? []
  };
}

export function getEvaluationEditorPreset(
  mode: EvaluationEditorMode,
  recordId?: string | null,
  memberId?: string | null
): EvaluationEditorPreset {
  if (mode === 'add') {
    return createAddPreset(memberId);
  }

  if (recordId && EDITOR_PRESETS[recordId]) {
    return EDITOR_PRESETS[recordId];
  }

  return EDITOR_PRESETS['EVAL-2408'];
}

function formatSystemDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}
