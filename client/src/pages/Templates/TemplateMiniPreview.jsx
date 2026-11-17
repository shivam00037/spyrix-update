import TemplatePreviewStage from './TemplatePreviewStage';
import { defaultInvoiceDesign } from '../Invoices/invoiceDesign';

export default function TemplateMiniPreview({ template, selected = {} }) {
  const design = {
    ...defaultInvoiceDesign,
    ...selected,
    templateId: template?.id,
    accentColor: selected.templateId === template?.id ? (selected.accentColor || template?.color) : template?.color,
    fontFamily: selected.templateId === template?.id ? (selected.fontFamily || template?.font) : template?.font,
  };
  return <TemplatePreviewStage template={template} design={design} mode="tile" className="ih-live-template-mini" />;
}
