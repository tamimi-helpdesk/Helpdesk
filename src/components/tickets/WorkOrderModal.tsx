import React, { useState } from 'react';
import {
  VillageStage,
  ClusterId,
  BuildingCategory,
  BuildingFloor,
  TicketPriority,
  TicketStatus,
  TicketTradeCategory,
  WorkOrderTicket,
  AssignedTechnician,
  MaterialPartUsed,
} from '../../types/ticket';
import {
  TRADE_CATEGORIES,
  TECHNICIAN_ROSTER,
  STANDARD_SPARE_PARTS,
  generateLocationCode,
} from '../../data/villageStructure';
import { VillageLocationPicker } from './VillageLocationPicker';
import {
  X,
  Plus,
  Trash2,
  Wrench,
  AlertTriangle,
  Clock,
  User,
  Shield,
  Phone,
  FileText,
  Package,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketData: any) => void;
  initialData?: WorkOrderTicket | null;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  if (!isOpen) return null;

  // Location State
  const [stage, setStage] = useState<VillageStage>(initialData?.stage || 'Stage 1');
  const [cluster, setCluster] = useState<ClusterId>(initialData?.cluster || 'H');
  const [buildingNumber, setBuildingNumber] = useState<number>(initialData?.buildingNumber || 1);
  const [buildingCategory, setBuildingCategory] = useState<BuildingCategory>(
    initialData?.buildingCategory || 'Executive'
  );
  const [floor, setFloor] = useState<BuildingFloor>(initialData?.floor || 'GF');
  const [unitNumber, setUnitNumber] = useState<string>(initialData?.unitNumber || '001');
  const [isToilet, setIsToilet] = useState<boolean>(initialData?.isToilet || false);
  const [bedNumber, setBedNumber] = useState<'Bed A' | 'Bed B' | undefined>(initialData?.bedNumber);

  // Defect Details
  const [category, setCategory] = useState<TicketTradeCategory>(initialData?.category || 'HVAC');
  const [subCategory, setSubCategory] = useState<string>(
    initialData?.subCategory || TRADE_CATEGORIES.HVAC.subCategories[0]
  );
  const [priority, setPriority] = useState<TicketPriority>(
    initialData?.priority || 'P2 - High'
  );
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [description, setDescription] = useState<string>(initialData?.description || '');

  // Reporter Details
  const [reporterName, setReporterName] = useState<string>(initialData?.reporterName || '');
  const [reporterBadge, setReporterBadge] = useState<string>(initialData?.reporterBadge || '');
  const [reporterPhone, setReporterPhone] = useState<string>(initialData?.reporterPhone || '+966 5');
  const [reporterDepartment, setReporterDepartment] = useState<string>(
    initialData?.reporterDepartment || 'RSG Facility Operations'
  );
  const [company, setCompany] = useState<'Red Sea Global' | 'TAMIMI Global' | 'Subcontractor / Partner'>(
    initialData?.company || 'Red Sea Global'
  );

  // Technician Dispatch
  const [selectedTechId, setSelectedTechId] = useState<string>(
    initialData?.assignedTechnician?.id || ''
  );
  const [etaMinutes, setEtaMinutes] = useState<number>(
    initialData?.assignedTechnician?.etaMinutes || 30
  );

  // Materials requisition
  const [materials, setMaterials] = useState<MaterialPartUsed[]>(
    initialData?.materialsUsed || []
  );

  const handleCategoryChange = (newCat: TicketTradeCategory) => {
    setCategory(newCat);
    setSubCategory(TRADE_CATEGORIES[newCat].subCategories[0] || '');
  };

  const handleAddMaterial = (itemCode: string) => {
    const part = STANDARD_SPARE_PARTS.find((p) => p.itemCode === itemCode);
    if (!part) return;
    const existing = materials.find((m) => m.itemCode === itemCode);
    if (existing) {
      setMaterials(
        materials.map((m) =>
          m.itemCode === itemCode ? { ...m, quantity: m.quantity + 1 } : m
        )
      );
    } else {
      setMaterials([
        ...materials,
        {
          id: `MAT-${Date.now()}-${materials.length + 1}`,
          itemCode: part.itemCode,
          description: part.description,
          quantity: 1,
          unit: part.unit,
          cost: part.cost,
        },
      ]);
    }
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !reporterName.trim()) {
      alert('Please fill in Issue Title, Description, and Reporter Name.');
      return;
    }

    const locationCode = generateLocationCode(
      stage,
      cluster,
      buildingCategory,
      buildingNumber,
      floor,
      unitNumber,
      bedNumber
    );

    let assignedTechnician: AssignedTechnician | undefined = undefined;
    if (selectedTechId) {
      const tech = TECHNICIAN_ROSTER.find((t) => t.id === selectedTechId);
      if (tech) {
        assignedTechnician = {
          id: tech.id,
          name: tech.name,
          trade: tech.trade,
          phone: tech.phone,
          assignedAt: new Date().toISOString(),
          etaMinutes,
        };
      }
    }

    const payload = {
      project: 'Amaala Construction Village',
      client: 'Red Sea Global',
      stage,
      cluster,
      clusterType: (cluster === 'H' || cluster === 'L' || cluster === 'D' ? 'VIP' : 'WORKERS') as 'VIP' | 'WORKERS',
      buildingNumber,
      buildingCategory,
      floor,
      unitNumber,
      isToilet,
      bedNumber,
      locationCode,
      category,
      subCategory,
      priority,
      status: (assignedTechnician ? 'ASSIGNED' : 'NEW') as TicketStatus,
      title: title.trim(),
      description: description.trim(),
      reporterName: reporterName.trim(),
      reporterBadge: reporterBadge.trim(),
      reporterPhone: reporterPhone.trim(),
      reporterDepartment: reporterDepartment.trim(),
      company,
      assignedTechnician,
      propertyName: initialData?.propertyName || `TBCV${stage.replace('Stage ', '')}, AMAALA ${stage.toUpperCase()}`,
      spaceName: initialData?.spaceName || `Building ${buildingNumber} Floor ${floor} Unit ${unitNumber}`,
      orderGroup: initialData?.orderGroup,
      comment: initialData?.comment || description.trim(),
      planonPriority: initialData?.planonPriority || (priority.includes('P1') ? 'AMA_P1, Critical (Immediate)' : priority.includes('P2') ? 'AMA_P2, High (Urgent)' : 'AMA_P3, Low (Routine)'),
      timeToCompleteScore: initialData?.timeToCompleteScore ?? 1,
      materialsUsed: materials,
    };

    onSubmit(payload);
    onClose();
  };

  // Filter tech roster by matching trade
  const tradeTechs = TECHNICIAN_ROSTER.filter((t) => t.trade === category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {initialData ? 'Edit Work Order' : 'Log New Helpdesk Work Order'}
                </h3>
                <span className="rounded-full bg-sky-100 dark:bg-sky-950/80 px-2.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                  Amaala Village
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Red Sea Global (RSG) Client Operations & TAMIMI HelpDesk Service Desk
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Village Location Picker (ACV Hierarchy) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-sky-500" />
              Facility Village Location & Unit Specification
            </h4>
            <VillageLocationPicker
              selectedStage={stage}
              onStageChange={setStage}
              selectedCluster={cluster}
              onClusterChange={setCluster}
              selectedBuildingNumber={buildingNumber}
              onBuildingChange={(num, cat) => {
                setBuildingNumber(num);
                setBuildingCategory(cat);
              }}
              selectedFloor={floor}
              onFloorChange={setFloor}
              selectedUnit={unitNumber}
              onUnitChange={(u, toilet, bed) => {
                setUnitNumber(u);
                setIsToilet(!!toilet);
                setBedNumber(bed);
              }}
              selectedBed={bedNumber}
            />
          </div>

          {/* 2. Trade Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Trade Category
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as TicketTradeCategory)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                {Object.values(TRADE_CATEGORIES).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Sub Category */}
              <div className="mt-2.5">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Common Issue Classification
                </label>
                <select
                  value={subCategory}
                  onChange={(e) => {
                    setSubCategory(e.target.value);
                    if (!title) setTitle(e.target.value);
                  }}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  {TRADE_CATEGORIES[category].subCategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority & SLA Target */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Urgency Priority (SLA Target)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'P1 - Critical / Emergency', label: 'P1 - Critical', time: '2 Hrs SLA', color: 'border-red-500 text-red-600 dark:text-red-400 bg-red-500/10' },
                  { id: 'P2 - High', label: 'P2 - High', time: '4 Hrs SLA', color: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10' },
                  { id: 'P3 - Medium', label: 'P3 - Medium', time: '12 Hrs SLA', color: 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10' },
                  { id: 'P4 - Low / Normal', label: 'P4 - Normal', time: '48 Hrs SLA', color: 'border-slate-400 text-slate-600 dark:text-slate-300 bg-slate-500/10' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id as TicketPriority)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      priority === p.id
                        ? `${p.color} ring-2 ring-current font-bold shadow-sm`
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className="text-[10px] opacity-80">{p.time}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Issue Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Order Subject / Problem Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Executive Suite 003 Split AC High Temperature Alarm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Detailed Defect Observation & Resident Remarks *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe the exact fault, symptoms, equipment tag, or resident safety precautions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* 4. Reporter Details */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-sky-500" />
              Reporter & Resident Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eng. Mansour"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Company / Organization
                </label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Red Sea Global">Red Sea Global (RSG)</option>
                  <option value="TAMIMI Global">TAMIMI Global (TAFGA)</option>
                  <option value="Subcontractor / Partner">Subcontractor / Partner</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  RSG Badge ID / ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. RSG-DIR-104"
                  value={reporterBadge}
                  onChange={(e) => setReporterBadge(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Contact Mobile
                </label>
                <input
                  type="tel"
                  placeholder="+966 50 123 4567"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 5. Dispatch Technician (Optional) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-sky-500" />
                Immediate Technician Dispatch (Optional)
              </h4>
              <span className="text-[11px] text-slate-400">
                Filtered for {category} Trade
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">-- No Technician Assigned (Pending Dispatch) --</option>
                  {tradeTechs.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.trade}) - {tech.phone} [{tech.status}]
                    </option>
                  ))}
                  {TECHNICIAN_ROSTER.filter((t) => t.trade !== category).map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} (Other: {tech.trade}) - {tech.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 whitespace-nowrap">ETA (Mins):</span>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    step={5}
                    value={etaMinutes}
                    onChange={(e) => setEtaMinutes(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 6. Spare Parts Requisition (Optional) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-amber-500" />
                Store Spare Parts & Materials Requisition
              </h4>
              <span className="text-[11px] text-slate-400">
                {materials.length} Items Requisitioned
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {STANDARD_SPARE_PARTS.slice(0, 6).map((part) => (
                <button
                  key={part.itemCode}
                  type="button"
                  onClick={() => handleAddMaterial(part.itemCode)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>{part.description.split('/')[0]}</span>
                </button>
              ))}
            </div>

            {materials.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 px-3 py-1.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {m.description}
                      </span>
                      <span className="ml-2 font-mono text-[10px] text-slate-400">
                        ({m.itemCode})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Qty: {m.quantity} {m.unit}
                      </span>
                      {m.cost && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {(m.cost * m.quantity).toFixed(0)} SAR
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(m.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/30 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>{initialData ? 'Save Changes' : 'Generate & Dispatch Work Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
