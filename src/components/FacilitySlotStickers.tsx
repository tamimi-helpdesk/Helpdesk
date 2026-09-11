import React from 'react';

export interface SlotStickerProps {
  facilityId: string;
  slotIndex?: number;
  status: 'AVAILABLE' | 'BOOKED' | 'BREAK' | 'SELECTED' | 'NEXT';
  className?: string;
}

/**
 * Helper to compute dark, high-contrast opacity for stickers
 */
const getStickerOpacity = (status: string) => {
  if (status === 'SELECTED') return 'opacity-85 dark:opacity-90';
  if (status === 'BOOKED') return 'opacity-40 dark:opacity-45';
  if (status === 'BREAK') return 'opacity-35 dark:opacity-40';
  return 'opacity-75 group-hover:opacity-100 transition-all duration-200';
};

/**
 * 1. BARBER STICKERS (Scissors, Barber Pole, Razor & Comb, VIP Crest)
 */
export const BarberSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: Barber Pole + Scissor Cross (Royal Indigo Luxe)
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Barber Pole Stripes */}
        <g transform="rotate(-15 50 50)">
          <rect x="36" y="10" width="28" height="80" rx="6" fill="#818cf8" fillOpacity="0.45" stroke="#3730a3" strokeWidth="3" />
          <path d="M36 25 L64 10 M36 45 L64 30 M36 65 L64 50 M36 85 L64 70" stroke="#6d28d9" strokeWidth="7" strokeLinecap="round" opacity="0.95" />
          <path d="M36 35 L64 20 M36 55 L64 40 M36 75 L64 60" stroke="#1d4ed8" strokeWidth="7" strokeLinecap="round" opacity="0.95" />
          {/* Pole Caps */}
          <ellipse cx="50" cy="10" rx="16" ry="6" fill="#a5b4fc" stroke="#312e81" strokeWidth="3" />
          <ellipse cx="50" cy="90" rx="16" ry="6" fill="#a5b4fc" stroke="#312e81" strokeWidth="3" />
        </g>
        {/* Scissor Silhouette */}
        <g transform="translate(15, 20) rotate(25)">
          <circle cx="15" cy="55" r="8" fill="#e0e7ff" stroke="#3730a3" strokeWidth="4" />
          <circle cx="35" cy="55" r="8" fill="#e0e7ff" stroke="#3730a3" strokeWidth="4" />
          <line x1="20" y1="50" x2="35" y2="15" stroke="#312e81" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="30" y1="50" x2="15" y2="15" stroke="#312e81" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="25" cy="33" r="3.5" fill="#1e1b4b" />
        </g>
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Straight Razor + Comb
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Barber Comb */}
        <g transform="rotate(-30 40 40)">
          <rect x="15" y="25" width="70" height="13" rx="3" fill="#6366f1" fillOpacity="0.55" stroke="#312e81" strokeWidth="3" />
          {/* Comb Teeth */}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i} x1={20 + i * 4.5} y1="38" x2={20 + i * 4.5} y2="54" stroke="#312e81" strokeWidth="3" strokeLinecap="round" />
          ))}
        </g>
        {/* Straight Razor Blade */}
        <g transform="translate(25, 30) rotate(15)">
          <path d="M10 20 C10 10, 45 5, 55 18 L48 45 C42 38, 15 30, 10 20 Z" fill="#818cf8" opacity="0.8" stroke="#312e81" strokeWidth="3" />
          <path d="M10 20 C18 35, 24 60, 20 72 L6 68 C10 52, 4 32, 10 20 Z" fill="#6366f1" stroke="#1e1b4b" strokeWidth="3" />
          <circle cx="10" cy="20" r="4" fill="#312e81" />
        </g>
      </svg>
    );
  } else {
    // Variant C: Executive Barber Crown & Mustache Badge
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Indigo Laurel / Crest Circle */}
        <circle cx="50" cy="50" r="42" stroke="#4338ca" strokeWidth="3.5" strokeDasharray="5 3" opacity="0.9" fill="#e0e7ff" fillOpacity="0.2" />
        {/* Gentleman Mustache */}
        <path
          d="M50 52 C45 42, 25 42, 18 56 C25 64, 42 62, 50 56 C58 62, 75 64, 82 56 C75 42, 55 42, 50 52 Z"
          fill="#3730a3"
          stroke="#1e1b4b"
          strokeWidth="3"
        />
        {/* Vintage Barber Scissors Icon */}
        <path d="M35 25 L65 45 M65 25 L35 45" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
        <circle cx="33" cy="23" r="6" fill="#e0e7ff" stroke="#3730a3" strokeWidth="3" />
        <circle cx="67" cy="23" r="6" fill="#e0e7ff" stroke="#3730a3" strokeWidth="3" />
      </svg>
    );
  }
};

/**
 * 2. CRICKET GROUND STICKERS (Bat, Leather Ball, Wickets & Pitch)
 */
