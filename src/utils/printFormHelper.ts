/**
 * High-Reliability Print & Export Utility for Official TAFGA Enterprise Forms
 * Supports direct browser print, dedicated printable popup tab, high-contrast text conversion,
 * and isolated stylesheets for pixel-perfect A4 Portrait & Landscape printing.
 */

export interface PrintOptions {
  title?: string;
  isLandscape?: boolean;
  orientation?: 'portrait' | 'landscape';
  preferPopup?: boolean;
}

/**
 * Prepares a clone of the form element for print by converting inputs/selects/textareas
 * to high-contrast permanent text spans to prevent print engine truncation or missing values.
 */
export const preparePrintableClone = (source: HTMLElement): HTMLElement => {
  const clone = source.cloneNode(true) as HTMLElement;

  // Hide interactive buttons, delete buttons, and elements marked no-print
  clone.querySelectorAll('.print\\:hidden, [data-no-print="true"], button').forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  const originalInputs = source.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >('input, textarea, select');
  const clonedInputs = clone.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >('input, textarea, select');

  originalInputs.forEach((orig, idx) => {
    const cloned = clonedInputs[idx];
    if (!cloned) return;

    if (orig instanceof HTMLInputElement) {
      if (orig.type === 'checkbox' || orig.type === 'radio') {
        if (orig.checked) {
          cloned.setAttribute('checked', 'true');
          (cloned as HTMLInputElement).checked = true;
        } else {
          cloned.removeAttribute('checked');
          (cloned as HTMLInputElement).checked = false;
        }
      } else {
        const val = orig.value || '';
        cloned.setAttribute('value', val);
        (cloned as HTMLInputElement).value = val;
      }
    } else if (orig instanceof HTMLTextAreaElement) {
      cloned.textContent = orig.value || '';
      (cloned as HTMLTextAreaElement).value = orig.value || '';
    } else if (orig instanceof HTMLSelectElement) {
      Array.from((cloned as HTMLSelectElement).options).forEach((opt) => {
        if (opt.value === orig.value) {
          opt.setAttribute('selected', 'true');
        } else {
          opt.removeAttribute('selected');
        }
      });
    }
  });

  return clone;
};

/**
 * Builds standalone standard printable HTML document with embedded Tailwind and layout rules
 */
