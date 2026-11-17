import { useEffect, useMemo, useRef, useState } from 'react';
import { defaultInvoiceDesign } from '../Invoices/invoiceDesign';
import XenmarkInvoicePreview from '../InvoiceCreator/XenmarkInvoicePreview';
import SpyrixTemplateInvoicePreview from '../InvoiceCreator/SpyrixTemplateInvoicePreview';
import './TemplatePreviewStage.css';

const sampleItems = [
  { id: 'sample-1', name: 'KALMA CAP (BLACK)', description: 'Custom embroidery', quantity: 6, unit: 'pcs', rate: 150, lineTotal: 900 },
  { id: 'sample-2', name: 'RAHAT CAP', description: '', quantity: 2, unit: 'pcs', rate: 120, lineTotal: 240 },
  { id: 'sample-3', name: 'SABR CAP', description: '', quantity: 4, unit: 'pcs', rate: 120, lineTotal: 480 },
  { id: 'sample-4', name: 'BLACK TSHIRT', description: 'Screen printing', quantity: 1, unit: 'pcs', rate: 240, lineTotal: 240 },
];
const sampleCalculations = { lines: sampleItems, subtotal: 1860, discount: 0, tax: 0, total: 1860 };
const sampleMeta = { invoiceNumber: '#SP-1042', issueDate: '2025-10-30', dueDate: '2025-11-30', purchaseOrder: 'PO-1042', reference: 'WEB-1042', notes: 'Thank you for choosing SPYRIX.', terms: '1. Goods once sold will not be taken back.\n2. Payment is due within 30 days.\n3. Custom orders are made to order.' };
const sampleCustomer = { name: 'ARABWEARS', companyName: 'ARABWEARS', billingAddress: 'Raj Lakshmi Complex, Lucknow', phone: '+91 98765 43210', email: 'accounts@example.com', gstin: '09ABCDE1234F1Z5', country: 'India' };
const noop = () => {};
const noUpload = () => () => {};

export function templateSampleData(baseDesign = {}) {
  return {
    design: {
      ...defaultInvoiceDesign,
      businessName: 'SPYRIX',
      businessAddress: 'RAJ LAKSHMI COMPLEX, KALYANPUR, LUCKNOW.',
      businessPhone: '+91 6387731661',
      businessWebsite: 'www.spyrix.in',
      businessGstin: '09LLIPK4037P1Z',
      businessTagline: 'GARMENT MANUFACTURER & PRINTING HOUSE',
      businessServiceLine: 'T-SHIRTS | CAPS | HOODIES | JACKETS',
      businessServiceLine2: 'EMBROIDERY | DTF | DTG | CUSTOM PRINTING',
      ...baseDesign,
    },
    meta: sampleMeta,
    customer: sampleCustomer,
    items: sampleItems,
    calculations: sampleCalculations,
  };
}

export default function TemplatePreviewStage({ template, design, meta, customer, items, calculations, mode = 'tile', className = '' }) {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0.32);
  const fallback = useMemo(() => templateSampleData(design), [design]);
  const actual = {
    design: design || fallback.design,
    meta: meta || fallback.meta,
    customer: customer || fallback.customer,
    items: items || fallback.items,
    calculations: calculations || fallback.calculations,
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const update = () => {
      const box = stage.getBoundingClientRect();
      const availableWidth = Math.max(1, box.width - (mode === 'tile' ? 8 : 24));
      const availableHeight = Math.max(1, box.height - (mode === 'tile' ? 8 : 24));
      const next = Math.max(0.08, Math.min(availableWidth / 794, availableHeight / 1123));
      setScale(current => Math.abs(current - next) > 0.002 ? next : current);
    };
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(stage);
    window.addEventListener('resize', update, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [mode, template?.id]);

  return <div ref={stageRef} className={`sp-template-preview-stage ${mode === 'tile' ? 'is-tile' : 'is-fit'} ${className}`}>
    <div className="sp-template-preview-scaled" style={{ width: `${794 * scale}px`, height: `${1123 * scale}px` }}>
      <div className="sp-template-preview-document" style={{ width: 794, height: 1123, transform: `scale(${scale})` }}>
        {template?.id === 'xenmark' ? <div className="sp-template-default-document">
          <XenmarkInvoicePreview
            design={actual.design}
            setD={noop}
            meta={actual.meta}
            setM={noop}
            customer={actual.customer}
            setC={noop}
            items={actual.items}
            updateLine={noop}
            addLine={noop}
            calculations={actual.calculations}
            uploadAsset={noUpload}
            isTemplateMode
          />
        </div> : <SpyrixTemplateInvoicePreview
          template={template}
          design={{ ...actual.design, accentColor: actual.design.accentColor || template?.color, fontFamily: actual.design.fontFamily || template?.font }}
          meta={actual.meta}
          customer={actual.customer}
          items={actual.items}
          calculations={actual.calculations}
          editable={false}
        />}
      </div>
    </div>
  </div>;
}
