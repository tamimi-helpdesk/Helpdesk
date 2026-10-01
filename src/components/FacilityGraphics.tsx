import React from 'react';

interface GraphicProps {
  className?: string;
  size?: number;
}

// 1. CRICKET GRAPHIC (Bat, Red Leather Ball, Wickets & Pitch)
export const CricketGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Ground Turf Circle */}
    <circle cx="60" cy="60" r="54" className="fill-emerald-500/40 stroke-emerald-600 dark:fill-emerald-500/35 dark:stroke-emerald-400" strokeWidth="4" />
    <path d="M22 88 C40 102, 80 102, 98 88" stroke="#059669" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.8" />
    
    {/* Cricket Stumps / Wickets */}
    <g transform="translate(68, 28)">
      <rect x="0" y="8" width="3.5" height="36" rx="1.5" fill="#d97706" stroke="#92400e" strokeWidth="1" />
      <rect x="7.5" y="8" width="3.5" height="36" rx="1.5" fill="#d97706" stroke="#92400e" strokeWidth="1" />
      <rect x="15" y="8" width="3.5" height="36" rx="1.5" fill="#d97706" stroke="#92400e" strokeWidth="1" />
      {/* Bails */}
      <rect x="-1" y="6" width="11" height="3" rx="1" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
      <rect x="8.5" y="6" width="11" height="3" rx="1" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
    </g>

    {/* Cricket Bat (Wood Grain + Grip) */}
    <g transform="rotate(-32 46 62)">
      {/* Handle */}
      <rect x="42" y="8" width="5.5" height="30" rx="2" fill="#e2e8f0" stroke="#047857" strokeWidth="2" />
      <line x1="42" y1="15" x2="47.5" y2="15" stroke="#047857" strokeWidth="1.5" />
      <line x1="42" y1="22" x2="47.5" y2="22" stroke="#047857" strokeWidth="1.5" />
      <line x1="42" y1="29" x2="47.5" y2="29" stroke="#047857" strokeWidth="1.5" />
      {/* Rubber Grip Top */}
      <circle cx="44.7" cy="8" r="3.5" fill="#047857" />
      {/* Blade */}
      <path
        d="M37 38 C37 35, 52 35, 52 38 L53 89 C53 93, 36 93, 36 89 Z"
        fill="url(#batWoodGradient)"
        stroke="#92400e"
        strokeWidth="2"
      />
      {/* Blade Ridge Spine */}
      <line x1="44.5" y1="40" x2="44.5" y2="87" stroke="#b45309" strokeWidth="2" opacity="0.8" />
      {/* Colored Sticker */}
      <rect x="38" y="44" width="12" height="20" rx="1.5" fill="#047857" stroke="#064e3b" strokeWidth="1" />
      <path d="M40 54 L48 54" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* Red Leather Cricket Ball with White Seam */}
    <g transform="translate(30, 68)">
      <circle cx="17" cy="17" r="15" fill="url(#cricketBallGradient)" stroke="#7f1d1d" strokeWidth="2" />
      {/* Seam Stitching */}
      <path
        d="M7 8 C17 17, 17 17, 27 26"
        stroke="#ffffff"
        strokeWidth="2"
        strokeDasharray="2.5 2"
        strokeLinecap="round"
      />
      {/* Ball Shine Reflection */}
      <ellipse cx="12" cy="11" rx="4.5" ry="3" transform="rotate(-30 12 11)" fill="#ffffff" opacity="0.5" />
    </g>

    {/* Gradients */}
    <defs>
      <linearGradient id="batWoodGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <radialGradient id="cricketBallGradient" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="55%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </radialGradient>
    </defs>
  </svg>
);

// 2. FOOTBALL GRAPHIC (Classic Soccer Ball & Goal Post)
export const FootballGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Blue/Turf Ambient Backing */}
    <circle cx="60" cy="60" r="54" className="fill-blue-500/40 stroke-blue-600 dark:fill-blue-500/35 dark:stroke-blue-400" strokeWidth="4" />

    {/* Goal Net Background */}
    <g opacity="0.6">
      <path d="M18 28 L102 28 L90 76 L30 76 Z" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 3" />
      <line x1="18" y1="28" x2="30" y2="76" stroke="#1d4ed8" strokeWidth="2.5" />
      <line x1="102" y1="28" x2="90" y2="76" stroke="#1d4ed8" strokeWidth="2.5" />
      <line x1="18" y1="28" x2="102" y2="28" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
    </g>

    {/* Classic 32-Panel Soccer Football */}
    <g transform="translate(60, 64)">
      <circle cx="0" cy="0" r="31" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
      {/* Central Black Pentagon */}
      <polygon points="0,-10 9.5,-3 5.9,8 -5.9,8 -9.5,-3" fill="#0f172a" />
      
      {/* Outer Seams to Surrounding Hexagons */}
      <line x1="0" y1="-10" x2="0" y2="-21" stroke="#0f172a" strokeWidth="2.5" />
      <line x1="9.5" y1="-3" x2="20" y2="-8" stroke="#0f172a" strokeWidth="2.5" />
      <line x1="5.9" y1="8" x2="14" y2="19" stroke="#0f172a" strokeWidth="2.5" />
      <line x1="-5.9" y1="8" x2="-14" y2="19" stroke="#0f172a" strokeWidth="2.5" />
      <line x1="-9.5" y1="-3" x2="-20" y2="-8" stroke="#0f172a" strokeWidth="2.5" />

      {/* Edge Pentagons */}
      <polygon points="0,-21 -7.5,-28 7.5,-28" fill="#0f172a" />
      <polygon points="20,-8 27,-16 29,-4" fill="#0f172a" />
      <polygon points="14,19 25,21 19,28" fill="#0f172a" />
      <polygon points="-14,19 -19,28 -25,21" fill="#0f172a" />
      <polygon points="-20,-8 -29,-4 -27,-16" fill="#0f172a" />

      {/* Shine Reflection */}
      <ellipse cx="-10" cy="-14" rx="7" ry="4" transform="rotate(-30 -10 -14)" fill="#ffffff" opacity="0.6" />
    </g>

    {/* Whistle / Referee Card Badge */}
    <g transform="translate(16, 68)">
      <rect x="0" y="0" width="13" height="19" rx="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
      <rect x="5" y="-3" width="13" height="19" rx="2" fill="#eab308" stroke="#a16207" strokeWidth="1.5" />
    </g>
  </svg>
);

