import React from 'react';

/**
 * High-fidelity vector illustrations matching the Planon FM portal icons
 */

export const CivilIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Construction site / building / crane */}
    <rect x="25" y="30" width="35" height="55" rx="3" fill="#94A3B8" />
    <rect x="30" y="36" width="7" height="9" rx="1" fill="#E2E8F0" />
    <rect x="42" y="36" width="7" height="9" rx="1" fill="#E2E8F0" />
    <rect x="30" y="50" width="7" height="9" rx="1" fill="#E2E8F0" />
    <rect x="42" y="50" width="7" height="9" rx="1" fill="#E2E8F0" />
    <rect x="30" y="64" width="7" height="9" rx="1" fill="#E2E8F0" />
    <rect x="42" y="64" width="7" height="9" rx="1" fill="#E2E8F0" />
    {/* Construction crane tower */}
    <path d="M75 85V20H95" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M75 35L88 20" stroke="#F59E0B" strokeWidth="2.5" />
    <path d="M75 50L90 35" stroke="#F59E0B" strokeWidth="2.5" />
    <path d="M75 65L90 50" stroke="#F59E0B" strokeWidth="2.5" />
    <path d="M92 20V32" stroke="#475569" strokeWidth="2" strokeDasharray="2 2" />
    <rect x="88" y="32" width="8" height="6" rx="1" fill="#EF4444" />
    {/* Yellow dump truck / excavator */}
    <rect x="68" y="70" width="28" height="15" rx="2" fill="#FBBF24" />
    <path d="M85 70V63H93L96 70H85Z" fill="#38BDF8" />
    <circle cx="74" cy="85" r="5" fill="#334155" />
    <circle cx="90" cy="85" r="5" fill="#334155" />
    {/* Traffic cone */}
    <path d="M12 85L17 70H23L28 85H12Z" fill="#F97316" />
    <rect x="15" y="76" width="10" height="3" fill="#FFFFFF" />
  </svg>
);

export const CleaningIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Yellow/cyan cleaning bucket */}
    <path d="M35 45L40 85C40 87 43 89 48 89H72C77 89 80 87 80 85L85 45H35Z" fill="#0EA5E9" />
    <path d="M32 45H88V41C88 39 86 38 84 38H36C34 38 32 39 32 41V45Z" fill="#38BDF8" />
    {/* Bubbles */}
    <circle cx="48" cy="33" r="6" fill="#FDE047" opacity="0.9" />
    <circle cx="62" cy="28" r="8" fill="#FDE047" opacity="0.8" />
    <circle cx="73" cy="35" r="5" fill="#FDE047" opacity="0.9" />
    {/* Spray bottles */}
    <path d="M22 62V85H34V62L28 55L22 62Z" fill="#F97316" />
    <path d="M25 55V48H27L32 50L30 52H28V55H25Z" fill="#475569" />
    {/* Brush / Mop head */}
    <path d="M78 52L95 85H85L72 58L78 52Z" fill="#F59E0B" />
    <path d="M78 52L85 40" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const ElectricalIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Gear background */}
    <path
      d="M60 22C61.5 22 62.8 23 63.2 24.5L64.5 29C66.5 29.6 68.3 30.5 70 31.6L74.2 29.8C75.6 29.2 77.2 29.6 78.1 30.8L82.1 35.8C83 37 83 38.6 82.2 39.8L79.8 43.6C80.4 45.4 80.8 47.3 80.8 49.3L85.2 51.1C86.6 51.7 87.5 53.1 87.4 54.7L86.9 61.1C86.8 62.7 85.6 63.9 84 64.2L79.5 65C78.7 66.8 77.6 68.5 76.3 70L78 74.2C78.6 75.6 78.2 77.2 77 78.1L72 82.1C70.8 83 69.2 83 68 82.2L64.2 79.8C62.4 80.4 60.5 80.8 58.5 80.8L56.7 85.2C56.1 86.6 54.7 87.5 53.1 87.4L46.7 86.9C45.1 86.8 43.9 85.6 43.6 84L42.8 79.5C41 78.7 39.3 77.6 37.8 76.3L33.6 78C32.2 78.6 30.6 78.2 29.7 77L25.7 72C24.8 70.8 24.8 69.2 25.6 68L28 64.2C27.4 62.4 27 60.5 27 58.5L22.6 56.7C21.2 56.1 20.3 54.7 20.4 53.1L20.9 46.7C21 45.1 22.2 43.9 23.8 43.6L28.3 42.8C29.1 41 30.2 39.3 31.5 37.8L29.8 33.6C29.2 32.2 29.6 30.6 30.8 29.7L35.8 25.7C37 24.8 38.6 24.8 39.8 25.6L43.6 28C45.4 27.4 47.3 27 49.3 27L51.1 22.6C51.7 21.2 53.1 20.3 54.7 20.4L60 22Z"
      fill="#334155"
    />
    <circle cx="54" cy="54" r="22" fill="#1E293B" />
    {/* Lightning Bolt */}
    <path
      d="M58 26L38 54H53L48 78L72 48H56L66 26H58Z"
      fill="#FBBF24"
      stroke="#D97706"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const EquipmentIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Grid of commercial kitchen appliances */}
    {/* Blender / Mixer */}
    <rect x="22" y="24" width="16" height="18" rx="2" fill="#67E8F9" />
    <rect x="24" y="42" width="12" height="6" fill="#334155" />
    {/* Microwave / Oven */}
    <rect x="46" y="24" width="26" height="18" rx="2" fill="#94A3B8" />
    <rect x="49" y="27" width="15" height="12" rx="1" fill="#1E293B" />
    <circle cx="68" cy="30" r="2" fill="#E2E8F0" />
    <circle cx="68" cy="36" r="2" fill="#E2E8F0" />
    {/* Commercial Food Warmer Bain Marie */}
    <rect x="80" y="24" width="22" height="18" rx="2" fill="#CBD5E1" />
    <line x1="84" y1="28" x2="84" y2="38" stroke="#475569" strokeWidth="2" />
    <line x1="91" y1="28" x2="91" y2="38" stroke="#475569" strokeWidth="2" />
    <line x1="98" y1="28" x2="98" y2="38" stroke="#475569" strokeWidth="2" />
    {/* Steam cooker / Boiler */}
    <rect x="24" y="58" width="18" height="20" rx="3" fill="#64748B" />
    <circle cx="33" cy="68" r="4" fill="#38BDF8" />
    {/* Kitchen Stove */}
    <rect x="50" y="58" width="22" height="20" rx="2" fill="#475569" />
    <rect x="54" y="62" width="14" height="12" rx="1" fill="#0F172A" />
    {/* Industrial Mixer */}
    <rect x="80" y="58" width="20" height="20" rx="3" fill="#94A3B8" />
    <path d="M85 64H95V70L90 74L85 70V64Z" fill="#F59E0B" />
  </svg>
);

