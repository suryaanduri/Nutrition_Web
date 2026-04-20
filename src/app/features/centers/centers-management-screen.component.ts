import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  output,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';

type CenterStatus = 'Active' | 'Inactive';
type CenterFilter = 'All status' | CenterStatus;
type CenterSort = 'Recently created' | 'Center name' | 'City';
type CenterScreenMode = 'list' | 'detail' | 'create';
type CenterFormMode = 'create' | 'edit';
type AdminStatus = 'Active' | 'Invite pending';

interface CenterMemberPreview {
  id: string;
  name: string;
  status: 'Active' | 'Needs attention' | 'Inactive';
  goal: string;
  lastVisitLabel: string;
}

interface CenterActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
}

interface CenterRecord {
  id: string;
  centerName: string;
  centerCode: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  status: CenterStatus;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminRole: string;
  adminStatus: AdminStatus;
  inviteMethod: string;
  createdDate: string;
  createdStamp: string;
  totalMembers: number;
  activeMembers: number;
  needsAttentionMembers: number;
  inactiveMembers: number;
  totalEvaluations: number;
  recentMembers: CenterMemberPreview[];
  recentActivity: CenterActivityItem[];
}

@Component({
  selector: 'app-centers-management-screen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './centers-management-screen.component.html',
  styleUrl: './centers-management-screen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CentersManagementScreenComponent {
  private readonly formBuilder = new FormBuilder();

  readonly navigateMembers = output<void>();
  readonly navigateMembersForAdd = output<void>();
  readonly navigateEvaluations = output<void>();
  readonly addEvaluation = output<void>();

  protected readonly statusOptions: CenterFilter[] = ['All status', 'Active', 'Inactive'];
  protected readonly sortOptions: CenterSort[] = ['Recently created', 'Center name', 'City'];
  protected readonly screenMode = signal<CenterScreenMode>('list');
  protected readonly formMode = signal<CenterFormMode>('create');
  protected readonly query = signal('');
  protected readonly selectedStatus = signal<CenterFilter>('All status');
  protected readonly selectedSort = signal<CenterSort>('Recently created');
  protected readonly saveFeedback = signal('');
  protected readonly editingCenterId = signal<string | null>(null);
  protected readonly selectedCenterId = signal<string | null>(null);

  protected readonly centers = signal<CenterRecord[]>([
    {
      id: 'CTR-24017',
      centerName: 'Nourish Jubilee Hills',
      centerCode: 'NJH',
      contactEmail: 'jubilee@ncmplatform.app',
      contactPhone: '+91 98765 34011',
      addressLine1: 'Road No. 36, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      status: 'Active',
      adminName: 'Rhea Kapoor',
      adminEmail: 'rhea.kapoor@ncmplatform.app',
      adminPhone: '+91 98765 34022',
      adminRole: 'Center Admin',
      adminStatus: 'Active',
      inviteMethod: 'Temporary password',
      createdDate: '18 Apr 2026',
      createdStamp: '2026-04-18',
      totalMembers: 248,
      activeMembers: 219,
      needsAttentionMembers: 18,
      inactiveMembers: 11,
      totalEvaluations: 712,
      recentMembers: [
        {
          id: 'MBR-1042',
          name: 'Rhea Sharma',
          status: 'Needs attention',
          goal: 'PCOS',
          lastVisitLabel: 'Today, 10:30 AM'
        },
        {
          id: 'MBR-0987',
          name: 'Arjun Menon',
          status: 'Active',
          goal: 'Metabolic Reset',
          lastVisitLabel: '2 days ago'
        },
        {
          id: 'MBR-0871',
          name: 'Sana Qureshi',
          status: 'Active',
          goal: 'Weight Loss',
          lastVisitLabel: 'Today, 8:45 AM'
        },
        {
          id: 'MBR-0612',
          name: 'Nadia Khan',
          status: 'Needs attention',
          goal: 'Weight Loss',
          lastVisitLabel: '13 days ago'
        }
      ],
      recentActivity: [
        {
          id: 'ACT-1',
          title: 'New member added',
          detail: 'Sana Qureshi was added to the center roster.',
          time: '18 min ago'
        },
        {
          id: 'ACT-2',
          title: 'Evaluation recorded',
          detail: 'Progress evaluation logged for Arjun Menon.',
          time: '1 hr ago'
        },
        {
          id: 'ACT-3',
          title: 'Status updated',
          detail: 'Nadia Khan marked as needs attention for follow-up.',
          time: 'Today'
        }
      ]
    },
    {
      id: 'CTR-24011',
      centerName: 'Wellness Center Indiranagar',
      centerCode: 'WCI',
      contactEmail: 'indiranagar@ncmplatform.app',
      contactPhone: '+91 98111 22041',
      addressLine1: '100 Feet Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      status: 'Active',
      adminName: 'Arjun Menon',
      adminEmail: 'arjun.menon@ncmplatform.app',
      adminPhone: '+91 98111 22055',
      adminRole: 'Center Admin',
      adminStatus: 'Invite pending',
      inviteMethod: 'Invite setup later',
      createdDate: '10 Apr 2026',
      createdStamp: '2026-04-10',
      totalMembers: 186,
      activeMembers: 162,
      needsAttentionMembers: 15,
      inactiveMembers: 9,
      totalEvaluations: 524,
      recentMembers: [
        {
          id: 'MBR-1124',
          name: 'Mira Dsouza',
          status: 'Active',
          goal: 'Weight Loss',
          lastVisitLabel: 'Yesterday'
        },
        {
          id: 'MBR-1109',
          name: 'Vikram Rao',
          status: 'Active',
          goal: 'Metabolic Reset',
          lastVisitLabel: '3 days ago'
        },
        {
          id: 'MBR-1088',
          name: 'Tara Jain',
          status: 'Needs attention',
          goal: 'PCOS',
          lastVisitLabel: '5 days ago'
        }
      ],
      recentActivity: [
        {
          id: 'ACT-4',
          title: 'Evaluation recorded',
          detail: 'Baseline evaluation added for Vikram Rao.',
          time: '42 min ago'
        },
        {
          id: 'ACT-5',
          title: 'New member added',
          detail: 'Mira Dsouza joined the center roster.',
          time: 'Today'
        }
      ]
    },
    {
      id: 'CTR-23984',
      centerName: 'NCM Anna Nagar',
      centerCode: 'ANA',
      contactEmail: 'annanagar@ncmplatform.app',
      contactPhone: '+91 99550 18008',
      addressLine1: '2nd Avenue, Anna Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600040',
      status: 'Inactive',
      adminName: 'Sana Qureshi',
      adminEmail: 'sana.qureshi@ncmplatform.app',
      adminPhone: '+91 99550 18021',
      adminRole: 'Center Admin',
      adminStatus: 'Active',
      inviteMethod: 'Temporary password',
      createdDate: '27 Mar 2026',
      createdStamp: '2026-03-27',
      totalMembers: 94,
      activeMembers: 66,
      needsAttentionMembers: 12,
      inactiveMembers: 16,
      totalEvaluations: 241,
      recentMembers: [
        {
          id: 'MBR-0912',
          name: 'Leena Roy',
          status: 'Inactive',
          goal: 'Weight Gain',
          lastVisitLabel: '15 days ago'
        },
        {
          id: 'MBR-0886',
          name: 'Nikhil Bose',
          status: 'Needs attention',
          goal: 'Metabolic Reset',
          lastVisitLabel: '7 days ago'
        }
      ],
      recentActivity: [
        {
          id: 'ACT-6',
          title: 'Status updated',
          detail: 'Center moved to inactive operating state.',
          time: '3 days ago'
        }
      ]
    },
    {
      id: 'CTR-23960',
      centerName: 'Nourish Pune West',
      centerCode: 'NPW',
      contactEmail: 'punewest@ncmplatform.app',
      contactPhone: '+91 97000 77130',
      addressLine1: 'Baner Road, Pune West',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      status: 'Active',
      adminName: 'Kavya Iyer',
      adminEmail: 'kavya.iyer@ncmplatform.app',
      adminPhone: '+91 97000 77141',
      adminRole: 'Center Admin',
      adminStatus: 'Active',
      inviteMethod: 'Temporary password',
      createdDate: '11 Mar 2026',
      createdStamp: '2026-03-11',
      totalMembers: 132,
      activeMembers: 118,
      needsAttentionMembers: 8,
      inactiveMembers: 6,
      totalEvaluations: 367,
      recentMembers: [
        {
          id: 'MBR-0821',
          name: 'Kavita More',
          status: 'Active',
          goal: 'Weight Loss',
          lastVisitLabel: 'Today'
        },
        {
          id: 'MBR-0794',
          name: 'Rohan Kulkarni',
          status: 'Active',
          goal: 'Weight Gain',
          lastVisitLabel: 'Yesterday'
        },
        {
          id: 'MBR-0782',
          name: 'Nisha Patil',
          status: 'Needs attention',
          goal: 'PCOS',
          lastVisitLabel: '4 days ago'
        }
      ],
      recentActivity: [
        {
          id: 'ACT-7',
          title: 'Evaluation recorded',
          detail: 'Body composition evaluation saved for Kavita More.',
          time: '25 min ago'
        },
        {
          id: 'ACT-8',
          title: 'New member added',
          detail: 'Rohan Kulkarni joined the center roster.',
          time: 'Today'
        }
      ]
    }
  ]);

  protected readonly onboardingForm = this.formBuilder.nonNullable.group({
    centerName: ['', [Validators.required, Validators.minLength(3)]],
    centerCode: [''],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{10,16}$/)]],
    addressLine1: ['', [Validators.required, Validators.minLength(6)]],
    addressLine2: [''],
    city: ['', [Validators.required, Validators.minLength(2)]],
    state: ['', [Validators.required, Validators.minLength(2)]],
    pincode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 -]{4,10}$/)]],
    status: ['Active', Validators.required],
    adminName: ['', [Validators.required, Validators.minLength(3)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{10,16}$/)]],
    role: ['Center Admin', Validators.required],
    inviteMethod: ['Temporary password', Validators.required],
    temporaryPassword: ['']
  });

  protected readonly filteredCenters = computed(() => {
    const query = this.query().trim().toLowerCase();
    const selectedStatus = this.selectedStatus();
    const selectedSort = this.selectedSort();

    let records = this.centers().filter((center) => {
      const matchesQuery =
        !query ||
        center.centerName.toLowerCase().includes(query) ||
        center.city.toLowerCase().includes(query) ||
        center.adminName.toLowerCase().includes(query) ||
        center.adminEmail.toLowerCase().includes(query) ||
        center.contactPhone.includes(query);
      const matchesStatus = selectedStatus === 'All status' || center.status === selectedStatus;
      return matchesQuery && matchesStatus;
    });

    records = [...records].sort((a, b) => {
      if (selectedSort === 'Center name') {
        return a.centerName.localeCompare(b.centerName);
      }

      if (selectedSort === 'City') {
        return a.city.localeCompare(b.city) || a.centerName.localeCompare(b.centerName);
      }

      return b.createdStamp.localeCompare(a.createdStamp);
    });

    return records;
  });

  protected readonly currentCenter = computed(
    () => this.centers().find((record) => record.id === this.selectedCenterId()) ?? null
  );
  protected readonly pageTitle = computed(() => {
    const center = this.currentCenter();
    if (this.screenMode() === 'detail' && center) {
      return center.centerName;
    }

    return this.screenMode() === 'create' ? 'Create Nutritional Center' : 'Nutritional Centers';
  });
  protected readonly pageDescription = computed(() => {
    const center = this.currentCenter();
    if (this.screenMode() === 'detail' && center) {
      return `${center.city}, ${center.state}`;
    }

    return this.screenMode() === 'create'
      ? 'Onboard center and assign admin in one flow'
      : 'Manage active centers, search records, and onboard new locations.';
  });
  protected readonly resultsLabel = computed(
    () => `${this.filteredCenters().length} center records`
  );
  protected readonly formTitle = computed(() =>
    this.formMode() === 'edit' ? 'Edit Nutritional Center' : 'Create Nutritional Center'
  );
  protected readonly formSubmitLabel = computed(() =>
    this.formMode() === 'edit' ? 'Save Changes' : 'Create Center'
  );
  protected readonly showTemporaryPassword = computed(
    () => this.onboardingForm.controls.inviteMethod.value === 'Temporary password'
  );
  protected readonly detailSummaryCards = computed(() => {
    const center = this.currentCenter();
    if (!center) {
      return [];
    }

    return [
      {
        label: 'Total Members',
        value: center.totalMembers,
        hint: 'Center roster',
        icon: 'members' as const,
        change: `${center.activeMembers} active`,
        trend: 'steady' as const
      },
      {
        label: 'Active Members',
        value: center.activeMembers,
        hint: 'Currently engaged',
        icon: 'target' as const,
        change: `${Math.round((center.activeMembers / center.totalMembers) * 100)}% of total`,
        trend: 'up' as const
      },
      {
        label: 'Needs Attention',
        value: center.needsAttentionMembers,
        hint: 'Requires follow-up',
        icon: 'trend' as const,
        change: 'Action queue',
        trend: center.needsAttentionMembers > 10 ? ('down' as const) : ('steady' as const)
      },
      {
        label: 'Total Evaluations',
        value: center.totalEvaluations,
        hint: 'Recorded assessments',
        icon: 'evaluations' as const,
        change: 'Operational volume',
        trend: 'up' as const
      }
    ];
  });

  constructor() {
    effect(() => {
      const passwordControl = this.onboardingForm.controls.temporaryPassword;

      if (this.showTemporaryPassword()) {
        passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
      } else {
        passwordControl.setValue('');
        passwordControl.setValidators([]);
      }

      passwordControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected openDetail(centerId: string): void {
    this.selectedCenterId.set(centerId);
    this.screenMode.set('detail');
  }

  protected openCreateFlow(): void {
    this.formMode.set('create');
    this.editingCenterId.set(null);
    this.screenMode.set('create');
    this.onboardingForm.reset({
      centerName: '',
      centerCode: '',
      contactEmail: '',
      contactPhone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      status: 'Active',
      adminName: '',
      adminEmail: '',
      adminPhone: '',
      role: 'Center Admin',
      inviteMethod: 'Temporary password',
      temporaryPassword: ''
    });
    this.onboardingForm.markAsPristine();
    this.onboardingForm.markAsUntouched();
  }

  protected openEditFlow(centerId: string): void {
    const center = this.centers().find((record) => record.id === centerId);
    if (!center) {
      return;
    }

    this.formMode.set('edit');
    this.editingCenterId.set(centerId);
    this.selectedCenterId.set(centerId);
    this.screenMode.set('create');
    this.onboardingForm.reset({
      centerName: center.centerName,
      centerCode: center.centerCode,
      contactEmail: center.contactEmail,
      contactPhone: center.contactPhone,
      addressLine1: center.addressLine1,
      addressLine2: center.addressLine2 ?? '',
      city: center.city,
      state: center.state,
      pincode: center.pincode,
      status: center.status,
      adminName: center.adminName,
      adminEmail: center.adminEmail,
      adminPhone: center.adminPhone,
      role: center.adminRole,
      inviteMethod: center.inviteMethod,
      temporaryPassword: ''
    });
    this.onboardingForm.markAsPristine();
    this.onboardingForm.markAsUntouched();
  }

  protected closeCenterView(): void {
    this.screenMode.set('list');
    this.selectedCenterId.set(null);
  }

  protected closeCreateFlow(): void {
    if (this.formMode() === 'edit' && this.selectedCenterId()) {
      this.screenMode.set('detail');
      return;
    }

    this.screenMode.set('list');
    this.formMode.set('create');
    this.editingCenterId.set(null);
    this.selectedCenterId.set(null);
  }

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected setStatus(value: string): void {
    this.selectedStatus.set(value as CenterFilter);
  }

  protected setSort(value: string): void {
    this.selectedSort.set(value as CenterSort);
  }

  protected resetFilters(): void {
    this.query.set('');
    this.selectedStatus.set('All status');
    this.selectedSort.set('Recently created');
  }

  protected submit(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    const raw = this.onboardingForm.getRawValue();
    const editingId = this.editingCenterId();
    const existingCenter = editingId
      ? this.centers().find((record) => record.id === editingId) ?? null
      : null;

    const today = new Date();
    const createdStamp = existingCenter?.createdStamp ?? today.toISOString().slice(0, 10);
    const createdDate =
      existingCenter?.createdDate ??
      today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

    const center: CenterRecord = {
      id: existingCenter?.id ?? `CTR-${Math.floor(10000 + Math.random() * 89999)}`,
      centerName: raw.centerName.trim(),
      centerCode: raw.centerCode.trim().toUpperCase(),
      contactEmail: raw.contactEmail.trim(),
      contactPhone: raw.contactPhone.trim(),
      addressLine1: raw.addressLine1.trim(),
      addressLine2: raw.addressLine2.trim(),
      city: raw.city.trim(),
      state: raw.state.trim(),
      pincode: raw.pincode.trim(),
      status: raw.status as CenterStatus,
      adminName: raw.adminName.trim(),
      adminEmail: raw.adminEmail.trim(),
      adminPhone: raw.adminPhone.trim(),
      adminRole: raw.role,
      adminStatus: existingCenter?.adminStatus ?? 'Active',
      inviteMethod: raw.inviteMethod,
      createdDate,
      createdStamp,
      totalMembers: existingCenter?.totalMembers ?? 0,
      activeMembers: existingCenter?.activeMembers ?? 0,
      needsAttentionMembers: existingCenter?.needsAttentionMembers ?? 0,
      inactiveMembers: existingCenter?.inactiveMembers ?? 0,
      totalEvaluations: existingCenter?.totalEvaluations ?? 0,
      recentMembers: existingCenter?.recentMembers ?? [],
      recentActivity: existingCenter?.recentActivity ?? []
    };

    if (existingCenter) {
      this.centers.update((records) =>
        records.map((record) => (record.id === existingCenter.id ? center : record))
      );
      this.saveFeedback.set(`${center.centerName} updated successfully.`);
      this.selectedCenterId.set(center.id);
      this.screenMode.set('detail');
    } else {
      this.centers.update((records) => [center, ...records]);
      this.saveFeedback.set(
        `${center.centerName} created with ${center.adminName} as Center Admin.`
      );
      this.screenMode.set('list');
    }

    window.setTimeout(() => this.saveFeedback.set(''), 2600);

    this.formMode.set('create');
    this.editingCenterId.set(null);
  }

  protected openDetailMembers(): void {
    this.navigateMembers.emit();
  }

  protected requestAddMember(): void {
    this.navigateMembersForAdd.emit();
  }

  protected openDetailEvaluations(): void {
    this.navigateEvaluations.emit();
  }

  protected requestAddEvaluation(): void {
    this.addEvaluation.emit();
  }

  protected fieldHasError(controlName: keyof typeof this.onboardingForm.controls): boolean {
    const control = this.onboardingForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected statusClass(status: CenterStatus): string {
    return status === 'Active'
      ? 'bg-[var(--ncm-primary-soft)] text-[var(--ncm-primary-strong)]'
      : 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
  }

  protected memberStatusClass(status: CenterMemberPreview['status']): string {
    if (status === 'Active') {
      return 'bg-[rgba(25,135,84,0.1)] text-[var(--ncm-success)]';
    }

    if (status === 'Needs attention') {
      return 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
    }

    return 'bg-[var(--ncm-surface-soft)] text-[var(--ncm-text-muted)]';
  }

  protected adminStatusClass(status: AdminStatus): string {
    return status === 'Active'
      ? 'bg-[rgba(25,135,84,0.1)] text-[var(--ncm-success)]'
      : 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
  }
}
