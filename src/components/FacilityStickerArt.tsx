import React from 'react';

interface StickerProps {
  className?: string;
  size?: number;
}

/**
 * 16 Distinct Thematic Background Watermark Artwork (NEW TYPE - Architectural, Arenas, Blueprints & Crests)
 * None of these duplicate the foreground icons (e.g. no bat/ball, scissors, popcorn, clipboard).
 * Instead, they feature atmospheric facility environments, grand arena blueprints, architectural facades,
 * and official heraldic crests that provide subtle, high-end depth to the background.
 */

// 1. BARBER: Luxury Salon Styling Lounge, Vintage Grand Mirror & Art-Deco Salon Canopy
export const BarberSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Salon Architectural Arch & Mirror Frame */}
    <path d="M40 145 V55 C40 32.9 57.9 15 80 15 C102.1 15 120 32.9 120 55 V145" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.6" />
    <path d="M48 145 V58 C48 40.3 62.3 26 80 26 C97.7 26 112 40.3 112 58 V145" stroke="#9333ea" strokeWidth="1.5" opacity="0.4" />
    
    {/* Vintage Tufted Salon Chair Silhouette */}
    <g transform="translate(80, 95)" opacity="0.75">
      {/* Headrest */}
      <rect x="-14" y="-46" width="28" height="10" rx="5" fill="#c084fc" />
      {/* Backrest with tufting lines */}
      <rect x="-24" y="-32" width="48" height="34" rx="8" fill="#7e22ce" stroke="#a855f7" strokeWidth="2" />
      <line x1="-12" y1="-32" x2="-12" y2="2" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="12" y1="-32" x2="12" y2="2" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="-24" y1="-15" x2="24" y2="-15" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Armrests */}
      <path d="M-28 -20 L-28 -4 C-28 0, -22 2, -18 2" stroke="#e9d5ff" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M28 -20 L28 -4 C28 0, 22 2, 18 2" stroke="#e9d5ff" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Hydraulic Base */}
      <rect x="-26" y="4" width="52" height="10" rx="4" fill="#6b21a8" />
      <line x1="0" y1="14" x2="0" y2="30" stroke="#c084fc" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="0" cy="34" rx="28" ry="8" fill="#581c87" stroke="#a855f7" strokeWidth="2" />
    </g>

    {/* Elegant Chandelier & Barber Crown Motif */}
    <g transform="translate(80, 26)" opacity="0.8">
      <circle cx="0" cy="0" r="4" fill="#e9d5ff" />
      <path d="M-18 6 C-10 14, 10 14, 18 6" stroke="#c084fc" strokeWidth="1.5" fill="none" />
      <circle cx="-18" cy="6" r="2" fill="#fbbf24" />
      <circle cx="0" cy="10" r="2" fill="#fbbf24" />
      <circle cx="18" cy="6" r="2" fill="#fbbf24" />
    </g>
    {/* Decorative Stars */}
    <path d="M25 40 L27 45 L32 47 L27 49 L25 54 L23 49 L18 47 L23 45 Z" fill="#c084fc" opacity="0.6" />
    <path d="M135 40 L137 45 L142 47 L137 49 L135 54 L133 49 L128 47 L133 45 Z" fill="#c084fc" opacity="0.6" />
  </svg>
);

// 2. CRICKET GROUND: Grand Cricket Stadium Oval Arena, 30-Yard Circle & Stadium Floodlight Towers
export const CricketSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Stadium Arena Grandstand Outer Bowl */}
    <ellipse cx="80" cy="82" rx="72" ry="52" stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
    <ellipse cx="80" cy="82" rx="64" ry="44" stroke="#059669" strokeWidth="1.5" opacity="0.4" />
    
    {/* Boundary Rope & 30-Yard Circle */}
    <ellipse cx="80" cy="82" rx="52" ry="34" stroke="#10b981" strokeWidth="2.5" opacity="0.7" />
    <ellipse cx="80" cy="82" rx="36" ry="22" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />

    {/* Center Pitch Rectangle */}
    <rect x="73" y="68" width="14" height="28" rx="2" fill="#047857" stroke="#6ee7b7" strokeWidth="1.5" opacity="0.8" />
    <line x1="73" y1="73" x2="87" y2="73" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
    <line x1="73" y1="91" x2="87" y2="91" stroke="#ffffff" strokeWidth="1" opacity="0.9" />

    {/* Four Grand Stadium Floodlight Towers */}
    {/* Top-Left Tower */}
    <g transform="translate(18, 20)" opacity="0.75">
      <line x1="10" y1="40" x2="16" y2="8" stroke="#047857" strokeWidth="2" />
      <line x1="22" y1="40" x2="16" y2="8" stroke="#047857" strokeWidth="2" />
      <line x1="12" y1="28" x2="20" y2="28" stroke="#047857" strokeWidth="1.5" />
      <rect x="6" y="2" width="20" height="7" rx="2" fill="#059669" stroke="#34d399" strokeWidth="1" />
      <circle cx="10" cy="5.5" r="1.5" fill="#fef08a" />
      <circle cx="16" cy="5.5" r="1.5" fill="#fef08a" />
      <circle cx="22" cy="5.5" r="1.5" fill="#fef08a" />
    </g>
    {/* Top-Right Tower */}
    <g transform="translate(112, 20)" opacity="0.75">
      <line x1="10" y1="40" x2="16" y2="8" stroke="#047857" strokeWidth="2" />
      <line x1="22" y1="40" x2="16" y2="8" stroke="#047857" strokeWidth="2" />
      <line x1="12" y1="28" x2="20" y2="28" stroke="#047857" strokeWidth="1.5" />
      <rect x="6" y="2" width="20" height="7" rx="2" fill="#059669" stroke="#34d399" strokeWidth="1" />
      <circle cx="10" cy="5.5" r="1.5" fill="#fef08a" />
      <circle cx="16" cy="5.5" r="1.5" fill="#fef08a" />
      <circle cx="22" cy="5.5" r="1.5" fill="#fef08a" />
    </g>

    {/* Stadium Pavilion Roof Arch */}
    <path d="M56 24 Q80 12 104 24" stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// 3. FOOTBALL GROUND: Tactical Pitch Blueprint, Penalty Box Geometry & Arena Floodlights