export const CricketSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: Willow Cricket Bat + Red Leather Ball
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Cricket Turf Ring */}
        <circle cx="50" cy="50" r="42" fill="#10b981" fillOpacity="0.3" stroke="#047857" strokeWidth="3" strokeDasharray="4 3" />
        {/* Cricket Bat */}
        <g transform="rotate(-35 45 50)">
          {/* Handle */}
          <rect x="42" y="10" width="6" height="24" rx="2" fill="#e2e8f0" stroke="#047857" strokeWidth="2.5" />
          <line x1="42" y1="16" x2="48" y2="16" stroke="#047857" strokeWidth="2.5" />
          <line x1="42" y1="22" x2="48" y2="22" stroke="#047857" strokeWidth="2.5" />
          {/* Blade */}
          <path d="M38 34 C38 32, 52 32, 52 34 L54 84 C54 88, 36 88, 36 84 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="3" />
          <line x1="45" y1="36" x2="45" y2="82" stroke="#92400e" strokeWidth="3" opacity="0.9" />
          <rect x="39" y="42" width="12" height="15" rx="1" fill="#047857" />
        </g>
        {/* Red Leather Cricket Ball with White Seam */}
        <g transform="translate(48, 48)">
          <circle cx="18" cy="18" r="14" fill="#dc2626" stroke="#7f1d1d" strokeWidth="3" />
          <path d="M8 10 C18 18, 18 18, 28 26" stroke="#ffffff" strokeWidth="3" strokeDasharray="3 2" strokeLinecap="round" />
          <ellipse cx="14" cy="12" rx="4" ry="2" transform="rotate(-30 14 12)" fill="#ffffff" opacity="0.8" />
        </g>
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Stumps / Wickets & Bails + Grass Turf
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Pitch Crease Line */}
        <line x1="15" y1="80" x2="85" y2="80" stroke="#047857" strokeWidth="4" strokeLinecap="round" />
        <line x1="25" y1="65" x2="75" y2="65" stroke="#059669" strokeWidth="3" strokeDasharray="3 3" opacity="0.9" />
        {/* 3 Stumps */}
        <g transform="translate(32, 22)">
          <rect x="4" y="10" width="5" height="48" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="2.5" />
          <rect x="16" y="10" width="5" height="48" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="2.5" />
          <rect x="28" y="10" width="5" height="48" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="2.5" />
          {/* Bails */}
          <rect x="2" y="7" width="16" height="4" rx="1.5" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
          <rect x="18" y="7" width="16" height="4" rx="1.5" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
        </g>
        {/* Flying Red Ball Hit */}
        <circle cx="24" cy="30" r="10" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2.5" />
        <path d="M16 26 C22 30, 24 32, 30 36" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="2 1.5" />
      </svg>
    );
  } else {
    // Variant C: Cricket Championship Shield / Boundary 6 Trophy
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Crest Shield */}
        <path d="M50 15 L80 25 L80 60 C80 75, 50 88, 50 88 C50 88, 20 75, 20 60 L20 25 Z" fill="#059669" fillOpacity="0.35" stroke="#047857" strokeWidth="3.5" />
        {/* Crossed Bats */}
        <line x1="30" y1="30" x2="70" y2="70" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
        <line x1="70" y1="30" x2="30" y2="70" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
        {/* Center Cricket Ball */}
        <circle cx="50" cy="50" r="12" fill="#dc2626" stroke="#7f1d1d" strokeWidth="3" />
        <path d="M42 46 C48 50, 52 52, 58 56" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="2 2" />
      </svg>
    );
  }
};

/**
 * 3. FOOTBALL GROUND STICKERS (Soccer Ball, Goal Post, Cleat & Whistle)
 */
export const FootballSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: Classic 32-Panel Soccer Football
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#0f172a" strokeWidth="4" />
        {/* Center Pentagon */}
        <polygon points="50,38 60,45 56,58 44,58 40,45" fill="#1e3a8a" stroke="#0f172a" strokeWidth="2" />
        {/* Seams */}
        <line x1="50" y1="38" x2="50" y2="24" stroke="#0f172a" strokeWidth="3" />
        <line x1="60" y1="45" x2="74" y2="40" stroke="#0f172a" strokeWidth="3" />
        <line x1="56" y1="58" x2="68" y2="72" stroke="#0f172a" strokeWidth="3" />
        <line x1="44" y1="58" x2="32" y2="72" stroke="#0f172a" strokeWidth="3" />
        <line x1="40" y1="45" x2="26" y2="40" stroke="#0f172a" strokeWidth="3" />
        {/* Outer Pentagons */}
        <polygon points="50,24 42,16 58,16" fill="#1e3a8a" />
        <polygon points="74,40 82,30 84,46" fill="#1e3a8a" />
        <polygon points="68,72 80,74 74,84" fill="#1e3a8a" />
        <polygon points="32,72 26,84 20,74" fill="#1e3a8a" />
        <polygon points="26,40 16,46 18,30" fill="#1e3a8a" />
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Goal Post & Net with Ball in Top Corner
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Goal Net */}
        <path d="M15 30 L85 30 L75 75 L25 75 Z" fill="#3b82f6" fillOpacity="0.3" stroke="#1d4ed8" strokeWidth="3" strokeDasharray="3 3" />
        <line x1="15" y1="30" x2="85" y2="30" stroke="#1e3a8a" strokeWidth="5" strokeLinecap="round" />
        <line x1="15" y1="30" x2="25" y2="75" stroke="#1e3a8a" strokeWidth="4" />
        <line x1="85" y1="30" x2="75" y2="75" stroke="#1e3a8a" strokeWidth="4" />
        {/* Net Grid Lines */}
        <line x1="32" y1="30" x2="38" y2="75" stroke="#2563eb" strokeWidth="2" strokeDasharray="2 2" />
        <line x1="50" y1="30" x2="50" y2="75" stroke="#2563eb" strokeWidth="2" strokeDasharray="2 2" />
        <line x1="68" y1="30" x2="62" y2="75" stroke="#2563eb" strokeWidth="2" strokeDasharray="2 2" />
        <line x1="20" y1="52" x2="80" y2="52" stroke="#2563eb" strokeWidth="2" strokeDasharray="2 2" />
        {/* Ball in Goal */}
        <circle cx="70" cy="40" r="11" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
        <polygon points="70,36 74,38 72,43 68,43 66,38" fill="#1e3a8a" />
      </svg>
    );
  } else {
    // Variant C: Football Boots / Cleat & Whistle Badge
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Stadium Turf Oval */}
        <ellipse cx="50" cy="50" rx="42" ry="38" fill="#2563eb" fillOpacity="0.3" stroke="#1e40af" strokeWidth="3" />
        {/* Football Cleat Shoe */}
        <g transform="translate(20, 25) rotate(-10)">
          <path d="M10 35 C15 25, 30 20, 45 28 L52 35 C55 42, 48 48, 38 48 L12 48 C6 48, 5 42, 10 35 Z" fill="#1d4ed8" stroke="#0f172a" strokeWidth="3" />
          {/* Studs */}
          <rect x="15" y="48" width="4" height="6" fill="#dc2626" />
          <rect x="25" y="48" width="4" height="6" fill="#dc2626" />
          <rect x="38" y="48" width="4" height="6" fill="#dc2626" />
          <rect x="46" y="48" width="4" height="6" fill="#dc2626" />
          {/* Sport Swoosh */}
          <path d="M18 36 C28 32, 38 36, 44 32" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </g>
        {/* Referee Whistle */}
        <g transform="translate(54, 48)">
          <circle cx="16" cy="16" r="11" fill="#f59e0b" stroke="#92400e" strokeWidth="3" />
          <rect x="4" y="10" width="14" height="9" rx="2" fill="#f59e0b" stroke="#92400e" strokeWidth="2.5" />
        </g>
      </svg>
    );
  }
};

