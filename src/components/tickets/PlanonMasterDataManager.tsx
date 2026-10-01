import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  DoorOpen,
  Tag,
  Wrench,
  Users,
  Briefcase,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  PlanonMasterStore,
  PlanonCategoryItem,
  PlanonRequestorItem,
  PlanonAssetItem,
  detectFloorFromSpace,
} from '../../services/planonMasterStore';
import { PlanonSpaceItem } from '../../data/planonMasterData';

type ManageTab = 'PROPERTIES' | 'SPACES' | 'CATEGORIES' | 'ASSETS' | 'REQUESTORS' | 'CUSTOMERS';

export function PlanonMasterDataManager({ onBack }: { onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState<ManageTab>('PROPERTIES');
  const [tick, setTick] = useState(0);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState<'ALL' | 'GF' | 'FF'>('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [disciplineFilter, setDisciplineFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Re-render when store updates
  useEffect(() => {
    const unsub = PlanonMasterStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  // Fetch live master data
  const properties = useMemo(() => PlanonMasterStore.getAllProperties(), [tick]);
  const spaces = useMemo(() => PlanonMasterStore.getAllSpaces(), [tick]);
  const categories = useMemo(() => PlanonMasterStore.getCategories(), [tick]);
  const assets = useMemo(() => PlanonMasterStore.getAssets(), [tick]);
  const requestors = useMemo(() => PlanonMasterStore.getRequestors(), [tick]);
  const customers = useMemo(() => PlanonMasterStore.getCustomers(), [tick]);

  // Space count per property for display
  const spaceCountByProp = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sp of spaces) {
      const parts = sp.spaceNumber.split('-');
      if (parts.length >= 3) {
        const p = `${parts[0]}-${parts[1]}-${parts[2]}`;
        counts[p] = (counts[p] || 0) + 1;
      }
    }
    return counts;
  }, [spaces]);

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return properties.filter((p) => {
      if (!q) return true;
      return p.toLowerCase().includes(q);
    });
  }, [properties, searchQuery]);

  // Filtered Spaces
  const filteredSpaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return spaces.filter((s) => {
      if (propertyFilter !== 'ALL') {
        if (!s.spaceNumber.toLowerCase().includes(propertyFilter.toLowerCase()) && s.building !== propertyFilter) {
          return false;
        }
      }
      if (stageFilter !== 'ALL') {
        if (s.stage !== stageFilter) return false;
      }
      if (floorFilter !== 'ALL') {
        const flr = detectFloorFromSpace(s.spaceNumber);
        if (flr !== floorFilter) return false;
      }
      if (q) {
        const matchesQ =
          s.spaceNumber.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.building.toLowerCase().includes(q) ||
          s.unit.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }
      return true;
    });
  }, [spaces, propertyFilter, stageFilter, floorFilter, searchQuery]);

  // Paginated Spaces
  const totalSpacePages = Math.ceil(filteredSpaces.length / pageSize) || 1;
  const paginatedSpaces = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSpaces.slice(start, start + pageSize);
  }, [filteredSpaces, currentPage, pageSize]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((c) => {
      if (disciplineFilter !== 'ALL' && c.discipline !== disciplineFilter) return false;
      if (q) {
        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.discipline.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categories, disciplineFilter, searchQuery]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return assets.filter((a) => {
      if (q) {
        return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [assets, searchQuery]);

  // Filtered Requestors
  const filteredRequestors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return requestors.filter((r) => {
      if (q) {
        return (
          r.badge.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.dept.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requestors, searchQuery]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      if (q) return c.toLowerCase().includes(q);
      return true;
    });
  }, [customers, searchQuery]);

  // In-App Confirmation Modal (Eliminates window.confirm issues in iframes)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Modals / Edit states
  const [propertyModal, setPropertyModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; originalCode?: string; code: string }>({
    isOpen: false,
    mode: 'add',
    code: '',
  });

  const [spaceModal, setSpaceModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    originalSpaceNumber?: string;
    data: {
      spaceNumber: string;
      name: string;
      stage: string;
      cluster: string;
      building: string;
      unit: string;
    };
  }>({
    isOpen: false,
    mode: 'add',
    data: {
      spaceNumber: '',
      name: '',
      stage: 'Stage 1',
      cluster: 'H',
      building: 'H01',
      unit: '001',
    },
  });

  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    id?: string;
    data: { code: string; name: string; discipline: string };
  }>({
    isOpen: false,
    mode: 'add',
    data: { code: '', name: '', discipline: 'Civil' },
  });

  const [assetModal, setAssetModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    originalCode?: string;
    data: { code: string; name: string; category: string };
  }>({
    isOpen: false,
    mode: 'add',
    data: { code: '', name: '', category: 'Civil / Furniture' },
  });

  const [requestorModal, setRequestorModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    originalBadge?: string;
    data: { badge: string; name: string; dept: string; role: string };
  }>({
    isOpen: false,
    mode: 'add',
    data: { badge: '', name: '', dept: 'Operations & Maintenance', role: 'Technician' },
  });

  const [customerModal, setCustomerModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    originalName?: string;
    name: string;
  }>({
    isOpen: false,
    mode: 'add',
    name: '',
  });

  // Action Handlers
  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = propertyModal.code.trim().toUpperCase();
    if (!clean) return;

    if (propertyModal.mode === 'add') {
      PlanonMasterStore.addProperty(clean);
      showToast(`Property "${clean}" created successfully.`);
    } else if (propertyModal.originalCode) {
      PlanonMasterStore.updateProperty(propertyModal.originalCode, clean);
      showToast(`Property updated to "${clean}".`);
    }
    setPropertyModal({ isOpen: false, mode: 'add', code: '' });
  };

  const handleSaveSpace = (e: React.FormEvent) => {
    e.preventDefault();
    const { spaceNumber, name, stage, cluster, building, unit } = spaceModal.data;
    const cleanNum = spaceNumber.trim().toUpperCase();
    if (!cleanNum) return;

    const item: PlanonSpaceItem = {
      code: `SPACE-${cleanNum}`,
      spaceNumber: cleanNum,
      name: name.trim() || `Room ${unit}`,
      stage,
      cluster,
      building,
      unit,
    };

    if (spaceModal.mode === 'add') {
      PlanonMasterStore.addSpace(item);
      showToast(`Space "${cleanNum}" registered.`);
    } else if (spaceModal.originalSpaceNumber) {
      PlanonMasterStore.updateSpace(spaceModal.originalSpaceNumber, item);
      showToast(`Space "${cleanNum}" updated.`);
    }
    setSpaceModal({
      isOpen: false,
      mode: 'add',
      data: { spaceNumber: '', name: '', stage: 'Stage 1', cluster: 'H', building: 'H01', unit: '001' },
    });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const { code, name, discipline } = categoryModal.data;
    if (!code.trim() || !name.trim()) return;

    if (categoryModal.mode === 'add') {
      PlanonMasterStore.addCategory({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        discipline,
      });
      showToast(`Category "${code.trim().toUpperCase()}" created.`);
    } else if (categoryModal.id) {
      PlanonMasterStore.updateCategory(categoryModal.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        discipline,
      });
      showToast(`Category "${code.trim().toUpperCase()}" updated.`);
    }
    setCategoryModal({ isOpen: false, mode: 'add', data: { code: '', name: '', discipline: 'Civil' } });
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const { code, name, category } = assetModal.data;
    if (!code.trim() || !name.trim()) return;

    const item: PlanonAssetItem = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
    };

    if (assetModal.mode === 'add') {
      PlanonMasterStore.addAsset(item);
      showToast(`Asset "${item.code}" created.`);
    } else if (assetModal.originalCode) {
      PlanonMasterStore.updateAsset(assetModal.originalCode, item);
      showToast(`Asset "${item.code}" updated.`);
    }
    setAssetModal({ isOpen: false, mode: 'add', data: { code: '', name: '', category: 'Civil / Furniture' } });
  };

  const handleSaveRequestor = (e: React.FormEvent) => {
    e.preventDefault();
    const { badge, name, dept, role } = requestorModal.data;
    if (!badge.trim() || !name.trim()) return;

    const item: PlanonRequestorItem = {
      badge: badge.trim(),
      name: name.trim(),
      dept: dept.trim(),
      role: role.trim(),
    };

    if (requestorModal.mode === 'add') {
      PlanonMasterStore.addRequestor(item);
      showToast(`Personnel "${item.name}" registered.`);
    } else if (requestorModal.originalBadge) {
      PlanonMasterStore.updateRequestor(requestorModal.originalBadge, item);
      showToast(`Personnel "${item.name}" updated.`);
    }
    setRequestorModal({
      isOpen: false,
      mode: 'add',
      data: { badge: '', name: '', dept: 'Operations & Maintenance', role: 'Technician' },
    });
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customerModal.name.trim();
    if (!clean) return;

    if (customerModal.mode === 'add') {
      PlanonMasterStore.addCustomer(clean);
      showToast(`Customer "${clean}" added.`);
    } else if (customerModal.originalName) {
      PlanonMasterStore.updateCustomer(customerModal.originalName, clean);
      showToast(`Customer updated to "${clean}".`);
    }
    setCustomerModal({ isOpen: false, mode: 'add', name: '' });
  };

  const handleResetToFactory = () => {
    setConfirmModal({
      title: 'Reset Master Data',
      message: 'Are you sure you want to reset all master data to official factory defaults? Any custom modifications will be cleared.',
      confirmText: 'Reset to Factory',
      onConfirm: () => {
        PlanonMasterStore.resetToFactory();
        showToast('All facility master data restored to factory specifications.');
      },
    });
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs overflow-hidden animate-in fade-in duration-150">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Row 1: Sleek Category Tabs & Reset Action */}
      <div className="shrink-0 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5 flex-wrap">
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('PROPERTIES');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'PROPERTIES'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Properties</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-600 font-mono">
              {properties.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('SPACES');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'SPACES'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <DoorOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rooms & Spaces</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-600 font-mono">
              {spaces.length.toLocaleString()}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('CATEGORIES');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'CATEGORIES'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Tag className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Request Categories</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-600 font-mono">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ASSETS');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'ASSETS'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Wrench className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Assets</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-600 font-mono">
              {assets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('REQUESTORS');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'REQUESTORS'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span>Personnel</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-600 font-mono">
              {requestors.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('CUSTOMERS');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'CUSTOMERS'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>Customers</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-600 font-mono">
              {customers.length}
            </span>
          </button>
        </div>

        {/* Reset to Default Button */}
        <button
          type="button"
          onClick={handleResetToFactory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
          title="Restore factory default master data"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Row 2: Search, Filters & Add Entity Button */}
      <div className="shrink-0 flex items-center justify-between gap-2.5 mb-2.5 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-2xl flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Spaces Specific Filters */}
          {activeTab === 'SPACES' && (
            <>
              <select
                value={stageFilter}
                onChange={(e) => {
                  setStageFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                <option value="ALL">All Stages</option>
                <option value="Stage 1">Stage 1</option>
                <option value="Stage 2">Stage 2</option>
                <option value="Stage 3">Stage 3</option>
              </select>

              <select
                value={floorFilter}
                onChange={(e) => {
                  setFloorFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                <option value="ALL">All Floors</option>
                <option value="GF">Ground Floor (GF)</option>
                <option value="FF">First Floor (FF)</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer"
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </>
          )}

          {/* Categories Specific Filter */}
          {activeTab === 'CATEGORIES' && (
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              <option value="ALL">All Disciplines</option>
              <option value="Civil">Civil</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="HVAC">HVAC</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Equipment">Equipment</option>
              <option value="Fire Systems">Fire Systems</option>
              <option value="General">General</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="HSE">HSE</option>
              <option value="IT">IT</option>
              <option value="Landscaping">Landscaping</option>
              <option value="Laundry">Laundry</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Pest Control">Pest Control</option>
              <option value="Waste Management">Waste Management</option>
            </select>
          )}
        </div>

        {/* Add Entity Buttons */}
        <div>
          {activeTab === 'PROPERTIES' && (
            <button
              type="button"
              onClick={() => setPropertyModal({ isOpen: true, mode: 'add', code: '' })}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Property</span>
            </button>
          )}

          {activeTab === 'SPACES' && (
            <button
              type="button"
              onClick={() =>
                setSpaceModal({
                  isOpen: true,
                  mode: 'add',
                  data: {
                    spaceNumber: '',
                    name: '',
                    stage: 'Stage 1',
                    cluster: 'H',
                    building: 'H01',
                    unit: '001',
                  },
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Room / Space</span>
            </button>
          )}

          {activeTab === 'CATEGORIES' && (
            <button
              type="button"
              onClick={() =>
                setCategoryModal({
                  isOpen: true,
                  mode: 'add',
                  data: { code: '', name: '', discipline: 'Civil' },
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Category</span>
            </button>
          )}

          {activeTab === 'ASSETS' && (
            <button
              type="button"
              onClick={() =>
                setAssetModal({
                  isOpen: true,
                  mode: 'add',
                  data: { code: '', name: '', category: 'Civil / Furniture' },
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Asset</span>
            </button>
          )}

          {activeTab === 'REQUESTORS' && (
            <button
              type="button"
              onClick={() =>
                setRequestorModal({
                  isOpen: true,
                  mode: 'add',
                  data: { badge: '', name: '', dept: 'Operations & Maintenance', role: 'Technician' },
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Personnel</span>
            </button>
          )}

          {activeTab === 'CUSTOMERS' && (
            <button
              type="button"
              onClick={() => setCustomerModal({ isOpen: true, mode: 'add', name: '' })}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 3: Main Data Viewport with Guaranteed Scrollability */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
        
        {/* Tab 1: Properties Table */}
        {activeTab === 'PROPERTIES' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5">Property / Location Code</th>
                <th className="px-4 py-2.5">Stage / Zone</th>
                <th className="px-4 py-2.5">Registered Rooms</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No properties found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredProperties.map((prop) => {
                  const roomCount = spaceCountByProp[prop] || 0;
                  let stageBadge = 'Stage 1';
                  if (prop.startsWith('TBCV2')) stageBadge = 'Stage 2';
                  else if (prop.startsWith('TBCV3')) stageBadge = 'Stage 3';

                  return (
                    <tr key={prop} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-2.5 font-bold font-mono text-blue-600 dark:text-blue-400">
                        {prop}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                          {stageBadge}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">
                        {roomCount > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {roomCount} rooms
                          </span>
                        ) : (
                          <span className="text-slate-400">0 rooms</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => setPropertyModal({ isOpen: true, mode: 'edit', originalCode: prop, code: prop })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Edit Property Code"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              title: 'Delete Property',
                              message: `Are you sure you want to delete property "${prop}"?`,
                              onConfirm: () => {
                                PlanonMasterStore.deleteProperty(prop);
                                showToast(`Property "${prop}" deleted.`);
                              },
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-500 transition-colors cursor-pointer"
                          title="Delete Property"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Tab 2: Spaces Table */}
        {activeTab === 'SPACES' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5">Space Number</th>
                <th className="px-4 py-2.5">Room Name / Label</th>
                <th className="px-4 py-2.5">Building & Cluster</th>
                <th className="px-4 py-2.5">Floor</th>
                <th className="px-4 py-2.5">Unit</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedSpaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No rooms found matching filters.
                  </td>
                </tr>
              ) : (
                paginatedSpaces.map((sp) => {
                  const flr = detectFloorFromSpace(sp.spaceNumber);

                  return (
                    <tr key={sp.spaceNumber} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-2 font-bold font-mono text-blue-600 dark:text-blue-400">
                        {sp.spaceNumber}
                      </td>
                      <td className="px-4 py-2 text-slate-800 dark:text-slate-200 font-medium">
                        {sp.name}
                      </td>
                      <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                        {sp.stage} • Cl {sp.cluster} • Bldg {sp.building}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            flr === 'FF'
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {flr === 'FF' ? 'First Floor (FF)' : 'Ground Floor (GF)'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-500 font-mono text-[11px]">{sp.unit}</td>
                      <td className="px-4 py-2 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() =>
                            setSpaceModal({
                              isOpen: true,
                              mode: 'edit',
                              originalSpaceNumber: sp.spaceNumber,
                              data: {
                                spaceNumber: sp.spaceNumber,
                                name: sp.name,
                                stage: sp.stage,
                                cluster: sp.cluster,
                                building: sp.building,
                                unit: sp.unit,
                              },
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Edit Room / Space"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              title: 'Delete Room / Space',
                              message: `Are you sure you want to delete space "${sp.spaceNumber}"?`,
                              onConfirm: () => {
                                PlanonMasterStore.deleteSpace(sp.spaceNumber);
                                showToast(`Space "${sp.spaceNumber}" deleted.`);
                              },
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-500 transition-colors cursor-pointer"
                          title="Delete Space"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Tab 3: Categories Table */}
        {activeTab === 'CATEGORIES' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Discipline</th>
                <th className="px-4 py-2.5">Defect Description / Scope</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5 font-bold font-mono text-blue-600 dark:text-blue-400">
                      {cat.code}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                        {cat.discipline}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                      {cat.name}
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCategoryModal({
                            isOpen: true,
                            mode: 'edit',
                            id: cat.id,
                            data: { code: cat.code, name: cat.name, discipline: cat.discipline },
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmModal({
                            title: 'Delete Request Category',
                            message: `Are you sure you want to delete category "${cat.code}"?`,
                            onConfirm: () => {
                              PlanonMasterStore.deleteCategory(cat.id);
                              showToast(`Category "${cat.code}" deleted.`);
                            },
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-500 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Tab 4: Assets Table */}
        {activeTab === 'ASSETS' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5">Asset Tag / Code</th>
                <th className="px-4 py-2.5">Asset Name</th>
                <th className="px-4 py-2.5">Category / Trade</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No assets found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((ast) => (
                  <tr key={ast.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5 font-bold font-mono text-blue-600 dark:text-blue-400">
                      {ast.code}
                    </td>
                    <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                      {ast.name}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                        {ast.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() =>
                          setAssetModal({
                            isOpen: true,
                            mode: 'edit',
                            originalCode: ast.code,
                            data: { code: ast.code, name: ast.name, category: ast.category },
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Edit Asset"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmModal({
                            title: 'Delete Asset',
                            message: `Are you sure you want to delete asset "${ast.code}"?`,
                            onConfirm: () => {
                              PlanonMasterStore.deleteAsset(ast.code);
                              showToast(`Asset "${ast.code}" deleted.`);
                            },
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-500 transition-colors cursor-pointer"
                        title="Delete Asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Tab 5: Requestors Table */}
        {activeTab === 'REQUESTORS' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5">Badge ID</th>
                <th className="px-4 py-2.5">Full Name</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequestors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No personnel found.
                  </td>
                </tr>
              ) : (
                filteredRequestors.map((req) => (
                  <tr key={req.badge} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5 font-bold font-mono text-blue-600 dark:text-blue-400">
                      {req.badge}
                    </td>
                    <td className="px-4 py-2.5 text-slate-900 dark:text-slate-100 font-bold">
                      {req.name}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                      {req.dept}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                        {req.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() =>
                          setRequestorModal({
                            isOpen: true,
                            mode: 'edit',
                            originalBadge: req.badge,
                            data: { badge: req.badge, name: req.name, dept: req.dept, role: req.role },
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Edit Personnel"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmModal({
                            title: 'Delete Staff Personnel',
                            message: `Are you sure you want to delete "${req.name}" (${req.badge})?`,
                            onConfirm: () => {
                              PlanonMasterStore.deleteRequestor(req.badge);
                              showToast(`Personnel "${req.name}" deleted.`);
                            },
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-500 transition-colors cursor-pointer"
                        title="Delete Requestor"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Tab 6: Customers Table */}
        {activeTab === 'CUSTOMERS' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5">Customer / Organization Name</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                      {cust}
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCustomerModal({
                            isOpen: true,
                            mode: 'edit',
                            originalName: cust,
                            name: cust,
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Edit Customer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmModal({
                            title: 'Delete Customer',
                            message: `Are you sure you want to delete customer "${cust}"?`,
                            onConfirm: () => {
                              PlanonMasterStore.deleteCustomer(cust);
                              showToast(`Customer "${cust}" deleted.`);
                            },
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-500 transition-colors cursor-pointer"
                        title="Delete Customer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Row 4: Spaces Pagination Bar */}
      {activeTab === 'SPACES' && (
        <div className="shrink-0 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredSpaces.length)} of {filteredSpaces.length.toLocaleString()} rooms
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold px-2">
              Page {currentPage} of {totalSpacePages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalSpacePages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalSpacePages))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {confirmModal.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Please confirm to proceed.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Property */}
      {propertyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {propertyModal.mode === 'add' ? 'Add Property / Location' : 'Edit Property Code'}
              </h3>
              <button
                type="button"
                onClick={() => setPropertyModal({ isOpen: false, mode: 'add', code: '' })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Property Code (e.g. TBCV1-H-H16 or TBCV2-I-I12)
                </label>
                <input
                  type="text"
                  required
                  value={propertyModal.code}
                  onChange={(e) => setPropertyModal((p) => ({ ...p, code: e.target.value }))}
                  placeholder="e.g. TBCV1-H-H16"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPropertyModal({ isOpen: false, mode: 'add', code: '' })}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  {propertyModal.mode === 'add' ? 'Save Property' : 'Update Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Room / Space */}
      {spaceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {spaceModal.mode === 'add' ? 'Add Room / Space' : 'Edit Room / Space'}
              </h3>
              <button
                type="button"
                onClick={() => setSpaceModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSpace} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stage
                  </label>
                  <select
                    value={spaceModal.data.stage}
                    onChange={(e) =>
                      setSpaceModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, stage: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="Stage 1">Stage 1 (H, G, F, E)</option>
                    <option value="Stage 2">Stage 2 (I, J, K, L)</option>
                    <option value="Stage 3">Stage 3 (A, B, C, D)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cluster
                  </label>
                  <input
                    type="text"
                    required
                    value={spaceModal.data.cluster}
                    onChange={(e) =>
                      setSpaceModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, cluster: e.target.value.toUpperCase() },
                      }))
                    }
                    placeholder="e.g. H"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Building Code
                  </label>
                  <input
                    type="text"
                    required
                    value={spaceModal.data.building}
                    onChange={(e) => {
                      const b = e.target.value.toUpperCase();
                      setSpaceModal((prev) => {
                        const newSpaceNum = `TBCV1-${prev.data.cluster}-${b}-${prev.data.unit}`;
                        return {
                          ...prev,
                          data: { ...prev.data, building: b, spaceNumber: prev.mode === 'add' ? newSpaceNum : prev.data.spaceNumber },
                        };
                      });
                    }}
                    placeholder="e.g. H01"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit / Room Number
                  </label>
                  <input
                    type="text"
                    required
                    value={spaceModal.data.unit}
                    onChange={(e) => {
                      const u = e.target.value;
                      setSpaceModal((prev) => {
                        const newSpaceNum = `TBCV1-${prev.data.cluster}-${prev.data.building}-${u}`;
                        return {
                          ...prev,
                          data: {
                            ...prev.data,
                            unit: u,
                            spaceNumber: prev.mode === 'add' ? newSpaceNum : prev.data.spaceNumber,
                            name: prev.data.name || `Room ${u}`,
                          },
                        };
                      });
                    }}
                    placeholder="e.g. 101 or 005"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Space Number / Location Code
                  </label>
                  {/* Live Floor Auto-Detection Badge */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Detected Floor: {detectFloorFromSpace(spaceModal.data.spaceNumber) === 'FF' ? 'First Floor (FF)' : 'Ground Floor (GF)'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={spaceModal.data.spaceNumber}
                  onChange={(e) =>
                    setSpaceModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, spaceNumber: e.target.value.toUpperCase() },
                    }))
                  }
                  placeholder="e.g. TBCV1-H-H01-101"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono font-bold text-blue-600 dark:text-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Room Label / Custom Name
                </label>
                <input
                  type="text"
                  value={spaceModal.data.name}
                  onChange={(e) =>
                    setSpaceModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, name: e.target.value },
                    }))
                  }
                  placeholder="e.g. Executive Bed 101"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSpaceModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  {spaceModal.mode === 'add' ? 'Register Space' : 'Update Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Category */}
      {categoryModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {categoryModal.mode === 'add' ? 'Add Request Category' : 'Edit Request Category'}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discipline / Trade
                </label>
                <select
                  value={categoryModal.data.discipline}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, discipline: e.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="Civil">Civil</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Fire Systems">Fire Systems</option>
                  <option value="General">General</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="HSE">HSE</option>
                  <option value="IT">IT</option>
                  <option value="Landscaping">Landscaping</option>
                  <option value="Laundry">Laundry</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Pest Control">Pest Control</option>
                  <option value="Waste Management">Waste Management</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Code (e.g. CV06 or EL04)
                </label>
                <input
                  type="text"
                  required
                  value={categoryModal.data.code}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, code: e.target.value.toUpperCase() },
                    }))
                  }
                  placeholder="e.g. CV06"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Defect Description / Scope of Work
                </label>
                <input
                  type="text"
                  required
                  value={categoryModal.data.name}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, name: e.target.value },
                    }))
                  }
                  placeholder="e.g. Civil - Ceramic floor tile replacement"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  {categoryModal.mode === 'add' ? 'Save Category' : 'Update Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Asset */}
      {assetModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {assetModal.mode === 'add' ? 'Add Asset / Tag' : 'Edit Asset'}
              </h3>
              <button
                type="button"
                onClick={() => setAssetModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAsset} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Tag / Code (e.g. AST-DRW-02)
                </label>
                <input
                  type="text"
                  required
                  value={assetModal.data.code}
                  onChange={(e) =>
                    setAssetModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, code: e.target.value.toUpperCase() },
                    }))
                  }
                  placeholder="e.g. AST-DRW-02"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Name / Spec
                </label>
                <input
                  type="text"
                  required
                  value={assetModal.data.name}
                  onChange={(e) =>
                    setAssetModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, name: e.target.value },
                    }))
                  }
                  placeholder="e.g. Under-bed Storage Drawer Frame"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category / Trade
                </label>
                <input
                  type="text"
                  required
                  value={assetModal.data.category}
                  onChange={(e) =>
                    setAssetModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, category: e.target.value },
                    }))
                  }
                  placeholder="e.g. Civil / Woodwork"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssetModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  {assetModal.mode === 'add' ? 'Save Asset' : 'Update Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Personnel */}
      {requestorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {requestorModal.mode === 'add' ? 'Add Personnel / Requestor' : 'Edit Personnel'}
              </h3>
              <button
                type="button"
                onClick={() => setRequestorModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveRequestor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Badge ID (e.g. TBCV_2616192)
                </label>
                <input
                  type="text"
                  required
                  value={requestorModal.data.badge}
                  onChange={(e) =>
                    setRequestorModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, badge: e.target.value },
                    }))
                  }
                  placeholder="e.g. TBCV_2616192"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={requestorModal.data.name}
                  onChange={(e) =>
                    setRequestorModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, name: e.target.value },
                    }))
                  }
                  placeholder="e.g. ALI, HASSAN"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={requestorModal.data.dept}
                  onChange={(e) =>
                    setRequestorModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, dept: e.target.value },
                    }))
                  }
                  placeholder="e.g. Civil Maintenance"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  required
                  value={requestorModal.data.role}
                  onChange={(e) =>
                    setRequestorModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, role: e.target.value },
                    }))
                  }
                  placeholder="e.g. Lead Carpenter"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestorModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  {requestorModal.mode === 'add' ? 'Save Personnel' : 'Update Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Customer */}
      {customerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {customerModal.mode === 'add' ? 'Add Client / Customer' : 'Edit Customer'}
              </h3>
              <button
                type="button"
                onClick={() => setCustomerModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer / Entity Name
                </label>
                <input
                  type="text"
                  required
                  value={customerModal.name}
                  onChange={(e) => setCustomerModal((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Red Sea Global (RSG) - Project Offices"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomerModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  {customerModal.mode === 'add' ? 'Save Customer' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
