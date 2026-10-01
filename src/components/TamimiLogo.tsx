import React, { useState } from 'react';
import { TAMIMI_LOGO_DATA_URL } from '../data/tamimiLogoBase64';

export const TAMIMI_LOCAL_IMAGE = `${import.meta.env.BASE_URL}images/tamimi-logo.png`;
export const TAMIMI_CDN_IMAGE = 'https://plain-eeur-prod-public.komododecks.com/202608/31/3ApmrfD8CZImEixpibgo/image.png';
export { TAMIMI_LOGO_DATA_URL };

export const TAMIMI_SVG_MARKUP = `<svg width="240" height="170" viewBox="0 0 240 170" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
  <defs>
    <linearGradient id="tamimiGoldGlobe" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DFC37A" />
      <stop offset="30%" stop-color="#F5E4A8" />
      <stop offset="60%" stop-color="#D4AF57" />
      <stop offset="85%" stop-color="#BA923C" />
      <stop offset="100%" stop-color="#E2C982" />
    </linearGradient>
    <linearGradient id="tamimiGoldBanner" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C9A64E" />
      <stop offset="40%" stop-color="#EED993" />
      <stop offset="80%" stop-color="#BA9138" />
      <stop offset="100%" stop-color="#DEC278" />
    </linearGradient>
  </defs>
  <ellipse cx="120" cy="75" rx="116" ry="72" fill="url(#tamimiGoldGlobe)" stroke="#111111" stroke-width="3.8" />
  <line x1="120" y1="3" x2="120" y2="147" stroke="#111111" stroke-width="2.2" />
  <ellipse cx="120" cy="75" rx="84" ry="72" stroke="#111111" stroke-width="2" fill="none" />
  <ellipse cx="120" cy="75" rx="44" ry="72" stroke="#111111" stroke-width="2" fill="none" />
  <path d="M 5 75 Q 120 75 235 75" stroke="#111111" stroke-width="2.4" fill="none" />
  <path d="M 12 45 Q 120 45 228 45" stroke="#111111" stroke-width="2.2" fill="none" />
  <path d="M 12 105 Q 120 105 228 105" stroke="#111111" stroke-width="2.2" fill="none" />
  <path d="M 28 116 L 28 152 Q 120 166 212 152 L 212 116 Z" fill="url(#tamimiGoldBanner)" stroke="#111111" stroke-width="3.6" />
  <text x="120" y="145" fill="#111111" font-size="22" font-weight="bold" font-family="'Times New Roman', Times, Georgia, serif" text-anchor="middle" letter-spacing="0.6">
    Tamimi Global
  </text>
  <g transform="translate(48, 22)">
    <path d="M 124 16 C 122 10 114 8 108 14 C 102 20 100 28 94 36 C 90 41 84 43 78 40 C 72 37 70 30 64 26 C 58 22 50 24 44 30 C 40 34 38 41 32 44 C 26 47 18 45 14 38 C 10 32 12 24 16 18 C 17 16 14 14 11 16 C 6 24 4 36 10 44 C 16 52 28 54 36 49 C 42 45 46 38 52 34 C 56 31 62 31 66 35 C 72 41 74 49 82 52 C 90 55 98 51 104 44 C 112 34 118 24 126 18 Z" fill="#111111" />
    <circle cx="106" cy="10" r="3.2" fill="#111111" />
    <path d="M 68 18 Q 72 12 78 15" stroke="#111111" stroke-width="2.8" stroke-linecap="round" fill="none" />
    <path d="M 88 16 Q 92 10 98 13" stroke="#111111" stroke-width="2.8" stroke-linecap="round" fill="none" />
    <path d="M 22 14 Q 28 10 32 14" stroke="#111111" stroke-width="2.8" stroke-linecap="round" fill="none" />
    <circle cx="28" cy="54" r="2.8" fill="#111111" />
    <circle cx="36" cy="54" r="2.8" fill="#111111" />
  </g>
  <g transform="translate(62, 75)">
    <line x1="12" y1="4" x2="114" y2="4" stroke="#111111" stroke-width="2.8" stroke-linecap="square" />
    <g>
      <rect x="2" y="4" width="14" height="26" fill="#111111" />
      <rect x="0" y="4" width="18" height="6" fill="#111111" />
      <line x1="5" y1="10" x2="5" y2="30" stroke="#DFC37A" stroke-width="1.2" />
      <line x1="9" y1="10" x2="9" y2="30" stroke="#DFC37A" stroke-width="1.2" />
      <line x1="13" y1="10" x2="13" y2="30" stroke="#DFC37A" stroke-width="1.2" />
    </g>
    <text x="28" y="28" fill="#111111" font-size="26" font-weight="900" font-family="'Arial Black', 'Impact', sans-serif" letter-spacing="-0.5">A</text>
    <g transform="translate(48, 8)">
      <text x="0" y="20" fill="#111111" font-size="24" font-weight="900" font-family="'Arial Black', 'Impact', sans-serif">M</text>
      <line x1="3" y1="4" x2="3" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="7" y1="4" x2="7" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="14" y1="4" x2="14" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="18" y1="4" x2="18" y2="20" stroke="#DFC37A" stroke-width="1" />
    </g>
    <text x="74" y="28" fill="#111111" font-size="26" font-weight="900" font-family="'Arial Black', 'Impact', sans-serif">I</text>
    <g transform="translate(84, 8)">
      <text x="0" y="20" fill="#111111" font-size="24" font-weight="900" font-family="'Arial Black', 'Impact', sans-serif">M</text>
      <line x1="3" y1="4" x2="3" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="7" y1="4" x2="7" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="14" y1="4" x2="14" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="18" y1="4" x2="18" y2="20" stroke="#DFC37A" stroke-width="1" />
    </g>
    <text x="110" y="28" fill="#111111" font-size="26" font-weight="900" font-family="'Arial Black', 'Impact', sans-serif">I</text>
  </g>
</svg>`;