/**
 * 4. BASKETBALL COURT STICKERS (Orange Ball, Hoop Backboard & Sneakers)
 */
export const BasketballSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: Textured Orange Basketball with Black Seams
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="38" fill="#ea580c" stroke="#7c2d12" strokeWidth="4" />
        {/* Black Seams */}
        <line x1="12" y1="50" x2="88" y2="50" stroke="#0c0a09" strokeWidth="4" />
        <line x1="50" y1="12" x2="50" y2="88" stroke="#0c0a09" strokeWidth="4" />
        <path d="M24 24 C42 40, 42 60, 24 76" stroke="#0c0a09" strokeWidth="4" fill="none" />
        <path d="M76 24 C58 40, 58 60, 76 76" stroke="#0c0a09" strokeWidth="4" fill="none" />
        {/* Shine Highlight */}
        <ellipse cx="38" cy="34" rx="10" ry="5" transform="rotate(-30 38 34)" fill="#ffedd5" opacity="0.8" />
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Hydraulic Glass Backboard & Hoop Rim with Net
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Backboard */}
        <rect x="18" y="16" width="64" height="42" rx="3" fill="#fdba74" fillOpacity="0.4" stroke="#c2410c" strokeWidth="3.5" />
        <rect x="36" y="30" width="28" height="20" fill="none" stroke="#dc2626" strokeWidth="3.5" />
        {/* Orange Rim */}
        <ellipse cx="50" cy="50" rx="18" ry="6" fill="none" stroke="#9a3412" strokeWidth="5" />
        {/* Net */}
        <path
          d="M34 52 L38 74 L50 82 L62 74 L66 52 M40 54 L50 74 L60 54 M36 62 L64 62 M38 70 L62 70"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.95"
        />
      </svg>
    );
  } else {
    // Variant C: Slam Dunk Trophy & Court 3-Point Line
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* 3-Point Arc */}
        <path d="M15 85 C15 45, 85 45, 85 85" stroke="#c2410c" strokeWidth="4" strokeDasharray="5 3" fill="none" />
        <rect x="35" y="45" width="30" height="40" fill="#ea580c" fillOpacity="0.3" stroke="#9a3412" strokeWidth="3" />
        <circle cx="50" cy="45" r="14" fill="none" stroke="#ea580c" strokeWidth="3" />
        {/* Trophy Cup */}
        <g transform="translate(34, 18)">
          <path d="M6 8 L26 8 L24 24 C24 30, 8 30, 8 24 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="3" />
          <path d="M16 28 L16 36 M10 36 L22 36" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <path d="M6 12 C0 12, 0 20, 6 22 M26 12 C32 12, 32 20, 26 22" stroke="#78350f" strokeWidth="3" fill="none" />
        </g>
      </svg>
    );
  }
};

/**
 * 5. CINEMA STICKERS (Film Reel, Popcorn, Clapperboard & VIP Ticket)
 */
export const CinemaSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: 35mm Gold Film Reel
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="38" fill="#4c0519" stroke="#e11d48" strokeWidth="4" />
        <circle cx="50" cy="50" r="26" fill="#1c1917" stroke="#9f1239" strokeWidth="3" />
        <circle cx="50" cy="50" r="10" fill="#f43f5e" />
        {/* Reel Holes */}
        <circle cx="50" cy="34" r="5.5" fill="#e2e8f0" stroke="#be123c" strokeWidth="1.5" />
        <circle cx="64" cy="42" r="5.5" fill="#e2e8f0" stroke="#be123c" strokeWidth="1.5" />
        <circle cx="64" cy="58" r="5.5" fill="#e2e8f0" stroke="#be123c" strokeWidth="1.5" />
        <circle cx="50" cy="66" r="5.5" fill="#e2e8f0" stroke="#be123c" strokeWidth="1.5" />
        <circle cx="36" cy="58" r="5.5" fill="#e2e8f0" stroke="#be123c" strokeWidth="1.5" />
        <circle cx="36" cy="42" r="5.5" fill="#e2e8f0" stroke="#be123c" strokeWidth="1.5" />
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Popcorn Tub + 3D Glasses
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Popcorn Tub */}
        <path d="M26 35 L32 82 L68 82 L74 35 Z" fill="#ffffff" stroke="#9f1239" strokeWidth="3.5" />
        <polygon points="34,35 38,82 46,82 44,35" fill="#e11d48" />
        <polygon points="54,35 56,82 64,82 66,35" fill="#e11d48" />
        {/* Popcorn Kernels */}
        <circle cx="34" cy="30" r="8" fill="#fef08a" stroke="#854d0e" strokeWidth="2.5" />
        <circle cx="46" cy="24" r="9" fill="#fef9c3" stroke="#854d0e" strokeWidth="2.5" />
        <circle cx="58" cy="22" r="10" fill="#fde047" stroke="#854d0e" strokeWidth="2.5" />
        <circle cx="68" cy="28" r="8" fill="#fef08a" stroke="#854d0e" strokeWidth="2.5" />
        <circle cx="50" cy="32" r="7" fill="#fef9c3" stroke="#854d0e" strokeWidth="2.5" />
        {/* 3D Glasses */}
        <g transform="translate(20, 52)">
          <rect x="0" y="0" width="28" height="16" rx="2" fill="#0284c7" stroke="#0f172a" strokeWidth="3" opacity="0.95" />
          <rect x="32" y="0" width="28" height="16" rx="2" fill="#e11d48" stroke="#0f172a" strokeWidth="3" opacity="0.95" />
          <line x1="28" y1="6" x2="32" y2="6" stroke="#0f172a" strokeWidth="3" />
        </g>
      </svg>
    );
  } else {
    // Variant C: Movie Clapperboard & VIP Admit One Ticket
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Clapperboard */}
        <g transform="translate(18, 15) rotate(-10)">
          <rect x="0" y="14" width="54" height="36" rx="3" fill="#0f172a" stroke="#be123c" strokeWidth="3" />
          {/* Zebra Top */}
          <rect x="0" y="0" width="54" height="14" rx="2" fill="#0f172a" stroke="#be123c" strokeWidth="3" />
          <polygon points="8,0 16,0 10,14 2,14" fill="#ffffff" />
          <polygon points="22,0 30,0 24,14 16,14" fill="#ffffff" />
          <polygon points="36,0 44,0 38,14 30,14" fill="#ffffff" />
        </g>
        {/* VIP Ticket */}
        <g transform="translate(30, 48) rotate(12)">
          <rect x="0" y="0" width="52" height="28" rx="4" fill="#f59e0b" stroke="#78350f" strokeWidth="3" />
          <line x1="38" y1="0" x2="38" y2="28" stroke="#78350f" strokeWidth="2.5" strokeDasharray="3 2" />
          <circle cx="38" cy="0" r="4" fill="#ffffff" />
          <circle cx="38" cy="28" r="4" fill="#ffffff" />
          <text x="18" y="18" textAnchor="middle" fill="#451a03" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            VIP 4K
          </text>
        </g>
      </svg>
    );
  }
};