export const FightingIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Red Fire Alarm Station */}
    <rect x="35" y="20" width="50" height="64" rx="6" fill="#DC2626" />
    <rect x="38" y="23" width="44" height="16" rx="3" fill="#991B1B" />
    <text x="60" y="35" fill="white" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
      FIRE
    </text>
    {/* White inner plate */}
    <rect x="42" y="44" width="36" height="34" rx="3" fill="#FFFFFF" />
    {/* Pull handle */}
    <rect x="48" y="50" width="24" height="12" rx="2" fill="#DC2626" />
    <path d="M54 62L60 72L66 62H54Z" fill="#DC2626" />
    <text x="60" y="59" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
      PULL
    </text>
  </svg>
);

export const GeneralIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Tools: wrench & screwdriver in yellow/gold */}
    <path
      d="M58 26L74 42L70 46L66 42L60 48L48 36L54 30L50 26L54 22L58 26Z"
      fill="#F59E0B"
    />
    <path d="M60 48L42 66C40 68 37 68 35 66L34 65C32 63 32 60 34 58L52 40L60 48Z" fill="#FBBF24" />
    <path d="M68 28L86 46L82 50L64 32L68 28Z" fill="#F97316" />
    {/* Open hand supporting */}
    <path
      d="M30 68L44 64C48 63 52 64 56 67L74 78C76 79 78 79 80 78L88 72C89 71 91 72 91 74C91 76 90 78 88 79L72 87C68 89 64 89 60 87L38 78C34 76 30 73 30 68Z"
      fill="#38BDF8"
    />
  </svg>
);

export const HousekeepingIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Blue bordered sign */}
    <rect x="24" y="24" width="72" height="52" rx="4" fill="#FFFFFF" stroke="#0284C7" strokeWidth="3" />
    {/* Person vacuuming silhouette */}
    <circle cx="60" cy="38" r="4" fill="#0284C7" />
    <path d="M57 44H63L65 56H61L59 50L57 56H53L57 44Z" fill="#0284C7" />
    {/* Vacuum */}
    <path d="M61 46L72 58" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
    <rect x="70" y="58" width="8" height="5" rx="1" fill="#0284C7" />
    <path d="M46 60H54V64H46Z" fill="#0284C7" />
    {/* Bottom banner text */}
    <rect x="25" y="62" width="70" height="13" fill="#0284C7" />
    <text x="60" y="71" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
      HOUSEKEEPING
    </text>
  </svg>
);