// 3. BARBER GRAPHIC (Barber Pole, Straight Razor & Scissors)
export const BarberGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Amber Ambient Glow */}
    <circle cx="60" cy="60" r="54" className="fill-purple-500/40 stroke-purple-600 dark:fill-purple-500/35 dark:stroke-purple-400" strokeWidth="4" />

    {/* Vintage Illuminated Barber Pole */}
    <g transform="translate(28, 18)">
      {/* Top Cap */}
      <ellipse cx="14" cy="8" rx="13" ry="5.5" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
      <circle cx="14" cy="4" r="4.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
      
      {/* Glass Cylinder */}
      <rect x="3" y="10" width="22" height="62" rx="3" fill="#ffffff" stroke="#581c87" strokeWidth="2.5" />
      
      {/* Helical Stripes (Red, White, Blue) */}
      <clipPath id="poleClip">
        <rect x="3" y="10" width="22" height="62" rx="3" />
      </clipPath>
      <g clipPath="url(#poleClip)">
        <path d="M-2 15 L30 -7 L30 5 L-2 27 Z" fill="#dc2626" />
        <path d="M-2 32 L30 10 L30 22 L-2 44 Z" fill="#1d4ed8" />
        <path d="M-2 49 L30 27 L30 39 L-2 61 Z" fill="#dc2626" />
        <path d="M-2 66 L30 44 L30 56 L-2 78 Z" fill="#1d4ed8" />
        <path d="M-2 83 L30 61 L30 73 L-2 95 Z" fill="#dc2626" />
      </g>
      
      {/* Glass Reflection Highlight */}
      <rect x="6" y="12" width="3.5" height="58" fill="#ffffff" opacity="0.7" rx="1.5" />

      {/* Bottom Cap & Wall Mount */}
      <ellipse cx="14" cy="74" rx="13" ry="5.5" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
      <rect x="11" y="78" width="6" height="8" fill="#d97706" />
      <rect x="5" y="84" width="18" height="5" rx="2" fill="#78350f" />
    </g>

    {/* Barber Scissors & Straight Razor */}
    <g transform="translate(60, 32)">
      {/* Razor Handle */}
      <path d="M12 18 C12 12, 36 6, 42 16 L36 38 C32 32, 16 26, 12 18 Z" fill="#334155" stroke="#0f172a" strokeWidth="2" />
      {/* Razor Steel Blade */}
      <path d="M12 18 C18 28, 22 52, 20 62 L8 58 C10 46, 6 28, 12 18 Z" fill="url(#steelBlade)" stroke="#64748b" strokeWidth="2" />
      <circle cx="12" cy="18" r="3.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
      
      {/* Scissors */}
      <g transform="rotate(35 24 50)">
        <circle cx="12" cy="56" r="7" fill="none" stroke="#d97706" strokeWidth="2.5" />
        <circle cx="30" cy="56" r="7" fill="none" stroke="#d97706" strokeWidth="2.5" />
        <line x1="16" y1="50" x2="27" y2="20" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        <line x1="26" y1="50" x2="15" y2="20" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        <circle cx="21" cy="36" r="2.5" fill="#b45309" />
      </g>
    </g>

    <defs>
      <linearGradient id="steelBlade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>
  </svg>
);

// 4. BASKETBALL GRAPHIC (Pebbled Orange Ball, Glass Backboard & Hoop Net)
export const BasketballGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Orange Ambient Backing */}
    <circle cx="60" cy="60" r="54" className="fill-orange-500/40 stroke-orange-600 dark:fill-orange-500/35 dark:stroke-orange-400" strokeWidth="4" />

    {/* Hydraulic Glass Backboard & Rim */}
    <g transform="translate(46, 12)">
      <rect x="0" y="0" width="56" height="38" rx="3" fill="#0f172a" opacity="0.35" stroke="#0284c7" strokeWidth="2.5" />
      {/* Target Square */}
      <rect x="18" y="14" width="20" height="16" fill="none" stroke="#dc2626" strokeWidth="2.5" />
      {/* Orange Spring Rim */}
      <ellipse cx="28" cy="34" rx="15" ry="4.5" fill="none" stroke="#ea580c" strokeWidth="3.5" />
      {/* Chain Net */}
      <path
        d="M14 35 L18 50 L28 54 L38 50 L42 35 M20 36 L28 50 L36 36 M16 42 L40 42 M19 48 L37 48"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.95"
      />
    </g>

    {/* Textured Orange Basketball with Black Seams */}
    <g transform="translate(42, 66)">
      <circle cx="0" cy="0" r="28" fill="url(#basketballGradient)" stroke="#7c2d12" strokeWidth="2.5" />
      {/* Black Seams */}
      <line x1="-28" y1="0" x2="28" y2="0" stroke="#0c0a09" strokeWidth="3" />
      <line x1="0" y1="-28" x2="0" y2="28" stroke="#0c0a09" strokeWidth="3" />
      <path d="M-20 -20 C-5 -7, -5 7, -20 20" stroke="#0c0a09" strokeWidth="2.5" fill="none" />
      <path d="M20 -20 C5 -7, 5 7, 20 20" stroke="#0c0a09" strokeWidth="2.5" fill="none" />
      {/* Light Shine */}
      <ellipse cx="-9" cy="-11" rx="6.5" ry="4" transform="rotate(-30 -9 -11)" fill="#ffffff" opacity="0.45" />
    </g>

    <defs>
      <radialGradient id="basketballGradient" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="55%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#7c2d12" />
      </radialGradient>
    </defs>
  </svg>
);

// 5. CINEMA GRAPHIC (35mm Film Reel, Popcorn & Clapperboard)
export const CinemaGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Crimson/Ruby Ambient Backing */}
    <circle cx="60" cy="60" r="54" className="fill-rose-500/40 stroke-rose-600 dark:fill-rose-500/35 dark:stroke-rose-400" strokeWidth="4" />

    {/* Movie Clapperboard */}
    <g transform="translate(18, 20) rotate(-8)">
      <rect x="0" y="10" width="40" height="28" rx="2" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />
      <line x1="4" y1="20" x2="36" y2="20" stroke="#64748b" strokeWidth="1.5" />
      <line x1="4" y1="28" x2="26" y2="28" stroke="#64748b" strokeWidth="1.5" />
      
      {/* Top Clapper Sticks (Zebra Stripes) */}
      <rect x="0" y="0" width="40" height="11" rx="2" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />
      <polygon points="6,0 13,0 9,11 2,11" fill="#ffffff" />
      <polygon points="17,0 24,0 20,11 13,11" fill="#ffffff" />
      <polygon points="28,0 35,0 31,11 24,11" fill="#ffffff" />
    </g>

    {/* 35mm Gold Film Reel */}
    <g transform="translate(80, 44)">
      <circle cx="0" cy="0" r="23" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
      <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#b45309" strokeWidth="2" />
      <circle cx="0" cy="0" r="5.5" fill="#f59e0b" />
      {/* Reel Cutout Holes */}
      <circle cx="0" cy="-9" r="3" fill="#475569" />
      <circle cx="8" cy="-4" r="3" fill="#475569" />
      <circle cx="8" cy="5" r="3" fill="#475569" />
      <circle cx="0" cy="9" r="3" fill="#475569" />
      <circle cx="-8" cy="5" r="3" fill="#475569" />
      <circle cx="-8" cy="-4" r="3" fill="#475569" />
    </g>

    {/* Popcorn Bucket */}
    <g transform="translate(36, 52)">
      {/* Bucket Tub */}
      <path d="M6 14 L10 54 L36 54 L40 14 Z" fill="#ffffff" stroke="#be123c" strokeWidth="2.5" />
      {/* Red Stripes */}
      <polygon points="12,14 14,54 20,54 19,14" fill="#e11d48" />
      <polygon points="24,14 25,54 31,54 30,14" fill="#e11d48" />
      
      {/* Puffy Popcorn Kernels */}
      <circle cx="10" cy="11" r="5.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
      <circle cx="18" cy="7" r="6.5" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
      <circle cx="27" cy="7" r="7" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
      <circle cx="35" cy="11" r="5.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
      <circle cx="22" cy="13" r="5" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
    </g>
  </svg>
);

