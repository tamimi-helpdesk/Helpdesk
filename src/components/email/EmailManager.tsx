import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Send,
  Eye,
  Plus,
  Edit3,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Server,
  ShieldCheck,
  Smartphone,
  Monitor,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  Users,
  FileText,
  Sparkles,
} from 'lucide-react';

interface EmailManagerProps {
  onBack: () => void;
}

export interface EmailTemplate {
  id: string;
  title: string;
  category: 'Reservations' | 'Work Orders' | 'Broadcast' | 'Feedback' | 'Administrative';
  subject: string;
  preheader: string;
  recipientType: string;
  bodyHtml: string;
  variables: string[];
}

export interface EmailOutboxRecord {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  templateId: string;
  status: 'DELIVERED' | 'OPENED' | 'QUEUED' | 'BOUNCED';
  sentAt: string;
  latencyMs: number;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'TMP-RES-01',
    title: 'Facility Reservation Pass & QR Voucher',
    category: 'Reservations',
    subject: 'Confirmed: Your Reservation at {{facility_name}} ({{booking_date}})',
    preheader: 'Your digital admission pass and check-in barcode are ready inside.',
    recipientType: 'Camp Resident / Guest',
    variables: ['{{resident_name}}', '{{facility_name}}', '{{stage_name}}', '{{booking_date}}', '{{slot_time}}', '{{access_code}}'],
    bodyHtml: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">TAMIMI GLOBAL</h1>
    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Amaala Construction Village • Facility Services</p>
  </div>
  <div style="padding: 24px;">
    <p style="font-size: 14px; color: #334155; margin-top: 0;">Dear <strong>{{resident_name}}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6;">Your booking request for <strong>{{facility_name}}</strong> has been approved and confirmed by the sports & recreation coordination desk.</p>
    
    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; color: #64748b;">Facility Venue:</td><td style="padding: 4px 0; font-weight: bold;">{{facility_name}} ({{stage_name}})</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Reservation Date:</td><td style="padding: 4px 0; font-weight: bold;">{{booking_date}}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Reserved Time Slot:</td><td style="padding: 4px 0; font-weight: bold;">{{slot_time}}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Access Passcode:</td><td style="padding: 4px 0; font-weight: 800; color: #0284c7; font-family: monospace;">{{access_code}}</td></tr>
      </table>
    </div>

    <p style="font-size: 12px; color: #64748b; line-height: 1.5;">Please arrive 5 minutes before your scheduled slot. Present your resident digital badge or show this email pass at the gate.</p>
    