export const FootballSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Stadium Outer Arena Contours */}
    <rect x="12" y="16" width="136" height="128" rx="20" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
    
    {/* Football Pitch Perimeter Lines */}
    <rect x="24" y="26" width="112" height="108" rx="6" stroke="#2563eb" strokeWidth="2.5" opacity="0.8" />
    {/* Halfway Line */}
    <line x1="24" y1="80" x2="136" y2="80" stroke="#2563eb" strokeWidth="2" opacity="0.8" />
    {/* Center Circle & Center Spot */}
    <circle cx="80" cy="80" r="18" stroke="#3b82f6" strokeWidth="2" opacity="0.8" fill="none" />
    <circle cx="80" cy="80" r="2.5" fill="#60a5fa" />

    {/* Top Penalty Area & Goal Box */}
    <rect x="52" y="26" width="56" height="24" stroke="#2563eb" strokeWidth="2" opacity="0.8" fill="none" />
    <rect x="64" y="26" width="32" height="10" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7" fill="none" />
    <path d="M68 50 C72 54, 88 54, 92 50" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7" fill="none" />
    <circle cx="80" cy="42" r="1.5" fill="#60a5fa" />

    {/* Bottom Penalty Area & Goal Box */}
    <rect x="52" y="110" width="56" height="24" stroke="#2563eb" strokeWidth="2" opacity="0.8" fill="none" />
    <rect x="64" y="124" width="32" height="10" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7" fill="none" />
    <path d="M68 110 C72 106, 88 106, 92 110" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7" fill="none" />
    <circle cx="80" cy="118" r="1.5" fill="#60a5fa" />

    {/* Four Corner Arcs */}
    <path d="M24 34 A8 8 0 0 0 32 26" stroke="#60a5fa" strokeWidth="1.5" opacity="0.8" />
    <path d="M128 26 A8 8 0 0 0 136 34" stroke="#60a5fa" strokeWidth="1.5" opacity="0.8" />
    <path d="M24 126 A8 8 0 0 1 32 134" stroke="#60a5fa" strokeWidth="1.5" opacity="0.8" />
    <path d="M128 134 A8 8 0 0 1 136 126" stroke="#60a5fa" strokeWidth="1.5" opacity="0.8" />
  </svg>
);

// 4. MULTIPURPOSE ROOM: Grand Conference Amphitheater Seating & Acoustic Ceiling Canopy
export const MultipurposeSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Executive Auditorium Stage Proscenium */}
    <path d="M35 32 Q80 44 125 32" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    <rect x="55" y="18" width="50" height="16" rx="4" fill="#4338ca" stroke="#818cf8" strokeWidth="1.5" opacity="0.7" />

    {/* Tiered Amphitheater Seating Curved Rows */}
    <path d="M25 60 Q80 84 135 60" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    <path d="M20 80 Q80 108 140 80" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <path d="M16 100 Q80 132 144 100" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    <path d="M12 120 Q80 156 148 120" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

    {/* Seating Aisle Dividers */}
    <line x1="80" y1="44" x2="80" y2="140" stroke="#c7d2fe" strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
    <line x1="52" y1="44" x2="38" y2="135" stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
    <line x1="108" y1="44" x2="122" y2="135" stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />

    {/* Acoustic Ceiling Floating Cloud Panels */}
    <ellipse cx="44" cy="14" rx="14" ry="4" stroke="#a5b4fc" strokeWidth="1.5" opacity="0.5" />
    <ellipse cx="80" cy="10" rx="18" ry="4.5" stroke="#a5b4fc" strokeWidth="1.5" opacity="0.6" />
    <ellipse cx="116" cy="14" rx="14" ry="4" stroke="#a5b4fc" strokeWidth="1.5" opacity="0.5" />
  </svg>
);