// 6. TENNIS GRAPHIC (Racket, Neon Felt Ball & Court Net)
export const TennisGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Chartreuse/Teal Ambient Backing */}
    <circle cx="60" cy="60" r="54" className="fill-teal-500/40 stroke-teal-600 dark:fill-teal-500/35 dark:stroke-teal-400" strokeWidth="4" />

    {/* Tennis Net in Background */}
    <path d="M15 65 L105 65" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
    <path d="M15 67 L105 67 L105 85 L15 85 Z" fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

    {/* Cross-Strung Tennis Racket */}
    <g transform="rotate(-38 48 56)">
      {/* Handle */}
      <rect x="44" y="60" width="6.5" height="36" rx="2.5" fill="#0f766e" stroke="#134e4a" strokeWidth="2" />
      <line x1="44" y1="68" x2="50.5" y2="68" stroke="#5eead4" strokeWidth="1.5" />
      <line x1="44" y1="76" x2="50.5" y2="76" stroke="#5eead4" strokeWidth="1.5" />
      <line x1="44" y1="84" x2="50.5" y2="84" stroke="#5eead4" strokeWidth="1.5" />
      {/* Shaft */}
      <path d="M44 60 L40 44 M50.5 60 L54.5 44" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
      
      {/* Head Frame */}
      <ellipse cx="47" cy="26" rx="19" ry="23" fill="none" stroke="#0f766e" strokeWidth="3.5" />
      
      {/* String Mesh Grid */}
      <g opacity="0.75">
        <line x1="36" y1="12" x2="36" y2="40" stroke="#2dd4bf" strokeWidth="1.5" />
        <line x1="42" y1="7" x2="42" y2="45" stroke="#2dd4bf" strokeWidth="1.5" />
        <line x1="47" y1="5" x2="47" y2="47" stroke="#2dd4bf" strokeWidth="1.5" />
        <line x1="52" y1="7" x2="52" y2="45" stroke="#2dd4bf" strokeWidth="1.5" />
        <line x1="58" y1="12" x2="58" y2="40" stroke="#2dd4bf" strokeWidth="1.5" />
        <line x1="33" y1="18" x2="61" y2="18" stroke="#2dd4bf" strokeWidth="1.5" />
        <line x1="30" y1="26" x2="64" y2="26" stroke="#2dd4bf" strokeWidth="1.5" />
        <line x1="33" y1="34" x2="61" y2="34" stroke="#2dd4bf" strokeWidth="1.5" />
      </g>
    </g>

    {/* Neon Yellow-Green Felt Tennis Ball with Curved White Seams */}
    <g transform="translate(74, 30)">
      <circle cx="15" cy="15" r="15" fill="#84cc16" stroke="#3f6212" strokeWidth="2" />
      {/* Tennis Ball Seam Arcs */}
      <path d="M4 15 C11 8, 19 8, 26 15" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M4 15 C11 22, 19 22, 26 15" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Felt Texture Highlight */}
      <ellipse cx="10" cy="10" rx="4.5" ry="2.5" transform="rotate(-30 10 10)" fill="#ffffff" opacity="0.6" />
    </g>
  </svg>
);

// 7. CRICKET NET GRAPHIC (Cage Wireframe, Auto Bowling Machine & Speed Radar)
export const CricketNetGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Cyan / Electric Ambient Backing */}
    <circle cx="60" cy="60" r="54" className="fill-cyan-500/40 stroke-cyan-600 dark:fill-cyan-500/35 dark:stroke-cyan-400" strokeWidth="4" />

    {/* Enclosed Net Cage Framework */}
    <g opacity="0.75">
      <path d="M16 28 L64 16 L104 28 L104 92 L64 100 L16 92 Z" fill="none" stroke="#0891b2" strokeWidth="2" strokeDasharray="3 3" />
      <line x1="64" y1="16" x2="64" y2="100" stroke="#0891b2" strokeWidth="2.5" />
      <line x1="16" y1="28" x2="16" y2="92" stroke="#0e7490" strokeWidth="3" />
      <line x1="104" y1="28" x2="104" y2="92" stroke="#0e7490" strokeWidth="3" />
    </g>

    {/* Automated Bowling Machine on Tripod Stand */}
    <g transform="translate(24, 40)">
      {/* Tripod Legs */}
      <line x1="22" y1="26" x2="6" y2="52" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
      <line x1="22" y1="26" x2="38" y2="52" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
      <line x1="22" y1="26" x2="22" y2="54" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
      
      {/* Cannon Machine Head */}
      <rect x="10" y="8" width="24" height="20" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="2.5" />
      {/* Dual Launch Wheels */}
      <circle cx="16" cy="18" r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="28" cy="18" r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
      
      {/* Ball Projector Chute */}
      <path d="M30 14 L44 10 L44 26 L30 22 Z" fill="#0369a1" />
      {/* Ball Shooting Out with Trajectory */}
      <circle cx="50" cy="18" r="5.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
      <path d="M56 18 L76 22" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="2 2" strokeLinecap="round" />
    </g>

    {/* Speed Radar Gauge Display (145 KM/H) */}
    <g transform="translate(68, 62)">
      <rect x="0" y="0" width="38" height="26" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
      <text x="19" y="13" textAnchor="middle" fill="#22d3ee" fontSize="9" fontWeight="900" fontFamily="sans-serif">
        145
      </text>
      <text x="19" y="21" textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="700" fontFamily="sans-serif">
        KM/H
      </text>
    </g>
  </svg>
);

// 8. MULTIPURPOSE ROOM GRAPHIC (Executive Podium, Dual 4K Screens & Acoustic Hall)
export const MultipurposeGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Indigo / Purple Ambient Backing */}
    <circle cx="60" cy="60" r="54" className="fill-indigo-500/40 stroke-indigo-600 dark:fill-indigo-500/35 dark:stroke-indigo-400" strokeWidth="4" />

    {/* Dual Presentation Screens (4K Presentation Display) */}
    <g transform="translate(20, 20)">
      {/* Main Wide Screen */}
      <rect x="0" y="0" width="52" height="30" rx="3" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="2" />
      <path d="M6 20 L16 12 L26 18 L38 10 L46 16" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="10" r="2.5" fill="#38bdf8" />
      <line x1="26" y1="30" x2="26" y2="36" stroke="#475569" strokeWidth="2.5" />
      <line x1="18" y1="36" x2="34" y2="36" stroke="#475569" strokeWidth="2.5" />

      {/* Secondary Monitor */}
      <rect x="58" y="4" width="24" height="18" rx="2" fill="#0f172a" stroke="#7c3aed" strokeWidth="1.5" />
      <circle cx="70" cy="13" r="4.5" fill="#a855f7" opacity="0.8" />
    </g>

    {/* Executive Podium / Speaker Stand with Mic */}
    <g transform="translate(44, 54)">
      {/* Podium Base */}
      <polygon points="8,10 24,10 28,42 4,42" fill="#312e81" stroke="#3730a3" strokeWidth="2" />
      <rect x="2" y="6" width="28" height="7" rx="1.5" fill="#4f46e5" />
      
      {/* Gooseneck Microphone */}
      <path d="M12 6 C12 -2, 20 -2, 20 -6" stroke="#f1f5f9" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="20" cy="-7" rx="2.5" ry="3.5" fill="#cbd5e1" />
      
      {/* Corporate Tamimi Crest on Podium */}
      <circle cx="16" cy="22" r="4.5" fill="#818cf8" />
    </g>

    {/* Acoustic Sound Waves */}
    <g transform="translate(82, 58)" opacity="0.9">
      <path d="M0 6 C4 0, 4 12, 8 6 C12 0, 12 12, 16 6" stroke="#818cf8" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M0 16 C4 10, 4 22, 8 16 C12 10, 12 22, 16 16" stroke="#a855f7" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

