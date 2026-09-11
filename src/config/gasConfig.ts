/// <reference types="vite/client" />

/**
 * ============================================================================
 * GLOBAL GOOGLE APPS SCRIPT WEB APP CONFIGURATION
 * ============================================================================
 * Set your Google Apps Script Web App URL here.
 * Once set here, ANY user on ANY computer or mobile phone who opens your Netlify link
 * will AUTOMATICALLY connect to your Google Sheet without needing to paste or import the link!
 * ============================================================================
 */

export const DEFAULT_GAS_WEB_APP_URL: string = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GAS_WEB_APP_URL) ||
  'https://script.google.com/macros/s/AKfycbyk66dsNfWkLjn3bQDUzPg9yVfMBnGDry4GRdl2uZntYxqLaJhY8uSPtvYY9l55SXxoiw/exec';

