import React, { useState, useMemo } from 'react';
import {
  Zap,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sliders,
  ChevronLeft,
  X,
  Send,
  Bell,
  Smartphone,
  Layers,
  Copy,
  Trash2,
  Activity,
  Check,
  MessageSquare,
  FileSpreadsheet,
  Download,
  Sparkles,
  ShieldCheck,
  QrCode,
  ExternalLink,
  HelpCircle,
  Info,
  SlidersHorizontal,
  FileText,
  ArrowLeftRight,
} from 'lucide-react';
import { WhatsAppObservationManager } from './WhatsAppObservationManager';
import { WhatsAppAutomationSection } from './WhatsAppAutomationSection';
import { ExcelAutomationSection } from './ExcelAutomationSection';
import { DifferenceCheckerSection } from './difference/DifferenceCheckerSection';
import { GreenApiService, GreenApiConfig } from '../../services/greenApiService';
import { GreenApiSetupModal } from './GreenApiSetupModal';
import { ToastService } from '../../services/toastService';

interface AutomatedWorkflowManagerProps {
  onBack: () => void;
}

export type MainTabType =
  | 'INSPECTION'
  | 'DIFFERENCE_CHECKER'
  | 'EXCEL_MANAGEMENT'
  | 'EXCEL_AUTOMATION'
  | 'PIPELINES'
  | 'PASSES'
  | 'LOGS';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  category: 'Incident & SLA' | 'Facility Bookings' | 'Preventative FM' | 'Emergency';
  triggerLabel: string;
  conditionField: string;
  conditionValue: string;
  actionLabel: string;
  actionRecipient: string;
  isActive: boolean;
  executionsCount: number;
  lastExecuted: string;
}

export interface WorkflowExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  timestamp: string;
  durationMs: number;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  payloadSummary: string;
  dispatchedAction: string;
}

const INITIAL_WORKFLOWS: WorkflowRule[] = [
  {
    id: 'WF-001',
    name: 'Auto-Dispatch P1 Emergency Incidents',
    description: 'Instantly alerts maintenance shift leads and sends priority alert when life safety or critical P1 ticket is opened.',
    category: 'Emergency',
    triggerLabel: 'When New Ticket Created',
    conditionField: 'priority',
    conditionValue: 'P1 - Critical / Emergency',
    actionLabel: 'Dispatch Priority WhatsApp & Audio Alert',
    actionRecipient: 'On-Duty Emergency MEP Crew (+966-55-492-101)',
    isActive: true,
    executionsCount: 14,
    lastExecuted: '18 mins ago',
  },
  {
    id: 'WF-002',
    name: 'Booking Confirmation Digital Pass Auto-Dispatch',
    description: 'Generates branded admission pass and QR passcode as soon as sports or cinema facility slot is confirmed.',
    category: 'Facility Bookings',
    triggerLabel: 'When Booking Status == Confirmed',
    conditionField: 'status',
    conditionValue: 'Confirmed',
    actionLabel: 'Dispatch Digital QR Pass & Rules',
    actionRecipient: 'Resident Registered WhatsApp / Email',
    isActive: true,
    executionsCount: 28,
    lastExecuted: '45 mins ago',
  },
  {
    id: 'WF-003',
    name: 'SLA 75% Escalation to Shift Supervisor',
    description: 'Evaluates work orders in progress and automatically dispatches escalation alerts when remaining time < 25%.',
    category: 'Incident & SLA',
    triggerLabel: 'When Remaining SLA < 25%',
    conditionField: 'health',
    conditionValue: 'WARNING',
    actionLabel: 'Escalate to Shift Lead & Reassign Free Tech',
    actionRecipient: 'Shift Supervisor Console',
    isActive: true,
    executionsCount: 6,
    lastExecuted: '2 hours ago',
  },
  {
    id: 'WF-004',
    name: 'VIP Cluster MEP Route Auto-Assignment',
    description: 'Directly assigns VIP Senior Technician when work orders are logged for Clusters H, G, F, E.',
    category: 'Incident & SLA',
    triggerLabel: 'When New Ticket Created',
    conditionField: 'cluster',
    conditionValue: 'H, G, F, E',
    actionLabel: 'Auto-Assign Senior MEP Lead (Eng. Khalid)',
    actionRecipient: 'Technician App Dispatch Queue',
    isActive: true,
    executionsCount: 9,
    lastExecuted: 'Yesterday',
  },
];