// 9. ISOLATION ROOM GRAPHIC (Hospital Bed, Medical Red Cross, Heartbeat ECG & Quarantine Shield)
export const IsolationRoomGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Sterile Violet Ambient Glow */}
    <circle cx="60" cy="60" r="54" className="fill-purple-500/40 stroke-purple-600 dark:fill-purple-500/35 dark:stroke-purple-400" strokeWidth="4" />

    {/* Medical Cross Crest Emblem Top */}
    <g transform="translate(48, 12)">
      <circle cx="12" cy="12" r="13" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
      <rect x="10" y="5" width="4.5" height="14" rx="1" fill="#ffffff" />
      <rect x="5" y="10" width="14" height="4.5" rx="1" fill="#ffffff" />
    </g>

    {/* Hospital Isolation Bed Frame */}
    <g transform="translate(20, 44)">
      {/* Headboard */}
      <rect x="6" y="8" width="6.5" height="36" rx="2" fill="#581c87" />
      {/* Footboard */}
      <rect x="68" y="18" width="6.5" height="26" rx="2" fill="#581c87" />
      {/* Mattress Base */}
      <rect x="10" y="24" width="60" height="11" rx="3" fill="#e9d5ff" stroke="#9333ea" strokeWidth="2" />
      {/* Patient Pillow */}
      <rect x="14" y="17" width="16" height="9" rx="3" fill="#ffffff" stroke="#c084fc" strokeWidth="1.5" />
      {/* Blanket with sterile drape */}
      <path d="M30 24 L70 24 L70 35 L30 35 Z" fill="#9333ea" opacity="0.9" />
      {/* Bed Legs */}
      <line x1="9" y1="44" x2="9" y2="54" stroke="#3b0764" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="71" y1="44" x2="71" y2="54" stroke="#3b0764" strokeWidth="3.5" strokeLinecap="round" />
      {/* Wheels */}
      <circle cx="9" cy="56" r="3" fill="#1e1b4b" />
      <circle cx="71" cy="56" r="3" fill="#1e1b4b" />
    </g>

    {/* Heartbeat ECG Line */}
    <g transform="translate(18, 92)">
      <path
        d="M0 8 L24 8 L30 0 L36 18 L42 2 L48 12 L54 8 L84 8"
        stroke="#db2777"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

// 10. HANDOVER & TAKENOVER GRAPHIC (Key Custody, Dual Transition Arrows & Clipboard Log)
export const HandoverGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Cyan Ambient Circle */}
    <circle cx="60" cy="60" r="54" className="fill-cyan-500/40 stroke-cyan-600 dark:fill-cyan-500/35 dark:stroke-cyan-400" strokeWidth="4" />

    {/* Transition Loop Arrows */}
    <g transform="translate(20, 16)">
      <path
        d="M10 24 C10 10, 70 10, 70 24"
        stroke="#0891b2"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <polygon points="74,26 62,19 66,33" fill="#0891b2" />

      <path
        d="M70 64 C70 78, 10 78, 10 64"
        stroke="#0e7490"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <polygon points="6,62 18,69 14,55" fill="#0e7490" />
    </g>

    {/* Clipboard / Handover Register */}
    <g transform="translate(32, 34)">
      <rect x="0" y="8" width="42" height="54" rx="6" fill="#ecfeff" stroke="#0891b2" strokeWidth="2.5" />
      {/* Top Clip */}
      <rect x="13" y="3" width="16" height="8" rx="2" fill="#0e7490" />
      <circle cx="21" cy="7" r="1.5" fill="#cffafe" />
      {/* Checklist Lines with Checkmark */}
      <line x1="8" y1="20" x2="34" y2="20" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8" y1="28" x2="28" y2="28" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <line x1="8" y1="36" x2="34" y2="36" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <line x1="8" y1="44" x2="22" y2="44" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      {/* Green Verified Checkmark */}
      <circle cx="33" cy="46" r="6" fill="#059669" />
      <path d="M30 46 L32 48 L36 44" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Golden Master Key Handover Overlay */}
    <g transform="translate(56, 52) rotate(-25)">
      {/* Key Bow Head */}
      <circle cx="16" cy="16" r="11" fill="url(#keyGoldGrad)" stroke="#92400e" strokeWidth="2" />
      <circle cx="16" cy="16" r="4.5" fill="#ecfeff" stroke="#92400e" strokeWidth="1.5" />
      {/* Key Shaft */}
      <rect x="25" y="13" width="28" height="6" rx="1.5" fill="url(#keyGoldGrad)" stroke="#92400e" strokeWidth="1.5" />
      {/* Key Teeth */}
      <rect x="42" y="19" width="4" height="7" rx="1" fill="#d97706" stroke="#92400e" strokeWidth="1" />
      <rect x="48" y="19" width="4" height="9" rx="1" fill="#d97706" stroke="#92400e" strokeWidth="1" />
    </g>

    <defs>
      <linearGradient id="keyGoldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
  </svg>
);

// 11. PARCEL MONITORING GRAPHIC (Delivery Box, Barcode Scanner & Tracking Shield)
export const ParcelGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Amber Ambient Circle */}
    <circle cx="60" cy="60" r="54" className="fill-amber-500/40 stroke-amber-600 dark:fill-amber-500/35 dark:stroke-amber-400" strokeWidth="4" />

    {/* Cardboard Delivery Box Isometric */}
    <g transform="translate(24, 28)">
      {/* Top Face */}
      <polygon points="36,4 70,18 36,32 2,18" fill="#fde68a" stroke="#b45309" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Left Face */}
      <polygon points="2,18 36,32 36,66 2,52" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Right Face */}
      <polygon points="36,32 70,18 70,52 36,66" fill="#d97706" stroke="#92400e" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Package Tape Strip */}
      <polygon points="28,8 44,14 44,48 28,42" fill="#fed7aa" opacity="0.85" stroke="#ea580c" strokeWidth="1.5" />

      {/* Barcode Sticker */}
      <g transform="translate(10, 32) skewY(15)">
        <rect x="0" y="0" width="18" height="12" rx="1" fill="#ffffff" stroke="#78350f" strokeWidth="1.2" />
        <line x1="2" y1="2" x2="2" y2="10" stroke="#000" strokeWidth="1.5" />
        <line x1="5" y1="2" x2="5" y2="10" stroke="#000" strokeWidth="1" />
        <line x1="8" y1="2" x2="8" y2="10" stroke="#000" strokeWidth="2" />
        <line x1="12" y1="2" x2="12" y2="10" stroke="#000" strokeWidth="1" />
        <line x1="15" y1="2" x2="15" y2="10" stroke="#000" strokeWidth="1.5" />
      </g>
    </g>

    {/* Red Laser Scanner Beam */}
    <g transform="translate(14, 24)">
      <line x1="6" y1="36" x2="86" y2="36" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="4 2" />
      <polygon points="82,33 90,36 82,39" fill="#dc2626" />
    </g>

    {/* Verified / Tracked Badge */}
    <g transform="translate(74, 68)">
      <circle cx="16" cy="16" r="14" fill="#059669" stroke="#064e3b" strokeWidth="2" />
      <path d="M10 16 L14 20 L22 12" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// 12. LOST & FOUND GRAPHIC (Magnifying Glass, Vault Storage & Safe Key)
export const LostAndFoundGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Emerald / Teal Ambient Circle */}
    <circle cx="60" cy="60" r="54" className="fill-emerald-500/40 stroke-emerald-600 dark:fill-emerald-500/35 dark:stroke-emerald-400" strokeWidth="4" />

    {/* Secured Safe / Vault Box */}
    <g transform="translate(24, 30)">
      <rect x="0" y="0" width="56" height="52" rx="8" fill="#065f46" stroke="#047857" strokeWidth="3" />
      {/* Vault Door Inset */}
      <rect x="6" y="6" width="44" height="40" rx="6" fill="#047857" stroke="#10b981" strokeWidth="2" />
      {/* Combination Dial */}
      <circle cx="28" cy="26" r="11" fill="#10b981" stroke="#064e3b" strokeWidth="2.5" />
      <circle cx="28" cy="26" r="4.5" fill="#ecfdf5" />
      {/* Dial Spokes */}
      <line x1="28" y1="17" x2="28" y2="21" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="28" y1="31" x2="28" y2="35" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="19" y1="26" x2="23" y2="26" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="33" y1="26" x2="37" y2="26" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
    </g>

    {/* Large Magnifying Glass Searching */}
    <g transform="translate(46, 26) rotate(15)">
      {/* Lens Rim */}
      <circle cx="26" cy="26" r="22" fill="#ecfdf5" fillOpacity="0.4" stroke="#047857" strokeWidth="4.5" />
      {/* Glare on Glass */}
      <path d="M12 24 C14 16, 22 12, 30 12" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
      {/* Question Mark Tag inside Lens */}
      <text x="26" y="34" textAnchor="middle" fill="#064e3b" fontSize="22" fontWeight="900" fontFamily="sans-serif">?</text>
      {/* Handle */}
      <path d="M42 42 L62 62" stroke="#064e3b" strokeWidth="7.5" strokeLinecap="round" />
      <path d="M44 44 L60 60" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  </svg>
);