export const HseIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Hard Hat */}
    <path d="M46 40C46 30 52 24 60 24C68 24 74 30 74 40H46Z" fill="#F59E0B" />
    <rect x="42" y="40" width="36" height="5" rx="2" fill="#D97706" />
    {/* Worker face outline */}
    <circle cx="60" cy="50" r="7" fill="#FED7AA" />
    {/* Safety glasses */}
    <rect x="54" y="48" width="12" height="4" rx="2" fill="#38BDF8" />
    {/* Outstretched protective hand */}
    <path
      d="M74 54C74 50 82 48 85 54L87 68C87 72 84 76 80 78L68 83L65 77L75 73L74 54Z"
      fill="#FFFFFF"
      stroke="#1E293B"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M46 54L35 68C33 71 35 75 39 77L52 82" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const HvacIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Split AC Unit */}
    <rect x="25" y="24" width="70" height="24" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
    <rect x="30" y="42" width="60" height="4" rx="1" fill="#CBD5E1" />
    <circle cx="88" cy="30" r="2" fill="#10B981" />
    {/* Cool breeze waves */}
    <path d="M36 54C38 58 40 64 38 68" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M48 54C50 60 52 66 50 72" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M60 54C62 60 64 66 62 72" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M72 54C74 60 76 66 74 72" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M84 54C86 58 88 64 86 68" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    {/* Snowflakes */}
    <g fill="#0284C7" transform="translate(38, 76) scale(0.6)">
      <path d="M10 0V20M0 10H20M3 3L17 17M17 3L3 17" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
    </g>
    <g fill="#0284C7" transform="translate(72, 76) scale(0.6)">
      <path d="M10 0V20M0 10H20M3 3L17 17M17 3L3 17" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
    </g>
  </svg>
);

export const ItIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Computer monitor */}
    <rect x="30" y="24" width="60" height="42" rx="4" fill="#0F172A" />
    <rect x="34" y="28" width="52" height="34" rx="2" fill="#0284C7" />
    <rect x="54" y="66" width="12" height="8" fill="#475569" />
    <rect x="44" y="74" width="32" height="4" rx="2" fill="#334155" />
    {/* Network globe / signal inside screen */}
    <circle cx="60" cy="45" r="11" stroke="#FFFFFF" strokeWidth="2" fill="none" />
    <ellipse cx="60" cy="45" rx="5" ry="11" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
    <line x1="49" y1="45" x2="71" y2="45" stroke="#FFFFFF" strokeWidth="1.5" />
    {/* Wi-Fi waves on right */}
    <path d="M78 28C81 25 85 25 88 28" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
    <path d="M75 25C80 20 86 20 91 25" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
    {/* Gear on bottom right */}
    <circle cx="82" cy="62" r="6" fill="#F59E0B" />
  </svg>
);

export const LandscapingIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Brown Soil mound */}
    <ellipse cx="60" cy="80" rx="36" ry="10" fill="#92400E" />
    {/* Fresh green sprout with leaves */}
    <path d="M60 80V45" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
    <path d="M60 55C50 48 42 55 40 62C52 64 58 58 60 55Z" fill="#22C55E" />
    <path d="M60 45C70 38 78 45 80 52C68 54 62 48 60 45Z" fill="#16A34A" />
    {/* Garden shovel */}
    <path d="M72 45L86 78H78L68 50L72 45Z" fill="#64748B" />
    <path d="M72 45L78 30" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
    <circle cx="79" cy="28" r="3" stroke="#F59E0B" strokeWidth="2" fill="none" />
  </svg>
);

export const LaundryIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Blue Washing Machine */}
    <rect x="25" y="26" width="40" height="52" rx="4" fill="#0284C7" />
    <circle cx="45" cy="54" r="14" fill="#E0F2FE" />
    <circle cx="45" cy="54" r="9" fill="#0284C7" />
    <circle cx="34" cy="33" r="2" fill="#FFFFFF" />
    <circle cx="40" cy="33" r="2" fill="#FFFFFF" />
    <rect x="50" y="32" width="10" height="3" rx="1" fill="#FFFFFF" />
    {/* Ironing board */}
    <path d="M70 48H105L102 52H70V48Z" fill="#60A5FA" />
    <path d="M75 52L95 80M95 52L75 80" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
    {/* Iron */}
    <path d="M86 42H96L99 48H84L86 42Z" fill="#38BDF8" />
  </svg>
);