/**
 * 6. TENNIS COURT STICKERS (Racket, Neon Felt Ball & Baseline)
 */
export const TennisSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: Cross-Strung Tennis Racket & Neon Ball
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Racket */}
        <g transform="rotate(-40 45 50)">
          {/* Handle */}
          <rect x="42" y="58" width="6" height="34" rx="2" fill="#0f766e" stroke="#134e4a" strokeWidth="2.5" />
          {/* Head */}
          <ellipse cx="45" cy="28" rx="20" ry="26" fill="none" stroke="#0f766e" strokeWidth="4" />
          {/* Strings */}
          <g opacity="0.9">
            <line x1="34" y1="12" x2="34" y2="44" stroke="#14b8a6" strokeWidth="2" />
            <line x1="40" y1="6" x2="40" y2="50" stroke="#14b8a6" strokeWidth="2" />
            <line x1="45" y1="4" x2="45" y2="52" stroke="#14b8a6" strokeWidth="2" />
            <line x1="50" y1="6" x2="50" y2="50" stroke="#14b8a6" strokeWidth="2" />
            <line x1="56" y1="12" x2="56" y2="44" stroke="#14b8a6" strokeWidth="2" />
            <line x1="30" y1="18" x2="60" y2="18" stroke="#14b8a6" strokeWidth="2" />
            <line x1="26" y1="28" x2="64" y2="28" stroke="#14b8a6" strokeWidth="2" />
            <line x1="30" y1="38" x2="60" y2="38" stroke="#14b8a6" strokeWidth="2" />
          </g>
        </g>
        {/* Neon Tennis Ball */}
        <g transform="translate(56, 26)">
          <circle cx="16" cy="16" r="14" fill="#a3e635" stroke="#1a2e05" strokeWidth="3" />
          <path d="M6 16 C12 10, 20 10, 26 16" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M6 16 C12 22, 20 22, 26 16" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Tennis Court Lines & Net
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Tennis Court Layout */}
        <rect x="15" y="15" width="70" height="70" fill="#14b8a6" fillOpacity="0.3" stroke="#0f766e" strokeWidth="3.5" />
        <line x1="25" y1="15" x2="25" y2="85" stroke="#ffffff" strokeWidth="2.5" opacity="0.9" />
        <line x1="75" y1="15" x2="75" y2="85" stroke="#ffffff" strokeWidth="2.5" opacity="0.9" />
        <line x1="15" y1="50" x2="85" y2="50" stroke="#0d9488" strokeWidth="4" />
        <line x1="50" y1="30" x2="50" y2="70" stroke="#ffffff" strokeWidth="2.5" opacity="0.9" />
        <line x1="25" y1="30" x2="75" y2="30" stroke="#ffffff" strokeWidth="2.5" opacity="0.9" />
        <line x1="25" y1="70" x2="75" y2="70" stroke="#ffffff" strokeWidth="2.5" opacity="0.9" />
        {/* Tennis Ball */}
        <circle cx="50" cy="50" r="10" fill="#a3e635" stroke="#1a2e05" strokeWidth="2.5" />
      </svg>
    );
  } else {
    // Variant C: Dual Crossed Rackets & Match Ace Star
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="40" stroke="#0f766e" strokeWidth="3" strokeDasharray="5 3" fill="#ccfbf1" fillOpacity="0.25" />
        {/* Crossed Rackets */}
        <line x1="20" y1="80" x2="80" y2="20" stroke="#0f766e" strokeWidth="5" strokeLinecap="round" />
        <line x1="80" y1="80" x2="20" y2="20" stroke="#0f766e" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="70" cy="30" rx="12" ry="16" fill="none" stroke="#0d9488" strokeWidth="3.5" transform="rotate(45 70 30)" />
        <ellipse cx="30" cy="30" rx="12" ry="16" fill="none" stroke="#0d9488" strokeWidth="3.5" transform="rotate(-45 30 30)" />
        {/* Center Ball */}
        <circle cx="50" cy="50" r="11" fill="#a3e635" stroke="#1a2e05" strokeWidth="3" />
      </svg>
    );
  }
};

/**
 * 7. CRICKET NET STICKERS (Cage Netting, Speed Radar & Bowling Cannon)
 */