// 13. BLANK FORMS GRAPHIC (Clipboard, Form Paper, Checkboxes & Pen)
export const BlankFormsGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="60" cy="60" r="54" className="fill-blue-500/40 stroke-blue-600 dark:fill-blue-500/35 dark:stroke-blue-400" strokeWidth="4" />
    {/* Clipboard Base */}
    <rect x="26" y="22" width="68" height="82" rx="8" fill="#1e293b" stroke="#2563eb" strokeWidth="2.5" />
    {/* White Paper Sheet */}
    <rect x="32" y="30" width="56" height="68" rx="4" fill="#ffffff" />
    {/* Clip Top */}
    <rect x="46" y="16" width="28" height="12" rx="3" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
    <circle cx="60" cy="20" r="3" fill="#1e293b" />
    {/* Form Rows & Checkboxes */}
    <g transform="translate(38, 40)">
      {/* Checkbox 1 */}
      <rect x="0" y="0" width="8" height="8" rx="2" fill="#2563eb" />
      <path d="M2 4 L3.5 6 L6.5 2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="4" x2="38" y2="4" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
      {/* Checkbox 2 */}
      <rect x="0" y="14" width="8" height="8" rx="2" fill="#2563eb" />
      <path d="M2 18 L3.5 20 L6.5 16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="18" x2="34" y2="18" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
      {/* Checkbox 3 */}
      <rect x="0" y="28" width="8" height="8" rx="2" fill="none" stroke="#64748b" strokeWidth="1.5" />
      <line x1="12" y1="32" x2="40" y2="32" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      {/* Signature line */}
      <line x1="0" y1="46" x2="42" y2="46" stroke="#2563eb" strokeWidth="2" strokeDasharray="2 2" />
    </g>
    {/* Blue Pen */}
    <g transform="rotate(38 88 78)">
      <rect x="80" y="50" width="8" height="38" rx="2" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1.5" />
      <polygon points="80,88 88,88 84,98" fill="#f59e0b" />
      <polygon points="82.5,95 85.5,95 84,98" fill="#0f172a" />
      <rect x="80" y="46" width="8" height="6" rx="1" fill="#cbd5e1" />
    </g>
  </svg>
);

// 14. INVOICE MANAGER GRAPHIC (Invoice Document, Cash/Receipt, Stamp & Coin)
export const InvoiceManagerGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="60" cy="60" r="54" className="fill-emerald-500/40 stroke-emerald-600 dark:fill-emerald-500/35 dark:stroke-emerald-400" strokeWidth="4" />
    {/* Receipt Paper Backing */}
    <g transform="translate(24, 20)">
      <path
        d="M6 0 L66 0 L66 76 L60 72 L54 76 L48 72 L42 76 L36 72 L30 76 L24 72 L18 76 L12 72 L6 76 Z"
        fill="#ffffff"
        stroke="#059669"
        strokeWidth="2.5"
      />
      {/* Header Bar */}
      <rect x="12" y="8" width="24" height="6" rx="2" fill="#059669" />
      <rect x="42" y="8" width="18" height="4" rx="1" fill="#64748b" />
      {/* Line Items */}
      <line x1="12" y1="22" x2="44" y2="22" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <line x1="48" y1="22" x2="60" y2="22" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="30" x2="38" y2="30" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <line x1="48" y1="30" x2="60" y2="30" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="38" x2="42" y2="38" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <line x1="48" y1="38" x2="60" y2="38" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
      {/* Divider */}
      <line x1="12" y1="46" x2="60" y2="46" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 2" />
      {/* Total row */}
      <rect x="12" y="52" width="20" height="5.5" rx="1.5" fill="#0f172a" />
      <rect x="44" y="52" width="16" height="5.5" rx="1.5" fill="#047857" />
      {/* PAID Stamp Badge */}
      <g transform="rotate(-15 42 48)">
        <rect x="22" y="38" width="34" height="14" rx="3" fill="#047857" opacity="0.95" stroke="#064e3b" strokeWidth="2" />
        <text x="26" y="49" fill="#ffffff" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">PAID</text>
      </g>
    </g>
    {/* Floating Golden Coin */}
    <g transform="translate(74, 68)">
      <circle cx="16" cy="16" r="14" fill="#f59e0b" stroke="#92400e" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="#fef08a" strokeWidth="2" />
      <text x="11.5" y="21" fill="#78350f" fontSize="14" fontWeight="bold" fontFamily="sans-serif">$</text>
    </g>
  </svg>
);

// 15. ANNOUNCEMENT & NOTICE GRAPHIC (Broadcast Megaphone / Speaker & Waves)
export const AnnouncementGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="60" cy="60" r="54" className="fill-amber-500/40 stroke-amber-600 dark:fill-amber-500/35 dark:stroke-amber-400" strokeWidth="4" />
    {/* Sound Waves */}
    <g stroke="#d97706" strokeWidth="3" strokeLinecap="round" opacity="0.9">
      <path d="M78 38 C86 44, 86 64, 78 70" />
      <path d="M86 30 C98 40, 98 72, 86 82" />
    </g>
    {/* Megaphone Body */}
    <g transform="rotate(-18 52 56)">
      {/* Handle */}
      <path d="M34 52 L30 76 L40 76 L42 54" fill="#d97706" stroke="#92400e" strokeWidth="2" />
      {/* Back Cap */}
      <ellipse cx="28" cy="46" rx="6" ry="12" fill="#f59e0b" stroke="#92400e" strokeWidth="2.5" />
      {/* Cone Body */}
      <path d="M28 34 L68 20 L68 72 L28 58 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2.5" />
      {/* Front Bell Rim */}
      <ellipse cx="68" cy="46" rx="8" ry="26" fill="#f59e0b" stroke="#92400e" strokeWidth="2.5" />
      {/* Inner Bell Hole */}
      <ellipse cx="68" cy="46" rx="5" ry="18" fill="#78350f" />
      {/* Center Button & Stripe */}
      <rect x="42" y="29" width="6" height="34" fill="#dc2626" />
      <circle cx="28" cy="46" r="3" fill="#ffffff" />
    </g>
    {/* Sparkle alert bursts */}
    <g fill="#d97706">
      <polygon points="96,22 98,27 103,28 99,32 100,37 96,34 92,37 93,32 89,28 94,27" />
    </g>
  </svg>
);

// 16. HELP & SUPPORT GRAPHIC (Lifebuoy, Support Headset & Agent Bubble)
export const HelpSupportGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="60" cy="60" r="54" className="fill-teal-500/40 stroke-teal-600 dark:fill-teal-500/35 dark:stroke-teal-400" strokeWidth="4" />
    {/* Classic Lifebuoy Ring */}
    <g transform="translate(60, 60)">
      <circle cx="0" cy="0" r="32" fill="#0f766e" stroke="#134e4a" strokeWidth="2.5" />
      <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#134e4a" strokeWidth="2.5" />
      {/* Red/Orange Contrast Straps */}
      <rect x="-32" y="-5" width="16" height="10" fill="#ea580c" />
      <rect x="16" y="-5" width="16" height="10" fill="#ea580c" />
      <rect x="-5" y="-32" width="10" height="16" fill="#ea580c" />
      <rect x="-5" y="16" width="10" height="16" fill="#ea580c" />
      {/* Rope around lifebuoy */}
      <circle cx="0" cy="0" r="36" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 4" />
    </g>
    {/* Customer Support Headset */}
    <g transform="translate(60, 48)">
      {/* Headband */}
      <path d="M-22 4 C-22 -20, 22 -20, 22 4" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      {/* Ear Cups */}
      <rect x="-26" y="0" width="7.5" height="15" rx="3.5" fill="#0f172a" />
      <rect x="19" y="0" width="7.5" height="15" rx="3.5" fill="#0f172a" />
      {/* Microphone Arm */}
      <path d="M22 8 L26 22 L14 26" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="12" cy="26" r="4" fill="#f59e0b" />
    </g>
    {/* 24/7 Badge */}
    <g transform="translate(24, 76)">
      <rect x="0" y="0" width="28" height="14" rx="4" fill="#0f172a" stroke="#0d9488" strokeWidth="1.5" />
      <text x="4" y="10.5" fill="#2dd4bf" fontSize="8" fontWeight="bold" fontFamily="sans-serif">24/7</text>
    </g>
  </svg>
);

