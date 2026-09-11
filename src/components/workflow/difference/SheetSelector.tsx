import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Layers, CheckSquare, Square, X } from 'lucide-react';

interface SheetSelectorProps {
  label?: string;
  allSheets: string[];
  selectedSheets: string[];
  sheetCounts?: Record<string, number>;
  totalRows: number;
  isLoading?: boolean;
  onChange: (newSelection: string[]) => void;
  accentColor?: 'blue' | 'emerald';
}

export const SheetSelector: React.FC<SheetSelectorProps> = ({
  label = 'Select Sheet(s)',
  allSheets,
  selectedSheets,
  sheetCounts = {},
  totalRows,
  isLoading = false,
  onChange,
  accentColor = 'blue',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleSheet = (sheet: string) => {
    if (selectedSheets.includes(sheet)) {
      // Don't allow unchecking the very last sheet
      if (selectedSheets.length > 1) {
        onChange(selectedSheets.filter((s) => s !== sheet));
      }
    } else {
      onChange([...selectedSheets, sheet]);
    }
  };

  const handleSelectAll = () => {
    onChange([...allSheets]);
  };

  const handleSelectOnly = (sheet: string) => {
    onChange([sheet]);
    setIsOpen(false);
  };

  const isAllSelected = allSheets.length > 0 && selectedSheets.length === allSheets.length;

  const isBlue = accentColor === 'blue';
  const activeBg = isBlue ? 'bg-blue-50 dark:bg-blue-950/50' : 'bg-emerald-50 dark:bg-emerald-950/50';
  const activeBorder = isBlue ? 'border-blue-400 dark:border-blue-600' : 'border-emerald-400 dark:border-emerald-600';
  const activeText = isBlue ? 'text-blue-700 dark:text-blue-300' : 'text-emerald-700 dark:text-emerald-300';
  const checkboxColor = isBlue ? 'text-blue-600' : 'text-emerald-600';
  const pillBg = isBlue
    ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
    : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800';

  // Display text for dropdown trigger
  const triggerText = () => {
    if (selectedSheets.length === 0) return 'No sheet selected';
    if (selectedSheets.length === 1) {
      const name = selectedSheets[0];
      const count = sheetCounts[name];
      return count !== undefined ? `${name} (${count.toLocaleString()} rows)` : name;
    }
    return `${selectedSheets.length} Sheets Selected (${totalRows.toLocaleString()} total rows)`;
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      {/* Dropdown trigger button */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          <span>{label}:</span>
        </span>

        <button
          type="button"
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`flex-1 flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer shadow-sm text-left truncate ${
            isOpen
              ? `${activeBg} ${activeBorder} ${activeText} ring-2 ring-opacity-20 ${
                  isBlue ? 'ring-blue-500' : 'ring-emerald-500'
                }`
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
          } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className="truncate pr-1">{isLoading ? 'Parsing sheets...' : triggerText()}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${
              isBlue ? 'text-blue-500' : 'text-emerald-500'
            }`}
          />
        </button>
      </div>

      {/* Selected sheets pills */}
      {selectedSheets.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {selectedSheets.map((sheet) => {
            const count = sheetCounts[sheet];
            return (
              <span
                key={sheet}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium border ${pillBg}`}
              >
                <Check className="w-3 h-3 shrink-0" />
                <span className="font-semibold">{sheet}</span>
                {count !== undefined && (
                  <span className="opacity-80">({count.toLocaleString()})</span>
                )}
                {selectedSheets.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSheet(sheet);
                    }}
                    title={`Remove ${sheet}`}
                    className="ml-0.5 hover:opacity-75 cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden p-2 animate-in fade-in zoom-in-95 duration-100">
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px]">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Select Sheets (Multi-select)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {isAllSelected ? 'All Selected' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Sheet Checklist */}
          <div className="max-h-60 overflow-y-auto space-y-1 divide-y-0">
            {allSheets.map((sheet) => {
              const isChecked = selectedSheets.includes(sheet);
              const count = sheetCounts[sheet];
              return (
                <div
                  key={sheet}
                  onClick={() => toggleSheet(sheet)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition text-xs select-none ${
                    isChecked
                      ? `${activeBg} ${activeText} font-semibold`
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isChecked ? (
                      <CheckSquare className={`w-4 h-4 shrink-0 ${checkboxColor}`} />
                    ) : (
                      <Square className="w-4 h-4 shrink-0 text-slate-400" />
                    )}
                    <span className="truncate">{sheet}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {count !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        {count.toLocaleString()}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOnly(sheet);
                      }}
                      title="Only select this sheet"
                      className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline px-1 cursor-pointer"
                    >
                      Only
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="pt-2 mt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
              {selectedSheets.length} of {allSheets.length} sheets selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`px-3 py-1 rounded-lg text-xs font-bold text-white transition cursor-pointer shadow-sm ${
                isBlue
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Apply Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
