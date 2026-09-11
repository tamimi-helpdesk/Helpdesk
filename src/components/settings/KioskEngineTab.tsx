import React, { useState } from 'react';
import {
  Monitor,
  Printer,
  Volume2,
  Megaphone,
  CheckCircle2,
  QrCode,
  Languages,
  Clock,
  Sliders,
  Sparkles,
  Eye,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { SystemPreferences } from '../../types';
import { AuthService } from '../../services/authService';

interface KioskEngineTabProps {
  preferences: SystemPreferences;
  onPreferencesUpdate: (prefs: SystemPreferences) => void;
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const KioskEngineTab: React.FC<KioskEngineTabProps> = ({
  preferences,
  onPreferencesUpdate,
  onShowFeedback,
}) => {
  // Kiosk Terminal States
  const [enableKioskAutoReset, setEnableKioskAutoReset] = useState(
    preferences.enableKioskAutoReset ?? true
  );
  const [kioskResetSeconds, setKioskResetSeconds] = useState(
    preferences.kioskAutoResetSeconds ?? 60
  );
  const [strictVip, setStrictVip] = useState(
    preferences.enableStrictVipVerification ?? true
  );
  const [defaultLanguage, setDefaultLanguage] = useState(
    preferences.defaultLanguage || 'en'
  );

  // Printer & Voucher States
  const [paperFormat, setPaperFormat] = useState(
    preferences.thermalPaperFormat || '80mm'
  );
  const [slipHeader, setSlipHeader] = useState(
    preferences.thermalSlipHeader || 'TAMIMI GLOBAL CO. LTD · TAFGA CAMP 188'
  );
  const [slipFooter, setSlipFooter] = useState(
    preferences.thermalSlipFooter ||
      'Please present this admission voucher to the on-duty facility officer.'
  );
  const [enableQr, setEnableQr] = useState(
    preferences.enableQrCodeOnTickets ?? true
  );
  const [enableBarcode, setEnableBarcode] = useState(
    preferences.enableBarcodeOnTickets ?? true
  );
  const [autoPrint, setAutoPrint] = useState(
    preferences.autoPrintVoucher ?? false
  );

  // Audio States
  const [audioAlerts, setAudioAlerts] = useState(
    preferences.enableLiveAudioAlerts ?? true
  );

  // Marquee Broadcast States
  const [marqueeText, setMarqueeText] = useState(
    preferences.campusMarqueeText ||
      '📢 Welcome to TAMIMI Camp 188 Facility Hub · All 20 recreational facilities are operational.'
  );
  const [marqueeLevel, setMarqueeLevel] = useState<
    'normal' | 'important' | 'urgent'
  >(preferences.campusMarqueeLevel || 'normal');

  // Test Acoustic Chime
  const handleTestAudio = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      onShowFeedback('Played acoustic reservation chime.', 'info');
    } catch (e) {
      onShowFeedback('Audio context not available in this browser.', 'error');
    }
  };

  // Test Print Voucher Sample
  const handleTestPrint = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (!printWindow) {
      onShowFeedback('Pop-up blocked. Please allow popups for slip printing.', 'error');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admission Voucher Test</title>
        <style>
          body {
            font-family: monospace;
            padding: 16px;
            max-width: ${paperFormat === '58mm' ? '200px' : paperFormat === '80mm' ? '280px' : '480px'};
            margin: 0 auto;
            color: #000;
            font-size: 12px;
            line-height: 1.4;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
          .badge { font-size: 16px; font-weight: bold; text-align: center; margin: 6px 0; }
        </style>
      </head>
      <body>
        <div class="center bold">${slipHeader}</div>
        <div class="center">FACILITY ADMISSION PASS</div>
        <div class="divider"></div>
        <div><strong>FACILITY:</strong> Cricket Ground (Pitch 1)</div>
        <div><strong>SLOT:</strong> 18:00 - 19:00</div>
        <div><strong>DATE:</strong> ${new Date().toLocaleDateString()}</div>
        <div><strong>RESIDENT:</strong> Limon Rahman</div>
        <div class="badge">BADGE: EMP-0001</div>
        <div class="divider"></div>
        ${enableQr ? '<div class="center">[ QR VERIFICATION CODE ]</div>' : ''}
        ${enableBarcode ? '<div class="center font-mono">||| | |||| ||| ||||| |||</div>' : ''}
        <div class="divider"></div>
        <div class="center" style="font-size: 10px;">${slipFooter}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // Save Settings
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: SystemPreferences = {
      ...preferences,
      enableKioskAutoReset,
      kioskAutoResetSeconds: Number(kioskResetSeconds),
      enableStrictVipVerification: strictVip,
      defaultLanguage: defaultLanguage as any,
      thermalPaperFormat: paperFormat as any,
      thermalSlipHeader: slipHeader.trim(),
      thermalSlipFooter: slipFooter.trim(),
      enableQrCodeOnTickets: enableQr,
      enableBarcodeOnTickets: enableBarcode,
      autoPrintVoucher: autoPrint,
      enableLiveAudioAlerts: audioAlerts,
      campusMarqueeText: marqueeText.trim(),
      campusMarqueeLevel: marqueeLevel,
    };

    const res = AuthService.saveSystemPreferences(updated);
    if (res.success) {
      onPreferencesUpdate(updated);
      AuthService.logAuditEvent(
        'KIOSK_ENGINE_UPDATED',
        'Super Admin updated Kiosk Terminal, Thermal Printer, and Broadcast Marquee settings.'
      );
      onShowFeedback('Kiosk terminal & thermal printer configurations saved!', 'success');
    } else {
      onShowFeedback('Failed to save kiosk preferences.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Kiosk, Print &amp; Audio Engine</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Super Administrator controls for front-desk touch kiosks, thermal slip templates, live acoustic feedback, and campus broadcast tickers.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* CARD 1: FRONT-DESK TOUCH KIOSK TERMINAL */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Monitor className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Touch Kiosk Terminal &amp; Inactivity Auto-Reset
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Kiosk Inactivity Timeout (Auto-return to Showcase Hub)
              </label>
              <select
                value={kioskResetSeconds}
                onChange={(e) => setKioskResetSeconds(Number(e.target.value))}
                disabled={!enableKioskAutoReset}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-sky-500 disabled:opacity-50"
              >
                <option value={30}>30 Seconds</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds (1 Minute - Recommended)</option>
                <option value={90}>90 Seconds</option>
                <option value={120}>120 Seconds (2 Minutes)</option>
                <option value={300}>300 Seconds (5 Minutes)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Default Terminal Language
              </label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-sky-500"
              >
                <option value="en">English (Default)</option>
                <option value="ar">Arabic</option>
                <option value="bn">Bengali</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Enable Kiosk Auto-Reset
                </h4>
                <p className="text-[11px] text-slate-500">
                  Automatically clears open modals and resets screen after idle period
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableKioskAutoReset}
                onChange={(e) => setEnableKioskAutoReset(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Strict VIP Lounge Verification
                </h4>
                <p className="text-[11px] text-slate-500">
                  Require operator pass or supervisor PIN before booking VIP suites
                </p>
              </div>
              <input
                type="checkbox"
                checked={strictVip}
                onChange={(e) => setStrictVip(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: THERMAL RECEIPT & PRINT SLIP ENGINE */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Thermal Admission Slip &amp; Voucher Engine
              </h3>
            </div>

            <button
              type="button"
              onClick={handleTestPrint}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Print Sample Test Slip</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Thermal Paper Width
              </label>
              <select
                value={paperFormat}
                onChange={(e) => setPaperFormat(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-sky-500"
              >
                <option value="58mm">58mm Thermal Roll (Compact POS)</option>
                <option value="80mm">80mm Thermal Roll (Standard POS)</option>
                <option value="a4">Standard A4 Voucher Sheet</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Slip Header Text
              </label>
              <input
                type="text"
                value={slipHeader}
                onChange={(e) => setSlipHeader(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Slip Footer Disclaimer &amp; Rules
              </label>
              <input
                type="text"
                value={slipFooter}
                onChange={(e) => setSlipFooter(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">QR Code on Pass</h4>
                <p className="text-[10px] text-slate-500">Fast scan check-in</p>
              </div>
              <input
                type="checkbox"
                checked={enableQr}
                onChange={(e) => setEnableQr(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Barcode on Pass</h4>
                <p className="text-[10px] text-slate-500">1D scanner support</p>
              </div>
              <input
                type="checkbox"
                checked={enableBarcode}
                onChange={(e) => setEnableBarcode(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto-Prompt Print</h4>
                <p className="text-[10px] text-slate-500">Auto dialog on booking</p>
              </div>
              <input
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => setAutoPrint(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* CARD 3: ACOUSTIC AUDIO FEEDBACK & LIVE BROADCAST TICKER */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Campus Broadcast Marquee &amp; Audio Feedback
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Campus Marquee Ticker Message (Shown across camp displays)
                </label>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">Severity:</span>
                  <select
                    value={marqueeLevel}
                    onChange={(e) => setMarqueeLevel(e.target.value as any)}
                    className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="normal">Normal (Sky)</option>
                    <option value="important">Important Notice (Amber)</option>
                    <option value="urgent">Urgent Alert (Rose)</option>
                  </select>
                </div>
              </div>
              <input
                type="text"
                value={marqueeText}
                onChange={(e) => setMarqueeText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Audio Feedback toggle & tester */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Live Acoustic Confirmation Chime
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Provides audible tone when a booking is confirmed on the kiosk
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleTestAudio}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs"
                >
                  Test Chime
                </button>
                <input
                  type="checkbox"
                  checked={audioAlerts}
                  onChange={(e) => setAudioAlerts(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Kiosk &amp; Print Engine Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