// 17. TICKET MANAGEMENT GRAPHIC (Support Ticket, Priority Badge & Resolution Stamp)
export const TicketManagementGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="60" cy="60" r="54" className="fill-blue-500/40 stroke-blue-600 dark:fill-blue-500/35 dark:stroke-blue-400" strokeWidth="4" />
    {/* Shadow Ticket Back */}
    <rect x="26" y="24" width="68" height="68" rx="10" transform="rotate(-6 60 58)" fill="#1e3a8a" opacity="0.4" />
    {/* Main Ticket */}
    <g transform="translate(22, 26)">
      <path
        d="M0 10 C0 4.5 4.5 0 10 0 L66 0 C71.5 0 76 4.5 76 10 L76 24 C71.5 24 68 27.5 68 32 C68 36.5 71.5 40 76 40 L76 56 C76 61.5 71.5 66 66 66 L10 66 C4.5 66 0 61.5 0 56 L0 40 C4.5 40 8 36.5 8 32 C8 27.5 4.5 24 0 24 Z"
        fill="#2563eb"
        stroke="#1d4ed8"
        strokeWidth="2.5"
      />
      {/* Dashed Tear Line */}
      <line x1="50" y1="2" x2="50" y2="64" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
      {/* Ticket Header & Text lines */}
      <rect x="12" y="10" width="30" height="7" rx="3.5" fill="#ffffff" />
      <rect x="12" y="22" width="22" height="4" rx="2" fill="#bfdbfe" />
      <rect x="12" y="30" width="26" height="4" rx="2" fill="#bfdbfe" />
      {/* Barcode Lines */}
      <g transform="translate(12, 42)">
        <rect x="0" y="0" width="2" height="14" fill="#ffffff" />
        <rect x="4" y="0" width="4" height="14" fill="#ffffff" />
        <rect x="10" y="0" width="2" height="14" fill="#ffffff" />
        <rect x="14" y="0" width="3" height="14" fill="#ffffff" />
        <rect x="19" y="0" width="5" height="14" fill="#ffffff" />
        <rect x="26" y="0" width="2" height="14" fill="#ffffff" />
      </g>
      {/* Ticket Right Stub ID */}
      <circle cx="62" cy="20" r="6" fill="#60a5fa" />
      <rect x="56" y="32" width="12" height="4" rx="2" fill="#dbeafe" />
      <rect x="56" y="40" width="12" height="4" rx="2" fill="#dbeafe" />
    </g>
    {/* Floating Priority Star Tag */}
    <g transform="translate(72, 68)">
      <circle cx="16" cy="16" r="14" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
      <path d="M16 7 L18.5 12.5 L24.5 13 L20 17 L21.5 23 L16 19.5 L10.5 23 L12 17 L7.5 13 L13.5 12.5 Z" fill="#ffffff" />
    </g>
  </svg>
);

// 18. SLA MANAGEMENT GRAPHIC (Chronometer, Target Rings & SLA Compliance Meter)
export const SLAManagementGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="60" cy="60" r="54" className="fill-purple-500/40 stroke-purple-600 dark:fill-purple-500/35 dark:stroke-purple-400" strokeWidth="4" />
    {/* Outer Stopwatch Top Button */}
    <rect x="54" y="10" width="12" height="10" rx="3" fill="#7c3aed" stroke="#6d28d9" strokeWidth="2" />
    <path d="M44 18 L50 24" stroke="#6d28d9" strokeWidth="3" strokeLinecap="round" />
    <path d="M76 18 L70 24" stroke="#6d28d9" strokeWidth="3" strokeLinecap="round" />
    {/* Clock Bezel */}
    <circle cx="60" cy="66" r="42" fill="#ffffff" stroke="#7c3aed" strokeWidth="4" />
    {/* SLA Progress Arc (Green / Safe zone) */}
    <circle
      cx="60"
      cy="66"
      r="34"
      fill="none"
      stroke="#10b981"
      strokeWidth="6"
      strokeDasharray="160 213"
      strokeLinecap="round"
      transform="rotate(-90 60 66)"
    />
    {/* Clock Ticks */}
    <circle cx="60" cy="38" r="2" fill="#6d28d9" />
    <circle cx="88" cy="66" r="2" fill="#6d28d9" />
    <circle cx="60" cy="94" r="2" fill="#6d28d9" />
    <circle cx="32" cy="66" r="2" fill="#6d28d9" />
    {/* Central Hands */}
    <circle cx="60" cy="66" r="5" fill="#4c1d95" />
    <line x1="60" y1="66" x2="60" y2="44" stroke="#4c1d95" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="60" y1="66" x2="78" y2="56" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    {/* Compliance SLA Shield Badge */}
    <g transform="translate(18, 70)">
      <path
        d="M0 4 C0 1.8 1.8 0 4 0 L24 0 C26.2 0 28 1.8 28 4 L28 16 C28 26 14 32 14 32 C14 32 0 26 0 16 Z"
        fill="#10b981"
        stroke="#ffffff"
        strokeWidth="2"
      />
      <path d="M7 14 L12 19 L21 9" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// 19. AUTOMATED WORKFLOW GRAPHIC (Automation Nodes, Circuit Flow & Gears)
export const AutomatedWorkflowGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="60" cy="60" r="54" className="fill-cyan-500/40 stroke-cyan-600 dark:fill-cyan-500/35 dark:stroke-cyan-400" strokeWidth="4" />
    {/* Pathway Curved Lines */}
    <path
      d="M30 36 C55 36 45 60 70 60 C85 60 85 86 64 86"
      fill="none"
      stroke="#0284c7"
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="6 4"
    />
    <path
      d="M30 36 C30 75 50 86 64 86"
      fill="none"
      stroke="#06b6d4"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    {/* Trigger Node 1 */}
    <g transform="translate(18, 24)">
      <circle cx="14" cy="14" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="3" />
      <path d="M14 7 L17 13 L23 14 L18.5 18 L20 24 L14 20.5 L8 24 L9.5 18 L5 14 L11 13 Z" fill="#ffffff" />
    </g>
    {/* Action Node 2 */}
    <g transform="translate(68, 48)">
      <rect x="0" y="0" width="28" height="24" rx="7" fill="#0891b2" stroke="#ffffff" strokeWidth="2.5" />
      <path d="M8 12 L12 16 L20 8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    {/* Automation Gear Node 3 */}
    <g transform="translate(48, 70)">
      <circle cx="18" cy="18" r="16" fill="#0e7490" stroke="#ffffff" strokeWidth="3" />
      {/* Cog wheel teeth */}
      <circle cx="18" cy="18" r="6" fill="#ffffff" />
      <line x1="18" y1="4" x2="18" y2="32" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="4" y1="18" x2="32" y2="18" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="8" y1="8" x2="28" y2="28" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="28" y1="8" x2="8" y2="28" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
    </g>
    {/* Lightning Bolt Fast Badge */}
    <g transform="translate(76, 20)">
      <circle cx="12" cy="12" r="11" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
      <path d="M13 5 L8 13 L12 13 L11 19 L16 11 L12 11 Z" fill="#ffffff" />
    </g>
  </svg>
);

