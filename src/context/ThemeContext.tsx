import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, CustomThemeConfig, ThemePreset } from '../types';
import { THEME_PRESETS, DEFAULT_THEME_CONFIG } from '../data/themePresets';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'amoled';
  customTheme: CustomThemeConfig;
  activePreset: ThemePreset | undefined;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'amoled') => void;
  setCustomTheme: (config: Partial<CustomThemeConfig>) => void;
  applyPreset: (presetId: string) => void;
  resetTheme: () => void;
}

const THEME_STORAGE_KEY = 'tamimi_portal_custom_theme_v2';
const LEGACY_THEME_KEY = 'tamimi_portal_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customTheme, setCustomThemeState] = useState<CustomThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_THEME_CONFIG, ...parsed };
      }
      const legacy = localStorage.getItem(LEGACY_THEME_KEY);
      if (legacy === 'dark') {
        return { ...DEFAULT_THEME_CONFIG, mode: 'dark' };
      }
      return DEFAULT_THEME_CONFIG;
    } catch {
      return DEFAULT_THEME_CONFIG;
    }
  });

  const activePreset = THEME_PRESETS.find((p) => p.id === customTheme.presetId) || THEME_PRESETS[0];

  // Apply theme to DOM and CSS custom variables
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(customTheme));
      localStorage.setItem(LEGACY_THEME_KEY, customTheme.mode === 'light' ? 'light' : 'dark');

      const root = document.documentElement;
      const body = document.body;

      // Set CSS Variables
      root.style.setProperty('--primary-color', customTheme.primaryColor);
      root.style.setProperty('--primary-hover', customTheme.primaryHover);
      root.style.setProperty('--primary-rgb', customTheme.primaryRgb);
      root.style.setProperty('--accent-color', customTheme.accentColor);
      root.style.setProperty('--accent-rgb', customTheme.accentRgb);

      // Set Data Attributes for selectors
      root.setAttribute('data-theme-preset', customTheme.presetId);
      root.setAttribute('data-theme-mode', customTheme.mode);
      root.setAttribute('data-theme-radius', customTheme.borderRadius);
      root.setAttribute('data-theme-font', customTheme.fontFamily);
      root.setAttribute('data-theme-density', customTheme.uiDensity);
      root.setAttribute('data-theme-glow', customTheme.glowIntensity);

      // Handle dark / amoled / light classes
      root.classList.remove('dark', 'light', 'amoled');
      body.classList.remove('bg-slate-50', 'bg-slate-950', 'bg-black', 'text-slate-900', 'text-slate-100');

      if (customTheme.mode === 'amoled') {
        root.classList.add('dark', 'amoled');
        body.classList.add('bg-black', 'text-slate-100');
      } else if (customTheme.mode === 'dark') {
        root.classList.add('dark');
        body.classList.add('bg-slate-950', 'text-slate-100');
      } else {
        root.classList.add('light');
        body.classList.add('bg-slate-100/90', 'text-slate-900');
      }

      // Dispatch global event for other modules
      window.dispatchEvent(new CustomEvent('tamimi_theme_changed', { detail: customTheme }));
    } catch (e) {
      console.error('Error applying theme:', e);
    }
  }, [customTheme]);

  const toggleTheme = () => {
    setCustomThemeState((prev) => {
      const nextMode: ThemeMode = prev.mode === 'light' ? 'dark' : 'light';
      return { ...prev, mode: nextMode };
    });
  };

  const setTheme = (mode: 'light' | 'dark' | 'amoled') => {
    setCustomThemeState((prev) => ({ ...prev, mode }));
  };

  const setCustomTheme = (updates: Partial<CustomThemeConfig>) => {
    setCustomThemeState((prev) => ({ ...prev, ...updates }));
  };

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setCustomThemeState((prev) => ({
      ...prev,
      presetId: preset.id,
      mode: preset.mode,
      primaryColor: preset.primaryColor,
      primaryHover: preset.primaryHover,
      primaryRgb: preset.primaryRgb,
      accentColor: preset.accentColor,
      accentRgb: preset.accentRgb,
      gradient: preset.gradient,
      borderRadius: preset.borderRadius,
      fontFamily: preset.fontFamily,
      glowIntensity: preset.glowIntensity,
      glassBlur: preset.glassBlur,
      uiDensity: preset.uiDensity,
    }));
  };

  const resetTheme = () => {
    setCustomThemeState(DEFAULT_THEME_CONFIG);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: customTheme.mode,
        customTheme,
        activePreset,
        toggleTheme,
        setTheme,
        setCustomTheme,
        applyPreset,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