// 5. CINEMA: Grand Theatre Proscenium Arch with Velvet Curtains & Illuminated Movie Screen Facade
export const CinemaSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Grand Cinema Stage Arch */}
    <path d="M20 145 V45 C20 25 35 15 80 15 C125 15 140 25 140 45 V145" stroke="#e11d48" strokeWidth="2.5" opacity="0.6" />
    <path d="M28 145 V50 C28 32 42 24 80 24 C118 24 132 32 132 50 V145" stroke="#fb7185" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.5" />

    {/* Theatrical Velvet Curtain Drapes */}
    <g opacity="0.8">
      {/* Left Drape */}
      <path d="M20 28 Q45 28 48 65 Q50 95 30 140 L20 140 Z" fill="#be123c" stroke="#f43f5e" strokeWidth="1.5" />
      {/* Right Drape */}
      <path d="M140 28 Q115 28 112 65 Q110 95 130 140 L140 140 Z" fill="#be123c" stroke="#f43f5e" strokeWidth="1.5" />
      {/* Top Valance Swags */}
      <path d="M20 28 Q50 48 80 28 Q110 48 140 28" fill="#9f1239" stroke="#fda4af" strokeWidth="2" />
    </g>

    {/* Center 16:9 Cinema Wide Screen Silhouette */}
    <rect x="42" y="52" width="76" height="46" rx="4" fill="#1e1b4b" stroke="#fda4af" strokeWidth="2" opacity="0.7" />
    {/* Light Projector Cone Beams */}
    <polygon points="80,12 42,52 118,52" fill="#fbbf24" opacity="0.15" />
    <line x1="80" y1="12" x2="42" y2="52" stroke="#fef08a" strokeWidth="1" opacity="0.4" strokeDasharray="3 3" />
    <line x1="80" y1="12" x2="118" y2="52" stroke="#fef08a" strokeWidth="1" opacity="0.4" strokeDasharray="3 3" />

    {/* Tiered Audience Seats Silhouette */}
    <path d="M34 122 H126" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <path d="M26 138 H134" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// 6. TENNIS COURT: Wimbledon Centre Court Blueprint & Championship Laurel Wreath Trophy Crest
export const TennisSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Championship Oval Wreath Frame */}
    <ellipse cx="80" cy="80" rx="72" ry="60" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />

    {/* Complete Aerial Tennis Court Diagram */}
    <rect x="36" y="24" width="88" height="112" rx="4" stroke="#0d9488" strokeWidth="2.5" opacity="0.8" />
    {/* Singles Tramlines */}
    <line x1="48" y1="24" x2="48" y2="136" stroke="#14b8a6" strokeWidth="1.5" opacity="0.7" />
    <line x1="112" y1="24" x2="112" y2="136" stroke="#14b8a6" strokeWidth="1.5" opacity="0.7" />
    
    {/* Center Tennis Net Across Court */}
    <line x1="30" y1="80" x2="130" y2="80" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    <line x1="30" y1="80" x2="130" y2="80" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />

    {/* Service Boxes & Service Line */}
    <line x1="48" y1="52" x2="112" y2="52" stroke="#14b8a6" strokeWidth="1.5" opacity="0.7" />
    <line x1="48" y1="108" x2="112" y2="108" stroke="#14b8a6" strokeWidth="1.5" opacity="0.7" />
    {/* Center Service Line */}
    <line x1="80" y1="52" x2="80" y2="108" stroke="#14b8a6" strokeWidth="1.5" opacity="0.7" />
    {/* Center Marks */}
    <line x1="80" y1="24" x2="80" y2="29" stroke="#14b8a6" strokeWidth="2" opacity="0.8" />
    <line x1="80" y1="131" x2="80" y2="136" stroke="#14b8a6" strokeWidth="2" opacity="0.8" />

    {/* Championship Grand Slam Laurel Wreath Leaves */}
    <path d="M22 65 C18 80, 24 105, 38 120" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M138 65 C142 80, 136 105, 122 120" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// 7. CRICKET NET: Practice Batting Tunnel 3D Grid & Speed Radar Pitch Target Matrix
export const CricketNetSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* 3D Batting Tunnel Enclosure Net Perspective */}
    {/* Front Entrance Frame */}
    <rect x="22" y="24" width="116" height="112" rx="8" stroke="#0891b2" strokeWidth="2.5" opacity="0.8" />
    {/* Back Wall Frame */}
    <rect x="52" y="48" width="56" height="58" rx="4" stroke="#06b6d4" strokeWidth="2" opacity="0.6" />
    {/* Connecting Corner Depth Perspective Lines */}
    <line x1="22" y1="24" x2="52" y2="48" stroke="#0891b2" strokeWidth="2" opacity="0.7" />
    <line x1="138" y1="24" x2="108" y2="48" stroke="#0891b2" strokeWidth="2" opacity="0.7" />
    <line x1="22" y1="136" x2="52" y2="106" stroke="#0891b2" strokeWidth="2" opacity="0.7" />
    <line x1="138" y1="136" x2="108" y2="106" stroke="#0891b2" strokeWidth="2" opacity="0.7" />

    {/* Practice Net Grid Wire Mesh Textures */}
    <g opacity="0.4" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3">
      <line x1="37" y1="24" x2="66" y2="48" />
      <line x1="123" y1="24" x2="94" y2="48" />
      <line x1="22" y1="80" x2="52" y2="77" />
      <line x1="138" y1="80" x2="108" y2="77" />
    </g>

    {/* Pitch Line & Target Bowling Marker Zones */}
    <polygon points="56,106 104,106 128,136 32,136" fill="#0e7490" opacity="0.4" />
    {/* Target Good Length Pitch Zone Circles */}
    <circle cx="80" cy="77" r="14" stroke="#67e8f9" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" fill="none" />
    <circle cx="80" cy="77" r="6" stroke="#38bdf8" strokeWidth="1.5" opacity="0.9" fill="#0891b2" />
    <line x1="80" y1="60" x2="80" y2="94" stroke="#67e8f9" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
    <line x1="60" y1="77" x2="100" y2="77" stroke="#67e8f9" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
  </svg>
);

