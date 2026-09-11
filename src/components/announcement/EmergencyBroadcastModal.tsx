import React, { useState } from 'react';
import {
  AlertTriangle,
  Volume2,
  VolumeX,
  Share2,
  Globe,
  Radio,
  X,
  Check,
  Send,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmergencyBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcast?: (alertData: any) => void;
}

export const EmergencyBroadcastModal: React.FC<EmergencyBroadcastModalProps> = ({
  isOpen,
  onClose,
  onBroadcast,
}) => {
  const [alertType, setAlertType] = useState<'FIRE_DRILL' | 'WEATHER_WARNING' | 'WATER_SHUTDOWN' | 'POWER_OUTAGE' | 'GENERAL_CAMP_ALERT'>('FIRE_DRILL');
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'EN' | 'AR' | 'HI' | 'UR'>('EN');

  const alertTemplates = {
    FIRE_DRILL: {
      EN: '🚨 EMERGENCY FIRE DRILL IN PROGRESS: Please proceed calmly to your designated Building Assembly Point immediately. Do not use elevators. Follow instructions from Camp Safety Marshals.',
      AR: '🚨 تمرين إخلاء طوارئ (حريق): يرجى التوجه بهدوء إلى نقطة التجمع المحددة للمبنى فوراً. اتبع تعليمات مشرفي السلامة.',
      HI: '🚨 आपातकालीन फायर ड्रिल जारी है: कृपया तुरंत शांतिपूर्वक अपने निर्दिष्ट बिल्डिंग असेंबली पॉइंट पर जाएं। सुरक्षा अधिकारियों के निर्देशों का पालन करें।',
      UR: '🚨 ہنگامی فائر ڈرل جاری ہے: براہ کرم فوری طور پر پرسکون رہ کر اپنی عمارت کے اسمبلی پوائنٹ پر جائیں۔ کیمپ سیفٹی مارشلز کی ہدایات پر عمل کریں۔',
    },
    WEATHER_WARNING: {
      EN: '⚠️ SEVERE WEATHER ALERT: High wind sandstorm forecasted. Secure outdoor gear and remain inside accommodations until further notice.',
      AR: '⚠️ تنبيه جوي طارئ: توقع عواصف رملية ورياح قوية. يرجى البقاء داخل غرف الإقامة وتأمين الممتلكات الخارجية.',
      HI: '⚠️ खराब मौसम की चेतावनी: तेज रेत के तूफान का पूर्वानुमान है। कृपया अपनी आवासीय इकाइयों के अंदर रहें।',
      UR: '⚠️ شدید موسمی انتباہ: تیز ہوا اور ریت کے طوفان کی پیش گوئی ہے۔ براہ کرم رہائش گاہ کے اندر رہیں اور محفوظ رہیں۔',
    },
    WATER_SHUTDOWN: {
      EN: '🚰 SCHEDULED WATER TANK MAINTENANCE: Temporary water supply interruption across all residential blocks from 02:00 PM to 04:30 PM today.',
      AR: '🚰 صيانة شبكة المياه: انقطاع مؤقت لخدمة المياه في جميع المباني السكنية اليوم من 02:00 ظهراً حتى 04:30 عصراً.',
      HI: '🚰 पानी की आपूर्ति का रखरखाव: आज दोपहर 02:00 से 04:30 बजे तक सभी आवासीय ब्लॉकों में पानी की आपूर्ति अस्थायी रूप से बाधित रहेगी।',
      UR: '🚰 پانی کی لائنوں کی دیکھ بھال: آج دوپہر 02:00 سے شام 04:30 بجے تک تمام رہائشی بلاکس میں پانی کی سپلائی عارضی طور پر معطل رہے گی۔',
    },
    POWER_OUTAGE: {
      EN: '⚡ GENERATOR TESTING NOTICE: Essential generator switchover test will occur between 01:00 AM – 01:30 AM tonight.',
      AR: '⚡ فحص المولدات الاحتياطية: سيتم إجراء اختبار تبديل المولدات الليلة بين 01:00 ص – 01:30 ص.',
      HI: '⚡ जनरेटर टेस्टिंग नोटिस: आज रात 01:00 AM से 01:30 AM के बीच जनरेटर स्विचओवर टेस्ट किया जाएगा।',
      UR: '⚡ جنریٹر ٹیسٹنگ نوٹس: آج رات 01:00 سے 01:30 کے درمیان جنریٹر ٹیسٹ کیا جائے گا۔',
    },
    GENERAL_CAMP_ALERT: {
      EN: '📢 OFFICIAL CAMP MANAGEMENT NOTICE: All residents must carry Camp RFID ID Badges when entering the central dining hall.',
      AR: '📢 إشعار رسمي من إدارة المخيم: يجب على جميع المقيمين إبراز بطاقة الهوية عند دخول صالة الطعام الرئيسية.',
      HI: '📢 आधिकारिक कैंप सूचना: मुख्य डाइनिंग हॉल में प्रवेश करते समय सभी निवासियों को अपना कैंप आईडी कार्ड साथ रखना अनिवार्य है।',
      UR: '📢 آفیشل کیمپ مینجمنٹ نوٹس: مین ڈائننگ ہال میں داخل ہوتے وقت تمام رہائشیوں کے لیے کیمپ شناختی کارڈ ساتھ رکھنا لازمی ہے۔',
    },
  };

  const currentMessage = alertTemplates[alertType][selectedLanguage];

  // Sound Siren Oscillator
  const toggleSiren = () => {
    if (isSirenActive) {
      setIsSirenActive(false);
    } else {
      setIsSirenActive(true);
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.0);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } catch (e) {}
    }
  };

  const handleSendWhatsAppBroadcast = () => {
    const encoded = encodeURIComponent(`🚨 *TAMIMI CAMP EMERGENCY BROADCAST*\n\n${currentMessage}\n\n_— Issued by Camp Health & Safety Control Room_`);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="emergency-broadcast-modal-overlay"
        className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border-2 border-red-500/60 rounded-3xl w-full max-w-2xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-b-2 border-red-500/40 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-red-600/40 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide uppercase">
                    EMERGENCY BROADCAST CONTROL
                  </h2>
                  <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md animate-ping">
                    ALERT
                  </span>
                </div>
                <p className="text-xs text-red-300/90 font-medium">
                  Instant Siren Tone & Multi-Lingual Resident Broadcast Dispatcher
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Alert Category Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-red-300 mb-2">
                1. Select Emergency Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'FIRE_DRILL', label: '🔥 Fire Drill / Alarm' },
                  { id: 'WEATHER_WARNING', label: '🌪️ Sandstorm / Rain' },
                  { id: 'WATER_SHUTDOWN', label: '🚰 Water Interruption' },
                  { id: 'POWER_OUTAGE', label: '⚡ Power / Generator' },
                  { id: 'GENERAL_CAMP_ALERT', label: '📢 General Camp Notice' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setAlertType(type.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                      alertType === type.id
                        ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/30'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-red-300 mb-2 flex items-center space-x-1.5">
                <Globe className="w-4 h-4" />
                <span>2. Multi-Language Instant Translation</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'EN', label: '🇬🇧 English' },
                  { code: 'AR', label: '🇸🇦 العربية (Arabic)' },
                  { code: 'HI', label: '🇮🇳 हिन्दी (Hindi)' },
                  { code: 'UR', label: '🇵🇰 اردو (Urdu)' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      selectedLanguage === lang.code
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Message Preview */}
            <div className="p-4 bg-red-950/40 border-2 border-red-500/40 rounded-2xl space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-red-400 block">
                Broadcast Output Preview:
              </span>
              <p className="text-sm font-bold text-white leading-relaxed font-sans">{currentMessage}</p>
            </div>

            {/* Siren Tone Controls */}
            <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-xs font-black text-white">Audio Alert Chime</div>
                  <div className="text-[11px] text-slate-400">Play standard high-frequency camp evacuation tone</div>
                </div>
              </div>
              <button
                onClick={toggleSiren}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer"
              >
                🔊 Play Siren Tone
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-950 border-t-2 border-red-500/40 p-4 sm:p-5 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSendWhatsAppBroadcast}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast to Camp WhatsApp Groups</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