export const CricketNetSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: 145 KM/H Speed Radar Gun & High-Velocity Ball
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Radar Screen Box */}
        <rect x="20" y="30" width="60" height="42" rx="6" fill="#0f172a" stroke="#0891b2" strokeWidth="3.5" />
        <text x="50" y="52" textAnchor="middle" fill="#22d3ee" fontSize="17" fontWeight="900" fontFamily="sans-serif">
          145
        </text>
        <text x="50" y="64" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="900" fontFamily="sans-serif">
          KM/H SPEED
        </text>
        {/* Laser Targeting Line */}
        <line x1="5" y1="20" x2="35" y2="35" stroke="#ef4444" strokeWidth="3" strokeDasharray="3 2" />
        <circle cx="20" cy="27" r="7.5" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2.5" />
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Enclosed Batting Cage Wireframe
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Cage Framework */}
        <path d="M15 25 L50 12 L85 25 L85 85 L50 92 L15 85 Z" fill="#06b6d4" fillOpacity="0.3" stroke="#0891b2" strokeWidth="3" strokeDasharray="3 3" />
        <line x1="50" y1="12" x2="50" y2="92" stroke="#0e7490" strokeWidth="3.5" />
        <line x1="15" y1="25" x2="15" y2="85" stroke="#0e7490" strokeWidth="4" />
        <line x1="85" y1="25" x2="85" y2="85" stroke="#0e7490" strokeWidth="4" />
        {/* Batter Helmet Silhouette */}
        <circle cx="50" cy="50" r="15" fill="#0284c7" stroke="#075985" strokeWidth="3" />
        <path d="M42 50 L58 50 L56 58 L44 58 Z" fill="#0f172a" />
      </svg>
    );
  } else {
    // Variant C: Automated Bowling Machine Cannon
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Cannon Head */}
        <rect x="25" y="25" width="36" height="26" rx="5" fill="#0284c7" stroke="#075985" strokeWidth="3" />
        <circle cx="34" cy="38" r="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
        <circle cx="52" cy="38" r="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
        {/* Chute */}
        <path d="M56 32 L75 28 L75 48 L56 44 Z" fill="#0369a1" stroke="#0c4a6e" strokeWidth="2" />
        {/* Shooting Ball */}
        <circle cx="84" cy="38" r="8" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2.5" />
        {/* Tripod Stand */}
        <line x1="43" y1="51" x2="25" y2="82" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        <line x1="43" y1="51" x2="61" y2="82" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
};

/**
 * 8. MULTIPURPOSE ROOM STICKERS (4K Screens, Acoustic Soundwaves & Podium Mic)
 */
export const MultipurposeSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: Dual 4K Presentation Screens & Keynote Chart
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Main Screen */}
        <rect x="18" y="20" width="64" height="38" rx="3" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="3.5" />
        {/* Chart Line */}
        <path d="M26 44 L38 32 L48 40 L62 28 L72 36" stroke="#c4b5fd" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="62" cy="28" r="4" fill="#38bdf8" />
        {/* Screen Stand */}
        <line x1="50" y1="58" x2="50" y2="72" stroke="#334155" strokeWidth="4" />
        <line x1="38" y1="72" x2="62" y2="72" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Executive Speaker Podium with Gooseneck Mic
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Podium */}
        <polygon points="34,35 66,35 72,82 28,82" fill="#312e81" stroke="#1e1b4b" strokeWidth="3" />
        <rect x="26" y="28" width="48" height="9" rx="2" fill="#6366f1" stroke="#312e81" strokeWidth="2" />
        {/* Mic */}
        <path d="M42 28 C42 16, 54 16, 54 10" stroke="#f8fafc" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <ellipse cx="54" cy="9" rx="4" ry="5" fill="#64748b" />
        {/* Crest */}
        <circle cx="50" cy="55" r="8" fill="#818cf8" opacity="0.95" />
      </svg>
    );
  } else {
    // Variant C: Acoustic Hall Sound Waves & Yoga / Banquet Medallion
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="38" stroke="#7c3aed" strokeWidth="3" strokeDasharray="5 3" fill="#ede9fe" fillOpacity="0.25" />
        {/* Sound Waves */}
        <path d="M22 50 C26 35, 26 65, 30 50 C34 35, 34 65, 38 50 C42 30, 42 70, 46 50 C50 20, 50 80, 54 50 C58 30, 58 70, 62 50 C66 35, 66 65, 70 50 C74 35, 74 65, 78 50" stroke="#6d28d9" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
};

/**
 * 9. ISOLATION & RESIDENTIAL ROOM STICKERS (Twin Beds, Medical Isolation Clinic, Keycard & Door)
 */
