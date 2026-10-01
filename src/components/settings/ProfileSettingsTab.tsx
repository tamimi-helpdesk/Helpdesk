import React, { useState, useRef } from 'react';
import {
  Edit2,
  Check,
  X,
  Camera,
  MapPin,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  User,
  Building,
  Hash,
  Upload,
  Trash2,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { OperatorProfile } from '../../types';
import { AuthService } from '../../services/authService';
import { FACILITIES } from '../../data/facilities';

interface ProfileSettingsTabProps {
  profile: OperatorProfile;
  onProfileUpdate: (updated: OperatorProfile) => void;
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
  profile,
  onProfileUpdate,
  onShowFeedback,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUsername = AuthService.getUsername();
  const isSuperAdmin = AuthService.isSuperAdmin();
  const assignedFacilityIds = AuthService.getUserAssignedFacilityIds();
  const accounts = AuthService.getStaffAccounts(true);
  const currentStaff = accounts.find(
    (a) => a.username.toLowerCase() === currentUsername.toLowerCase() || (a.email && a.email.toLowerCase() === currentUsername.toLowerCase())
  );

  const fallbackFirstName = currentStaff?.fullName?.split(' ')[0] || (isSuperAdmin ? 'Limon' : 'Tamimi');
  const fallbackLastName = currentStaff?.fullName?.split(' ').slice(1).join(' ') || (isSuperAdmin ? 'Rahman' : 'Operator');
  const fallbackEmail = currentStaff?.email || (isSuperAdmin ? 'tamimitafga188@gmail.com' : `${currentUsername.toLowerCase()}@tamimi.com`);
  const fallbackRoleTitle = currentStaff?.roleTitle || (isSuperAdmin ? 'Super Admin' : 'Facility Operator');
  const fallbackBadgeId = currentStaff?.badgeId || (isSuperAdmin ? 'TAMIMI-SUPREME-01' : (AuthService.isHelpdeskUser() ? 'EMP-0188' : `TAMIMI-${currentUsername.toUpperCase()}`));

  // Editing state for each card independently or unified
  const [editingCard, setEditingCard] = useState<'none' | 'hero' | 'personal' | 'address'>('none');
  const [formData, setFormData] = useState<OperatorProfile>({ ...profile });

  // Sync formData when profile updates from session change
  React.useEffect(() => {
    if (editingCard === 'none') {
      setFormData({ ...profile });
    }
  }, [profile, editingCard]);

  const handleStartEdit = (card: 'none' | 'hero' | 'personal' | 'address') => {
    setFormData({ ...profile });
    setEditingCard(card);
  };

  const handleCancelEdit = () => {
    setFormData({ ...profile });
    setEditingCard('none');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AuthService.saveOperatorProfile(formData);
    if (res.success) {
      onProfileUpdate(formData);
      onShowFeedback(res.message, 'success');
      setEditingCard('none');
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Profile image upload handler (reads file, compresses to lightweight base64)
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowFeedback('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          
          const updatedProfile: OperatorProfile = {
            ...profile,
            ...formData,
            avatarUrl: compressedDataUrl,
          };
          setFormData(updatedProfile);
          const res = AuthService.saveOperatorProfile(updatedProfile);
          if (res.success) {
            onProfileUpdate(updatedProfile);
            onShowFeedback('Profile photo attached and saved!', 'success');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // reset input value so re-selecting same file triggers change
    e.target.value = '';
  };

  const handleRemovePhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedProfile: OperatorProfile = {
      ...profile,
      ...formData,
      avatarUrl: '',
    };
    setFormData(updatedProfile);
    const res = AuthService.saveOperatorProfile(updatedProfile);
    if (res.success) {
      onProfileUpdate(updatedProfile);
      onShowFeedback('Profile photo removed.', 'info');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Hidden File Input for Avatar Attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoFileChange}
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
      />

      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          My Profile
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your executive identity, contact credentials, and station location.
        </p>
      </div>

      {/* CARD 1: PROFILE HERO / AVATAR CARD (Matching the image style) */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Avatar with photo or gradient & initials */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Click to change profile picture">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover shadow-md shadow-sky-600/30 ring-4 ring-slate-100 dark:ring-slate-800"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-black shadow-md shadow-sky-600/30 ring-4 ring-slate-100 dark:ring-slate-800">
                  {profile.firstName ? profile.firstName[0].toUpperCase() : 'T'}
                  {profile.lastName ? profile.lastName[0].toUpperCase() : 'O'}
                </div>
              )}
              
              {/* Photo Upload Overlay Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
                title="Attach new photo"
              >
                <Camera className="w-5 h-5 drop-shadow-md" />
                <span className="text-[9px] font-black tracking-wider uppercase drop-shadow-md">Upload</span>
              </button>

              <div className="absolute bottom-0 right-0 p-1 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="Active on shift" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {profile.firstName || fallbackFirstName} {profile.lastName || fallbackLastName}
                </h3>
                {profile.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-[10px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold underline cursor-pointer"
                    title="Remove custom photo"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {profile.roleTitle || fallbackRoleTitle}
              </p>

              <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                <span>{profile.cityState || 'Tabuk / Red Sea Coast'}, {profile.country || 'Saudi Arabia'}</span>
              </div>
            </div>
          </div>

          {/* Quick Photo Upload & Edit Button */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              title="Upload profile picture"
            >
              <Camera className="w-3.5 h-3.5 text-sky-500" />
              <span>Attach Photo</span>
            </button>

            {/* Edit Button (Matching the blue outlined icon button in image) */}
            <button
              onClick={() => handleStartEdit(editingCard === 'hero' ? 'none' : 'hero')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/70 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Inline Hero Edit Form */}
        {editingCard === 'hero' && (
          <form onSubmit={handleSave} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Full Role Title
                </label>
                <input
                  type="text"
                  value={formData.roleTitle || ''}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                  placeholder="e.g. Executive Facilities Lead"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Active Shift Schedule
                </label>
                <select
                  value={formData.activeShift || 'Executive 24/7 On-Duty'}
                  onChange={(e: any) => setFormData({ ...formData, activeShift: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-bold"
                >
                  <option value="Executive 24/7 On-Duty">Executive 24/7 On-Duty</option>
                  <option value="Morning Shift (07:00 - 15:00)">Morning Shift (07:00 - 15:00)</option>
                  <option value="Evening Shift (15:00 - 23:00)">Evening Shift (15:00 - 23:00)</option>
                  <option value="Night Shift (23:00 - 07:00)">Night Shift (23:00 - 07:00)</option>
                </select>
              </div>
            </div>

            {/* Custom Photo URL Input Option */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Profile Photo (Attachment / Direct URL)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={formData.avatarUrl || ''}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-mono text-[11px]"
                  placeholder="Paste image URL or click Attach Photo above..."
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-200 transition shrink-0 cursor-pointer"
                >
                  Browse
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CARD 2: PERSONAL INFORMATION (Matching the image style) */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            Personal Information
          </h3>
          <button
            onClick={() => handleStartEdit(editingCard === 'personal' ? 'none' : 'personal')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/70 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>

        {editingCard !== 'personal' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                First Name
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {profile.firstName || fallbackFirstName}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                Last Name
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {profile.lastName || fallbackLastName}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                Email Address
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {profile.email || fallbackEmail}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                Phone
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm font-mono">
                {profile.phoneNumber || '+966 50 188 7799'}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                Bio / Mission
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                {profile.bio || (isSuperAdmin
                  ? 'Supreme Super Administrator overseeing enterprise guest relations, facility allocations, sports grounds scheduling, and real-time Google Sheets synchronization across all facilities.'
                  : 'Authorized operational staff member responsible for assigned facility reservations, guest assistance, and campus operations.')}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Bio / Responsibilities
                </label>
                <textarea
                  rows={2}
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CARD 3: ADDRESS & CAMPUS LOCATION (Matching the image style) */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            Address &amp; Station Location
          </h3>
          <button
            onClick={() => handleStartEdit(editingCard === 'address' ? 'none' : 'address')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/70 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>

        {editingCard !== 'address' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                Country
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {profile.country || 'Kingdom of Saudi Arabia'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                City / State
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {profile.cityState || 'Tabuk / Red Sea Coast'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                Postal Code
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm font-mono">
                {profile.postalCode || '47521'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                TAX ID / Staff Badge No
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm font-mono">
                {profile.badgeId || fallbackBadgeId}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  City / State / Region
                </label>
                <input
                  type="text"
                  value={formData.cityState || ''}
                  onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode || ''}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  TAX ID / Staff Badge ID
                </label>
                <input
                  type="text"
                  value={formData.badgeId || ''}
                  onChange={(e) => setFormData({ ...formData, badgeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Assigned Venues & Clearances Overview Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-sky-500" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {isSuperAdmin ? 'Camp-Wide Venue Clearance (Master)' : `Permitted Facilities (${assignedFacilityIds.length} of ${FACILITIES.length})`}
            </h4>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
            isSuperAdmin
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {isSuperAdmin ? 'Full Clearance' : 'Restricted Access'}
          </span>
        </div>

        {isSuperAdmin ? (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            As Supreme Super Administrator, you have unrestricted camp-wide clearance to view, reserve, edit, and manage all {FACILITIES.length} facilities across Camp 188.
          </p>
        ) : assignedFacilityIds.length === 0 ? (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-semibold">
            ⚠️ No booking facilities have been assigned to your operator account yet. Please contact the Super Administrator (@limon) to authorize specific facilities in Team Management.
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Your operator account is strictly authorized to view, create, and manage bookings only for the following designated facilities:
            </p>
            <div className="flex flex-wrap gap-2">
              {assignedFacilityIds.map((facId) => {
                const facObj = FACILITIES.find((f) => f.id === facId);
                return (
                  <span
                    key={facId}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>{facObj?.name || facId}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
