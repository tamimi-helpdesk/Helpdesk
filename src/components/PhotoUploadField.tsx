import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Upload, Trash2, Eye, Image as ImageIcon, Sparkles, Clipboard, ClipboardPaste, Check } from 'lucide-react';
import { compressAndConvertImage } from '../utils/imageHelper';

interface PhotoUploadFieldProps {
  label: string;
  sublabel?: string;
  value?: string;
  onChange: (photoUrl: string | undefined) => void;
  accentColor?: 'cyan' | 'amber' | 'emerald' | 'indigo';
  required?: boolean;
}

export const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({
  label,
  sublabel,
  value,
  onChange,
  accentColor = 'emerald',
  required = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewZoomOpen, setPreviewZoomOpen] = useState(false);
  const [pastedNotice, setPastedNotice] = useState<string | null>(null);

  const colorStyles = {
    cyan: {
      border: 'hover:border-cyan-500 focus:border-cyan-500',
      btn: 'bg-cyan-600 hover:bg-cyan-700 text-white',
      badge: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      activeRing: 'ring-cyan-500',
      tag: 'bg-cyan-500 text-white',
    },
    amber: {
      border: 'hover:border-amber-500 focus:border-amber-500',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
      badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      activeRing: 'ring-amber-500',
      tag: 'bg-amber-500 text-white',
    },
    emerald: {
      border: 'hover:border-emerald-500 focus:border-emerald-500',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      activeRing: 'ring-emerald-500',
      tag: 'bg-emerald-500 text-white',
    },
    indigo: {
      border: 'hover:border-indigo-500 focus:border-indigo-500',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      activeRing: 'ring-indigo-500',
      tag: 'bg-indigo-500 text-white',
    },
  }[accentColor];

  // Process and compress image file
  const processImageFile = useCallback(async (file: File, sourceName = 'File') => {
    if (!file.type.startsWith('image/')) {
      alert('Please select or paste an image file (JPEG, PNG, WEBP).');
      return;
    }

    try {
      setIsProcessing(true);
      const compressedDataUrl = await compressAndConvertImage(file, 1000, 0.82);
      onChange(compressedDataUrl);
      setPastedNotice(`Image attached from ${sourceName}`);
      setTimeout(() => setPastedNotice(null), 3500);
    } catch (err) {
      console.error('Failed to process image', err);
      alert('Could not process the selected image. Please try another file or re-copy.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onChange]);

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    processImageFile(files[0], 'Upload / Camera');
  };

  // Clipboard Paste Handler (Supports WhatsApp Copy, Screenshots, Web Copy)
  const handlePasteEvent = useCallback((e: ClipboardEvent | React.ClipboardEvent) => {
    const clipboardData = (e as ClipboardEvent).clipboardData || (e as React.ClipboardEvent).clipboardData;
    if (!clipboardData) return;

    // Check files in clipboard
    if (clipboardData.files && clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        e.stopPropagation();
        processImageFile(file, 'Clipboard (Ctrl+V / WhatsApp)');
        return;
      }
    }

    // Check items in clipboard
    if (clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            e.stopPropagation();
            processImageFile(file, 'Clipboard (WhatsApp / Screenshot)');
            return;
          }
        }
      }
    }
  }, [processImageFile]);

  // Global window paste listener when field is mounted
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // If active element is a text input / textarea, let text paste happen normally
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') &&
        (activeEl as HTMLInputElement).type !== 'file';

      // If user copied an actual image blob/file in clipboard, handle it
      const hasImage = e.clipboardData?.items && Array.from(e.clipboardData.items).some((it) => it.type.startsWith('image/'));
      if (hasImage && !isInputFocused) {
        handlePasteEvent(e);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handlePasteEvent]);

  // Manual one-click "Paste from Clipboard" button handler
  const handlePasteFromClipboardClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (!navigator.clipboard) {
        alert('Please press Ctrl+V on your keyboard to paste the copied image.');
        return;
      }

      // Try reading clipboard items if supported by browser
      if (navigator.clipboard.read) {
        setIsProcessing(true);
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((type) => type.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], 'clipboard-image.png', { type: imageType });
            await processImageFile(file, 'Clipboard');
            return;
          }
        }
      }

      // Fallback hint
      alert('No copied image detected in clipboard yet.\n\nTip: Right-click any image in WhatsApp / Web and choose "Copy Image", or take a screenshot, then click here or press Ctrl+V!');
    } catch (err) {
      console.warn('Direct clipboard read requires user permission or keyboard Ctrl+V', err);
      alert('Please click inside this box and press Ctrl + V on your keyboard to paste the copied image directly!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  return (
    <div className="space-y-1.5" ref={containerRef} onPaste={handlePasteEvent}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
          <Camera className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
        
        <div className="flex items-center space-x-2">
          {pastedNotice ? (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3 h-3" />
              <span>{pastedNotice}</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {sublabel || 'Direct Paste (Ctrl+V) Supported'}
            </span>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileChange(e.target.files)}
        className="hidden"
      />

      {value ? (
        /* Image Attached Preview Card */
        <div className="relative group bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <div
              onClick={() => setPreviewZoomOpen(true)}
              className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer shadow-xs group-hover:ring-2 group-hover:ring-amber-500 transition"
            >
              <img
                src={value}
                alt="Uploaded proof"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${colorStyles.badge}`}>
                  Photo Attached
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ready for Print &amp; Log
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                Visual Evidence Attached
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Click photo to zoom • Paste (Ctrl+V) or click camera to replace
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePasteFromClipboardClick}
              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 transition cursor-pointer border border-amber-200 dark:border-amber-800"
              title="Paste new image from Clipboard / WhatsApp (Ctrl+V)"
            >
              <ClipboardPaste className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewZoomOpen(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="View full size"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="Take camera photo or upload"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition cursor-pointer"
              title="Remove photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Full Screen Image Zoom Lightbox */}
          {previewZoomOpen && (
            <div
              onClick={() => setPreviewZoomOpen(false)}
              className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
            >
              <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-3xl p-2 border-2 border-slate-700 overflow-hidden flex flex-col items-center">
                <img
                  src={value}
                  alt="Zoom preview"
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl"
                />
                <div className="pt-2 text-center text-xs text-slate-300 font-semibold flex items-center justify-between w-full px-3">
                  <span>Visual Evidence Preview</span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoomOpen(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty Upload Dropzone with Paste & Camera options */
        <div
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition cursor-pointer bg-slate-50/70 dark:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
            isDragging
              ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/30'
              : `border-slate-300 dark:border-slate-800 ${colorStyles.border}`
          }`}
        >
          {isProcessing ? (
            <div className="py-2 flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Compressing &amp; Optimizing Image...
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-11 h-11 rounded-2xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                    <span>Take Photo / Upload</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      or Paste (Ctrl+V)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Copy from WhatsApp, Screenshot (Win+Shift+S), or Click to browse
                  </p>
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePasteFromClipboardClick}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                  title="Paste copied image from clipboard"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Paste Image</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