export const IsolationRoomSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: Residential Twin Bed Suite & Clinic Room
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Soft Background Accent Ring */}
        <circle cx="50" cy="50" r="42" stroke="#0f766e" strokeWidth="3" strokeDasharray="5 3" fill="#ccfbf1" fillOpacity="0.25" />
        {/* Headboard */}
        <rect x="14" y="24" width="72" height="12" rx="3" fill="#0f766e" fillOpacity="0.4" stroke="#115e59" strokeWidth="3" />
        {/* Twin Bed 1 */}
        <rect x="16" y="38" width="30" height="46" rx="4" fill="#14b8a6" fillOpacity="0.35" stroke="#0f766e" strokeWidth="3" />
        <rect x="20" y="42" width="22" height="12" rx="3" fill="#5eead4" stroke="#0f766e" strokeWidth="2.5" />
        <path d="M16 62 L46 62 L46 84 L16 84 Z" fill="#0d9488" opacity="0.8" />
        {/* Twin Bed 2 */}
        <rect x="54" y="38" width="30" height="46" rx="4" fill="#14b8a6" fillOpacity="0.35" stroke="#0f766e" strokeWidth="3" />
        <rect x="58" y="42" width="22" height="12" rx="3" fill="#5eead4" stroke="#0f766e" strokeWidth="2.5" />
        <path d="M54 62 L84 62 L84 84 L54 84 Z" fill="#0d9488" opacity="0.8" />
        {/* Clinical Suite Glow */}
        <circle cx="50" cy="18" r="5" fill="#2dd4bf" stroke="#0f766e" strokeWidth="2.5" />
        <line x1="50" y1="8" x2="50" y2="18" stroke="#0f766e" strokeWidth="3" />
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Medical Isolation Hospital Bed & Heartbeat Pulse
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Medical Cross Crest Ring */}
        <circle cx="50" cy="50" r="42" stroke="#0284c7" strokeWidth="3" strokeDasharray="5 3" fill="#e0f2fe" fillOpacity="0.25" />
        {/* Hospital Bed Outline */}
        <path d="M14 66 L14 42 C14 36, 32 30, 48 38 L84 52 C88 54, 88 64, 84 66 Z" fill="#0284c7" fillOpacity="0.35" stroke="#0369a1" strokeWidth="3" />
        <line x1="12" y1="66" x2="88" y2="66" stroke="#0369a1" strokeWidth="4" strokeLinecap="round" />
        <line x1="20" y1="66" x2="20" y2="86" stroke="#075985" strokeWidth="4" strokeLinecap="round" />
        <line x1="80" y1="66" x2="80" y2="86" stroke="#075985" strokeWidth="4" strokeLinecap="round" />
        {/* Medical Cross Badge */}
        <g transform="translate(60, 16)">
          <rect x="0" y="4" width="16" height="6" rx="1.5" fill="#0891b2" stroke="#0e7490" strokeWidth="2" />
          <rect x="5" y="-1" width="6" height="16" rx="1.5" fill="#0891b2" stroke="#0e7490" strokeWidth="2" />
        </g>
        {/* Pulse ECG Line */}
        <path d="M16 54 L28 54 L33 44 L38 62 L44 36 L50 58 L54 54 L72 54" stroke="#0369a1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  } else {
    // Variant C: Smart Keycard & Suite Door Access
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Laurel / Circle */}
        <circle cx="50" cy="50" r="42" stroke="#059669" strokeWidth="3" strokeDasharray="5 3" fill="#d1fae5" fillOpacity="0.25" />
        {/* Door Frame */}
        <rect x="22" y="16" width="56" height="70" rx="4" fill="#059669" fillOpacity="0.35" stroke="#047857" strokeWidth="3" />
        {/* Door Panel */}
        <rect x="28" y="22" width="44" height="62" rx="2" fill="#10b981" fillOpacity="0.35" stroke="#059669" strokeWidth="2.5" />
        {/* Keycard Silhouette */}
        <g transform="translate(42, 38) rotate(-15)">
          <rect x="0" y="0" width="34" height="22" rx="3" fill="#34d399" stroke="#047857" strokeWidth="3" />
          <line x1="0" y1="6" x2="34" y2="6" stroke="#047857" strokeWidth="3" />
          <circle cx="8" cy="14" r="3" fill="#fff" />
          <path d="M16 12 L28 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        {/* Door Handle */}
        <circle cx="64" cy="54" r="4" fill="#a7f3d0" stroke="#047857" strokeWidth="1.5" />
        <rect x="58" y="53" width="9" height="3.5" rx="1" fill="#a7f3d0" stroke="#047857" strokeWidth="1.5" />
      </svg>
    );
  }
};

/**
 * 10. HANDOVER & TAKEOVER STICKERS (Checklist Register, Golden Key Exchange & Asset Custody Shield)
 */
export const HandoverSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: Shift Checklist Register & Verified Check
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="42" stroke="#0891b2" strokeWidth="3" strokeDasharray="5 3" fill="#cffafe" fillOpacity="0.25" />
        {/* Clipboard */}
        <rect x="26" y="20" width="48" height="60" rx="6" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
        <rect x="38" y="14" width="24" height="10" rx="3" fill="#0369a1" />
        {/* Lines */}
        <line x1="34" y1="36" x2="66" y2="36" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
        <line x1="34" y1="46" x2="58" y2="46" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <line x1="34" y1="56" x2="66" y2="56" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <line x1="34" y1="66" x2="52" y2="66" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        {/* Green Verification Stamp */}
        <circle cx="64" cy="66" r="9" fill="#10b981" stroke="#047857" strokeWidth="2" />
        <path d="M60 66 L63 69 L68 63" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Golden Master Key Custody
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="42" stroke="#0891b2" strokeWidth="3" strokeDasharray="5 3" fill="#ecfeff" fillOpacity="0.25" />
        {/* Golden Key */}
        <g transform="translate(25, 25) rotate(-30)">
          <circle cx="20" cy="20" r="14" fill="#f59e0b" stroke="#78350f" strokeWidth="3" />
          <circle cx="20" cy="20" r="5" fill="#ecfeff" stroke="#78350f" strokeWidth="2" />
          <rect x="32" y="16" width="36" height="8" rx="2" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
          <rect x="52" y="24" width="6" height="10" rx="1" fill="#d97706" />
          <rect x="60" y="24" width="6" height="12" rx="1" fill="#d97706" />
        </g>
      </svg>
    );
  } else {
    // Variant C: Asset Custody & Shift Transition Shield
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Shield */}
        <path d="M50 15 L80 25 L80 60 C80 75, 50 88, 50 88 C50 88, 20 75, 20 60 L20 25 Z" fill="#06b6d4" fillOpacity="0.3" stroke="#0891b2" strokeWidth="3.5" />
        {/* Dual Arrows Exchange */}
        <path d="M35 44 L65 44 M55 36 L65 44 L55 52" stroke="#0e7490" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M65 58 L35 58 M45 50 L35 58 L45 66" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
};

/**
 * 11. PARCEL MONITORING STICKERS (Delivery Box, Barcode Scanner & Smart Locker)
 */