const INITIAL_LOGS: WorkflowExecutionLog[] = [
  {
    id: 'LOG-8841',
    ruleId: 'WF-001',
    ruleName: 'Auto-Dispatch P1 Emergency Incidents',
    triggerEvent: 'ON_TICKET_CREATED (#1082975)',
    timestamp: '18 mins ago',
    durationMs: 74,
    status: 'SUCCESS',
    payloadSummary: 'Emergency Plumbing in I08-012',
    dispatchedAction: 'Sent priority SMS & WhatsApp alert to On-Duty Crew',
  },
  {
    id: 'LOG-8840',
    ruleId: 'WF-002',
    ruleName: 'Booking Confirmation Digital Pass Auto-Dispatch',
    triggerEvent: 'ON_BOOKING_CONFIRMED (#BK-4921)',
    timestamp: '45 mins ago',
    durationMs: 112,
    status: 'SUCCESS',
    payloadSummary: 'Cinema Room slot confirmed for 20:00',
    dispatchedAction: 'Dispatched QR Pass voucher to resident WhatsApp',
  },
  {
    id: 'LOG-8839',
    ruleId: 'WF-003',
    ruleName: 'SLA 75% Escalation to Shift Supervisor',
    triggerEvent: 'ON_SLA_WARNING_75 (#1082960)',
    timestamp: '2 hours ago',
    durationMs: 95,
    status: 'SUCCESS',
    payloadSummary: 'AC Cooling failure warning in J01',
    dispatchedAction: 'Escalated ticket priority to High and notified Shift Lead',
  },
];