export const MechanicalIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Two crossed spanners & interlocking gears in pink & blue */}
    <path
      d="M38 32L78 78L70 84L30 38L38 32Z"
      fill="#F43F5E"
    />
    <path
      d="M72 32L32 78L40 84L80 38L72 32Z"
      fill="#0284C7"
    />
    {/* Wrench heads */}
    <circle cx="34" cy="34" r="10" fill="#F43F5E" />
    <circle cx="34" cy="34" r="5" fill="#FFFFFF" />
    <circle cx="76" cy="34" r="10" fill="#0284C7" />
    <circle cx="76" cy="34" r="5" fill="#FFFFFF" />
    <circle cx="34" cy="80" r="10" fill="#0284C7" />
    <circle cx="34" cy="80" r="5" fill="#FFFFFF" />
    <circle cx="76" cy="80" r="10" fill="#F43F5E" />
    <circle cx="76" cy="80" r="5" fill="#FFFFFF" />
  </svg>
);

export const PestControlIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Circular beige badge */}
    <circle cx="60" cy="50" r="32" fill="#FED7AA" opacity="0.8" />
    {/* Dark brown bug / beetle */}
    <ellipse cx="60" cy="52" rx="12" ry="16" fill="#78350F" />
    <circle cx="60" cy="34" r="7" fill="#78350F" />
    {/* Bug antennae */}
    <path d="M56 30C52 24 46 22 42 22" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 30C68 24 74 22 78 22" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
    {/* Bug legs */}
    <path d="M48 44L36 38M48 52L32 52M48 60L36 68" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M72 44L84 38M72 52L88 52M72 60L84 68" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
    {/* Back wing divider */}
    <line x1="60" y1="38" x2="60" y2="68" stroke="#FED7AA" strokeWidth="2" />
  </svg>
);

export const PulmingIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Gray mechanical gear */}
    <circle cx="50" cy="58" r="18" fill="#475569" stroke="#334155" strokeWidth="3" />
    <circle cx="50" cy="58" r="8" fill="#FFFFFF" />
    {/* Metal water pipes & valve */}
    <path d="M44 26H76V34H68V48H60V34H44V26Z" fill="#64748B" />
    <path d="M68 44H84V64H76V52H68V44Z" fill="#94A3B8" />
    {/* Water faucet */}
    <path d="M76 64H88V72H84V78H78V72H76V64Z" fill="#3B82F6" />
    {/* Water drop */}
    <path d="M81 82C81 82 77 87 77 89C77 91.2 78.8 93 81 93C83.2 93 85 91.2 85 89C85 87 81 82 81 82Z" fill="#38BDF8" />
  </svg>
);

export const WasteManagementIllustration: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Green garbage truck */}
    <path d="M30 68V48L52 44V68H30Z" fill="#16A34A" />
    <path d="M52 44L74 46V68H52V44Z" fill="#22C55E" />
    <path d="M74 52L86 52L92 60V68H74V52Z" fill="#FBBF24" />
    <rect x="80" y="55" width="8" height="6" fill="#38BDF8" />
    {/* Wheels */}
    <circle cx="42" cy="72" r="7" fill="#1E293B" />
    <circle cx="42" cy="72" r="3" fill="#E2E8F0" />
    <circle cx="82" cy="72" r="7" fill="#1E293B" />
    <circle cx="82" cy="72" r="3" fill="#E2E8F0" />
    {/* Recycle logo in white on green box */}
    <path
      d="M48 50L54 44L50 44C50 41 53 39 56 39L57 41L61 38L57 35L56 37C51 37 48 40 48 44H44L48 50Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const ReportsDocumentIllustration: React.FC<{ className?: string }> = ({ className = 'h-40 w-40' }) => (
  <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Background page tilted */}
    <rect x="25" y="20" width="105" height="135" rx="8" fill="#DBEAFE" transform="rotate(-6 25 20)" />
    {/* Foreground page */}
    <rect x="36" y="24" width="100" height="136" rx="8" fill="#FFFFFF" stroke="#2563EB" strokeWidth="5" />
    {/* Growth trend arrow */}
    <path d="M50 78L70 66L84 74L110 52" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M102 50H112V60" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Bar chart */}
    <rect x="48" y="90" width="10" height="32" rx="2" fill="#3B82F6" />
    <rect x="64" y="98" width="10" height="24" rx="2" fill="#60A5FA" />
    <rect x="80" y="86" width="10" height="36" rx="2" fill="#2563EB" />
    <rect x="96" y="92" width="10" height="30" rx="2" fill="#60A5FA" />
    <rect x="112" y="80" width="10" height="42" rx="2" fill="#1D4ED8" />
    {/* Base line */}
    <line x1="44" y1="124" x2="128" y2="124" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
    {/* Text lines */}
    <line x1="46" y1="140" x2="126" y2="140" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
    <line x1="46" y1="150" x2="126" y2="150" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
    <line x1="46" y1="160" x2="96" y2="160" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
  </svg>
);