export const ParcelSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: Cardboard Parcel Box & Barcode Scanner
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="42" stroke="#d97706" strokeWidth="3" strokeDasharray="5 3" fill="#fef3c7" fillOpacity="0.25" />
        {/* Delivery Box */}
        <g transform="translate(20, 22)">
          <polygon points="30,4 58,16 30,28 2,16" fill="#fde68a" stroke="#b45309" strokeWidth="2.5" />
          <polygon points="2,16 30,28 30,56 2,44" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5" />
          <polygon points="30,28 58,16 58,44 30,56" fill="#d97706" stroke="#b45309" strokeWidth="2.5" />
          <polygon points="24,8 36,13 36,42 24,37" fill="#fed7aa" opacity="0.8" />
          {/* Barcode */}
          <g transform="translate(8, 24) skewY(15)">
            <rect x="0" y="0" width="14" height="10" fill="#ffffff" stroke="#78350f" strokeWidth="0.8" />
            <line x1="2" y1="2" x2="2" y2="8" stroke="#000" strokeWidth="1.2" />
            <line x1="5" y1="2" x2="5" y2="8" stroke="#000" strokeWidth="0.8" />
            <line x1="8" y1="2" x2="8" y2="8" stroke="#000" strokeWidth="1.5" />
            <line x1="11" y1="2" x2="11" y2="8" stroke="#000" strokeWidth="1" />
          </g>
        </g>
        {/* Red Laser Line */}
        <line x1="15" y1="46" x2="85" y2="46" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="3 2" />
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Smart Courier Locker Bay
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Locker Grid */}
        <rect x="22" y="18" width="56" height="64" rx="4" fill="#f59e0b" fillOpacity="0.3" stroke="#b45309" strokeWidth="3" />
        <line x1="50" y1="18" x2="50" y2="82" stroke="#b45309" strokeWidth="2" />
        <line x1="22" y1="39" x2="78" y2="39" stroke="#b45309" strokeWidth="2" />
        <line x1="22" y1="60" x2="78" y2="60" stroke="#b45309" strokeWidth="2" />
        {/* Locker Keypads */}
        <circle cx="42" cy="28" r="2.5" fill="#10b981" />
        <circle cx="70" cy="28" r="2.5" fill="#ef4444" />
        <circle cx="42" cy="49" r="2.5" fill="#10b981" />
        <circle cx="70" cy="49" r="2.5" fill="#10b981" />
        <circle cx="42" cy="71" r="2.5" fill="#f59e0b" />
        <circle cx="70" cy="71" r="2.5" fill="#10b981" />
      </svg>
    );
  } else {
    // Variant C: Verified Courier Handover Seal
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="40" stroke="#d97706" strokeWidth="3" strokeDasharray="5 3" fill="#fef3c7" fillOpacity="0.3" />
        {/* Box in center */}
        <rect x="32" y="32" width="36" height="36" rx="4" fill="#f59e0b" stroke="#78350f" strokeWidth="3" />
        <line x1="32" y1="46" x2="68" y2="46" stroke="#78350f" strokeWidth="2.5" />
        <line x1="50" y1="32" x2="50" y2="68" stroke="#78350f" strokeWidth="2.5" />
        {/* Verified Badge */}
        <circle cx="66" cy="66" r="10" fill="#10b981" stroke="#047857" strokeWidth="2" />
        <path d="M62 66 L65 69 L71 63" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
};

/**
 * 12. LOST & FOUND STICKERS (Safe Vault, Magnifying Glass & Identification Tag)
 */
