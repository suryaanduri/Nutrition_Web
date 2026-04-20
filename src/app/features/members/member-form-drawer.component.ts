import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';

export type GenderOption = 'Female' | 'Male' | 'Other';
export type MemberGoalOption = 'Weight Loss' | 'Weight Gain' | 'PCOS' | 'Metabolic Reset';
export type MemberDrawerMode = 'create' | 'edit';

export interface MemberFormValue {
  id?: string;
  joinedOn?: string;
  fullName: string;
  dob: string;
  height: string;
  email: string;
  phone: string;
  gender: GenderOption;
  goal: MemberGoalOption;
  coach: string;
}

export interface AssignableStaffOption {
  id: string;
  fullName: string;
  role: 'CENTER_ADMIN' | 'COACH';
}

@Component({
  selector: 'app-member-form-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './member-form-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberFormDrawerComponent {
  private readonly formBuilder = new FormBuilder();

  readonly open = input(false);
  readonly mode = input<MemberDrawerMode>('create');
  readonly initialValue = input<MemberFormValue | null>(null);
  readonly assignableStaffOptions = input<AssignableStaffOption[]>([]);

  readonly cancelled = output<void>();
  readonly saved = output<MemberFormValue>();

  protected readonly genderOptions: GenderOption[] = ['Female', 'Male', 'Other'];
  protected readonly goalOptions: MemberGoalOption[] = [
    'Weight Loss',
    'Weight Gain',
    'PCOS',
    'Metabolic Reset'
  ];

  protected readonly memberForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    dob: ['', Validators.required],
    height: ['', [Validators.required, Validators.min(80), Validators.max(250)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{10,16}$/)]],
    gender: ['', Validators.required],
    goal: ['', Validators.required],
    coach: ['', Validators.required]
  });

  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Member' : 'Add Member'
  );
  protected readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Update member information without leaving the current workflow.'
      : 'Create a member profile without leaving the list workflow.'
  );
  protected readonly submitLabel = computed(() =>
    this.mode() === 'edit' ? 'Save Changes' : 'Save Member'
  );
  protected readonly coachOptions = computed(() =>
    this.assignableStaffOptions().map((staff) => ({
      label: staff.role === 'CENTER_ADMIN' ? `${staff.fullName} (Admin)` : staff.fullName,
      value: staff.fullName
    }))
  );

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const value = this.initialValue();

      if (!isOpen) {
        return;
      }

      if (value) {
        this.memberForm.reset({
          fullName: value.fullName,
          dob: value.dob,
          height: value.height,
          email: value.email,
          phone: value.phone,
          gender: value.gender,
          goal: value.goal,
          coach: value.coach
        });
      } else {
        this.memberForm.reset({
          fullName: '',
          dob: '',
          height: '',
          email: '',
          phone: '',
          gender: '',
          goal: '',
          coach: ''
        });
      }

      this.memberForm.markAsPristine();
      this.memberForm.markAsUntouched();
    });
  }

  protected closeDrawer(): void {
    this.cancelled.emit();
  }

  protected submit(): void {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    const raw = this.memberForm.getRawValue();
    const initial = this.initialValue();

    this.saved.emit({
      id: initial?.id,
      joinedOn: initial?.joinedOn,
      fullName: raw.fullName.trim(),
      dob: raw.dob,
      height: raw.height.toString(),
      email: raw.email.trim(),
      phone: raw.phone.trim(),
      gender: raw.gender as GenderOption,
      goal: raw.goal as MemberGoalOption,
      coach: raw.coach
    });
  }

  protected fieldHasError(controlName: keyof typeof this.memberForm.controls): boolean {
    const control = this.memberForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }
}