// 8. BASKETBALL: NBA Hardwood Court Geometric Floor Blueprint & Arena Jumbotron Scoreboard Hexagon
export const BasketballSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Court Perimeter Boundary */}
    <rect x="18" y="20" width="124" height="120" rx="10" stroke="#ea580c" strokeWidth="2.5" opacity="0.8" />
    <rect x="24" y="26" width="112" height="108" rx="6" stroke="#f97316" strokeWidth="1" opacity="0.4" />

    {/* 3-Point Arc */}
    <path d="M30 140 V105 C30 65 52 42 80 42 C108 42 130 65 130 105 V140" stroke="#ea580c" strokeWidth="2.5" opacity="0.8" fill="none" />

    {/* The Paint / Key Lane Rectangle */}
    <rect x="58" y="80" width="44" height="60" stroke="#c2410c" strokeWidth="2" opacity="0.8" fill="#ea580c" fillOpacity="0.15" />
    {/* Free Throw Circle */}
    <circle cx="80" cy="80" r="18" stroke="#f97316" strokeWidth="2" strokeDasharray="5 3" opacity="0.8" fill="none" />
    <path d="M62 80 A18 18 0 0 0 98 80" stroke="#f97316" strokeWidth="2" opacity="0.8" fill="none" />

    {/* Restricted Area Arc & Backboard Base Marker */}
    <path d="M72 132 A8 8 0 0 1 88 132" stroke="#fdba74" strokeWidth="2" opacity="0.8" fill="none" />
    <line x1="68" y1="135" x2="92" y2="135" stroke="#ea580c" strokeWidth="3" opacity="0.9" />

    {/* Arena Overhead Jumbotron Scoreboard Silhouette */}
    <polygon points="66,16 94,16 102,28 58,28" fill="#9a3412" stroke="#fdba74" strokeWidth="1.5" opacity="0.7" />
  </svg>
);

// 9. ISOLATION ROOM: Hospital Quarantine Ward Architectural Floor Plan & Shield of Health Caduceus
export const IsolationSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Architectural Clinical Room Floorplan Outline */}
    <rect x="20" y="20" width="120" height="120" rx="8" stroke="#9333ea" strokeWidth="2.5" opacity="0.7" />
    
    {/* Room Divider Partition & Air-lock Antechamber */}
    <line x1="20" y1="70" x2="68" y2="70" stroke="#7e22ce" strokeWidth="2" strokeDasharray="5 3" opacity="0.6" />
    <line x1="92" y1="70" x2="140" y2="70" stroke="#7e22ce" strokeWidth="2" strokeDasharray="5 3" opacity="0.6" />
    {/* Door Swing Arc */}
    <path d="M68 70 A24 24 0 0 1 92 70" stroke="#c084fc" strokeWidth="1.5" opacity="0.6" fill="none" />

    {/* Bed 1 Bay & Bed 2 Bay Floor Layouts */}
    <rect x="28" y="28" width="34" height="34" rx="4" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" fill="none" />
    <rect x="98" y="28" width="34" height="34" rx="4" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" fill="none" />

    {/* Central Medical Shield of Health Sanctuary */}
    <g transform="translate(80, 105)" opacity="0.8">
      <path d="M0 -24 L24 -14 V6 C24 20 12 30 0 36 C-12 30 -24 20 -24 6 V-14 Z" fill="#6b21a8" stroke="#c084fc" strokeWidth="2" />
      {/* Swiss Medical Cross inside Shield */}
      <rect x="-4" y="-8" width="8" height="20" rx="2" fill="#ffffff" />
      <rect x="-10" y="-2" width="20" height="8" rx="2" fill="#ffffff" />
    </g>

    {/* Vital ECG Cardiac Waveform Across Bottom */}
    <path d="M22 135 L48 135 L54 122 L60 144 L66 128 L72 138 L78 135 L138 135" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
  </svg>
);

