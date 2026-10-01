import { FormTemplateDefinition } from '../types/blankForms';

/**
 * Exports current form data and tables to a standard CSV spreadsheet
 * that can be directly opened in Microsoft Excel or Google Sheets.
 */
export const exportFormToCsv = (
  template: FormTemplateDefinition,
  formData: Record<string, any>,
  docRef: string = 'DOC-REF'
) => {
  try {
    const rows: string[][] = [];

    // Header Meta
    rows.push(['TAMIMI GLOBAL COMPANY LTD. - TAFGA FORMS REPOSITORY']);
    rows.push([`FORM CODE: ${template.code}`, `DOCUMENT REF: ${docRef}`]);
    rows.push([`FORM TITLE: ${template.title}`]);
    rows.push([`DEPARTMENT: ${template.department}`, `EXPORT DATE: ${new Date().toLocaleDateString()}`]);
    rows.push([]);

    // General Form Fields
    rows.push(['=== GENERAL DETAILS ===']);
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value !== 'object' && value !== undefined && value !== null) {
        // Humanize key name
        const humanKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        rows.push([humanKey, String(value)]);
      }
    });
    rows.push([]);

    // Array / Table Data (e.g., items, rows, tasks, days)
    const arrayKeys = ['items', 'rows', 'tasks', 'days', 'attendanceRows', 'materialRows', 'gatePassRows'];
    arrayKeys.forEach((arrKey) => {
      const arr = formData[arrKey];
      if (Array.isArray(arr) && arr.length > 0) {
        rows.push([`=== TABLE DATA (${arrKey.toUpperCase()}) ===`]);
        // Extract column headers
        const firstItem = arr[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const colKeys = Object.keys(firstItem);
          const colLabels = ['#', ...colKeys.map((k) => k.replace(/([A-Z])/g, ' $1').toUpperCase())];
          rows.push(colLabels);

          arr.forEach((item, index) => {
            const rowValues = [String(index + 1), ...colKeys.map((k) => `"${String(item[k] ?? '').replace(/"/g, '""')}"`)];
            rows.push(rowValues);
          });
        }
        rows.push([]);
      }
    });

    // Convert to CSV string with UTF-8 BOM
    const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = template.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `${template.code}_${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting form to CSV:', err);
  }
};