    <div style="text-align: center; margin-top: 24px;">
      <a href="#" style="background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block;">View Digital Pass in App</a>
    </div>
  </div>
  <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
    Tamimi Global Facilities Team • Amaala Construction Village S1-S3
  </div>
</div>
    `.trim(),
  },
  {
    id: 'TMP-WO-02',
    title: 'Work Order Acknowledgment & SLA Notice',
    category: 'Work Orders',
    subject: '[{{ticket_number}}] Support Ticket Received - Target SLA {{sla_target}}',
    preheader: 'A dedicated technician has been dispatched to your residential unit.',
    recipientType: 'Incident Reporter',
    variables: ['{{reporter_name}}', '{{ticket_number}}', '{{issue_title}}', '{{category}}', '{{priority}}', '{{sla_target}}', '{{technician_name}}'],
    bodyHtml: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 18px; font-weight: 800;">FACILITY HELPDESK WORK ORDER</h1>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Red Sea Global • Amaala Construction Village</p>
  </div>
  <div style="padding: 24px;">
    <p style="font-size: 14px; color: #334155;">Hello <strong>{{reporter_name}}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6;">Your maintenance request has been logged into our CAFM dispatch queue. Our field team is actively responding.</p>

    <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px; margin: 16px 0; border-radius: 0 8px 8px 0;">
      <div style="font-size: 14px; font-weight: bold; color: #0f172a;">{{ticket_number}} - {{issue_title}}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Category: <strong>{{category}}</strong> • Priority: <strong>{{priority}}</strong></div>
      <div style="font-size: 12px; color: #0284c7; margin-top: 4px; font-weight: bold;">SLA Resolution Target: {{sla_target}}</div>
    </div>

    <p style="font-size: 13px; color: #475569;">Assigned Lead Technician: <strong>{{technician_name}}</strong></p>
    <p style="font-size: 12px; color: #64748b; margin-top: 16px;">You will receive an instant notification once the repair is completed and tested.</p>
  </div>
  <div style="background: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
    Need immediate urgent escalation? Contact Central Reception at Ext. 100.
  </div>
</div>
    `.trim(),
  },
  {
    id: 'TMP-WO-03',
    title: 'Work Order Completed & Quality Rating',
    category: 'Work Orders',
    subject: '[{{ticket_number}}] Resolved: Maintenance Completed at {{location}}',
    preheader: 'Please rate the quality of service provided by our technicians.',
    recipientType: 'Incident Reporter',
    variables: ['{{reporter_name}}', '{{ticket_number}}', '{{issue_title}}', '{{location}}', '{{completion_notes}}'],
    bodyHtml: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 18px; font-weight: 800;">SERVICE COMPLETED</h1>
    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Work Order Successfully Resolved</p>
  </div>
  <div style="padding: 24px;">
    <p style="font-size: 14px; color: #334155;">Dear <strong>{{reporter_name}}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6;">Technicians have finished servicing your request <strong>{{ticket_number}}</strong> located at <strong>{{location}}</strong>.</p>
    
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px; margin: 16px 0;">
      <div style="font-size: 12px; color: #065f46; font-weight: bold;">Technician Resolution Note:</div>
      <div style="font-size: 13px; color: #047857; margin-top: 4px;">{{completion_notes}}</div>
    </div>

    <p style="font-size: 13px; color: #334155; text-align: center; margin-top: 20px; font-weight: bold;">How satisfied are you with the resolution?</p>
    <div style="text-align: center; margin-top: 10px;">
      <span style="font-size: 24px; cursor: pointer; margin: 0 4px;">⭐⭐⭐⭐⭐</span>
    </div>
  </div>
  <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
    Tamimi Global Facilities Quality Assurance
  </div>
</div>
    `.trim(),
  },
  {
    id: 'TMP-BC-04',
    title: 'Scheduled Utilities Maintenance Bulletin',
    category: 'Broadcast',
    subject: 'Official Notice: Scheduled Electrical & Chiller Upgrade on {{maintenance_date}}',
    preheader: 'Temporary utility maintenance across specific residential blocks.',
    recipientType: 'All Camp Residents',
    variables: ['{{maintenance_date}}', '{{start_time}}', '{{end_time}}', '{{affected_blocks}}', '{{emergency_contact}}'],
    bodyHtml: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 24px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 18px; font-weight: 800;">OFFICIAL OPERATIONAL BULLETIN</h1>
    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Scheduled Preventative Maintenance Advisory</p>
  </div>
  <div style="padding: 24px;">
    <p style="font-size: 14px; color: #334155;">Attention All Residents & Contractors,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6;">Please be advised that scheduled preventative maintenance will take place on <strong>{{maintenance_date}}</strong> from <strong>{{start_time}}</strong> to <strong>{{end_time}}</strong>.</p>
    
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; margin: 16px 0;">
      <div style="font-size: 13px; font-weight: bold; color: #92400e;">Affected Zones:</div>
      <div style="font-size: 13px; color: #78350f; margin-top: 4px;">{{affected_blocks}}</div>
    </div>

    <p style="font-size: 12px; color: #64748b; line-height: 1.5;">During this window, backup power generators will maintain emergency lighting and critical systems. We apologize for any temporary inconvenience.</p>
  </div>
  <div style="background: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
    For urgent inquiries during maintenance: Contact {{emergency_contact}}
  </div>
</div>
    `.trim(),
  },
];

