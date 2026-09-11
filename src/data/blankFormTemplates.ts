import { FormTemplateDefinition } from '../types/blankForms';
import { AUTHENTIC_COMPANY_TEMPLATES } from './blank-forms/templates-authentic';
import { RECEPTION_TEMPLATES } from './blank-forms/templates-reception';
import { HR_TEMPLATES } from './blank-forms/templates-hr';
import { STORE_TEMPLATES } from './blank-forms/templates-store';
import { OPERATIONS_TEMPLATES } from './blank-forms/templates-operations';
import { LOGISTICS_TEMPLATES } from './blank-forms/templates-logistics';
import { COMPLIANCE_TEMPLATES } from './blank-forms/templates-compliance';

// Aggregate and export all official enterprise forms with authentic 13 company forms and reception at top
export const FORM_TEMPLATES: FormTemplateDefinition[] = [
  ...AUTHENTIC_COMPANY_TEMPLATES,
  ...RECEPTION_TEMPLATES,
  ...HR_TEMPLATES,
  ...STORE_TEMPLATES,
  ...OPERATIONS_TEMPLATES,
  ...LOGISTICS_TEMPLATES,
  ...COMPLIANCE_TEMPLATES,
];

