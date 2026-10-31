import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  CreditCard,
  Building,
  Calendar,
  Briefcase,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserPlus,
} from 'lucide-react';
import { BlankFromRow, EMPTY_BLANK_FROM_ROW } from '../../data/initialBlankFromData';
import { ToastService } from '../../services/toastService';
import { getTodayDateString } from '../../services/storageService';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: BlankFromRow) => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<BlankFromRow>>({
    // Only the exact 20 whitelisted fields initialized
    unitNo: '',
    moveInDate: getTodayDateString(),
    moveOutDate: '2026-12-31',
    name: '',
    department: 'Operations',
    employmentId: '',
    company: 'Red Sea Global',
    division: 'Projects Delivery', // Program
    asset: 'Coastal Village',
    idIqama: '',
    idExpiryDate: '',
    passport: '',
    passportExpiryDate: '',
    nationality: 'Saudi Arabia',
    dob: '',
    gender: 'Male',
    contractNumber: '',
    email: '',
    emergencyMobile: '',
    emergencyName: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof BlankFromRow, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (validationError) setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = (formData.name || '').trim();
    const trimmedIqama = (formData.idIqama || '').trim();
    const trimmedPassport = (formData.passport || '').trim();

    // 1. Name is strictly required
    if (!trimmedName) {
      const err = 'Please enter the resident name. (রেসিডেন্ট নাম দেওয়া আবশ্যক)';
      setValidationError(err);
      ToastService.warn(err);
      return;
    }

    // 2. Either ID/Iqama OR Passport is strictly required
    if (!trimmedIqama && !trimmedPassport) {
      const err = 'Either ID/Iqama No or Passport Number is required. (ইকামা অথবা পাসপোর্ট নাম্বার দিতেই হবে)';
      setValidationError(err);
      ToastService.warn(err);
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const unitInput = (formData.unitNo || '').trim();
      let bldg = 'B01';
      let unitNum = unitInput || '101';

      // Parse unit input (e.g. "H03-15", "D01 112", "H05-GF-104", "15")
      if (unitInput) {
        const parts = unitInput.split(/[\s\-_/]+/).filter(Boolean);
        if (parts.length >= 2) {
          bldg = parts[0].toUpperCase();
          unitNum = parts.slice(1).join('-');
        } else {
          unitNum = unitInput;
        }
      }

      const prop = 'TBCV';
      const sec = 'S01';
      const fl = 'GF';
      const fullUnit = `${prop} - ${sec}- ${bldg}- ${fl}- ${unitNum}`;
      const contractNum = (formData.contractNumber || '').trim();
      const empId = (formData.employmentId || '').trim() || trimmedIqama || trimmedPassport || `EMP-${Date.now().toString().slice(-6)}`;
      const inDate = formData.moveInDate || getTodayDateString();
      const outDate = formData.moveOutDate || '2026-12-31';

      const newRecord: BlankFromRow = {
        ...EMPTY_BLANK_FROM_ROW,
        id: `custom-res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: trimmedName,
        employmentId: empId,
        idIqama: trimmedIqama,
        idExpiryDate: formData.idExpiryDate || '',
        passport: trimmedPassport,
        passportExpiryDate: formData.passportExpiryDate || '',
        nationality: (formData.nationality || 'Saudi Arabia').trim(),
        dob: formData.dob || '',
        gender: formData.gender || 'Male',
        company: (formData.company || 'Red Sea Global').trim(),
        department: (formData.department || 'Operations').trim(),
        division: (formData.division || 'Projects Delivery').trim(), // Program
        asset: (formData.asset || 'Coastal Village').trim(),
        unitNo: unitNum,
        room: unitNum,
        buildingNo: bldg,
        house: bldg,
        floor: fl,
        property: prop,
        propertyName: prop,
        unit: fullUnit,
        unitSerialNo: fullUnit,
        moveInDate: inDate,
        moveOutDate: outDate,
        contractStartDate: inDate,
        contractEndDate: outDate,
        contractNumber: contractNum,
        email: (formData.email || '').trim(),
        mobile: (formData.emergencyMobile || '').trim(),
        emergencyMobile: (formData.emergencyMobile || '').trim(),
        emergencyName: (formData.emergencyName || '').trim(),
        category: (formData.company || '').toLowerCase().includes('visitor') ? 'Rsg Visitor' : 'Rsg Staff',
        propertyType: 'Executive',
        status: 'Checked in',
        isCustom: true,
        uploadedAt: new Date().toISOString(),
      };

      onSave(newRecord);
      onClose();
    } catch (err: any) {
      ToastService.warn(err?.message || 'Could not save resident profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasIqama = Boolean(formData.idIqama && formData.idIqama.trim().length > 0);
  const hasPassport = Boolean(formData.passport && formData.passport.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-white to-indigo-50/50 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>+ Add Resident Profile</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                  From.docx Auto-Fill Ready
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter resident information to generate Word form and synchronize across workstations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Error Alert if Triggered */}
        {validationError && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        {/* Modal Form Body - Exactly 20 Fields */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          
          {/* Card 1: Identification & Personal Info */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>1. Personal & Identity Details</span>
              </span>
              <span className="text-[10px] text-slate-500">
                Fields with <span className="text-rose-500 font-bold">*</span> are required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Field 1: Name */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Mohammed Fauda / Tariq Al otaibi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 2: Gender */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender || 'Male'}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Field 3: Nationality */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  value={formData.nationality || ''}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  placeholder="e.g. Saudi Arabia, Egypt"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 4: Date of birth */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 5: Email */}
              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="e.g. resident@company.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Official Identification & Documents (ID/Iqama & Passport) */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Official Documents (ID / Iqama or Passport)</span>
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                hasIqama || hasPassport
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                {hasIqama || hasPassport ? '✓ Document Provided' : '★ Either ID/Iqama or Passport Required'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Field 6: ID/Iqama */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ID/Iqama {!hasPassport && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.idIqama || ''}
                  onChange={(e) => handleChange('idIqama', e.target.value)}
                  placeholder="e.g. 1096708498"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 7: Expiry date (ID/Iqama) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Expiry date (ID/Iqama)
                </label>
                <input
                  type="date"
                  value={formData.idExpiryDate || ''}
                  onChange={(e) => handleChange('idExpiryDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 8: Passport */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Passport {!hasIqama && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.passport || ''}
                  onChange={(e) => handleChange('passport', e.target.value)}
                  placeholder="e.g. N1234567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 9: Expiry date (Passport) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Expiry date (Passport)
                </label>
                <input
                  type="date"
                  value={formData.passportExpiryDate || ''}
                  onChange={(e) => handleChange('passportExpiryDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Accommodation, Unit & Stay Dates */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>3. Accommodation & Stay Dates</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Field 10: Unit Apartment No */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Unit Apartment No
                </label>
                <input
                  type="text"
                  value={formData.unitNo || ''}
                  onChange={(e) => handleChange('unitNo', e.target.value)}
                  placeholder="e.g. H03-15 or 112"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 11: Check in date */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Check in date
                </label>
                <input
                  type="date"
                  value={formData.moveInDate || ''}
                  onChange={(e) => handleChange('moveInDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 12: Check out date */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Check out date
                </label>
                <input
                  type="date"
                  value={formData.moveOutDate || ''}
                  onChange={(e) => handleChange('moveOutDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 13: Contract Number */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Contract Number
                </label>
                <input
                  type="text"
                  value={formData.contractNumber || ''}
                  onChange={(e) => handleChange('contractNumber', e.target.value)}
                  placeholder="e.g. CN-2026-9041"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Company, Program & Emergency Contact */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>4. Company, Program & Emergency Contact</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {/* Field 14: Employee Id */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Employee Id
                </label>
                <input
                  type="text"
                  value={formData.employmentId || ''}
                  onChange={(e) => handleChange('employmentId', e.target.value)}
                  placeholder="e.g. 108939"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 15: Company */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="e.g. Red Sea Global"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 16: Department */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="e.g. Operations"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 17: Program */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Program
                </label>
                <input
                  type="text"
                  value={formData.division || ''}
                  onChange={(e) => handleChange('division', e.target.value)}
                  placeholder="e.g. Projects Delivery"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 18: Asset */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Asset
                </label>
                <input
                  type="text"
                  value={formData.asset || ''}
                  onChange={(e) => handleChange('asset', e.target.value)}
                  placeholder="e.g. Coastal Village"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Emergency Contact Details */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Field 19: Emergency contact number */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Emergency contact number
                </label>
                <input
                  type="text"
                  value={formData.emergencyMobile || ''}
                  onChange={(e) => handleChange('emergencyMobile', e.target.value)}
                  placeholder="e.g. 0546844775"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 20: Emergency contact person name */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Emergency contact person name
                </label>
                <input
                  type="text"
                  value={formData.emergencyName || ''}
                  onChange={(e) => handleChange('emergencyName', e.target.value)}
                  placeholder="e.g. Contact Person / Family Member"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 hidden sm:inline-block">
              Resident will be saved locally, synchronized to server, and immediately selectable.
            </span>
            <div className="flex items-center space-x-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center space-x-2 transition shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save & Select Resident'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