export const AutomatedWorkflowManager: React.FC<AutomatedWorkflowManagerProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<MainTabType>('INSPECTION');
  const [excelSubTab, setExcelSubTab] = useState<'FORMAT_PAINTER' | 'DIFFERENCE_CHECKER'>('FORMAT_PAINTER');
  const [greenApiConfig, setGreenApiConfig] = useState<GreenApiConfig>(() =>
    GreenApiService.getConfig()
  );
  const [isGreenApiModalOpen, setIsGreenApiModalOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Workflow Rules states
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(INITIAL_WORKFLOWS);
  const [logs, setLogs] = useState<WorkflowExecutionLog[]>(INITIAL_LOGS);
  const [ruleSearch, setRuleSearch] = useState('');
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<WorkflowRule['category']>('Incident & SLA');
  const [newRuleTrigger, setNewRuleTrigger] = useState('When New Ticket Created');
  const [newRuleAction, setNewRuleAction] = useState('Dispatch WhatsApp Message');
  const [newRuleRecipient, setNewRuleRecipient] = useState('+966554921010');

  // Simulator
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResults, setSimResults] = useState<string[]>([]);

  // Toggle rule
  const toggleRule = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w))
    );
  };

  // Create rule
  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const created: WorkflowRule = {
      id: `WF-${String(Math.floor(Math.random() * 900 + 100))}`,
      name: newRuleName.trim(),
      description: 'Custom automated operations workflow rule.',
      category: newRuleCategory,
      triggerLabel: newRuleTrigger,
      conditionField: 'status',
      conditionValue: 'Triggered',
      actionLabel: newRuleAction,
      actionRecipient: newRuleRecipient,
      isActive: true,
      executionsCount: 0,
      lastExecuted: 'Never',
    };

    setWorkflows((prev) => [created, ...prev]);
    setIsNewRuleModalOpen(false);
    setNewRuleName('');
    ToastService.showSuccess('New automation pipeline rule created!');
  };

  // Run simulation
  const handleRunSimulator = () => {
    setIsSimulating(true);
    setSimResults(['Trigger dispatched: P1 Emergency at I08-012...']);

    setTimeout(() => {
      setSimResults((prev) => [...prev, 'Evaluating active workflow rules... MATCH: WF-001']);
    }, 400);

    setTimeout(() => {
      setSimResults((prev) => [
        ...prev,
        'Action executed: Sent Priority WhatsApp to Emergency MEP Crew (+966-55-492-101)',
      ]);
    }, 900);

    setTimeout(() => {
      setSimResults((prev) => [...prev, 'Audit log saved to CAFM in 68ms. Simulation complete.']);
      setIsSimulating(false);
      ToastService.showSuccess('Simulation executed successfully!');
    }, 1400);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-3 sm:p-6 space-y-5 animate-fadeIn">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & DIRECT COMMAND CONTROLS                      */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
            title="Return to Facilities Hub"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Automated Operations &amp; WhatsApp Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Live Automation Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              WhatsApp field inspection synchronization, automated operational triggers, and digital QR passes.
            </p>
          </div>
        </div>

        {/* Right Header Guide Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Guide Toggle */}
          <button
            onClick={() => setShowHowItWorks((prev) => !prev)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>{showHowItWorks ? 'Hide Guide' : 'How it Works'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. COLLAPSIBLE "HOW IT WORKS" GUIDANCE (CLEAR ENGLISH)        */}
      {/* ============================================================ */}
      {showHowItWorks && (
        <div className="bg-emerald-950/10 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-3xl p-5 sm:p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-3">
            <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200 flex items-center space-x-2">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>How the Automated Field Inspection System Works</span>
            </h3>
            <button
              onClick={() => setShowHowItWorks(false)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {/* Step 1 */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center text-xs">
                1
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                Green API Gateway
              </h4>
              <p className="text-slate-500">
                Connect your WhatsApp instance securely via Green API. Click <strong>"Connect Green API"</strong> to enter your Instance ID and Token.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center text-xs">
                2
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                Strict Target Group Isolation
              </h4>
              <p className="text-slate-500">
                Choose your specific inspection group (e.g. <code>1203630...@g.us</code>). The system strictly isolates messages from this group to prevent unrelated chats from appearing.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center text-xs">
                3
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                Automated Categorization &amp; Tickets
              </h4>
              <p className="text-slate-500">
                Click <strong>"Fetch Group Messages"</strong> to ingest field photos and defect captions. Messages are automatically categorized into Hard Service, Soft Services, or Pest Control, and can be converted to work orders with 1 click.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MODERN TAB NAVIGATION (LINEAR / VERCEL STYLE)             */}
      {/* ============================================================ */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('INSPECTION')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'INSPECTION'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Field Inspection</span>
        </button>

        <button
          id="tab-excel-automation"
          onClick={() => setActiveTab('EXCEL_AUTOMATION')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'EXCEL_AUTOMATION' || activeTab === 'EXCEL_MANAGEMENT' || activeTab === 'DIFFERENCE_CHECKER'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel Automation</span>
        </button>

        <button
          onClick={() => setActiveTab('PIPELINES')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'PIPELINES'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Automation Pipelines</span>
        </button>

        <button
          onClick={() => setActiveTab('PASSES')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'PASSES'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Outbound Digital Passes</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'LOGS'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Execution Logs</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 4. TAB CONTENT PANELS                                        */}
      {/* ============================================================ */}

      {/* TAB 1: WHATSAPP FIELD INSPECTION & OBSERVATION REGISTRY */}
      {activeTab === 'INSPECTION' && (
        <div className="animate-fadeIn">
          <WhatsAppObservationManager
            onOpenOutboundPasses={() => setActiveTab('PASSES')}
            onBack={onBack}
          />
        </div>
      )}

      {/* TAB: EXCEL AUTOMATION (Format Painter & Difference Checker) */}
      {(activeTab === 'EXCEL_MANAGEMENT' || activeTab === 'EXCEL_AUTOMATION' || activeTab === 'DIFFERENCE_CHECKER') && (
        <div className="space-y-4 animate-fadeIn">
          {/* Sub-navigation bar between Format Painter & Difference Checker */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex-1 sm:max-w-xl">
              <button
                id="btn-subtab-format-painter"
                type="button"
                onClick={() => setExcelSubTab('FORMAT_PAINTER')}
                className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition cursor-pointer ${
                  excelSubTab === 'FORMAT_PAINTER'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Format Painter</span>
              </button>

              <button
                id="btn-subtab-difference-checker"
                type="button"
                onClick={() => setExcelSubTab('DIFFERENCE_CHECKER')}
                className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition cursor-pointer ${
                  excelSubTab === 'DIFFERENCE_CHECKER'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Difference Checker</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium px-3 hidden lg:block">
              {excelSubTab === 'FORMAT_PAINTER' ? (
                <span>14-Column Header &amp; Formatting Normalizer</span>
              ) : (
                <span>Dual-File Reconciliation &amp; Discrepancy Finder</span>
              )}
            </div>
          </div>

          {/* Active Sub-tool View */}
          {excelSubTab === 'FORMAT_PAINTER' ? (
            <ExcelAutomationSection />
          ) : (
            <DifferenceCheckerSection />
          )}
        </div>
      )}

      {/* TAB 2: AUTOMATION TRIGGER PIPELINES */}
      {activeTab === 'PIPELINES' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Top Bar for Pipelines */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Configured Automation Rules &amp; Event Pipelines
              </h3>
              <p className="text-xs text-slate-500">
                Trigger automated technician dispatch, P1 urgent escalations, and digital access passes upon event detection.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunSimulator}
                disabled={isSimulating}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 text-emerald-600 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Simulating...' : 'Test Simulator'}</span>
              </button>

              <button
                onClick={() => setIsNewRuleModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Rule</span>
              </button>
            </div>
          </div>

          {/* Simulation Output Card if active */}
          {simResults.length > 0 && (
            <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                <span>SIMULATOR CONSOLE</span>
                <button onClick={() => setSimResults([])} className="hover:text-white">Clear</button>
              </div>
              {simResults.map((r, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="text-emerald-600">&gt;</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((rule, rIdx) => (
              <div
                key={`wf-rule-${rule.id || 'rule'}-${rIdx}`}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {rule.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {rule.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {rule.name}
                    </h4>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`w-11 h-6 rounded-full p-0.5 transition cursor-pointer ${
                      rule.isActive ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        rule.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {rule.description}
                </p>

                {/* Trigger & Action summary pills */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">TRIGGER:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {rule.triggerLabel}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-emerald-600 uppercase text-[9px]">ACTION:</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      {rule.actionLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Executed: {rule.executionsCount} times</span>
                  <span>Last: {rule.lastExecuted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OUTBOUND PASSES & WHATSAPP DIRECT */}
      {activeTab === 'PASSES' && (
        <div className="animate-fadeIn">
          <WhatsAppAutomationSection
            initialTab="OUTBOUND_PASSES"
            onBackToHub={() => setActiveTab('INSPECTION')}
          />
        </div>
      )}

      {/* TAB 4: EXECUTION LOGS & AUDIT HISTORY */}
      {activeTab === 'LOGS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs animate-fadeIn">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Live Automation Activity &amp; Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Recent automated actions, dispatches, and trigger evaluations
              </p>
            </div>
            <button
              onClick={() => ToastService.showInfo('Logs refreshed')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Trigger Event</th>
                  <th className="py-3 px-4">Payload Summary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Time &amp; Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {logs.map((log, lIdx) => (
                  <tr key={`wf-log-${log.id || 'log'}-${lIdx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">{log.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.ruleName}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{log.triggerEvent}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{log.payloadSummary}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                      {log.timestamp} ({log.durationMs}ms)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL: CREATE CUSTOM AUTOMATION RULE                      */}
      {/* ============================================================ */}
      {isNewRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Create Automation Rule
              </h3>
              <button
                onClick={() => setIsNewRuleModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Rule Name:
                </label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Alert Night Shift on AC Breakdown"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Category:
                </label>
                <select
                  value={newRuleCategory}
                  onChange={(e) => setNewRuleCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Emergency">Emergency</option>
                  <option value="Incident & SLA">Incident &amp; SLA</option>
                  <option value="Facility Bookings">Facility Bookings</option>
                  <option value="Preventative FM">Preventative FM</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Trigger Event:
                </label>
                <input
                  type="text"
                  value={newRuleTrigger}
                  onChange={(e) => setNewRuleTrigger(e.target.value)}
                  placeholder="e.g. When Priority == P1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Recipient Phone:
                </label>
                <input
                  type="text"
                  value={newRuleRecipient}
                  onChange={(e) => setNewRuleRecipient(e.target.value)}
                  placeholder="+966554921010"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Green API Setup Modal */}
      <GreenApiSetupModal
        isOpen={isGreenApiModalOpen}
        onClose={() => setIsGreenApiModalOpen(false)}
        onConfigSaved={(cfg) => {
          setGreenApiConfig(cfg);
        }}
      />
    </div>
  );
};