const INITIAL_OUTBOX_LOGS: EmailOutboxRecord[] = [
  {
    id: 'OUT-9912',
    recipientEmail: 'tariq.almansoor@redsea.com',
    recipientName: 'Eng. Tariq Al-Mansoor',
    subject: 'Confirmed: Your Reservation at Cricket Ground (2026-09-05)',
    templateId: 'TMP-RES-01',
    status: 'OPENED',
    sentAt: 'Today, 11:42 AM',
    latencyMs: 840,
  },
  {
    id: 'OUT-9911',
    recipientEmail: 'khalid.m@tamimi-global.com',
    recipientName: 'Eng. Khalid (Lead MEP)',
    subject: '[WO-0182] Support Ticket Received - Target SLA 2 Hours',
    templateId: 'TMP-WO-02',
    status: 'DELIVERED',
    sentAt: 'Today, 11:18 AM',
    latencyMs: 920,
  },
  {
    id: 'OUT-9910',
    recipientEmail: 'all-residents-stage1@tamimi-acv.com',
    recipientName: 'Stage 1 Residents (Broadcast)',
    subject: 'Official Notice: Scheduled Electrical & Chiller Upgrade on Tomorrow',
    templateId: 'TMP-BC-04',
    status: 'DELIVERED',
    sentAt: 'Today, 09:30 AM',
    latencyMs: 1450,
  },
  {
    id: 'OUT-9909',
    recipientEmail: 's.nasser@amaala.sa',
    recipientName: 'Dr. Sultan Nasser',
    subject: '[WO-0179] Resolved: Maintenance Completed at Villa H-02',
    templateId: 'TMP-WO-03',
    status: 'OPENED',
    sentAt: 'Yesterday, 05:15 PM',
    latencyMs: 760,
  },
];

