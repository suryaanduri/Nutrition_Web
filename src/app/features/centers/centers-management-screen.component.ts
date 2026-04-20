import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';

type CenterStatus = 'Active' | 'Inactive';
type CenterFilter = 'All status' | CenterStatus;
type CenterSort = 'Recently created' | 'Center name' | 'City';
type CenterScreenMode = 'list' | 'create';
type CenterFormMode = 'create' | 'edit';

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
  inviteMethod: string;
  createdDate: string;
  createdStamp: string;
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

  protected readonly statusOptions: CenterFilter[] = ['All status', 'Active', 'Inactive'];
  protected readonly sortOptions: CenterSort[] = ['Recently created', 'Center name', 'City'];
  protected readonly screenMode = signal<CenterScreenMode>('list');
  protected readonly formMode = signal<CenterFormMode>('create');
  protected readonly query = signal('');
  protected readonly selectedStatus = signal<CenterFilter>('All status');
  protected readonly selectedSort = signal<CenterSort>('Recently created');
  protected readonly saveFeedback = signal('');
  protected readonly editingCenterId = signal<string | null>(null);

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
      inviteMethod: 'Temporary password',
      createdDate: '18 Apr 2026',
      createdStamp: '2026-04-18'
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
      inviteMethod: 'Invite setup later',
      createdDate: '10 Apr 2026',
      createdStamp: '2026-04-10'
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
      inviteMethod: 'Temporary password',
      createdDate: '27 Mar 2026',
      createdStamp: '2026-03-27'
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
      inviteMethod: 'Temporary password',
      createdDate: '11 Mar 2026',
      createdStamp: '2026-03-11'
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

  protected readonly pageTitle = computed(() =>
    this.screenMode() === 'create' ? 'Create Nutritional Center' : 'Nutritional Centers'
  );
  protected readonly pageDescription = computed(() =>
    this.screenMode() === 'create'
      ? 'Onboard center and assign admin in one flow'
      : 'Manage active centers, search records, and onboard new locations.'
  );
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

  protected closeCreateFlow(): void {
    this.screenMode.set('list');
    this.formMode.set('create');
    this.editingCenterId.set(null);
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
      inviteMethod: raw.inviteMethod,
      createdDate,
      createdStamp
    };

    if (existingCenter) {
      this.centers.update((records) =>
        records.map((record) => (record.id === existingCenter.id ? center : record))
      );
      this.saveFeedback.set(`${center.centerName} updated successfully.`);
    } else {
      this.centers.update((records) => [center, ...records]);
      this.saveFeedback.set(
        `${center.centerName} created with ${center.adminName} as Center Admin.`
      );
    }

    window.setTimeout(() => this.saveFeedback.set(''), 2600);

    this.screenMode.set('list');
    this.formMode.set('create');
    this.editingCenterId.set(null);
  }

  protected fieldHasError(
    controlName: keyof typeof this.onboardingForm.controls
  ): boolean {
    const control = this.onboardingForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected statusClass(status: CenterStatus): string {
    return status === 'Active'
      ? 'bg-[var(--ncm-primary-soft)] text-[var(--ncm-primary-strong)]'
      : 'bg-[rgba(183,121,31,0.12)] text-[var(--ncm-warning)]';
  }
}
