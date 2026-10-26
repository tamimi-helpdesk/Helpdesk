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
        </style>
      </head>
      <body>
        <div class="a4-print-wrapper">
          ${cloneHtml}
        </div>
      </body>
    </html>
  `;
};

/**
 * Open form in a clean standalone printable browser tab and trigger print immediately
 */
export const openPrintableTab = (
  elementId = 'printable-official-form',
  docTitle = 'Official Form - Printable View',
  isLandscape = false
) => {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    window.print();
    return;
  }

  const clone = preparePrintableClone(sourceElement);
  const printHtml = buildPrintHtml(
    clone.outerHTML,
    docTitle,
    isLandscape ? 'landscape' : 'portrait'
  );

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  } else {
    // Popup was blocked, trigger window.print()
    window.print();
  }
};

/**
 * Direct print trigger that handles both iframe printing and browser fallback
 */
export const printOfficialDocument = (
  elementId = 'printable-official-form',
  optionsOrOrientation?: PrintOptions | 'portrait' | 'landscape'
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const sourceElement = document.getElementById(elementId);
      if (!sourceElement) {
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

      // Direct, infallible in-DOM print with native window.print() & isolated hidden iframe
      const clone = preparePrintableClone(sourceElement);
      const printHtml = buildPrintHtml(clone.outerHTML, docTitle, orientation);

      let printContainer = document.getElementById('official-document-print-container');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'official-document-print-container';
        document.body.appendChild(printContainer);
      }
      printContainer.innerHTML = printHtml;
      document.body.classList.add('printing-official-doc-mode');

      // Isolated hidden iframe print trigger (works inside sandboxed iframes)
      let hiddenFrame = document.getElementById('official-print-hidden-iframe') as HTMLIFrameElement | null;
      if (!hiddenFrame) {
        hiddenFrame = document.createElement('iframe');
        hiddenFrame.id = 'official-print-hidden-iframe';
        hiddenFrame.style.position = 'fixed';
        hiddenFrame.style.right = '0';
        hiddenFrame.style.bottom = '0';
        hiddenFrame.style.width = '0';
        hiddenFrame.style.height = '0';
        hiddenFrame.style.border = '0';
        hiddenFrame.style.opacity = '0';
        hiddenFrame.style.pointerEvents = 'none';
        document.body.appendChild(hiddenFrame);
      }

      const frameDoc = hiddenFrame.contentWindow?.document || hiddenFrame.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(printHtml);
        frameDoc.close();
        setTimeout(() => {
          try {
            hiddenFrame?.contentWindow?.focus();
            hiddenFrame?.contentWindow?.print();
          } catch (err) {
            window.print();
          }
        }, 250);
      } else {
        window.print();
      }

      const cleanup = () => {
        document.body.classList.remove('printing-official-doc-mode');
        if (printContainer) printContainer.innerHTML = '';
      };
      window.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(cleanup, 12000);
      resolve(true);
    } catch (e) {
      console.error('Print utility fallback to window.print():', e);
      try {
        window.print();
      } catch (_) {}
      resolve(true);
    }
  });
};