export const EmailManager: React.FC<EmailManagerProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'BROADCAST' | 'OUTBOX' | 'GATEWAY'>('TEMPLATES');
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('tafga_email_templates_v2');
      return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  const [outbox, setOutbox] = useState<EmailOutboxRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tafga_email_outbox_v2');
      return saved ? JSON.parse(saved) : INITIAL_OUTBOX_LOGS;
    } catch {
      return INITIAL_OUTBOX_LOGS;
    }
  });

  // Template Preview & Edit
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(templates[0]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('tamimitafga188@gmail.com');
  const [testEmailSentMsg, setTestEmailSentMsg] = useState<string | null>(null);

  // Broadcast Composer
  const [broadcastAudience, setBroadcastAudience] = useState('All Camp Residents (Stage 1-3)');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState<string | null>(null);

  // Gateway Settings
  const [smtpHost, setSmtpHost] = useState('smtp.tamimi-global.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSenderName, setSmtpSenderName] = useState('Tamimi Global Facility Operations');
  const [smtpSenderEmail, setSmtpSenderEmail] = useState('facilities@tamimi-global.com');
  const [isPingingGateway, setIsPingingGateway] = useState(false);
  const [gatewayPingResult, setGatewayPingResult] = useState<string | null>(null);

  // Save templates
  useEffect(() => {
    try {
      localStorage.setItem('tafga_email_templates_v2', JSON.stringify(templates));
    } catch {}
  }, [templates]);

  // Save outbox
  useEffect(() => {
    try {
      localStorage.setItem('tafga_email_outbox_v2', JSON.stringify(outbox));
    } catch {}
  }, [outbox]);

  // Send Test Email from preview
  const handleSendTestEmail = () => {
    if (!testEmailAddress) return;
    const newRecord: EmailOutboxRecord = {
      id: `OUT-${Math.floor(Math.random() * 9000 + 1000)}`,
      recipientEmail: testEmailAddress,
      recipientName: 'Test Recipient',
      subject: selectedTemplate.subject.replace('{{facility_name}}', 'Cricket Ground').replace('{{booking_date}}', '2026-09-05'),
      templateId: selectedTemplate.id,
      status: 'DELIVERED',
      sentAt: 'Just now',
      latencyMs: Math.floor(Math.random() * 400 + 600),
    };
    setOutbox((prev) => [newRecord, ...prev]);
    setTestEmailSentMsg(`Test broadcast dispatched to ${testEmailAddress} via SMTP gateway!`);
    setTimeout(() => setTestEmailSentMsg(null), 3000);
  };

  // Dispatch Broadcast
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingBroadcast(true);

    setTimeout(() => {
      setIsSendingBroadcast(false);
      const newRecord: EmailOutboxRecord = {
        id: `OUT-${Math.floor(Math.random() * 9000 + 1000)}`,
        recipientEmail: broadcastAudience,
        recipientName: broadcastAudience,
        subject: broadcastSubject || 'Important Camp Facilities Notice',
        templateId: 'BROADCAST-CUSTOM',
        status: 'DELIVERED',
        sentAt: 'Just now',
        latencyMs: 1240,
      };
      setOutbox((prev) => [newRecord, ...prev]);
      setBroadcastSuccessMsg(`Broadcast successfully queued and dispatched to ${broadcastAudience}!`);
      setBroadcastSubject('');
      setBroadcastBody('');
      setTimeout(() => setBroadcastSuccessMsg(null), 4000);
    }, 1200);
  };

  // Ping Gateway
  const handlePingGateway = () => {
    setIsPingingGateway(true);
    setGatewayPingResult(null);
    setTimeout(() => {
      setIsPingingGateway(false);
      setGatewayPingResult(`Connected to ${smtpHost}:${smtpPort} (TLS 1.3 Handshake OK, Latency: 48ms). Ready for production email routing.`);
    }, 900);
  };

  // Render Sample HTML with placeholders filled
  const renderedHtml = useMemo(() => {
    if (!selectedTemplate) return '';
    let html = selectedTemplate.bodyHtml;
    html = html.replace(/{{resident_name}}/g, 'Eng. Tariq Al-Mansoor');
    html = html.replace(/{{facility_name}}/g, 'Cricket Ground');
    html = html.replace(/{{stage_name}}/g, 'Stage 1 VIP Arena');
    html = html.replace(/{{booking_date}}/g, 'Saturday, 05 Sep 2026');
    html = html.replace(/{{slot_time}}/g, '18:00 - 20:00 (Evening Floodlight)');
    html = html.replace(/{{access_code}}/g, 'CKT-9281');
    html = html.replace(/{{ticket_number}}/g, 'WO-0182');
    html = html.replace(/{{issue_title}}/g, 'Air Conditioning High Temp Alarm');
    html = html.replace(/{{category}}/g, 'HVAC & Cooling');
    html = html.replace(/{{priority}}/g, 'P1 - Critical');
    html = html.replace(/{{sla_target}}/g, '2 Hours');
    html = html.replace(/{{technician_name}}/g, 'Eng. Khalid (Lead MEP)');
    html = html.replace(/{{location}}/g, 'Cluster H Executive Villa 04');
    html = html.replace(/{{completion_notes}}/g, 'Dual capacitor replaced and tested. Airflow returned to 19.5°C.');
    html = html.replace(/{{maintenance_date}}/g, 'Tomorrow, 06 Sep 2026');
    html = html.replace(/{{start_time}}/g, '01:00 AM');
    html = html.replace(/{{end_time}}/g, '04:00 AM');
    html = html.replace(/{{affected_blocks}}/g, 'Residential Stage 1 - Clusters A, B, C & Mess Hall');
    html = html.replace(/{{emergency_contact}}/g, 'Camp Control Room (+966-55-492-100)');
    return html;
  }, [selectedTemplate]);

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-3 sm:p-6 space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Return to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Enterprise Email Management Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                SMTP Gateway
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated reservation passes, ticket SLAs, emergency broadcasts, and branded camp notifications.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveTab('BROADCAST')}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send New Broadcast</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Configured Templates
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {templates.length}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Branded mobile-ready layouts
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            SMTP Gateway
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
            TLS 1.3 • Port 587 Secured
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Sent Today
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {outbox.length + 180}
            </span>
            <span className="text-xs text-slate-400">/ 2,500 Quota</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            92% daily capacity available
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Delivery Rate
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              99.8%
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
            0 hard bounces this week
          </span>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center space-x-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'TEMPLATES'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Email Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('BROADCAST')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'BROADCAST'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Send Broadcast
        </button>
        <button
          onClick={() => setActiveTab('OUTBOX')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'OUTBOX'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Delivery Outbox &amp; Logs ({outbox.length})
        </button>
        <button
          onClick={() => setActiveTab('GATEWAY')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'GATEWAY'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          SMTP Gateway Settings
        </button>
      </div>

      {/* TAB 1: TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      {tmpl.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {tmpl.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                    {tmpl.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Subject: <strong className="text-slate-700 dark:text-slate-200">{tmpl.subject}</strong>
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tmpl.variables.map((v) => (
                      <span
                        key={v}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Recipient: <strong className="text-slate-600 dark:text-slate-300">{tmpl.recipientType}</strong>
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTemplate(tmpl);
                        setIsPreviewOpen(true);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Preview</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BROADCAST COMPOSER */}
      {activeTab === 'BROADCAST' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Send className="w-4 h-4 text-rose-600" />
                <span>Compose Facility Broadcast</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Send official notifications to camp residents, VIP clusters, or maintenance contractors.
              </p>
            </div>

            {broadcastSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{broadcastSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Audience *
                </label>
                <select
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="All Camp Residents (Stage 1-3)">All Camp Residents (Stage 1-3) • 4,800+ Recipients</option>
                  <option value="Executive VIP Clusters (H, G, F, E)">Executive VIP Clusters (H, G, F, E) • 640 Recipients</option>
                  <option value="Stage 1 Contractors & Staff">Stage 1 Contractors &amp; Staff • 1,200 Recipients</option>
                  <option value="On-Duty FM Supervisors & Leads">On-Duty FM Supervisors &amp; Leads • 28 Recipients</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Urgency Level
                </label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="prio"
                      checked={broadcastPriority === 'NORMAL'}
                      onChange={() => setBroadcastPriority('NORMAL')}
                      className="accent-rose-600"
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Normal Advisory</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="prio"
                      checked={broadcastPriority === 'URGENT'}
                      onChange={() => setBroadcastPriority('URGENT')}
                      className="accent-rose-600"
                    />
                    <span className="font-bold text-red-600">Urgent Operational Alert (Immediate Push)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Water Maintenance Advisory for Block C..."
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Broadcast Message Body *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Type official notification message here..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-xs"
                >
                  {isSendingBroadcast ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSendingBroadcast ? 'Dispatching...' : 'Dispatch Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: OUTBOX LOGS */}
      {activeTab === 'OUTBOX' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-rose-600" />
                  <span>Outbox Dispatch &amp; Delivery Log</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live record of transactional and broadcast emails dispatched by the SMTP server.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-3">Dispatch ID</th>
                    <th className="py-3 px-3">Recipient</th>
                    <th className="py-3 px-3">Subject Line</th>
                    <th className="py-3 px-3">Template</th>
                    <th className="py-3 px-3">Delivery Latency</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Sent Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {outbox.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {rec.id}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{rec.recipientName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{rec.recipientEmail}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {rec.subject}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {rec.templateId}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {rec.latencyMs}ms
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                            rec.status === 'OPENED'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                              : rec.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                        {rec.sentAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SMTP GATEWAY SETTINGS */}
      {activeTab === 'GATEWAY' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Server className="w-4 h-4 text-rose-600" />
                <span>SMTP Gateway &amp; Relay Configuration</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure outgoing mail server parameters for Tamimi Global corporate relay.
              </p>
            </div>

            {gatewayPingResult && (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{gatewayPingResult}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SMTP Hostname
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Sender Name
                </label>
                <input
                  type="text"
                  value={smtpSenderName}
                  onChange={(e) => setSmtpSenderName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sender Email Address
                </label>
                <input
                  type="email"
                  value={smtpSenderEmail}
                  onChange={(e) => setSmtpSenderEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Security &amp; Encryption Standard:</span>
                </div>
                <div className="text-slate-500">• Explicit TLS 1.3 negotiated on STARTTLS (Port 587)</div>
                <div className="text-slate-500">• SPF and DKIM verified for @tamimi-global.com domain</div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isPingingGateway}
                  onClick={handlePingGateway}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-xs"
                >
                  {isPingingGateway ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Server className="w-4 h-4" />
                  )}
                  <span>{isPingingGateway ? 'Testing Connection...' : 'Test Gateway Handshake'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE PREVIEW MODAL */}
      {isPreviewOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedTemplate.title}
                  </h3>
                  <p className="text-[11px] text-slate-400">Template ID: {selectedTemplate.id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Device switch */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg transition ${
                      previewDevice === 'desktop'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg transition ${
                      previewDevice === 'mobile'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Test Send Notification */}
            {testEmailSentMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs font-bold flex items-center justify-between">
                <span>{testEmailSentMsg}</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
            )}

            {/* Email Preview Canvas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/80 flex justify-center">
              <div
                className={`transition-all duration-300 w-full ${
                  previewDevice === 'mobile' ? 'max-w-sm shadow-xl rounded-2xl overflow-hidden' : 'max-w-xl'
                }`}
              >
                <div
                  className="bg-white rounded-2xl overflow-hidden shadow-xs"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            </div>

            {/* Modal Footer (Send Test) */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <input
                  type="email"
                  placeholder="Enter email to test dispatch..."
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
                />
                <button
                  onClick={handleSendTestEmail}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test</span>
                </button>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedTemplate.bodyHtml);
                  setCopiedHtml(true);
                  setTimeout(() => setCopiedHtml(false), 2000);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHtml ? 'Copied HTML' : 'Copy HTML'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