// 10. HANDOVER & TAKEOVER: Security Vault Gear Mechanism, Verification Handshake Emblem & Seal
export const HandoverSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Large Precision Vault Gear Cogwheel */}
    <g transform="translate(80, 80)" opacity="0.75">
      <circle cx="0" cy="0" r="54" stroke="#0891b2" strokeWidth="2" strokeDasharray="6 4" />
      <circle cx="0" cy="0" r="46" stroke="#06b6d4" strokeWidth="2.5" />
      {/* 8 Gear Teeth */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <rect
          key={i}
          x="-5"
          y="-58"
          width="10"
          height="14"
          rx="2"
          fill="#0891b2"
          stroke="#06b6d4"
          strokeWidth="1"
          transform={`rotate(${angle})`}
        />
      ))}
      <circle cx="0" cy="0" r="32" fill="#164e63" stroke="#22d3ee" strokeWidth="2" />
    </g>

    {/* Official Mutual Duty Handshake Crest in Center */}
    <g transform="translate(80, 80)" opacity="0.9">
      {/* Left Hand Silhouette */}
      <path d="M-28 -4 L-12 -4 L-4 4 L-12 12 L-28 8 Z" fill="#22d3ee" />
      {/* Right Hand Silhouette */}
      <path d="M28 -4 L12 -4 L4 4 L12 12 L28 8 Z" fill="#38bdf8" />
      {/* Interlocked Center Clasp */}
      <circle cx="0" cy="4" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
    </g>

    {/* Dual Security Verification Stars */}
    <path d="M30 36 L32 41 L37 42 L33 46 L34 51 L30 48 L26 51 L27 46 L23 42 L28 41 Z" fill="#22d3ee" opacity="0.7" />
    <path d="M130 36 L132 41 L137 42 L133 46 L134 51 L130 48 L126 51 L127 46 L123 42 L128 41 Z" fill="#22d3ee" opacity="0.7" />
  </svg>
);

// 11. PARCEL MONITORING: Global Cargo Transit Orbit, Flight Routes Map & Barcode Scanner Radar Grid
export const ParcelSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Global Logistics Globe Latitudes & Longitudes */}
    <circle cx="80" cy="80" r="58" stroke="#d97706" strokeWidth="2" opacity="0.7" fill="none" />
    <ellipse cx="80" cy="80" rx="34" ry="58" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5" fill="none" />
    <line x1="22" y1="80" x2="138" y2="80" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5" />
    <path d="M32 50 Q80 62 128 50" stroke="#f59e0b" strokeWidth="1.5" opacity="0.4" fill="none" />
    <path d="M32 110 Q80 98 128 110" stroke="#f59e0b" strokeWidth="1.5" opacity="0.4" fill="none" />

    {/* Orbiting Flight / Courier Transit Arcs */}
    <ellipse cx="80" cy="80" rx="68" ry="30" stroke="#ea580c" strokeWidth="2" strokeDasharray="5 3" opacity="0.75" transform="rotate(-25 80 80)" fill="none" />
    
    {/* Transit Hub Radar Waypoints */}
    <circle cx="55" cy="65" r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
    <circle cx="108" cy="72" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
    <circle cx="80" cy="115" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
    
    {/* Flight Route Curve */}
    <path d="M55 65 Q80 40 108 72" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" opacity="0.8" fill="none" />

    {/* Holographic Radar Target Crosshair */}
    <line x1="80" y1="16" x2="80" y2="24" stroke="#f59e0b" strokeWidth="2" />
    <line x1="80" y1="136" x2="80" y2="144" stroke="#f59e0b" strokeWidth="2" />
    <line x1="16" y1="80" x2="24" y2="80" stroke="#f59e0b" strokeWidth="2" />
    <line x1="136" y1="80" x2="144" y2="80" stroke="#f59e0b" strokeWidth="2" />
  </svg>
);

// 12. LOST & FOUND: Archival Repository Vault Locker Grid & Nautical Discovery Compass Rose
export const LostFoundSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* 4x3 Archival Storage Locker Matrix Grid */}
    <rect x="22" y="24" width="116" height="112" rx="8" stroke="#047857" strokeWidth="2.5" opacity="0.75" />
    {/* Grid Lines */}
    <line x1="51" y1="24" x2="51" y2="136" stroke="#059669" strokeWidth="1.5" opacity="0.6" />
    <line x1="80" y1="24" x2="80" y2="136" stroke="#059669" strokeWidth="1.5" opacity="0.6" />
    <line x1="109" y1="24" x2="109" y2="136" stroke="#059669" strokeWidth="1.5" opacity="0.6" />
    <line x1="22" y1="61" x2="138" y2="61" stroke="#059669" strokeWidth="1.5" opacity="0.6" />
    <line x1="22" y1="99" x2="138" y2="99" stroke="#059669" strokeWidth="1.5" opacity="0.6" />

    {/* Locker Keyholes */}
    {[36, 65, 94, 123].map((x) =>
      [42, 80, 117].map((y) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#10b981" opacity="0.5" />
      ))
    )}

    {/* Center Discovery Compass Rose */}
    <g transform="translate(80, 80)" opacity="0.85">
      <circle cx="0" cy="0" r="28" stroke="#34d399" strokeWidth="2" fill="#064e3b" fillOpacity="0.8" />
      {/* 4 Primary Compass Points */}
      <polygon points="0,-24 4,-6 0,0 -4,-6" fill="#ef4444" />
      <polygon points="0,24 4,6 0,0 -4,6" fill="#e2e8f0" />
      <polygon points="24,0 6,4 0,0 6,-4" fill="#e2e8f0" />
      <polygon points="-24,0 -6,4 0,0 -6,-4" fill="#e2e8f0" />
      <circle cx="0" cy="0" r="4" fill="#fbbf24" />
      {/* North Cardinal Letter */}
      <text x="0" y="-12" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">N</text>
    </g>
  </svg>
);

