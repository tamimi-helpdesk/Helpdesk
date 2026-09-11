import React, { useEffect, useState, useRef } from 'react';
import { WorkOrderTicket } from '../../types/ticket';
import { X, Printer, CheckCircle2, Shield } from 'lucide-react';
import QRCode from 'qrcode';

interface WorkOrderPrintModalProps {
  ticket: WorkOrderTicket | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkOrderPrintModal: React.FC<WorkOrderPrintModalProps> = ({
  ticket,
  isOpen,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket) {
      const qrPayload = JSON.stringify({
        wo: ticket.ticketNumber,
        proj: 'Amaala Construction Village',
        client: 'Red Sea Global',
        loc: ticket.locationCode,
        priority: ticket.priority,
        cat: ticket.category,
        date: ticket.createdAt,
      });

      QRCode.toDataURL(qrPayload, { width: 140, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code error', err));
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl max-h-[95vh] flex flex-col rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden print:shadow-none print:max-h-none print:rounded-none print:w-full">
        {/* Screen Controls Header (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Work Order Print Preview ({ticket.ticketNumber})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print Official Slip</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document */}
        <div
          ref={printAreaRef}
          className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white font-sans text-slate-900 print:overflow-visible print:p-4"
        >
          {/* Header with RSG & TAMIMI Logos */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-sky-800">
                  RED SEA GLOBAL · OFFICIAL MAINTENANCE SLIP
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  Amaala Construction Village
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Facility Management & Engineering Maintenance Work Order
                </p>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Contractor: TAMIMI Global Company Ltd. (TAFGA) · Helpdesk Ops
                </p>
              </div>

              {qrDataUrl && (
                <div className="text-center">
                  <img src={qrDataUrl} alt="QR Verification" className="h-20 w-20 mx-auto" />
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Scan to Verify</span>
                </div>
              )}
            </div>

            {/* Sub banner with Work Order Number and Priority */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-100 p-2.5 text-xs">
              <div>
                <span className="font-semibold text-slate-500">WORK ORDER NUMBER: </span>
                <strong className="font-mono text-sm font-bold text-slate-900">{ticket.ticketNumber}</strong>
              </div>
              <div>
                <span className="font-semibold text-slate-500">PRIORITY: </span>
                <strong
                  className={`font-bold uppercase ${
                    ticket.priority.includes('P1') ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {ticket.priority}
                </strong>
              </div>
              <div>
                <span className="font-semibold text-slate-500">STATUS: </span>
                <strong className="font-bold text-slate-900 uppercase">{ticket.status}</strong>
              </div>
            </div>
          </div>

          {/* Location Details Grid */}
          <div className="mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-1 mb-2">
              1. Facility Village Location Particulars
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-200 rounded p-2.5">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Project</span>
                <span className="font-bold text-slate-800">Amaala Const. Village</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Client Customer</span>
                <span className="font-bold text-slate-800">Red Sea Global</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Stage</span>
                <span className="font-bold text-slate-800">{ticket.stage}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Cluster</span>
                <span className="font-bold text-slate-800">
                  Cluster {ticket.cluster} ({ticket.clusterType})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Building</span>
                <span className="font-bold text-slate-800">
                  {ticket.buildingCategory} Bld {ticket.buildingNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Floor</span>
                <span className="font-bold text-slate-800">{ticket.floor}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Unit / Room / Facility</span>
                <span className="font-bold text-slate-800">
                  {ticket.unitNumber}
                  {ticket.isToilet ? ' (Communal Toilet)' : ''}
                  {ticket.bedNumber ? ` [${ticket.bedNumber}]` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Location Tag</span>
                <span className="font-mono text-[10px] font-bold text-slate-800">{ticket.locationCode}</span>
              </div>
            </div>
          </div>

          {/* Defect Particulars */}
          <div className="mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-1 mb-2">
              2. Defect Description & Work Specifications
            </h2>
            <div className="border border-slate-200 rounded p-2.5 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Trade: </span>
                  <strong className="text-slate-800">{ticket.category}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Sub-Category: </span>
                  <strong className="text-slate-800">{ticket.subCategory}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Target SLA: </span>
                  <strong className="font-mono text-slate-800">
                    {new Date(ticket.targetResolutionTime).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Issue Title:</span>
                <div className="font-bold text-slate-900 text-sm">{ticket.title}</div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Detailed Defect / Observation:</span>
                <p className="text-slate-700 leading-relaxed text-xs whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
            </div>
          </div>

          {/* Personnel & Dispatch */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded p-2.5 text-xs">
              <h3 className="font-bold text-slate-800 text-[11px] uppercase border-b border-slate-200 pb-1 mb-1.5">
                Reporter / Resident
              </h3>
              <p>
                <strong>Name:</strong> {ticket.reporterName}
              </p>
              <p>
                <strong>Badge ID:</strong> {ticket.reporterBadge || 'N/A'}
              </p>
              <p>
                <strong>Phone:</strong> {ticket.reporterPhone}
              </p>
              <p>
                <strong>Department:</strong> {ticket.reporterDepartment}
              </p>
              <p>
                <strong>Company:</strong> {ticket.company}
              </p>
            </div>

            <div className="border border-slate-200 rounded p-2.5 text-xs">
              <h3 className="font-bold text-slate-800 text-[11px] uppercase border-b border-slate-200 pb-1 mb-1.5">
                Assigned Maintenance Technician
              </h3>
              {ticket.assignedTechnician ? (
                <>
                  <p>
                    <strong>Technician:</strong> {ticket.assignedTechnician.name}
                  </p>
                  <p>
                    <strong>Trade:</strong> {ticket.assignedTechnician.trade}
                  </p>
                  <p>
                    <strong>Phone:</strong> {ticket.assignedTechnician.phone}
                  </p>
                  <p>
                    <strong>Dispatched:</strong>{' '}
                    {new Date(ticket.assignedTechnician.assignedAt).toLocaleTimeString()}
                  </p>
                </>
              ) : (
                <p className="text-slate-400 italic">No technician assigned</p>
              )}
            </div>
          </div>

          {/* Materials Requisition Table */}
          {ticket.materialsUsed.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-1 mb-2">
                3. Materials & Spare Parts Requisitioned from Store
              </h2>
              <table className="w-full text-xs border border-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200 text-left text-[10px] uppercase font-bold text-slate-600">
                  <tr>
                    <th className="p-1.5">Item Code</th>
                    <th className="p-1.5">Description</th>
                    <th className="p-1.5 text-center">Qty</th>
                    <th className="p-1.5 text-center">Unit</th>
                    <th className="p-1.5 text-right">Cost (SAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ticket.materialsUsed.map((m) => (
                    <tr key={m.id}>
                      <td className="p-1.5 font-mono text-[10px]">{m.itemCode}</td>
                      <td className="p-1.5 font-medium">{m.description}</td>
                      <td className="p-1.5 text-center font-bold">{m.quantity}</td>
                      <td className="p-1.5 text-center">{m.unit}</td>
                      <td className="p-1.5 text-right font-mono">
                        {m.cost ? (m.cost * m.quantity).toFixed(0) : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures & Certification Boxes */}
          <div className="mt-6 pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-xs">
            <div className="border border-slate-300 rounded p-3 text-center flex flex-col justify-between h-28">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Technician / TAMIMI Supervisor Sign & Stamp
              </span>
              <div className="font-mono text-xs font-bold text-slate-800">
                {ticket.signatureTechnician || ticket.assignedTechnician?.name || '__________________________'}
              </div>
              <span className="text-[9px] text-slate-400">Date & Time Verified</span>
            </div>

            <div className="border border-slate-300 rounded p-3 text-center flex flex-col justify-between h-28">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Red Sea Global (RSG) Client / Resident Sign-off
              </span>
              <div className="font-mono text-xs font-bold text-slate-800">
                {ticket.signatureClient || ticket.reporterName || '__________________________'}
              </div>
              <span className="text-[9px] text-slate-400">
                Satisfaction: {ticket.satisfactionRating ? `${ticket.satisfactionRating}/5 Stars Verified` : 'Pending Resident Sign-off'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