// 20. EMAIL MANAGEMENT GRAPHIC (Envelope, Dispatch Plane & Digital Postal Badge)
export const EmailManagementGraphic: React.FC<GraphicProps> = ({ className = 'w-12 h-12', size }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="60" cy="60" r="54" className="fill-rose-500/40 stroke-rose-600 dark:fill-rose-500/35 dark:stroke-rose-400" strokeWidth="4" />
    {/* Letter Stacking Shadow */}
    <rect x="22" y="38" width="66" height="46" rx="8" fill="#881337" opacity="0.3" transform="rotate(-4 55 61)" />
    {/* Envelope Body */}
    <g transform="translate(20, 36)">
      <rect x="0" y="0" width="72" height="48" rx="8" fill="#e11d48" stroke="#be123c" strokeWidth="2.5" />
      {/* Letter sheet slipping out */}
      <g transform="translate(10, -14)">
        <rect x="0" y="0" width="52" height="30" rx="4" fill="#ffffff" stroke="#fecdd3" strokeWidth="1.5" />
        <line x1="8" y1="8" x2="34" y2="8" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="14" x2="44" y2="14" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="20" x2="28" y2="20" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Envelope Flap Fold Lines */}
      <path d="M0 0 L36 28 L72 0" fill="#f43f5e" stroke="#be123c" strokeWidth="2" />
      <path d="M0 48 L28 22" stroke="#be123c" strokeWidth="1.5" opacity="0.6" />
      <path d="M72 48 L44 22" stroke="#be123c" strokeWidth="1.5" opacity="0.6" />
    </g>
    {/* Paper Airplane Flying Off */}
    <g transform="translate(68, 16)">
      <path d="M30 4 L4 18 L16 22 L24 30 L26 24 L30 4 Z" fill="#ffffff" stroke="#e11d48" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 22 L30 4" stroke="#e11d48" strokeWidth="1.5" />
      {/* Jet Stream Trail */}
      <path d="M2 30 C-4 28 -8 34 -14 32" stroke="#fb7185" strokeWidth="2" strokeDasharray="2.5 2" strokeLinecap="round" />
    </g>
    {/* Unread Alert Dot */}
    <circle cx="86" cy="74" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
  </svg>
);

// Master Helper to get Custom Graphic for Any Facility ID
export const getFacilityGraphic = (facilityId: string, className = 'w-10 h-10', size?: number) => {
  switch (facilityId) {
    case 'cricket-ground':
      return <CricketGraphic className={className} size={size} />;
    case 'football-ground':
      return <FootballGraphic className={className} size={size} />;
    case 'barber-booking':
      return <BarberGraphic className={className} size={size} />;
    case 'basketball-court':
      return <BasketballGraphic className={className} size={size} />;
    case 'cinema':
      return <CinemaGraphic className={className} size={size} />;
    case 'tennis-court':
      return <TennisGraphic className={className} size={size} />;
    case 'cricket-net':
      return <CricketNetGraphic className={className} size={size} />;
    case 'multipurpose-room':
      return <MultipurposeGraphic className={className} size={size} />;
    case 'isolation-room':
      return <IsolationRoomGraphic className={className} size={size} />;
    case 'handover-takenover':
      return <HandoverGraphic className={className} size={size} />;
    case 'parcel-monitoring':
      return <ParcelGraphic className={className} size={size} />;
    case 'lost-and-found':
      return <LostAndFoundGraphic className={className} size={size} />;
    case 'blank-forms':
      return <BlankFormsGraphic className={className} size={size} />;
    case 'invoice-manager':
      return <InvoiceManagerGraphic className={className} size={size} />;
    case 'announcement-notice':
      return <AnnouncementGraphic className={className} size={size} />;
    case 'help-support':
      return <HelpSupportGraphic className={className} size={size} />;
    case 'ticket-management':
      return <TicketManagementGraphic className={className} size={size} />;
    case 'sla-management':
      return <SLAManagementGraphic className={className} size={size} />;
    case 'automated-workflow':
      return <AutomatedWorkflowGraphic className={className} size={size} />;
    case 'email-management':
      return <EmailManagementGraphic className={className} size={size} />;
    default:
      return <CricketGraphic className={className} size={size} />;
  }
};

// Facility Visual Styling Metadata (Distinct Theme Palettes)
export const FACILITY_THEMES: Record<
  string,
  {
    primary: string;
    border: string;
    bgBadge: string;
    textBadge: string;
    gradientHero: string;
    accentGlow: string;
    tagline: string;
    tagIcon: string;
    equipmentKeywords: string[];
  }