// 13. BLANK FORMS: Official Certificate Guilloche Rosette Ribbon & Legal Registry Seal
export const BlankFormsSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Ornate Legal Guilloche Rosette Border */}
    <g transform="translate(80, 75)" opacity="0.75">
      <circle cx="0" cy="0" r="54" stroke="#2563eb" strokeWidth="2" strokeDasharray="5 3" />
      <circle cx="0" cy="0" r="46" stroke="#1d4ed8" strokeWidth="2" />
      {/* 16 Scalloped Rosette Petals */}
      {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map(
        (angle, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-46"
            rx="7"
            ry="4"
            fill="#3b82f6"
            opacity="0.5"
            transform={`rotate(${angle})`}
          />
        )
      )}
      <circle cx="0" cy="0" r="38" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="30" stroke="#93c5fd" strokeWidth="1" strokeDasharray="3 2" />
      
      {/* Official Registry Star Emblem */}
      <path d="M0 -18 L4 -6 L16 -6 L7 2 L10 14 L0 7 L-10 14 L-7 2 L-16 -6 L-4 -6 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
    </g>

    {/* Dual Ceremonial Blue Ribbons Hanging Below Seal */}
    <g opacity="0.8">
      <polygon points="68,110 60,150 72,142 80,150 76,110" fill="#1d4ed8" stroke="#3b82f6" strokeWidth="1.5" />
      <polygon points="84,110 80,150 88,142 100,150 92,110" fill="#2563eb" stroke="#60a5fa" strokeWidth="1.5" />
    </g>
  </svg>
);

// 14. INVOICE MANAGER: Financial Treasury Scales of Justice & Banking Classical Temple Pediment
export const InvoiceSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Classical Treasury / Central Bank Facade Silhouette */}
    <polygon points="20,44 80,18 140,44" fill="#047857" stroke="#10b981" strokeWidth="2" opacity="0.7" />
    <rect x="18" y="44" width="124" height="8" rx="2" fill="#065f46" stroke="#34d399" strokeWidth="1.5" opacity="0.7" />
    {/* 4 Pillars */}
    <rect x="28" y="52" width="10" height="74" fill="#047857" opacity="0.5" />
    <rect x="58" y="52" width="10" height="74" fill="#047857" opacity="0.5" />
    <rect x="92" y="52" width="10" height="74" fill="#047857" opacity="0.5" />
    <rect x="122" y="52" width="10" height="74" fill="#047857" opacity="0.5" />
    <rect x="16" y="126" width="128" height="10" rx="2" fill="#065f46" stroke="#10b981" strokeWidth="2" opacity="0.8" />

    {/* Financial Scales of Balanced Justice in Foreground */}
    <g transform="translate(80, 82)" opacity="0.85">
      {/* Central Brass Fulcrum Mast */}
      <line x1="0" y1="-30" x2="0" y2="28" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      <circle cx="0" cy="-30" r="4.5" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
      {/* Horizontal Crossbeam */}
      <line x1="-34" y1="-22" x2="34" y2="-22" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Left Pan */}
      <line x1="-34" y1="-22" x2="-44" y2="2" stroke="#d97706" strokeWidth="1.5" />
      <line x1="-34" y1="-22" x2="-24" y2="2" stroke="#d97706" strokeWidth="1.5" />
      <path d="M-48 2 Q-34 14 -20 2 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />

      {/* Right Pan */}
      <line x1="34" y1="-22" x2="24" y2="2" stroke="#d97706" strokeWidth="1.5" />
      <line x1="34" y1="-22" x2="44" y2="2" stroke="#d97706" strokeWidth="1.5" />
      <path d="M20 2 Q34 14 48 2 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
    </g>
  </svg>
);

// 15. ANNOUNCEMENT: Broadcast Transmission Antenna Tower with Concentric Radio Waves & Heraldic Banner
export const AnnouncementSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Concentric Broadcasting Electromagnetic Radio Waves */}
    <circle cx="80" cy="40" r="24" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" opacity="0.8" fill="none" />
    <circle cx="80" cy="40" r="40" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" fill="none" />
    <circle cx="80" cy="40" r="58" stroke="#d97706" strokeWidth="1.5" strokeDasharray="7 5" opacity="0.4" fill="none" />

    {/* Lattice Transmission Antenna Tower */}
    <g opacity="0.85">
      {/* Main Legs */}
      <line x1="80" y1="38" x2="48" y2="140" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="38" x2="112" y2="140" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      {/* Cross Lattice Bracing */}
      <line x1="72" y1="62" x2="88" y2="62" stroke="#f59e0b" strokeWidth="2" />
      <line x1="64" y1="88" x2="96" y2="88" stroke="#f59e0b" strokeWidth="2" />
      <line x1="56" y1="114" x2="104" y2="114" stroke="#f59e0b" strokeWidth="2.5" />
      
      <line x1="72" y1="62" x2="96" y2="88" stroke="#f59e0b" strokeWidth="1.5" />
      <line x1="88" y1="62" x2="64" y2="88" stroke="#f59e0b" strokeWidth="1.5" />
      <line x1="64" y1="88" x2="104" y2="114" stroke="#f59e0b" strokeWidth="1.5" />
      <line x1="96" y1="88" x2="56" y2="114" stroke="#f59e0b" strokeWidth="1.5" />

      {/* Red Beacon Beacon Light */}
      <circle cx="80" cy="36" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
      <line x1="80" y1="18" x2="80" y2="30" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="80" cy="18" r="3" fill="#fef08a" />
    </g>

    {/* Heraldic Announcement Wings on Base */}
    <path d="M30 135 Q50 120 70 135" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M130 135 Q110 120 90 135" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// 16. HELP & SUPPORT: Majestic Guiding Lighthouse on Coastal Rocks with Radiant Light Beams