export const buildPrintHtml = (
  cloneHtml: string,
  docTitle: string,
  orientation: 'portrait' | 'landscape'
): string => {
  // Collect all current stylesheets and inline styles
  let stylesHtml = '';
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    stylesHtml += node.outerHTML;
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${docTitle}</title>
        ${stylesHtml}
        <style>
          @page {
            size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
            margin: ${orientation === 'landscape' ? '5mm 8mm' : '8mm 10mm'};
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            width: 100% !important;
          }
          .no-print, [data-no-print="true"], button.print\\:hidden, button {
            display: none !important;
          }
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            outline: none !important;
            box-shadow: none !important;
            color: #000000 !important;
            resize: none !important;
            font-family: inherit !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }
          input::placeholder, textarea::placeholder {
            color: transparent !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border-color: #000000 !important;
          }
          .a4-print-wrapper {
            width: 100% !important;
            max-width: ${orientation === 'landscape' ? '1120px' : '840px'} !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @media print {
            .print-helper-bar {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-helper-bar no-print" style="position: sticky; top: 0; background: #0f172a; color: #fff; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: ui-sans-serif, system-ui, sans-serif;">
          <div>
            <div style="font-weight: 700; font-size: 14px;">${docTitle}</div>
            <div style="font-size: 11px; color: #94a3b8;">${orientation === 'landscape' ? 'A4 Landscape' : 'A4 Portrait'} • Official Document</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="window.focus(); window.print();" style="background: #2563eb; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">
              🖨️ Click to Print (Ctrl+P)
            </button>
            <button onclick="window.close();" style="background: #334155; color: #cbd5e1; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">
              Close
            </button>
          </div>
        </div>
        <div class="a4-print-wrapper">
          ${cloneHtml}
        </div>
        <script>
          window.addEventListener('load', function() {
            setTimeout(function() {
              try {
                window.focus();
                window.print();
              } catch (e) {
                console.warn('Auto print trigger error:', e);
              }
            }, 300);
          });
        </script>
      </body>
    </html>
  `;
};

/**
 * Open form in a clean standalone printable browser tab and trigger print immediately via Blob URL
 */
export const openPrintableTab = (
  elementId = 'printable-official-form',
  docTitle = 'Official Form - Printable View',
  isLandscape = false
) => {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    window.focus();
    window.print();
    return;
  }

  const clone = preparePrintableClone(sourceElement);
  const printHtml = buildPrintHtml(
    clone.outerHTML,
    docTitle,
    isLandscape ? 'landscape' : 'portrait'
  );

  try {
    const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        link.remove();
        URL.revokeObjectURL(blobUrl);
      } catch (_) {}
    }, 15000);
  } catch (e) {
    console.warn('Blob link print failed, falling back to window.print():', e);
    window.focus();
    window.print();
  }
};

/**
 * Direct print trigger that handles native browser print dialog reliably in Chrome
 */
export const printOfficialDocument = (
  elementId = 'printable-official-form',
  optionsOrOrientation?: PrintOptions | 'portrait' | 'landscape'
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const sourceElement = document.getElementById(elementId);
      if (!sourceElement) {
        window.focus();
        window.print();
        resolve(true);
        return;
      }

      let orientation: 'portrait' | 'landscape' = 'portrait';
      let docTitle = 'TAFGA Official Form';
      let preferPopup = false;

      if (typeof optionsOrOrientation === 'string') {
        orientation = optionsOrOrientation;
      } else if (optionsOrOrientation) {
        if (optionsOrOrientation.orientation) {
          orientation = optionsOrOrientation.orientation;
        } else if (optionsOrOrientation.isLandscape) {
          orientation = 'landscape';
        }
        if (optionsOrOrientation.title) {
          docTitle = optionsOrOrientation.title;
        }
        if (optionsOrOrientation.preferPopup) {
          preferPopup = true;
        }
      }

      if (preferPopup) {
        openPrintableTab(elementId, docTitle, orientation === 'landscape');
        resolve(true);
        return;
      }

      // Clone the printable element with high-contrast text and values preserved
      const clone = preparePrintableClone(sourceElement);

      let printContainer = document.getElementById('official-document-print-container');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'official-document-print-container';
        document.body.appendChild(printContainer);
      }
      printContainer.innerHTML = '';

      const wrapper = document.createElement('div');
      wrapper.className = 'a4-print-wrapper';
      wrapper.appendChild(clone);
      printContainer.appendChild(wrapper);

      // Inject dynamic page orientation style
      let styleTag = document.getElementById('official-document-print-style') as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'official-document-print-style';
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = `
        @media print {
          @page {
            size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'} !important;
            margin: ${orientation === 'landscape' ? '5mm 8mm' : '8mm 10mm'} !important;
          }
        }
      `;

      document.body.classList.add('printing-official-doc-mode');

      const originalTitle = document.title;
      if (docTitle) {
        document.title = docTitle;
      }

      const cleanup = () => {
        document.body.classList.remove('printing-official-doc-mode');
        if (printContainer) printContainer.innerHTML = '';
        document.title = originalTitle;
      };

      window.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(cleanup, 4000);

      // Directly trigger native browser print dialog!
      setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch (err) {
          console.warn('Native window.print() exception, opening fallback tab:', err);
          openPrintableTab(elementId, docTitle, orientation === 'landscape');
        }
        resolve(true);
      }, 50);
    } catch (e) {
      console.error('Print utility fallback to direct window.print():', e);
      try {
        window.focus();
        window.print();
      } catch (_) {}
      resolve(true);
    }
  });
};