> = {
  'cricket-ground': {
    primary: 'emerald',
    border: 'border-emerald-500/40 dark:border-emerald-500/30',
    bgBadge: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    textBadge: 'text-emerald-700 dark:text-emerald-400',
    gradientHero: 'from-emerald-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(16, 185, 129, 0.15)',
    tagline: 'Standard Turf Pitch & Floodlights',
    tagIcon: '🏏',
    equipmentKeywords: ['Turf Pitch', 'Floodlights', 'Pavilion'],
  },
  'football-ground': {
    primary: 'blue',
    border: 'border-blue-500/40 dark:border-blue-500/30',
    bgBadge: 'bg-blue-500/15 dark:bg-blue-500/20',
    textBadge: 'text-blue-700 dark:text-blue-400',
    gradientHero: 'from-blue-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(59, 130, 246, 0.15)',
    tagline: 'Full Turf Field & Goals',
    tagIcon: '⚽',
    equipmentKeywords: ['Goal Posts', 'Floodlights', 'Turf'],
  },
  'barber-booking': {
    primary: 'amber',
    border: 'border-amber-500/40 dark:border-amber-500/30',
    bgBadge: 'bg-amber-500/15 dark:bg-amber-500/20',
    textBadge: 'text-amber-700 dark:text-amber-400',
    gradientHero: 'from-amber-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(245, 158, 11, 0.15)',
    tagline: 'Salon & Grooming Services',
    tagIcon: '✂️',
    equipmentKeywords: ['Haircut', 'Shave', 'Beard Trim'],
  },
  'basketball-court': {
    primary: 'orange',
    border: 'border-orange-500/40 dark:border-orange-500/30',
    bgBadge: 'bg-orange-500/15 dark:bg-orange-500/20',
    textBadge: 'text-orange-700 dark:text-orange-400',
    gradientHero: 'from-orange-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(249, 115, 22, 0.15)',
    tagline: 'Hardwood Court & Hoops',
    tagIcon: '🏀',
    equipmentKeywords: ['Full Court', 'Hoops', 'Scoreboard'],
  },
  'cinema': {
    primary: 'rose',
    border: 'border-rose-500/40 dark:border-rose-500/30',
    bgBadge: 'bg-rose-500/15 dark:bg-rose-500/20',
    textBadge: 'text-rose-700 dark:text-rose-400',
    gradientHero: 'from-rose-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(244, 63, 94, 0.15)',
    tagline: 'Auditorium & Sound System',
    tagIcon: '🍿',
    equipmentKeywords: ['Projector', 'Surround Sound', 'Recliners'],
  },
  'tennis-court': {
    primary: 'teal',
    border: 'border-teal-500/40 dark:border-teal-500/30',
    bgBadge: 'bg-teal-500/15 dark:bg-teal-500/20',
    textBadge: 'text-teal-700 dark:text-teal-400',
    gradientHero: 'from-teal-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(20, 184, 166, 0.15)',
    tagline: 'Hard Court & Net',
    tagIcon: '🎾',
    equipmentKeywords: ['Tennis Court', 'Net', 'Lighting'],
  },
  'cricket-net': {
    primary: 'cyan',
    border: 'border-cyan-500/40 dark:border-cyan-500/30',
    bgBadge: 'bg-cyan-500/15 dark:bg-cyan-500/20',
    textBadge: 'text-cyan-700 dark:text-cyan-400',
    gradientHero: 'from-cyan-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(6, 182, 212, 0.15)',
    tagline: 'Practice Nets & Bowling Machine',
    tagIcon: '🎯',
    equipmentKeywords: ['Practice Nets', 'Turf Matting', 'Bowling Machine'],
  },
  'multipurpose-room': {
    primary: 'indigo',
    border: 'border-indigo-500/40 dark:border-indigo-500/30',
    bgBadge: 'bg-indigo-500/15 dark:bg-indigo-500/20',
    textBadge: 'text-indigo-700 dark:text-indigo-400',
    gradientHero: 'from-indigo-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(99, 102, 241, 0.15)',
    tagline: 'Hall, Projector & Audio Setup',
    tagIcon: '🏛️',
    equipmentKeywords: ['Projector', 'Sound System', 'Seating'],
  },
  'isolation-room': {
    primary: 'purple',
    border: 'border-purple-500/40 dark:border-purple-500/30',
    bgBadge: 'bg-purple-500/15 dark:bg-purple-500/20',
    textBadge: 'text-purple-700 dark:text-purple-400',
    gradientHero: 'from-purple-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(168, 85, 247, 0.15)',
    tagline: 'Isolation Rooms & Medical Staging',
    tagIcon: '🏥',
    equipmentKeywords: ['Patient Beds', 'Medical Monitoring', 'En-Suite Facilities'],
  },
  'handover-takenover': {
    primary: 'cyan',
    border: 'border-cyan-500/40 dark:border-cyan-500/30',
    bgBadge: 'bg-cyan-500/15 dark:bg-cyan-500/20',
    textBadge: 'text-cyan-700 dark:text-cyan-400',
    gradientHero: 'from-cyan-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(6, 182, 212, 0.15)',
    tagline: 'Shift Handover & Key Custody',
    tagIcon: '🔄',
    equipmentKeywords: ['Key Registry', 'Duty Log', 'Asset Tracking'],
  },
  'parcel-monitoring': {
    primary: 'amber',
    border: 'border-amber-500/40 dark:border-amber-500/30',
    bgBadge: 'bg-amber-500/15 dark:bg-amber-500/20',
    textBadge: 'text-amber-700 dark:text-amber-400',
    gradientHero: 'from-amber-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(245, 158, 11, 0.15)',
    tagline: 'Inbound Courier & Package Logging',
    tagIcon: '📦',
    equipmentKeywords: ['Parcel Log', 'Storage Shelves', 'Recipient Notifications'],
  },
  'lost-and-found': {
    primary: 'emerald',
    border: 'border-emerald-500/40 dark:border-emerald-500/30',
    bgBadge: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    textBadge: 'text-emerald-700 dark:text-emerald-400',
    gradientHero: 'from-emerald-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(16, 185, 129, 0.15)',
    tagline: 'Lost & Found Property Register',
    tagIcon: '🔍',
    equipmentKeywords: ['Item Storage', 'Claim Verification', 'Custody Log'],
  },
  'blank-forms': {
    primary: 'blue',
    border: 'border-blue-500/40 dark:border-blue-500/30',
    bgBadge: 'bg-blue-500/15 dark:bg-blue-500/20',
    textBadge: 'text-blue-700 dark:text-blue-400',
    gradientHero: 'from-blue-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(59, 130, 246, 0.15)',
    tagline: 'Printable Templates & Clearance Forms',
    tagIcon: '📋',
    equipmentKeywords: ['PDF Requisitions', 'Clearance Slips', 'Digital Sign-off'],
  },
  'invoice-manager': {
    primary: 'emerald',
    border: 'border-emerald-500/40 dark:border-emerald-500/30',
    bgBadge: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    textBadge: 'text-emerald-700 dark:text-emerald-400',
    gradientHero: 'from-emerald-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(16, 185, 129, 0.15)',
    tagline: 'Facility Invoicing & POS Receipts',
    tagIcon: '🧾',
    equipmentKeywords: ['Tax Invoices', 'Thermal Receipts', 'Audit Records'],
  },
  'announcement-notice': {
    primary: 'amber',
    border: 'border-amber-500/40 dark:border-amber-500/30',
    bgBadge: 'bg-amber-500/15 dark:bg-amber-500/20',
    textBadge: 'text-amber-700 dark:text-amber-400',
    gradientHero: 'from-amber-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(245, 158, 11, 0.15)',
    tagline: 'Official Broadcasts & Alert Bulletins',
    tagIcon: '📢',
    equipmentKeywords: ['Notice Board', 'Priority Broadcasts', 'Maintenance Alerts'],
  },
  'help-support': {
    primary: 'teal',
    border: 'border-teal-500/40 dark:border-teal-500/30',
    bgBadge: 'bg-teal-500/15 dark:bg-teal-500/20',
    textBadge: 'text-teal-700 dark:text-teal-400',
    gradientHero: 'from-teal-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(20, 184, 166, 0.15)',
    tagline: '24/7 Facility Helpdesk & Escalation',
    tagIcon: '🛟',
    equipmentKeywords: ['Support Tickets', 'Hotline Contacts', 'Live FAQ'],
  },
  'ticket-management': {
    primary: 'blue',
    border: 'border-blue-500/40 dark:border-blue-500/30',
    bgBadge: 'bg-blue-500/15 dark:bg-blue-500/20',
    textBadge: 'text-blue-700 dark:text-blue-400',
    gradientHero: 'from-blue-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(59, 130, 246, 0.15)',
    tagline: 'Incident Tickets & Resolution Queue',
    tagIcon: '🎫',
    equipmentKeywords: ['Ticket Queue', 'Priority Matrix', 'Resolution Log'],
  },
  'sla-management': {
    primary: 'purple',
    border: 'border-purple-500/40 dark:border-purple-500/30',
    bgBadge: 'bg-purple-500/15 dark:bg-purple-500/20',
    textBadge: 'text-purple-700 dark:text-purple-400',
    gradientHero: 'from-purple-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(168, 85, 247, 0.15)',
    tagline: 'SLA Tracking & Response Deadlines',
    tagIcon: '⏱️',
    equipmentKeywords: ['Compliance Targets', 'Turnaround Timers', 'Escalation Rules'],
  },
  'automated-workflow': {
    primary: 'cyan',
    border: 'border-cyan-500/40 dark:border-cyan-500/30',
    bgBadge: 'bg-cyan-500/15 dark:bg-cyan-500/20',
    textBadge: 'text-cyan-700 dark:text-cyan-400',
    gradientHero: 'from-cyan-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(6, 182, 212, 0.15)',
    tagline: 'Smart Triggers & Automated Execution',
    tagIcon: '⚡',
    equipmentKeywords: ['Triggers', 'Routing Logic', 'Webhook Dispatch'],
  },
  'email-management': {
    primary: 'rose',
    border: 'border-rose-500/40 dark:border-rose-500/30',
    bgBadge: 'bg-rose-500/15 dark:bg-rose-500/20',
    textBadge: 'text-rose-700 dark:text-rose-400',
    gradientHero: 'from-rose-950/70 via-slate-900 to-slate-950',
    accentGlow: 'rgba(244, 63, 94, 0.15)',
    tagline: 'Enterprise Email & Broadcast Gateway',
    tagIcon: '✉️',
    equipmentKeywords: ['Email Templates', 'Dispatch Logs', 'Notification Campaigns'],
  },
};