export const HelpSupportSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* 360-Degree Radiating Beacon Compass Star */}
    <circle cx="80" cy="50" r="50" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" fill="none" />
    <circle cx="80" cy="50" r="32" stroke="#14b8a6" strokeWidth="1.5" opacity="0.5" fill="none" />

    {/* Radiant Dual Light Beams Sweeping Across Background */}
    <polygon points="80,50 10,18 10,48" fill="#fef08a" opacity="0.25" />
    <polygon points="80,50 150,18 150,48" fill="#fef08a" opacity="0.25" />
    <line x1="80" y1="50" x2="10" y2="18" stroke="#fde047" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
    <line x1="80" y1="50" x2="150" y2="18" stroke="#fde047" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

    {/* Coastal Lighthouse Architecture */}
    <g opacity="0.85">
      {/* Stone Foundation Rocks */}
      <path d="M40 144 Q80 136 120 144" stroke="#0f766e" strokeWidth="5" strokeLinecap="round" />
      {/* Tapering Tower */}
      <polygon points="72,58 88,58 94,136 66,136" fill="#0f766e" stroke="#14b8a6" strokeWidth="2" />
      {/* Red Stripes on Tower */}
      <polygon points="70,80 90,80 91,96 69,96" fill="#f97316" />
      <polygon points="68,112 92,112 93,126 67,126" fill="#f97316" />

      {/* Observation Balcony */}
      <rect x="68" y="54" width="24" height="4" rx="1" fill="#2dd4bf" />
      {/* Lantern Room & Glowing Dome */}
      <rect x="73" y="44" width="14" height="10" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <path d="M72 44 Q80 34 88 44 Z" fill="#0d9488" stroke="#14b8a6" strokeWidth="1.5" />
      <circle cx="80" cy="34" r="2" fill="#f59e0b" />
    </g>
  </svg>
);

// 17. TICKET MANAGEMENT: Architectural Turnstile Concourse, Access Portal Arches & Ticketing Gateway
export const TicketSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Architectural Gateway Arch */}
    <path d="M25 145 V55 C25 25 50 15 80 15 C110 15 135 25 135 55 V145" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" opacity="0.45" />
    <path d="M35 145 V58 C35 32 55 24 80 24 C105 24 125 32 125 58 V145" stroke="#2563eb" strokeWidth="1.5" opacity="0.3" />
    {/* Concourse Floor Radial Grid */}
    <ellipse cx="80" cy="140" rx="60" ry="16" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
    <ellipse cx="80" cy="140" rx="40" ry="10" stroke="#93c5fd" strokeWidth="1" opacity="0.3" />
    {/* Turnstile Access Stanchions */}
    <g transform="translate(80, 85)" opacity="0.75">
      <rect x="-42" y="-15" width="14" height="48" rx="4" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" />
      <rect x="-7" y="-18" width="14" height="52" rx="4" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
      <rect x="28" y="-15" width="14" height="48" rx="4" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" />
      {/* Barrier Swing Arms */}
      <line x1="-35" y1="4" x2="-7" y2="4" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
      <line x1="7" y1="4" x2="35" y2="4" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
      {/* Optical Sensor Glows */}
      <circle cx="-35" cy="-8" r="2.5" fill="#38bdf8" />
      <circle cx="0" cy="-11" r="2.5" fill="#38bdf8" />
      <circle cx="35" cy="-8" r="2.5" fill="#38bdf8" />
    </g>
    {/* Digital Transit Gate Display Lines */}
    <line x1="45" y1="42" x2="115" y2="42" stroke="#60a5fa" strokeWidth="2" strokeDasharray="3 3" opacity="0.5" />
  </svg>
);

// 18. SLA MANAGEMENT: Chronological Blueprint Dial, Response Perimeter Rings & Precision Grid
export const SLASticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Concentric Precision Radar Coordinates */}
    <circle cx="80" cy="80" r="68" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
    <circle cx="80" cy="80" r="52" stroke="#7c3aed" strokeWidth="2" opacity="0.3" />
    <circle cx="80" cy="80" r="36" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.4" />
    <circle cx="80" cy="80" r="20" stroke="#c4b5fd" strokeWidth="1" opacity="0.3" />
    {/* Quadrant Crosshairs */}
    <line x1="80" y1="10" x2="80" y2="150" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
    <line x1="10" y1="80" x2="150" y2="80" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
    {/* 45 Degree Diagonal Marks */}
    <line x1="32" y1="32" x2="128" y2="128" stroke="#a78bfa" strokeWidth="1" strokeDasharray="3 3" opacity="0.25" />
    <line x1="32" y1="128" x2="128" y2="32" stroke="#a78bfa" strokeWidth="1" strokeDasharray="3 3" opacity="0.25" />
    {/* Target Calibrations & Hour Markers */}
    <g opacity="0.6">
      <circle cx="80" cy="12" r="3" fill="#7c3aed" />
      <circle cx="148" cy="80" r="3" fill="#7c3aed" />
      <circle cx="80" cy="148" r="3" fill="#7c3aed" />
      <circle cx="12" cy="80" r="3" fill="#7c3aed" />
    </g>
  </svg>
);

