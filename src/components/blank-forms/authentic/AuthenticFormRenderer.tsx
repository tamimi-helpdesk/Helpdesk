import React from 'react';
import { FormTemplateDefinition } from '../../../types/blankForms';
import { AssetsHandoverForm } from './AssetsHandoverForm';
import { MaterialRequestForm } from './MaterialRequestForm';
import { GolfSimulatorChecklistForm } from './GolfSimulatorChecklistForm';
import { KeyMonitoringForm } from './KeyMonitoringForm';
import { AssetsTransferForm } from './AssetsTransferForm';
import { SportsEquipmentForm } from './SportsEquipmentForm';
import { ParcelMonitoringLogForm } from './ParcelMonitoringLogForm';
import { JobDescriptionForm } from './JobDescriptionForm';
import { WorkHandoverForm } from './WorkHandoverForm';
import { OutGoingPermissionForm } from './OutGoingPermissionForm';
import { LostAndFoundForm } from './LostAndFoundForm';
import { CustomerSatisfactionForm } from './CustomerSatisfactionForm';
import { LinenPickDropForm } from './LinenPickDropForm';

interface AuthenticFormRendererProps {
  template: FormTemplateDefinition;
  formData: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const AuthenticFormRenderer: React.FC<AuthenticFormRendererProps> = ({
  template,
  formData,
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const commonProps = {
    formData,
    isBlankMode,
    isEditable,
    onFieldChange,
    onTableChange,
  };

  switch (template.id) {
    case 'TAFGA-FRM-01-ASSETS-HND':
      return <AssetsHandoverForm {...commonProps} />;
    case 'TAFGA-FRM-02-MAT-REQ':
      return <MaterialRequestForm {...commonProps} />;
    case 'TAFGA-FRM-03-GOLF-CHK':
      return <GolfSimulatorChecklistForm {...commonProps} />;
    case 'TAFGA-FRM-04-KEY-MON':
      return <KeyMonitoringForm {...commonProps} />;
    case 'TAFGA-FRM-05-ASSET-TRF':
      return <AssetsTransferForm {...commonProps} />;
    case 'TAFGA-FRM-06-SPORTS-SLIP':
      return <SportsEquipmentForm {...commonProps} />;
    case 'TAFGA-FRM-07-PARCEL-LOG':
      return <ParcelMonitoringLogForm {...commonProps} />;
    case 'TAFGA-FRM-08-JOB-DESC':
      return <JobDescriptionForm {...commonProps} />;
    case 'TAFGA-FRM-09-WORK-HND':
      return <WorkHandoverForm {...commonProps} />;
    case 'TAFGA-FRM-10-OUT-PERM':
      return <OutGoingPermissionForm {...commonProps} />;
    case 'TAFGA-FRM-11-LOST-FND':
      return <LostAndFoundForm {...commonProps} />;
    case 'TAFGA-FRM-12-CUST-SAT':
      return <CustomerSatisfactionForm {...commonProps} />;
    case 'TAFGA-FRM-13-LINEN-PICK':
      return <LinenPickDropForm {...commonProps} />;
    default:
      return null;
  }
};
