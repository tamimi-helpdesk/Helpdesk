import React, { useState } from 'react';
import {
  MapPin,
  Building,
  Navigation,
  Copy,
  Check,
  Globe,
  Share2,
  Info,
  ShieldCheck,
  Edit3,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CampAddressInfo, CAMP_ADDRESS as DEFAULT_CAMP_ADDRESS } from '../../data/departmentDirectory';

interface CampAddressCardProps {
  address?: CampAddressInfo;
  onSaveAddress?: (updated: CampAddressInfo) => void;
  onResetAddress?: () => void;
  onTriggerFeedback?: (type: 'success' | 'info', message: string) => void;
}

export const CampAddressCard: React.FC<CampAddressCardProps> = ({
  address = DEFAULT_CAMP_ADDRESS,
  onSaveAddress,
  onResetAddress,
  onTriggerFeedback,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form State
  const [formBuilding, setFormBuilding] = useState(address.buildingName || '');
  const [formMainLocation, setFormMainLocation] = useState(address.mainLocation || '');
  const [formCity, setFormCity] = useState(address.city || '');
  const [formDistrict, setFormDistrict] = useState(address.district || '');
  const [formProvince, setFormProvince] = useState(address.province || '');
  const [formCountry, setFormCountry] = useState(address.country || '');
  const [formNationalAddress, setFormNationalAddress] = useState(address.nationalAddress || '');
  const [formZipCode, setFormZipCode] = useState(address.zipCode || '');
  const [formFormattedAddress, setFormFormattedAddress] = useState(address.fullFormattedAddress || '');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
    if (onTriggerFeedback) {
      onTriggerFeedback('success', `Copied ${label} to clipboard.`);
    }
  };

  const handleOpenEdit = () => {
    setFormBuilding(address.buildingName || '');
    setFormMainLocation(address.mainLocation || '');
    setFormCity(address.city || '');
    setFormDistrict(address.district || '');
    setFormProvince(address.province || '');
    setFormCountry(address.country || '');
    setFormNationalAddress(address.nationalAddress || '');
    setFormZipCode(address.zipCode || '');
    setFormFormattedAddress(address.fullFormattedAddress || '');
    setIsEditModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveAddress) {
      const updated: CampAddressInfo = {
        buildingName: formBuilding.trim(),
        mainLocation: formMainLocation.trim(),
        city: formCity.trim(),
        district: formDistrict.trim(),
        province: formProvince.trim(),
        country: formCountry.trim(),
        nationalAddress: formNationalAddress.trim(),
        zipCode: formZipCode.trim(),
        fullFormattedAddress:
          formFormattedAddress.trim() ||
          `${formBuilding.trim()}, ${formMainLocation.trim()}, ${formDistrict.trim()} District, ${formCity.trim()} ${formZipCode.trim()}, ${formProvince.trim()} Province, ${formCountry.trim()} (National Address: ${formNationalAddress.trim()})`,
      };
      onSaveAddress(updated);
      if (onTriggerFeedback) {
        onTriggerFeedback('success', 'Official Camp Address updated successfully.');
      }
    }
    setIsEditModalOpen(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/50 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header Title & Edit Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500 text-white shadow-2xs">
                  Official Camp Address
                </span>
                <span className="text-xs font-mono text-sky-300">
                  National Code: {address.nationalAddress}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {address.buildingName}
              </h3>
              <p className="text-xs font-medium text-slate-300 mt-0.5">
                {address.mainLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onResetAddress && (
              <button
                type="button"
                onClick={onResetAddress}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                title="Reset address to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenEdit}
              className="flex items-center gap-1 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Address</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy(address.fullFormattedAddress, 'Full National Address')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-black rounded-xl transition cursor-pointer active:scale-95 shadow-md shrink-0"
            >
              {copiedField === 'Full National Address' ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Full Address</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Address Fields Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              City / Province
            </span>
            <div className="text-sm font-bold text-white mt-1">
              {address.city}, {address.province}
            </div>
            <div className="text-xs text-slate-400">{address.country}</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              District
            </span>
            <div className="text-sm font-bold text-white mt-1">{address.district}</div>
            <div className="text-xs text-slate-400">Postal: {address.zipCode}</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">
                National Address Code
              </span>
              <div className="text-base font-mono font-black text-sky-300 mt-0.5">
                {address.nationalAddress}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(address.nationalAddress, 'National Short Code')}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 mt-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </button>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                ZIP / Postal Code
              </span>
              <div className="text-base font-mono font-black text-white mt-0.5">
                {address.zipCode}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(address.zipCode, 'Postal Code')}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 mt-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy ZIP</span>
            </button>
          </div>
        </div>

        {/* Full Formatted Delivery Address Box */}
        <div className="p-4 bg-slate-950/60 border border-slate-700/60 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Complete Logistics &amp; Courier Destination String (SPL / Aramex / DHL / Amazon):
            </span>
          </div>
          <p className="text-xs sm:text-sm font-mono text-slate-200 leading-relaxed select-all">
            {address.fullFormattedAddress}
          </p>
        </div>
      </div>

      {/* ==========================================
          EDIT CAMP ADDRESS MODAL
          ========================================== */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div
            onClick={() => setIsEditModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-2xl">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Edit Official Camp Address
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update facility name, national address code, and postal information
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSave} className="overflow-y-auto space-y-4 pr-1 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Building Name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Building / Facility Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formBuilding}
                      onChange={(e) => setFormBuilding(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Main Location */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Main Location / Project Village <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formMainLocation}
                      onChange={(e) => setFormMainLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* District */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      District <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Province */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Province / Region
                    </label>
                    <input
                      type="text"
                      value={formProvince}
                      onChange={(e) => setFormProvince(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Country */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* National Address Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      National Address Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formNationalAddress}
                      onChange={(e) => setFormNationalAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  {/* ZIP Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      ZIP / Postal Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formZipCode}
                      onChange={(e) => setFormZipCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  {/* Full Formatted Address */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Full Formatted Logistics String
                    </label>
                    <textarea
                      rows={3}
                      value={formFormattedAddress}
                      onChange={(e) => setFormFormattedAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs active:scale-95"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