interface TamimiLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'image' | 'inline' | 'compact';
}

export const TamimiLogo: React.FC<TamimiLogoProps> = ({
  className = '',
  size = 68,
  showText = false,
}) => {
  const [srcIndex, setSrcIndex] = useState(0);
  // TAMIMI_LOGO_DATA_URL is the embedded official PNG from the login page, guaranteed to load instantly
  const sources = [TAMIMI_LOGO_DATA_URL, TAMIMI_LOCAL_IMAGE, TAMIMI_CDN_IMAGE];

  // Maintain crisp aspect ratio (approx 240:170 ~ 1.41:1)
  const calculatedHeight = Math.round((size * 170) / 240);

  const handleImageError = () => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex(srcIndex + 1);
    } else {
      setSrcIndex(sources.length); // Fallback to SVG
    }
  };

  return (
    <div className={`inline-flex items-center space-x-3 shrink-0 bg-transparent select-none ${className}`}>
      {srcIndex < sources.length ? (
        <img
          src={sources[srcIndex]}
          alt="Tamimi Global Logo"
          width={size}
          height={calculatedHeight}
          referrerPolicy="no-referrer"
          loading="eager"
          onError={handleImageError}
          className="shrink-0 select-none object-contain transition-transform duration-300 hover:scale-105 filter drop-shadow-xs"
          style={{
            width: `${size}px`,
            height: `${calculatedHeight}px`,
            maxWidth: `${size}px`,
            maxHeight: `${calculatedHeight}px`,
          }}
        />
      ) : (
        <div
          style={{ width: `${size}px`, height: `${calculatedHeight}px` }}
          dangerouslySetInnerHTML={{
            __html: TAMIMI_SVG_MARKUP.replace(
              '<svg ',
              `<svg width="${size}" height="${calculatedHeight}" `
            ),
          }}
        />
      )}

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center space-x-1.5">
            <span className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
              TAMIMI Global
            </span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              TAFGA
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide mt-0.5">
            Camp &amp; Facility Operations
          </span>
        </div>
      )}
    </div>
  );
};

