'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createEmployeeAction,
  updateEmployeeAction,
  getUnlinkedZitadelUsersAction,
  type ActionResult,
} from '@/app/admin/employees/actions';
import { toast } from 'sonner';
import type { Employee } from '@/lib/db/employees';

interface EmployeeFormProps {
  employee?: Employee;
  mode: 'create' | 'edit';
}

type Tab = 'profile' | 'compensation' | 'withholding' | '990-pii';

const TABS: { key: Tab; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'compensation', label: 'Compensation' },
  { key: 'withholding', label: 'Withholding' },
  { key: '990-pii', label: '990 & PII' },
];

type ZitadelUser = { id: string; displayName: string; email: string };

export function EmployeeForm({ employee, mode }: EmployeeFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Zitadel user picker state
  const [zitadelUsers, setZitadelUsers] = useState<ZitadelUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(mode === 'create');

  // --- Form state ---
  const [zitadelUserId, setZitadelUserId] = useState(employee?.zitadelUserId || '');
  const [name, setName] = useState(employee?.name || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [workerType, setWorkerType] = useState(employee?.workerType || 'W-2');
  const [payFrequency, setPayFrequency] = useState(employee?.payFrequency || 'biweekly');

  // Compensation
  const [compensationType, setCompensationType] = useState(employee?.compensationType || 'PER_TASK');
  const [annualSalary, setAnnualSalary] = useState(employee?.annualSalary || '');
  const [expectedAnnualHours, setExpectedAnnualHours] = useState(
    employee?.expectedAnnualHours?.toString() || ''
  );
  const [exemptStatus, setExemptStatus] = useState(employee?.exemptStatus || 'NON_EXEMPT');

  // Withholding
  const [federalFilingStatus, setFederalFilingStatus] = useState(
    employee?.federalFilingStatus || 'single'
  );
  const [federalAllowances, setFederalAllowances] = useState(
    employee?.federalAllowances?.toString() || '0'
  );
  const [stateAllowances, setStateAllowances] = useState(
    employee?.stateAllowances?.toString() || '0'
  );
  const [additionalFederalWithholding, setAdditionalFederalWithholding] = useState(
    employee?.additionalFederalWithholding || '0'
  );
  const [additionalStateWithholding, setAdditionalStateWithholding] = useState(
    employee?.additionalStateWithholding || '0'
  );
  const [isHeadOfHousehold, setIsHeadOfHousehold] = useState(employee?.isHeadOfHousehold || false);
  const [isBlind, setIsBlind] = useState(employee?.isBlind || false);
  const [spouseIsBlind, setSpouseIsBlind] = useState(employee?.spouseIsBlind || false);

  // 990 & PII
  const [isOfficer, setIsOfficer] = useState(employee?.isOfficer || false);
  const [officerTitle, setOfficerTitle] = useState(employee?.officerTitle || '');
  const [boardMember, setBoardMember] = useState(employee?.boardMember || false);
  const [avgHoursPerWeek, setAvgHoursPerWeek] = useState(employee?.avgHoursPerWeek || '');
  const [employerHealthPremium, setEmployerHealthPremium] = useState(
    employee?.employerHealthPremium || ''
  );
  const [employerRetirementContrib, setEmployerRetirementContrib] = useState(
    employee?.employerRetirementContrib || ''
  );
  const [taxId, setTaxId] = useState(employee?.taxId || '');
  const [taxIdRevealed, setTaxIdRevealed] = useState(false);
  const [stateTaxId, setStateTaxId] = useState(employee?.stateTaxId || '');
  const [address, setAddress] = useState(employee?.address || '');

  // Load Zitadel users for the picker (create mode only)
  useEffect(() => {
    if (mode !== 'create') return;

    getUnlinkedZitadelUsersAction().then((result) => {
      if (result.error) {
        toast.error(result.error);
      }
      setZitadelUsers(result.users);
      setLoadingUsers(false);
    });
  }, [mode]);

  const handleZitadelUserSelect = (userId: string) => {
    setZitadelUserId(userId);
    const user = zitadelUsers.find((u) => u.id === userId);
    if (user) {
      setName(user.displayName);
      setEmail(user.email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      if (mode === 'create') formData.append('zitadelUserId', zitadelUserId);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('workerType', workerType);
      formData.append('payFrequency', payFrequency);
      formData.append('compensationType', compensationType);
      formData.append('annualSalary', annualSalary);
      formData.append('expectedAnnualHours', expectedAnnualHours);
      formData.append('exemptStatus', exemptStatus);
      formData.append('federalFilingStatus', federalFilingStatus);
      formData.append('federalAllowances', federalAllowances);
      formData.append('stateAllowances', stateAllowances);
      formData.append('additionalFederalWithholding', additionalFederalWithholding);
      formData.append('additionalStateWithholding', additionalStateWithholding);
      if (isHeadOfHousehold) formData.append('isHeadOfHousehold', 'on');
      if (isBlind) formData.append('isBlind', 'on');
      if (spouseIsBlind) formData.append('spouseIsBlind', 'on');
      if (isOfficer) formData.append('isOfficer', 'on');
      formData.append('officerTitle', officerTitle);
      if (boardMember) formData.append('boardMember', 'on');
      formData.append('avgHoursPerWeek', avgHoursPerWeek);
      formData.append('employerHealthPremium', employerHealthPremium);
      formData.append('employerRetirementContrib', employerRetirementContrib);
      formData.append('taxId', taxId);
      formData.append('stateTaxId', stateTaxId);
      formData.append('address', address);

      let result: ActionResult;

      if (mode === 'create') {
        result = await createEmployeeAction(formData);
      } else {
        result = await updateEmployeeAction(employee!.id, formData);
      }

      if (result.success) {
        toast.success(
          mode === 'create'
            ? 'Employee created successfully'
            : 'Employee updated successfully'
        );
        router.push('/admin/employees');
        router.refresh();
      } else {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
        toast.error(result.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskedTaxId =
    taxId && !taxIdRevealed
      ? `***-**-${taxId.slice(-4)}`
      : taxId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="employee-form">
      {/* Tab navigation */}
      <div className="border-b" data-testid="employee-form-tabs">
        <nav className="-mb-px flex gap-4 overflow-x-auto" aria-label="Form sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
              }`}
              data-testid={`tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Zitadel user picker (create only) */}
            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="zitadelUserId">
                  Link to User <span className="text-destructive">*</span>
                </Label>
                {loadingUsers ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading users...
                  </div>
                ) : zitadelUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    All users already have employee records. Invite a new user first.
                  </p>
                ) : (
                  <Select value={zitadelUserId} onValueChange={handleZitadelUserSelect}>
                    <SelectTrigger className="w-full" data-testid="zitadel-user-picker">
                      <SelectValue placeholder="Select a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {zitadelUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.displayName} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.zitadelUserId && (
                  <p className="text-sm text-destructive">{errors.zitadelUserId[0]}</p>
                )}
              </div>
            )}

            {mode === 'edit' && (
              <div className="space-y-2">
                <Label>Zitadel User ID</Label>
                <Input value={employee?.zitadelUserId || ''} disabled className="font-mono" />
                <p className="text-xs text-muted-foreground">
                  Identity link is immutable after creation.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full legal name"
                  data-testid="employee-name-input"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@org.org"
                  data-testid="employee-email-input"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email[0]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workerType">Worker Type</Label>
                <Select value={workerType} onValueChange={setWorkerType}>
                  <SelectTrigger className="w-full" data-testid="worker-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="W-2">W-2 Employee</SelectItem>
                    <SelectItem value="1099">1099 Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payFrequency">Pay Frequency</Label>
                <Select value={payFrequency} onValueChange={setPayFrequency}>
                  <SelectTrigger className="w-full" data-testid="pay-frequency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="semimonthly">Semi-monthly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Compensation */}
      {activeTab === 'compensation' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compensationType">Compensation Type</Label>
                <Select value={compensationType} onValueChange={setCompensationType}>
                  <SelectTrigger className="w-full" data-testid="comp-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_TASK">Per Task</SelectItem>
                    <SelectItem value="SALARIED">Salaried</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exemptStatus">Exempt Status</Label>
                <Select value={exemptStatus} onValueChange={setExemptStatus}>
                  <SelectTrigger className="w-full" data-testid="exempt-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXEMPT">Exempt</SelectItem>
                    <SelectItem value="NON_EXEMPT">Non-Exempt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {compensationType === 'SALARIED' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualSalary">Annual Salary ($)</Label>
                  <Input
                    id="annualSalary"
                    type="number"
                    step="0.01"
                    min="0"
                    value={annualSalary}
                    onChange={(e) => setAnnualSalary(e.target.value)}
                    placeholder="0.00"
                    data-testid="annual-salary-input"
                  />
                  {errors.annualSalary && (
                    <p className="text-sm text-destructive">{errors.annualSalary[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedAnnualHours">Expected Annual Hours</Label>
                  <Input
                    id="expectedAnnualHours"
                    type="number"
                    min="0"
                    value={expectedAnnualHours}
                    onChange={(e) => setExpectedAnnualHours(e.target.value)}
                    placeholder="2080"
                    data-testid="expected-hours-input"
                  />
                  {errors.expectedAnnualHours && (
                    <p className="text-sm text-destructive">{errors.expectedAnnualHours[0]}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Withholding */}
      {activeTab === 'withholding' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="federalFilingStatus">Federal Filing Status</Label>
              <Select value={federalFilingStatus} onValueChange={setFederalFilingStatus}>
                <SelectTrigger className="w-full" data-testid="filing-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="married_separate">Married Filing Separately</SelectItem>
                  <SelectItem value="head_of_household">Head of Household</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="federalAllowances">Federal Allowances</Label>
                <Input
                  id="federalAllowances"
                  type="number"
                  min="0"
                  value={federalAllowances}
                  onChange={(e) => setFederalAllowances(e.target.value)}
                  data-testid="federal-allowances-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateAllowances">State Allowances</Label>
                <Input
                  id="stateAllowances"
                  type="number"
                  min="0"
                  value={stateAllowances}
                  onChange={(e) => setStateAllowances(e.target.value)}
                  data-testid="state-allowances-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="additionalFederalWithholding">
                  Additional Federal Withholding ($)
                </Label>
                <Input
                  id="additionalFederalWithholding"
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalFederalWithholding}
                  onChange={(e) => setAdditionalFederalWithholding(e.target.value)}
                  data-testid="addl-federal-wh-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalStateWithholding">
                  Additional State Withholding ($)
                </Label>
                <Input
                  id="additionalStateWithholding"
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalStateWithholding}
                  onChange={(e) => setAdditionalStateWithholding(e.target.value)}
                  data-testid="addl-state-wh-input"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isHeadOfHousehold"
                  checked={isHeadOfHousehold}
                  onCheckedChange={(v) => setIsHeadOfHousehold(v === true)}
                  data-testid="hoh-checkbox"
                />
                <Label htmlFor="isHeadOfHousehold" className="font-normal">
                  Head of household
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isBlind"
                  checked={isBlind}
                  onCheckedChange={(v) => setIsBlind(v === true)}
                  data-testid="blind-checkbox"
                />
                <Label htmlFor="isBlind" className="font-normal">
                  Blind
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="spouseIsBlind"
                  checked={spouseIsBlind}
                  onCheckedChange={(v) => setSpouseIsBlind(v === true)}
                  data-testid="spouse-blind-checkbox"
                />
                <Label htmlFor="spouseIsBlind" className="font-normal">
                  Spouse is blind
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: 990 & PII */}
      {activeTab === '990-pii' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              990 Part VII
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isOfficer"
                  checked={isOfficer}
                  onCheckedChange={(v) => setIsOfficer(v === true)}
                  data-testid="officer-checkbox"
                />
                <Label htmlFor="isOfficer" className="font-normal">
                  Officer
                </Label>
              </div>

              {isOfficer && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="officerTitle">Officer Title</Label>
                  <Input
                    id="officerTitle"
                    value={officerTitle}
                    onChange={(e) => setOfficerTitle(e.target.value)}
                    placeholder="e.g., Executive Director"
                    data-testid="officer-title-input"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="boardMember"
                  checked={boardMember}
                  onCheckedChange={(v) => setBoardMember(v === true)}
                  data-testid="board-member-checkbox"
                />
                <Label htmlFor="boardMember" className="font-normal">
                  Board member
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="avgHoursPerWeek">Avg Hours / Week</Label>
                <Input
                  id="avgHoursPerWeek"
                  type="number"
                  step="0.1"
                  min="0"
                  value={avgHoursPerWeek}
                  onChange={(e) => setAvgHoursPerWeek(e.target.value)}
                  placeholder="40.0"
                  data-testid="avg-hours-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerHealthPremium">Health Premium ($)</Label>
                <Input
                  id="employerHealthPremium"
                  type="number"
                  step="0.01"
                  min="0"
                  value={employerHealthPremium}
                  onChange={(e) => setEmployerHealthPremium(e.target.value)}
                  placeholder="0.00"
                  data-testid="health-premium-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerRetirementContrib">Retirement Contrib ($)</Label>
                <Input
                  id="employerRetirementContrib"
                  type="number"
                  step="0.01"
                  min="0"
                  value={employerRetirementContrib}
                  onChange={(e) => setEmployerRetirementContrib(e.target.value)}
                  placeholder="0.00"
                  data-testid="retirement-contrib-input"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                PII (Sensitive)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">SSN / Tax ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="taxId"
                      value={mode === 'edit' && !taxIdRevealed ? maskedTaxId : taxId}
                      onChange={(e) => {
                        setTaxIdRevealed(true);
                        setTaxId(e.target.value);
                      }}
                      onFocus={() => {
                        if (mode === 'edit' && !taxIdRevealed) {
                          setTaxIdRevealed(true);
                        }
                      }}
                      placeholder="XXX-XX-XXXX"
                      className="font-mono"
                      data-testid="tax-id-input"
                    />
                    {mode === 'edit' && taxId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTaxIdRevealed(!taxIdRevealed)}
                        data-testid="toggle-tax-id"
                      >
                        {taxIdRevealed ? 'Hide' : 'Show'}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateTaxId">State Tax ID</Label>
                  <Input
                    id="stateTaxId"
                    value={stateTaxId}
                    onChange={(e) => setStateTaxId(e.target.value)}
                    placeholder="State tax ID"
                    data-testid="state-tax-id-input"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="address">Mailing Address (W-2)</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, state, zip"
                  rows={3}
                  data-testid="address-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
          data-testid="employee-form-cancel-btn"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          data-testid="submit-employee"
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : mode === 'create' ? (
            'Create Employee'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
