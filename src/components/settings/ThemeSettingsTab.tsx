import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Check,
  RotateCcw,
  Sliders,
  Type,
  Maximize2,
  Volume2,
  VolumeX,
  Eye,
  Layers,
  Crown,
  Share2,
  Compass,
  Laptop,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { THEME_PRESETS, COLOR_PALETTE_SWATCHES } from '../../data/themePresets';
import { ThemePreset, ThemeFontFamily, ThemeBorderRadius, ThemeGlowIntensity, ThemeUiDensity, ThemeMode } from '../../types';

interface ThemeSettingsTabProps {
  onShowFeedback?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ThemeSettingsTab: React.FC<ThemeSettingsTabProps> = ({ onShowFeedback }) => {
  const { customTheme, setCustomTheme, applyPreset, resetTheme, activePreset } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customHexInput, setCustomHexInput] = useState(customTheme.primaryColor);

  const categories = ['All', 'Enterprise', 'Heritage', 'Luxury VIP', 'Cyber & Tech', 'Nature & Warmth'];

  const filteredPresets = selectedCategory === 'All'
    ? THEME_PRESETS
    : THEME_PRESETS.filter((p) => p.category === selectedCategory);

  const handleApplyPreset = (preset: ThemePreset) => {
    applyPreset(preset.id);
    onShowFeedback?.(`Theme changed to '${preset.name}'!`, 'success');
  };