export const LostFoundSlotSticker: React.FC<{ variant?: number; status: string; className?: string }> = ({
  variant = 0,
  status,
  className = 'w-20 h-20',
}) => {
  const opacity = getStickerOpacity(status);

  if (variant % 3 === 0) {
    // Variant A: Secured Safe Vault & Combination Dial
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="42" stroke="#059669" strokeWidth="3" strokeDasharray="5 3" fill="#d1fae5" fillOpacity="0.25" />
        {/* Vault Frame */}
        <rect x="22" y="22" width="56" height="56" rx="8" fill="#047857" stroke="#064e3b" strokeWidth="3" />
        <rect x="28" y="28" width="44" height="44" rx="5" fill="#059669" stroke="#10b981" strokeWidth="2" />
        {/* Dial */}
        <circle cx="50" cy="50" r="12" fill="#10b981" stroke="#064e3b" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="4" fill="#ffffff" />
        <line x1="50" y1="40" x2="50" y2="44" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="56" x2="50" y2="60" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="50" x2="44" y2="50" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
        <line x1="56" y1="50" x2="60" y2="50" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  } else if (variant % 3 === 1) {
    // Variant B: Magnifying Glass Search with Question Mark
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        <circle cx="50" cy="50" r="42" stroke="#059669" strokeWidth="3" strokeDasharray="5 3" fill="#ecfdf5" fillOpacity="0.25" />
        {/* Magnifying Glass */}
        <g transform="translate(18, 18)">
          <circle cx="28" cy="28" r="22" fill="#d1fae5" fillOpacity="0.5" stroke="#047857" strokeWidth="4" />
          <text x="28" y="36" textAnchor="middle" fill="#047857" fontSize="22" fontWeight="900" fontFamily="sans-serif">?</text>
          <line x1="44" y1="44" x2="64" y2="64" stroke="#064e3b" strokeWidth="6" strokeLinecap="round" />
          <line x1="46" y1="46" x2="60" y2="60" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  } else {
    // Variant C: Item Custody Tag & Register Key
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${opacity}`}>
        {/* Tag */}
        <g transform="translate(25, 20) rotate(15)">
          <polygon points="0,15 15,0 55,0 55,50 0,50" fill="#10b981" stroke="#047857" strokeWidth="3" />
          <circle cx="10" cy="10" r="3.5" fill="#ffffff" stroke="#047857" strokeWidth="1.5" />
          <line x1="20" y1="16" x2="46" y2="16" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="20" y1="26" x2="40" y2="26" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="20" y1="36" x2="46" y2="36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }
};

/**
 * Master Facility Slot Background Sticker Component
 */
export const FacilitySlotWatermark: React.FC<{
  facilityId: string;
  slotIndex: number;
  status: 'AVAILABLE' | 'BOOKED' | 'BREAK' | 'SELECTED' | 'NEXT';
  className?: string;
}> = ({ facilityId, slotIndex, status, className }) => {
  switch (facilityId) {
    case 'barber-booking':
      return <BarberSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'cricket-ground':
      return <CricketSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'football-ground':
      return <FootballSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'basketball-court':
      return <BasketballSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'cinema':
      return <CinemaSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'tennis-court':
      return <TennisSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'cricket-net':
      return <CricketNetSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'multipurpose-room':
      return <MultipurposeSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'isolation-room':
      return <IsolationRoomSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'handover-takenover':
      return <HandoverSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'parcel-monitoring':
      return <ParcelSlotSticker variant={slotIndex} status={status} className={className} />;
    case 'lost-and-found':
      return <LostFoundSlotSticker variant={slotIndex} status={status} className={className} />;
    default:
      return <IsolationRoomSlotSticker variant={slotIndex} status={status} className={className} />;
  }
};

/**
 * Facility Tactile Mini-Badge Sticker (Physical corner sticker)
 */
export const FacilitySlotMiniBadge: React.FC<{
  facilityId: string;
  status: string;
}> = ({ facilityId, status }) => {
  const isSelected = status === 'SELECTED';
  const isBooked = status === 'BOOKED';
  const isBreak = status === 'BREAK';

  if (isBreak || isBooked || isSelected) return null;

  const BADGE_MAP: Record<string, { label: string; emoji: string; bg: string; text: string; border: string }> = {
    'barber-booking': {
      label: 'VIP Groom',
      emoji: '✂️',
      bg: 'bg-indigo-100/95 dark:bg-indigo-950/90',
      text: 'text-indigo-950 dark:text-indigo-200 font-black',
      border: 'border-indigo-400 dark:border-indigo-600',
    },
    'cricket-ground': {
      label: 'ICC Turf',
      emoji: '🏏',
      bg: 'bg-emerald-100/95 dark:bg-emerald-950/90',
      text: 'text-emerald-950 dark:text-emerald-200 font-black',
      border: 'border-emerald-400 dark:border-emerald-600',
    },
    'football-ground': {
      label: 'FIFA Pro',
      emoji: '⚽',
      bg: 'bg-blue-100/95 dark:bg-blue-950/90',
      text: 'text-blue-950 dark:text-blue-200 font-black',
      border: 'border-blue-400 dark:border-blue-600',
    },
    'basketball-court': {
      label: 'FIBA Floor',
      emoji: '🏀',
      bg: 'bg-orange-100/95 dark:bg-orange-950/90',
      text: 'text-orange-950 dark:text-orange-200 font-black',
      border: 'border-orange-400 dark:border-orange-600',
    },
    'cinema': {
      label: '4K Laser',
      emoji: '🍿',
      bg: 'bg-rose-100/95 dark:bg-rose-950/90',
      text: 'text-rose-950 dark:text-rose-200 font-black',
      border: 'border-rose-400 dark:border-rose-600',
    },
    'tennis-court': {
      label: 'Pro Hard',
      emoji: '🎾',
      bg: 'bg-teal-100/95 dark:bg-teal-950/90',
      text: 'text-teal-950 dark:text-teal-200 font-black',
      border: 'border-teal-400 dark:border-teal-600',
    },
    'cricket-net': {
      label: '145 KM/H',
      emoji: '🎯',
      bg: 'bg-cyan-100/95 dark:bg-cyan-950/90',
      text: 'text-cyan-950 dark:text-cyan-200 font-black',
      border: 'border-cyan-400 dark:border-cyan-600',
    },
    'multipurpose-room': {
      label: 'Acoustic',
      emoji: '🏛️',
      bg: 'bg-purple-100/95 dark:bg-purple-950/90',
      text: 'text-purple-950 dark:text-purple-200 font-black',
      border: 'border-purple-400 dark:border-purple-600',
    },
    'isolation-room': {
      label: '2x1 Suite',
      emoji: '🛏️',
      bg: 'bg-teal-100/95 dark:bg-teal-950/90',
      text: 'text-teal-950 dark:text-teal-200 font-black',
      border: 'border-teal-400 dark:border-teal-600',
    },
    'handover-takenover': {
      label: 'Desk Key',
      emoji: '🔄',
      bg: 'bg-cyan-100/95 dark:bg-cyan-950/90',
      text: 'text-cyan-950 dark:text-cyan-200 font-black',
      border: 'border-cyan-400 dark:border-cyan-600',
    },
    'parcel-monitoring': {
      label: 'Parcel Bay',
      emoji: '📦',
      bg: 'bg-amber-100/95 dark:bg-amber-950/90',
      text: 'text-amber-950 dark:text-amber-200 font-black',
      border: 'border-amber-400 dark:border-amber-600',
    },
    'lost-and-found': {
      label: 'Safe Vault',
      emoji: '🔍',
      bg: 'bg-emerald-100/95 dark:bg-emerald-950/90',
      text: 'text-emerald-950 dark:text-emerald-200 font-black',
      border: 'border-emerald-400 dark:border-emerald-600',
    },
    'blank-forms': {
      label: 'Official PDF',
      emoji: '📄',
      bg: 'bg-blue-100/95 dark:bg-blue-950/90',
      text: 'text-blue-950 dark:text-blue-200 font-black',
      border: 'border-blue-400 dark:border-blue-600',
    },
    'invoice-manager': {
      label: 'ZATCA Tax',
      emoji: '🧾',
      bg: 'bg-emerald-100/95 dark:bg-emerald-950/90',
      text: 'text-emerald-950 dark:text-emerald-200 font-black',
      border: 'border-emerald-400 dark:border-emerald-600',
    },
    'announcement-notice': {
      label: 'Broadcast',
      emoji: '📢',
      bg: 'bg-amber-100/95 dark:bg-amber-950/90',
      text: 'text-amber-950 dark:text-amber-200 font-black',
      border: 'border-amber-400 dark:border-amber-600',
    },
    'help-support': {
      label: '24/7 Desk',
      emoji: '🛟',
      bg: 'bg-teal-100/95 dark:bg-teal-950/90',
      text: 'text-teal-950 dark:text-teal-200 font-black',
      border: 'border-teal-400 dark:border-teal-600',
    },
  };

  const badge = BADGE_MAP[facilityId] || BADGE_MAP['isolation-room'];

  return (
    <span
      className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[9px] font-black border shadow-2xs ${badge.bg} ${badge.text} ${badge.border} opacity-95 group-hover:opacity-100 transition-opacity select-none`}
    >
      <span className="text-[10px] leading-none">{badge.emoji}</span>
      <span className="tracking-tight">{badge.label}</span>
    </span>
  );
};