// 19. AUTOMATED WORKFLOW: Circuit Matrix Pipeline, Logic Nodes & Orchestration Pathways
export const WorkflowSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Circuit Bus Network Lines */}
    <path d="M20 40 H70 L95 65 H140" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5 3" opacity="0.5" />
    <path d="M20 120 H65 L90 95 H140" stroke="#0891b2" strokeWidth="2" strokeDasharray="5 3" opacity="0.5" />
    <path d="M40 20 V60 L60 80 V140" stroke="#0284c7" strokeWidth="1.5" opacity="0.35" />
    <path d="M120 20 V70 L100 90 V140" stroke="#0284c7" strokeWidth="1.5" opacity="0.35" />
    {/* Logic Pipeline Diamonds & Junction Nodes */}
    <g opacity="0.65">
      <polygon points="70,40 80,30 90,40 80,50" fill="#0891b2" stroke="#67e8f9" strokeWidth="1.5" />
      <polygon points="70,120 80,110 90,120 80,130" fill="#0891b2" stroke="#67e8f9" strokeWidth="1.5" />
      <polygon points="80,80 95,65 110,80 95,95" fill="#0e7490" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="80" cy="80" r="4" fill="#a5f3fc" />
      {/* Corner Terminal Pads */}
      <circle cx="20" cy="40" r="4" fill="#06b6d4" />
      <circle cx="140" cy="65" r="4" fill="#06b6d4" />
      <circle cx="20" cy="120" r="4" fill="#0891b2" />
      <circle cx="140" cy="95" r="4" fill="#0891b2" />
    </g>
  </svg>
);

// 20. EMAIL MANAGEMENT: Global Postal Routing Map, Flight Corridors & Orbital Communications
export const EmailSticker: React.FC<StickerProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Globe Latitude & Longitude Arcs */}
    <ellipse cx="80" cy="80" rx="68" ry="68" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
    <ellipse cx="80" cy="80" rx="68" ry="26" stroke="#fb7185" strokeWidth="1.5" opacity="0.35" />
    <ellipse cx="80" cy="80" rx="26" ry="68" stroke="#fb7185" strokeWidth="1.5" opacity="0.35" />
    {/* Flight Route Curved Dashed Lines */}
    <path d="M22 65 Q80 20 138 65" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
    <path d="M22 95 Q80 140 138 95" stroke="#e11d48" strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
    {/* Airport / Postal Hub Dots */}
    <g opacity="0.7">
      <circle cx="45" cy="50" r="3.5" fill="#e11d48" />
      <circle cx="115" cy="50" r="3.5" fill="#e11d48" />
      <circle cx="80" cy="80" r="4.5" fill="#be123c" />
      <circle cx="45" cy="110" r="3.5" fill="#e11d48" />
      <circle cx="115" cy="110" r="3.5" fill="#e11d48" />
    </g>
  </svg>
);

// Master Helper to get Facility Sticker
export const getFacilitySticker = (facilityId: string, className = 'w-full h-full') => {
  switch (facilityId) {
    case 'barber-booking':
      return <BarberSticker className={className} />;
    case 'cricket-ground':
      return <CricketSticker className={className} />;
    case 'football-ground':
      return <FootballSticker className={className} />;
    case 'multipurpose-room':
      return <MultipurposeSticker className={className} />;
    case 'cinema':
      return <CinemaSticker className={className} />;
    case 'tennis-court':
      return <TennisSticker className={className} />;
    case 'cricket-net':
      return <CricketNetSticker className={className} />;
    case 'basketball-court':
      return <BasketballSticker className={className} />;
    case 'isolation-room':
      return <IsolationSticker className={className} />;
    case 'handover-takenover':
      return <HandoverSticker className={className} />;
    case 'parcel-monitoring':
      return <ParcelSticker className={className} />;
    case 'lost-and-found':
      return <LostFoundSticker className={className} />;
    case 'blank-forms':
      return <BlankFormsSticker className={className} />;
    case 'invoice-manager':
      return <InvoiceSticker className={className} />;
    case 'announcement-notice':
      return <AnnouncementSticker className={className} />;
    case 'help-support':
      return <HelpSupportSticker className={className} />;
    case 'ticket-management':
      return <TicketSticker className={className} />;
    case 'sla-management':
      return <SLASticker className={className} />;
    case 'automated-workflow':
      return <WorkflowSticker className={className} />;
    case 'email-management':
      return <EmailSticker className={className} />;
    default:
      return <CricketSticker className={className} />;
  }
};