  const handleCustomColorChange = (hex: string) => {
    setCustomHexInput(hex);
    const matched = COLOR_PALETTE_SWATCHES.find((s) => s.hex.toLowerCase() === hex.toLowerCase());
    if (matched) {
      setCustomTheme({
        primaryColor: matched.hex,
        primaryHover: matched.hover,
        primaryRgb: matched.rgb,
        accentColor: matched.accent,
        accentRgb: matched.accentRgb,
        gradient: matched.gradient,
      });
    } else {
      let r = 2, g = 132, b = 199;
      if (/^#[0-9A-F]{6}$/i.test(hex)) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      }
      setCustomTheme({
        primaryColor: hex,
        primaryHover: hex,
        primaryRgb: `${r}, ${g}, ${b}`,
      });
    }
  };

  const handleRandomTheme = () => {
    const randomPreset = THEME_PRESETS[Math.floor(Math.random() * THEME_PRESETS.length)];
    applyPreset(randomPreset.id);
    onShowFeedback?.(`Random theme applied: '${randomPreset.name}'!`, 'info');
  };

  const handleResetTheme = () => {
    resetTheme();
    onShowFeedback?.('Theme reset to default Tamimi Royal Blue.', 'info');
  };

  const fonts: { id: ThemeFontFamily; label: string; desc: string; sample: string }[] = [
    { id: 'plus-jakarta', label: 'Plus Jakarta Sans', desc: 'Executive & Elegant', sample: 'Aa Bb 123' },
    { id: 'inter', label: 'Inter Clean', desc: 'Technical & Crisp', sample: 'Aa Bb 123' },
    { id: 'outfit', label: 'Outfit Display', desc: 'Geometric & Modern', sample: 'Aa Bb 123' },
    { id: 'poppins', label: 'Poppins Rounded', desc: 'Bold & Friendly', sample: 'Aa Bb 123' },
    { id: 'jetbrains', label: 'JetBrains Mono', desc: 'Cyber Monospace', sample: 'Aa Bb 123' },
  ];

  const radii: { id: ThemeBorderRadius; label: string; desc: string }[] = [
    { id: 'sharp', label: 'Sharp Corner', desc: 'Tactical 4px edges' },
    { id: 'normal', label: 'Standard', desc: 'Balanced 12px edges' },
    { id: 'rounded', label: 'Modern Smooth', desc: 'Executive 16px radius' },
    { id: 'soft', label: 'Ultra Soft', desc: 'Pillow 24px curves' },
  ];

  const glowOptions: { id: ThemeGlowIntensity; label: string; desc: string }[] = [
    { id: 'none', label: 'Clean Flat', desc: 'No ambient shadows' },
    { id: 'subtle', label: 'Subtle Executive', desc: 'Soft focused aura' },
    { id: 'vibrant', label: 'Cyber Vibrant', desc: 'High-intensity neon glow' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Clean, Integrated Top Header Bar (Matching Native Modal Theme) */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Theme &amp; Template Customizer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transform the full visual style, colors, dark modes, typography, and card geometry across the entire system.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Active Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div
              className="w-3 h-3 rounded-full shadow-xs"
              style={{ backgroundColor: customTheme.primaryColor }}
            />
            <span>Active: <strong className="text-slate-900 dark:text-white">{activePreset?.name || 'Custom'}</strong></span>
            <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] uppercase font-black">
              {customTheme.mode}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRandomTheme}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-xs"
            title="Surprise with a random theme"
          >
            <Compass className="w-4 h-4 text-amber-500" />
            <span>Random Preset</span>
          </button>

          <button
            type="button"
            onClick={handleResetTheme}
            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-xs"
            title="Reset to default theme"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* Preset Filter Categories */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Master Theme Presets ({THEME_PRESETS.length} Curated Styles)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any template to immediately transform all screens, headers, buttons, cards, and accent colors.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-102'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4.5">
          {filteredPresets.map((preset) => {
            const isCurrent = customTheme.presetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`group relative rounded-2xl border-2 p-4 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-white dark:bg-slate-900 border-sky-500 dark:border-sky-400 shadow-xl ring-2 ring-sky-500/20 scale-[1.01]'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                <div>
                  {/* Active Selection Badge */}
                  {isCurrent && (
                    <div className="absolute top-3 right-3 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-500 text-white text-[10px] font-black shadow-md shadow-sky-500/30">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>ACTIVE</span>
                    </div>
                  )}

                  {/* Preset Header */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: preset.primaryColor }}
                    >
                      <Palette className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 pr-14">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {preset.subtitle}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                          {preset.category}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[9px] font-black text-white"
                          style={{ backgroundColor: preset.primaryColor }}
                        >
                          {preset.mode.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Color Swatch Bars */}
                  <div className="flex items-center space-x-1.5 mb-3">
                    {preset.previewColors.map((col, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-3.5 rounded-full shadow-inner ring-1 ring-black/10"
                        style={{ backgroundColor: col }}
                        title={col}
                      />
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3.5">
                    {preset.description}
                  </p>
                </div>

                <div>
                  {/* Distinctive UI Theme Preview Widget */}
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-2 mb-3 shadow-inner ${
                      preset.id === 'cyber-neon'
                        ? 'bg-slate-950 border-cyan-500/40 text-cyan-200 font-mono shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                        : preset.id === 'imperial-gold'
                        ? 'bg-zinc-950 border-amber-500/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : preset.id === 'obsidian-amoled'
                        ? 'bg-black border-zinc-800 text-zinc-100'
                        : preset.id === 'emerald-oasis'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                        : preset.id === 'redsea-sunset'
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                        : preset.id === 'arctic-frost'
                        ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800 text-cyan-950 dark:text-cyan-100 backdrop-blur-md'
                        : preset.id === 'galactic-nebula'
                        ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-100 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                        : preset.id === 'desert-sunset'
                        ? 'bg-stone-900 border-orange-500/40 text-orange-100'
                        : preset.id === 'sage-zen'
                        ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 text-teal-950 dark:text-teal-100'
                        : preset.mode === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] tracking-wide">
                        {preset.id === 'cyber-neon' ? 'SYSTEM_HUD' : preset.id === 'imperial-gold' ? 'VIP SUITE' : 'UI PREVIEW'}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-black text-white shadow-xs"
                        style={{ backgroundColor: preset.primaryColor }}
                      >
                        Active
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="flex-1 py-1.5 rounded-lg text-center text-[10px] font-black text-white shadow-xs"
                        style={{ backgroundColor: preset.primaryColor }}
                      >
                        Book Slot
                      </div>
                      <div
                        className="px-2.5 py-1.5 rounded-lg text-center text-[10px] font-bold border"
                        style={{ borderColor: preset.accentColor, color: preset.accentColor }}
                      >
                        Details
                      </div>
                    </div>
                  </div>

                  {/* Action Trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyPreset(preset);
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 ${
                      isCurrent
                        ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 border border-sky-300 dark:border-sky-700 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Current Active</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Apply Template</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Studio Customization Section */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-7">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-sky-500" />
            <span>Theme Studio · Fine-Tuning &amp; Typography</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fine-tune every visual dimension including primary accent color, dark mode intensity, typography font family, and card corner smoothness.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Mode & Primary Colors */}
          <div className="space-y-6">
            {/* Display Mode Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                1. Display Mode
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'light' as ThemeMode, label: 'Day Light', icon: Sun, desc: 'Clean White' },
                  { id: 'dark' as ThemeMode, label: 'Night Dark', icon: Moon, desc: 'Slate Velvet' },
                  { id: 'amoled' as ThemeMode, label: 'OLED AMOLED', icon: Zap, desc: 'Pure Black' },
                ].map((modeOpt) => {
                  const Icon = modeOpt.icon;
                  const isSel = customTheme.mode === modeOpt.id;
                  return (
                    <button
                      key={modeOpt.id}
                      type="button"
                      onClick={() => setCustomTheme({ mode: modeOpt.id })}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        isSel
                          ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 shadow-md ring-1 ring-sky-500/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-4 h-4 ${isSel ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                        {isSel && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                      </div>
                      <p className="text-xs font-black leading-tight">{modeOpt.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{modeOpt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Brand Palette Swatches */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  2. Primary Brand Color
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{customHexInput}</span>
                  <input
                    type="color"
                    value={customHexInput}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-6 h-6 rounded-lg cursor-pointer border-0 bg-transparent"
                    title="Choose custom hex color"
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {COLOR_PALETTE_SWATCHES.map((swatch) => {
                  const isSelected = customTheme.primaryColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      onClick={() => handleCustomColorChange(swatch.hex)}
                      className={`p-2 rounded-xl border-2 flex flex-col items-center space-y-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 dark:border-white shadow-lg scale-105'
                          : 'border-slate-200 dark:border-slate-800 hover:scale-102'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg shadow-sm flex items-center justify-center text-white"
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                        {swatch.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Typography Font Family Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                3. Font Family
              </label>
              <div className="space-y-2">
                {fonts.map((f) => {
                  const isSel = customTheme.fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCustomTheme({ fontFamily: f.id })}
                      className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                        isSel
                          ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 text-left">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-300">
                          <Type className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{f.label}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{f.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 hidden sm:inline">{f.sample}</span>
                        {isSel && <Check className="w-4 h-4 text-sky-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Geometry, Glows & Live Preview */}
          <div className="space-y-6">
            {/* Border Radius & Smoothness */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                4. Corner Radius
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {radii.map((r) => {
                  const isSel = customTheme.borderRadius === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setCustomTheme({ borderRadius: r.id })}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                        isSel
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-black">{r.label}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{r.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Glow Intensity & Frosted Glass */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                5. Lighting Glow &amp; Glassmorphism
              </label>
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {glowOptions.map((g) => {
                  const isSel = customTheme.glowIntensity === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setCustomTheme({ glowIntensity: g.id })}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                        isSel
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <p className="text-xs font-black">{g.label}</p>
                      <p className="text-[9px] text-slate-400">{g.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Glass Blur Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2.5">
                  <Layers className="w-4 h-4 text-sky-500" />
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Frosted Glass Blur Effect</p>
                    <p className="text-[10px] text-slate-500">Backdrop-filter blur behind cards and modal frames</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomTheme({ glassBlur: !customTheme.glassBlur })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    customTheme.glassBlur ? 'bg-sky-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>

            {/* Sound & Celebration Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Audio Cues</p>
                    <p className="text-[10px] text-slate-500">Click &amp; booking sounds</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomTheme({ soundEffectsEnabled: !customTheme.soundEffectsEnabled })}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    customTheme.soundEffectsEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Confetti FX</p>
                    <p className="text-[10px] text-slate-500">Booking voucher burst</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomTheme({ confettiEnabled: !customTheme.confettiEnabled })}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    customTheme.confettiEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>

            {/* Live Interactive Sandbox Card */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-500" />
                  <span>Real-Time Sandbox Preview</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Live Rendered</span>
              </div>

              {/* Sample Slot Item */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-slate-900 dark:text-white">Triple Bay Football Stadium</p>
                  <p className="text-[10px] text-slate-500">20:00 - 21:00 · Slot #04</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: customTheme.primaryColor }}
                  >
                    Reserved
                  </span>
                </div>
              </div>

              {/* Sample Interactive Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer text-center"
                  style={{ backgroundColor: customTheme.primaryColor }}
                  onClick={() => onShowFeedback?.('Theme test button clicked successfully!', 'success')}
                >
                  Primary Action
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer text-center bg-white dark:bg-slate-800"
                  style={{ borderColor: customTheme.primaryColor, color: customTheme.primaryColor }}
                  onClick={() => onShowFeedback?.('Secondary accent button test clicked!', 'info')}
                >
                  Outline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
