import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  output,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import {
  CenterResponse,
  CentersService,
  CreateCenterOnboardingRequest,
  UpdateCenterRequest
} from './centers.service';
import { UsersService } from '../users/users.service';

type CenterStatus = 'Active' | 'Inactive';
type CenterFilter = 'All status' | CenterStatus;
type CenterSort = 'Recently created' | 'Center name' | 'City';
type CenterScreenMode = 'list' | 'detail' | 'create';
type CenterFormMode = 'create' | 'edit-center' | 'edit-admin';
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
  adminUserId: string | null;
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
  private readonly centersService = inject(CentersService);
  private readonly usersService = inject(UsersService);

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
  protected readonly submitError = signal('');
  protected readonly isSaving = signal(false);
  protected readonly editingCenterId = signal<string | null>(null);
  protected readonly selectedCenterId = signal<string | null>(null);

  protected readonly centers = signal<CenterRecord[]>([]);

  protected readonly onboardingForm = this.formBuilder.nonNullable.group({
    centerName: ['', [Validators.required, Validators.minLength(3)]],
    centerCode: [''],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{10,20}$/)]],
    addressLine1: ['', [Validators.required, Validators.minLength(6)]],
    addressLine2: [''],
    city: ['', [Validators.required, Validators.minLength(2)]],
    state: ['', [Validators.required, Validators.minLength(2)]],
    pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    status: ['Active', Validators.required],
    adminName: ['', [Validators.required, Validators.minLength(3)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{10,20}$/)]],
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
      ? this.formMode() === 'edit-admin'
        ? 'Update center admin details'
        : this.formMode() === 'edit-center'
          ? 'Update center details'
          : 'Onboard center and assign admin in one flow'
      : 'Manage active centers, search records, and onboard new locations.';
  });
  protected readonly resultsLabel = computed(
    () => `${this.filteredCenters().length} center records`
  );
  protected readonly formTitle = computed(() =>
    this.formMode() === 'edit-admin'
      ? 'Edit Center Admin'
      : this.formMode() === 'edit-center'
        ? 'Edit Nutritional Center'
        : 'Create Nutritional Center'
  );
  protected readonly formSubmitLabel = computed(() =>
    this.formMode() === 'create' ? 'Create Center' : 'Save Changes'
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

    effect(() => {
      const centerControls = [
        this.onboardingForm.controls.centerName,
        this.onboardingForm.controls.centerCode,
        this.onboardingForm.controls.contactEmail,
        this.onboardingForm.controls.contactPhone,
        this.onboardingForm.controls.addressLine1,
        this.onboardingForm.controls.addressLine2,
        this.onboardingForm.controls.city,
        this.onboardingForm.controls.state,
        this.onboardingForm.controls.pincode,
        this.onboardingForm.controls.status
      ];
      const adminControls = [
        this.onboardingForm.controls.centerCode,
        this.onboardingForm.controls.adminName,
        this.onboardingForm.controls.adminEmail,
        this.onboardingForm.controls.adminPhone,
        this.onboardingForm.controls.role,
        this.onboardingForm.controls.inviteMethod,
        this.onboardingForm.controls.temporaryPassword
      ];

      if (this.formMode() === 'edit-center') {
        centerControls.forEach((control) => control.enable({ emitEvent: false }));
        adminControls.forEach((control) => control.disable({ emitEvent: false }));
      } else if (this.formMode() === 'edit-admin') {
        centerControls.forEach((control) => control.disable({ emitEvent: false }));
        adminControls.forEach((control) => control.enable({ emitEvent: false }));
        this.onboardingForm.controls.centerCode.disable({ emitEvent: false });
        this.onboardingForm.controls.role.disable({ emitEvent: false });
        this.onboardingForm.controls.inviteMethod.disable({ emitEvent: false });
        this.onboardingForm.controls.temporaryPassword.disable({ emitEvent: false });
      } else {
        centerControls.forEach((control) => control.enable({ emitEvent: false }));
        adminControls.forEach((control) => control.enable({ emitEvent: false }));
      }
    });

    this.loadCenters();
  }

  protected openDetail(centerId: string): void {
    this.selectedCenterId.set(centerId);
    this.screenMode.set('detail');
  }

  protected openCreateFlow(): void {
    this.submitError.set('');
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

  protected openEditCenterFlow(centerId: string): void {
    const center = this.centers().find((record) => record.id === centerId);
    if (!center) {
      return;
    }

    this.submitError.set('');
    this.formMode.set('edit-center');
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

  protected openEditAdminFlow(centerId: string): void {
    const center = this.centers().find((record) => record.id === centerId);
    if (!center) {
      return;
    }

    if (!center.adminUserId) {
      this.submitError.set('No center admin is assigned to this center yet.');
      return;
    }

    this.submitError.set('');
    this.formMode.set('edit-admin');
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
    this.submitError.set('');
    if (
      (this.formMode() === 'edit-center' || this.formMode() === 'edit-admin') &&
      this.selectedCenterId()
    ) {
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

    this.submitError.set('');
    this.isSaving.set(true);
    const raw = this.onboardingForm.getRawValue();
    const editingId = this.editingCenterId();
    if (editingId && this.formMode() === 'edit-center') {
      this.centersService
        .updateCenter(editingId, this.toUpdateCenterRequest(raw))
        .subscribe({
          next: (response) => {
            this.centers.update((records) =>
              records.map((record) =>
                record.id === response.id ? this.mapCenter(response) : record
              )
            );
            this.selectedCenterId.set(response.id);
            this.screenMode.set('detail');
            this.formMode.set('create');
            this.editingCenterId.set(null);
            this.saveFeedback.set(`${response.name} updated successfully.`);
            this.isSaving.set(false);
            window.setTimeout(() => this.saveFeedback.set(''), 2600);
          },
          error: (error: HttpErrorResponse) => {
            this.isSaving.set(false);
            this.submitError.set(this.errorMessageFrom(error, 'Unable to update center.'));
          }
        });
      return;
    }

    if (editingId && this.formMode() === 'edit-admin') {
      const center = this.centers().find((record) => record.id === editingId);
      if (!center?.adminUserId) {
        this.isSaving.set(false);
        this.submitError.set('No center admin is assigned to this center yet.');
        return;
      }

      this.usersService
        .updateUser(center.adminUserId, {
          fullName: raw.adminName.trim(),
          email: raw.adminEmail.trim().toLowerCase(),
          phone: digitsOnly(raw.adminPhone),
          role: 'CENTER_ADMIN',
          centerId: editingId,
          status: center.adminStatus === 'Active' ? 'ACTIVE' : 'INACTIVE'
        })
        .subscribe({
          next: (response: import('../users/users.service').UserResponse) => {
            this.centers.update((records) =>
              records.map((record) =>
                record.id === editingId
                  ? {
                      ...record,
                      adminName: response.fullName,
                      adminEmail: response.email,
                      adminPhone: response.phone ?? 'Not assigned'
                    }
                  : record
              )
            );
            this.selectedCenterId.set(editingId);
            this.screenMode.set('detail');
            this.formMode.set('create');
            this.editingCenterId.set(null);
            this.saveFeedback.set('Center admin updated successfully.');
            this.isSaving.set(false);
            window.setTimeout(() => this.saveFeedback.set(''), 2600);
          },
          error: (error: HttpErrorResponse) => {
            this.isSaving.set(false);
            this.submitError.set(this.errorMessageFrom(error, 'Unable to update center admin.'));
          }
        });
      return;
    }

    this.centersService.createCenter(this.toCreateCenterRequest(raw)).subscribe({
      next: (response) => {
        this.centers.update((records) => [this.mapCenter(response.center), ...records]);
        this.selectedCenterId.set(response.center.id);
        this.screenMode.set('detail');
        this.formMode.set('create');
        this.editingCenterId.set(null);
        this.saveFeedback.set(
          `${response.center.name} created with ${response.initialAdmin.fullName} as Center Admin.`
        );
        this.isSaving.set(false);
        window.setTimeout(() => this.saveFeedback.set(''), 2600);
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.submitError.set(this.errorMessageFrom(error, 'Unable to create center.'));
      }
    });
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

  private loadCenters(): void {
    this.centersService.listCenters().subscribe({
      next: (centers) => this.centers.set(centers.map((center) => this.mapCenter(center)))
    });
  }

  private errorMessageFrom(error: HttpErrorResponse, fallback: string): string {
    const message = error.error?.message;

    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return fallback;
  }

  private mapCenter(center: CenterResponse): CenterRecord {
    const admin = center.centerAdmins[0];

    return {
      id: center.id,
      centerName: center.name,
      centerCode: center.code,
      contactEmail: center.contactEmail,
      contactPhone: center.contactPhone,
      addressLine1: center.addressLine1,
      addressLine2: center.addressLine2 ?? undefined,
      city: center.city,
      state: center.state,
      pincode: center.pincode,
      status: center.status === 'ACTIVE' ? 'Active' : 'Inactive',
      adminName: admin?.fullName ?? 'Unassigned',
      adminEmail: admin?.email ?? 'Not assigned',
      adminPhone: admin?.phone ?? 'Not assigned',
      adminRole: 'Center Admin',
      adminStatus: admin ? 'Active' : 'Invite pending',
      inviteMethod: admin ? 'Temporary password' : 'Invite setup later',
      createdDate: new Date(center.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      createdStamp: center.createdAt.slice(0, 10),
      totalMembers: 0,
      activeMembers: 0,
      needsAttentionMembers: 0,
      inactiveMembers: 0,
      totalEvaluations: 0,
      recentMembers: [],
      recentActivity: [],
      adminUserId: admin?.id ?? null
    };
  }

  private toCreateCenterRequest(
    raw: ReturnType<typeof this.onboardingForm.getRawValue>
  ): CreateCenterOnboardingRequest {
    return {
      center: {
        name: raw.centerName.trim(),
        code: raw.centerCode.trim().toUpperCase(),
        contactEmail: raw.contactEmail.trim().toLowerCase(),
        contactPhone: digitsOnly(raw.contactPhone),
        addressLine1: raw.addressLine1.trim(),
        addressLine2: raw.addressLine2.trim() || undefined,
        city: raw.city.trim(),
        state: raw.state.trim(),
        pincode: digitsOnly(raw.pincode),
        status: raw.status === 'Active' ? 'ACTIVE' : 'INACTIVE'
      },
      admin: {
        fullName: raw.adminName.trim(),
        email: raw.adminEmail.trim().toLowerCase(),
        phone: digitsOnly(raw.adminPhone)
      }
    };
  }

  private toUpdateCenterRequest(
    raw: ReturnType<typeof this.onboardingForm.getRawValue>
  ): UpdateCenterRequest {
    return {
      name: raw.centerName.trim(),
      contactEmail: raw.contactEmail.trim().toLowerCase(),
      contactPhone: digitsOnly(raw.contactPhone),
      addressLine1: raw.addressLine1.trim(),
      addressLine2: raw.addressLine2.trim() || undefined,
      city: raw.city.trim(),
      state: raw.state.trim(),
      pincode: digitsOnly(raw.pincode),
      status: raw.status === 'Active' ? 'ACTIVE' : 'INACTIVE'
    };
  }
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}
