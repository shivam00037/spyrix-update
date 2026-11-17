import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Check, ChevronDown, ChevronUp, Download, Eye, ImagePlus, Undo2, Redo2,
  Palette, Plus, Printer, Save, ShieldCheck, SlidersHorizontal, Sparkles, Type,
  Trash2, Upload, X, QrCode, Building2, UserRound, FileText, LayoutTemplate, ListChecks, Share2, FileImage, Table2, Shapes, SlidersHorizontal as SlidersIcon, Mail, Copy, Sparkles as SparklesIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../data/DataContext';
import { apiRequest } from '../../api';
import { invoiceTemplates, loadInvoiceDesign, readImageFile, saveInvoiceDesign } from '../Invoices/invoiceDesign';
import './InvoiceCreatorPage.css';
import XenmarkInvoicePreview from './XenmarkInvoicePreview';
import SpyrixTemplateInvoicePreview from './SpyrixTemplateInvoicePreview';
import TemplatePreviewStage from '../Templates/TemplatePreviewStage';
import { exportInvoiceImage, exportInvoiceSvg, shareInvoiceSummary } from './invoiceExport';

const today = new Date().toISOString().slice(0, 10);
const future = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
const currency = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(value || 0));
const money = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const emptyLine = () => ({ id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: '', description: '', sku: '', quantity: 1, unit: 'pcs', rate: 0, discount: 0, taxRate: 0 });
const blankCustomer = {
  name: '', contactPerson: '', companyName: '', email: '', phone: '', alternatePhone: '',
  billingAddress: '', shippingAddress: '', city: '', state: '', stateCode: '', postalCode: '',
  country: 'India', gstin: '', pan: '', paymentTerms: 'Due on receipt', notes: '', customFields: [],
};
const sampleCustomer = { ...blankCustomer, name: 'ARABWEARS', companyName: 'ARABWEARS', country: 'India' };
const customerProfileKeys = [
  'name', 'contactPerson', 'companyName', 'email', 'phone', 'alternatePhone',
  'billingAddress', 'shippingAddress', 'city', 'state', 'stateCode', 'postalCode',
  'country', 'gstin', 'pan', 'paymentTerms', 'notes',
];
function customerToInvoiceFields(record = {}) {
  return {
    ...blankCustomer,
    ...Object.fromEntries(customerProfileKeys.map(key => [key, record[key] ?? (key === 'country' ? 'India' : '')])),
    customFields: Array.isArray(record.customFields) ? record.customFields : [],
  };
}
function customerProfilePayload(record = {}) {
  const payload = Object.fromEntries(customerProfileKeys.map(key => [key, String(record[key] ?? '').trim()]));
  payload.email = String(record.email ?? '').trim().toLowerCase();
  payload.gstin = String(record.gstin ?? '').trim().toUpperCase();
  payload.pan = String(record.pan ?? '').trim().toUpperCase();
  payload.country = String(record.country ?? '').trim() || 'India';
  return { ...payload, customFields: Array.isArray(record.customFields) ? record.customFields : [] };
}
function sameCustomerField(a, b) {
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
}
function genericTextPath(root, node) {
  const path = [];
  let current = node;
  while (current && current !== root) {
    const parent = current.parentElement;
    if (!parent) break;
    path.unshift(Array.prototype.indexOf.call(parent.children, current));
    current = parent;
  }
  return `generic-text-${path.join('-') || '0'}`;
}
function buildGenericTextStyleCss(styles = {}) {
  const validProperties = ['fontFamily', 'fontSize', 'color', 'fontWeight', 'fontStyle', 'textDecoration', 'textAlign', 'lineHeight', 'letterSpacing'];
  const cssName = key => key.replace(/[A-Z]/g, value => `-${value.toLowerCase()}`);
  return Object.entries(styles).filter(([id, value]) => /^[a-z0-9_-]+$/i.test(id) && value && typeof value === 'object').map(([id, value]) => {
    const declarations = validProperties.filter(key => value[key] != null).map(key => {
      const safe = String(value[key]).replace(/[;{}<>]/g, '').trim();
      if (!safe) return '';
      return `${cssName(key)}:${key === 'fontFamily' ? JSON.stringify(safe.replace(/["\\]/g, '')) : safe} !important`;
    }).filter(Boolean).join(';');
    return declarations ? `.ic-invoice-paper [data-generic-text-id="${id}"]{${declarations}}` : '';
  }).filter(Boolean).join('\n');
}
const sampleItems = [
  { id: 'sample-1', name: 'KALMA CAP (BLACK)', description: '', sku: '', quantity: 6, unit: 'pcs', rate: 150, discount: 0, taxRate: 0 },
  { id: 'sample-2', name: 'RAHAT CAP', description: '', sku: '', quantity: 2, unit: 'pcs', rate: 120, discount: 0, taxRate: 0 },
  { id: 'sample-3', name: 'SABR CAP', description: '', sku: '', quantity: 4, unit: 'pcs', rate: 120, discount: 0, taxRate: 0 },
  { id: 'sample-4', name: 'BLACK TSHIRT', description: '', sku: '', quantity: 1, unit: 'pcs', rate: 240, discount: 0, taxRate: 0 },
];

const paperBackgrounds = [
  { id: 'snow', name: 'Snow white', description: 'Crisp and classic', color: '#ffffff' },
  { id: 'ivory', name: 'Warm ivory', description: 'Soft premium warmth', color: '#fff7e8' },
  { id: 'ice', name: 'Ice blue', description: 'Cool and professional', color: '#edf5ff' },
  { id: 'blush', name: 'Soft blush', description: 'Subtle creative tone', color: '#fff0f2' },
  { id: 'sage', name: 'Fresh sage', description: 'Calm natural finish', color: '#eff7ee' },
];

const layoutPresets = [
  { id: 'signature', name: 'Signature', description: 'Balanced everyday style', accentColor: '#171717', fontFamily: 'Arial', headerStyle: 'line', tableStyle: 'clean', frameStyle: 'thin' },
  { id: 'bold', name: 'Bold impact', description: 'Strong header and contrast', accentColor: '#18243a', fontFamily: 'Inter', headerStyle: 'band', tableStyle: 'striped', frameStyle: 'none' },
  { id: 'elegant', name: 'Elegant', description: 'Refined serif typography', accentColor: '#80533e', fontFamily: 'Georgia', headerStyle: 'minimal', tableStyle: 'minimal', frameStyle: 'thin' },
  { id: 'creative', name: 'Creative', description: 'Fresh colour and structure', accentColor: '#416b8c', fontFamily: 'Poppins', headerStyle: 'split', tableStyle: 'boxed', frameStyle: 'dashed' },
  { id: 'compact', name: 'Compact', description: 'Dense, space-saving layout', accentColor: '#315c4b', fontFamily: 'Tahoma', headerStyle: 'line', tableStyle: 'striped', frameStyle: 'none', tableDensity: 'compact' },
];

const paperPatternStyles = {
  plain: 'none',
  dots: 'radial-gradient(rgba(25,25,25,.09) .7px, transparent .7px)',
  grid: 'linear-gradient(rgba(25,25,25,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(25,25,25,.045) 1px, transparent 1px)',
  diagonal: 'repeating-linear-gradient(135deg, rgba(25,25,25,.035) 0 1px, transparent 1px 9px)',
};

const defaultDesign = {
  templateId: 'xenmark', xenmarkRevision: 5, accentColor: '#85172d', fontFamily: 'Arial', textColor: '#11151b', elementStyles: {}, invoiceTitle: 'INVOICE',
  businessName: 'XENMARK', businessAddress: 'RAJ LAKSHMI COMPLEX, KALYANPUR, LUCKNOW.', businessPhone: '+91 6387731661', businessEmail: '', businessWebsite: 'www.xenmark.in', businessGstin: '09LLIPK4037P1Z', businessPan: '', businessTagline: 'GARMENT MANUFACTURER & PRINTING HOUSE', businessServiceLine: 'T-SHIRTS | CAPS | HOODIES | JACKETS', businessServiceLine2: 'EMBROIDERY | DTF | DTG | CUSTOM PRINTING',
  businessBankName: '', businessAccountNumber: '', businessIfsc: '', upiId: '', businessServices: 'T-SHIRTS | CAPS | HOODIES | JACKETS | EMBROIDERY | DTF / DTG | CUSTOM PRINTS',
  logoDataUrl: '', qrDataUrl: '', showLogo: true, showQr: true, logoWidth: 64, logoZoom: 1, logoOffsetX: 0, logoOffsetY: 0, logoPosition: 'left',
  footerText: 'GARMENTS | PRINTING | CUSTOMIZATION', ribbonServices: 'T-SHIRTS | CAPS | HOODIES | JACKETS | DTF / DTG | EMBROIDERY | CUSTOM PRINTS', serviceBannerText: 'CUSTOM APPAREL\nFOR YOUR\nBRAND & BUSINESS', businessSocialHandle: '@xenmark_', topIssueDateLabel: 'Date', qrPaymentProvider: 'UPI / PhonePe', qrScanText: 'Scan & Pay', qrScanSubtext: 'Pay with any UPI App', documentLabel: 'S. No.', invoiceNumberLabel: 'Bill No.', issueDateLabel: 'Invoice Date', dueDateLabel: 'Due Date', purchaseOrderLabel: 'PO No.', referenceLabel: 'Reference', billToLabel: 'BILL TO', billFromLabel: 'BILL BY', paymentDetailsLabel: 'Payment Details',
  customerNameLabel: 'Name', customerCompanyLabel: 'Company Name', customerAddressLabel: 'Address', customerPhoneLabel: 'Phone', customerEmailLabel: 'Email', businessNameLabel: 'Name', businessAddressLabel: 'Address', businessPhoneLabel: 'Phone', businessEmailLabel: 'Email', websiteLabel: 'Website',
  thankYouText: 'Thank You!', trustText: 'FOR YOUR TRUST', paymentStatusText: 'PAYMENT STATUS: UNPAID', amountPaidLabel: 'Amount paid:', dueAmountLabel: 'Due amount:',
  signatureDataUrl: '', showSignature: false, signatureName: '', signatureTitle: 'Authorised Signatory', signatureWidth: 170, signatureAlignment: 'right', signatureCaption: 'AUTHORISED SIGNATORY',
  qrWidth: 82, qrPosition: 'right', qrCaption: 'SCAN TO PAY', qrInstruction: 'Scan the QR code with your UPI app to complete payment.',
  invoiceSubtitle: '', invoiceNumberLabel: 'Bill No.', paymentDetailsLabel: 'Payment Details',
  businessGstinLabel: 'GSTIN', customerGstinLabel: 'GSTIN', panLabel: 'PAN', accountNumberLabel: 'A/C', ifscLabel: 'IFSC', upiLabel: 'UPI',
  paymentInstructions: '• Please scan the QR code and pay the amount.\n• After payment, share the screenshot with your order/bill number.\n• For any payment issues, contact us.\n• Thank you for your business.',
  documentLabel: 'S. No.', issueDateLabel: 'Invoice Date', dueDateLabel: 'Due Date', referenceLabel: 'Reference', purchaseOrderLabel: 'PO No.', paymentInstructionsLabel: 'Payment Instructions', skuLabel: 'SKU',
  billToLabel: 'BILL TO', billFromLabel: 'BILL BY', itemLabel: 'Description', quantityLabel: 'Pieces', rateLabel: 'Rate (₹)', amountLabel: 'Amount (₹)',
  subtotalLabel: 'Sub Total', discountLabel: 'Discount', taxLabel: 'GST (18%)', totalLabel: 'Total Amount', notesLabel: 'NOTES', termsLabel: 'TERMS & CONDITIONS',
  pageSize: 'A4', pageOrientation: 'portrait', paperBackground: '#ffffff', fontSize: 10, frameStyle: 'thin', headerStyle: 'line', tableStyle: 'clean', tableDensity: 'normal',
  showBusinessGstin: true, showCustomerGstin: true, showSku: false, showPaymentInstructions: true, showFooter: true,
  paperPattern: 'plain', backgroundImageDataUrl: '', backgroundImageOpacity: 24, backgroundImageFit: 'cover', showWatermark: false, watermarkText: 'SPYRIX', watermarkOpacity: 7,
};

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false, hint, children, className = '' }) {
  return <label className={`ic-field ${className}`}><span>{label}</span>{children || (multiline ? <textarea value={value ?? ''} placeholder={placeholder} onChange={event => onChange(event.target.value)} rows={3}/> : <input type={type} value={value ?? ''} placeholder={placeholder} onChange={event => onChange(event.target.value)}/>)}{hint && <small>{hint}</small>}</label>;
}

function Section({ title, description, icon, children, defaultOpen = false, id }) {
  const [open, setOpen] = useState(defaultOpen);
  return <section id={id} className="ic-editor-section"><button className="ic-section-toggle" type="button" onClick={() => setOpen(value => !value)}><span className="ic-section-icon">{icon}</span><span className="ic-section-name"><b>{title}</b><small>{description}</small></span>{open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>{open && <div className="ic-section-content">{children}</div>}</section>;
}

function UploadAsset({ title, hint, value, onUpload, onRemove, icon: Icon }) {
  return <div className="ic-upload-row"><div className="ic-logo-thumb">{value ? <img src={value} alt={title}/> : <Icon size={21}/>}</div><div className="ic-upload-copy"><b>{title}</b><small>{hint}</small></div><label className="ic-small-upload">{value ? 'Replace' : 'Upload'}<input type="file" accept="image/*" onChange={onUpload}/></label>{value && <button type="button" className="ic-icon-button" onClick={onRemove} title={`Remove ${title}`}><Trash2 size={14}/></button>}</div>;
}

export default function InvoiceCreatorPage({ mode = 'invoice' }) {
  const isTemplateMode = mode === 'template' || mode === 'preview';
  const navigate = useNavigate();
  const location = useLocation();
  const editId = new URLSearchParams(location.search).get('edit') || '';
  const { business, session } = useAuth();
  const { records = {}, createRecord, updateRecord, loading: dataLoading } = useData();
  const [prefillDraft] = useState(() => { try { const raw = sessionStorage.getItem('spyrix_invoice_prefill'); if (!raw) return null; sessionStorage.removeItem('spyrix_invoice_prefill'); return JSON.parse(raw); } catch { return null; } });
  const [saving, setSaving] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(editId);
  const editLoadedRef = useRef('');
  const [exportingFormat, setExportingFormat] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDesignTools, setShowDesignTools] = useState(isTemplateMode);
  const [showQuickDesigns, setShowQuickDesigns] = useState(false);
  const [manualStep, setManualStep] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [customerId, setCustomerId] = useState(() => !isTemplateMode ? (prefillDraft?.customerId || '') : '');
  const [customer, setCustomer] = useState(() => isTemplateMode ? { ...sampleCustomer } : { ...blankCustomer, ...(prefillDraft?.customer || {}) });
  const [customerSearch, setCustomerSearch] = useState('');
  const [updatingCustomerProfile, setUpdatingCustomerProfile] = useState(false);
  const [creatingCustomerFromInvoice, setCreatingCustomerFromInvoice] = useState(false);
  const [meta, setMeta] = useState(() => ({ issueDate: prefillDraft?.issueDate || (isTemplateMode ? '2025-10-30' : today), dueDate: prefillDraft?.dueDate || (isTemplateMode ? '2025-11-30' : future), invoiceNumber: isTemplateMode ? '' : `SPY-${new Date().getFullYear()}-001`, manualInvoiceNumber: isTemplateMode, purchaseOrder: prefillDraft?.purchaseOrder || '', reference: prefillDraft?.reference || '', notes: prefillDraft?.notes || 'Thank you for choosing our business.', terms: prefillDraft?.terms || 'Payment is due by the due date shown above.' }));
  const [design, setDesign] = useState(() => {
    const saved = loadInvoiceDesign();
    const fromQuote = prefillDraft?.design || {};
    const templateId = prefillDraft?.templateId || fromQuote.templateId || saved.templateId || defaultDesign.templateId;
    return { ...defaultDesign, ...saved, ...fromQuote, templateId, businessName: saved.businessName || business?.name || defaultDesign.businessName, businessAddress: saved.businessAddress || business?.address || defaultDesign.businessAddress, businessPhone: saved.businessPhone || business?.phone || defaultDesign.businessPhone, businessEmail: saved.businessEmail || business?.email || defaultDesign.businessEmail, businessWebsite: saved.businessWebsite || business?.website || defaultDesign.businessWebsite, businessGstin: saved.businessGstin || business?.gstin || defaultDesign.businessGstin };
  });
  const [items, setItems] = useState(() => {
    if (isTemplateMode) return sampleItems;
    if (Array.isArray(prefillDraft?.items) && prefillDraft.items.length) return prefillDraft.items.map((item, index) => ({ ...emptyLine(), ...item, id: `quote-line-${Date.now()}-${index}`, quantity: Number(item.quantity || 1), rate: Number(item.rate || 0), discount: Number(item.discount || 0), taxRate: Number(item.taxRate || 0) }));
    return [emptyLine()];
  });
  const [customFields, setCustomFields] = useState(() => Array.isArray(prefillDraft?.customFields) ? prefillDraft.customFields : []);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [templateEditorScale, setTemplateEditorScale] = useState(1);
  const [previewDevice, setPreviewDevice] = useState(() => window.matchMedia?.('(max-width: 820px)').matches ? 'mobile' : 'desktop');
  const [activeToolTab, setActiveToolTab] = useState('Design');
  const [selectedPreviewSection, setSelectedPreviewSection] = useState('');
  const [selectedTextElementId, setSelectedTextElementId] = useState('');
  const [templateCategory, setTemplateCategory] = useState('All');
  const [templateSearch, setTemplateSearch] = useState('');
  const [exportScale, setExportScale] = useState('3');
  const historyRef = useRef({ past: [], future: [], last: null, applying: false });
  const invoicePaperRef = useRef(null);
  const mobileTapTimeRef = useRef(0);
  const genericLogoDragRef = useRef(null);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  // Apply the invoice-wide font size to every text-bearing element in the live invoice.
  // Keep each element's original size so the scale does not compound on slider changes.
  useEffect(() => {
    const paper = invoicePaperRef.current;
    if (!paper) return;
    const scale = Math.max(0.7, Math.min(1.8, Number(design.fontSize || 10) / 10));
    const elements = [paper, ...paper.querySelectorAll('*')];
    const skipped = element => element.matches('svg, img, video, canvas, input, textarea, select, button, [contenteditable="true"]');
    // Read all natural sizes before applying overrides so inherited sizes never compound.
    elements.forEach(element => {
      if (skipped(element) || element.dataset.spyrixBaseFontSize) return;
      const computed = Number.parseFloat(window.getComputedStyle(element).fontSize);
      if (Number.isFinite(computed) && computed > 0) element.dataset.spyrixBaseFontSize = String(computed);
    });
    elements.forEach(element => {
      if (skipped(element)) return;
      const base = Number.parseFloat(element.dataset.spyrixBaseFontSize || '');
      if (Number.isFinite(base) && base > 0) {
        element.style.setProperty('font-size', `${Math.max(6, Math.min(72, base * scale))}px`, 'important');
      }
    });
  }, [design.fontSize, design.templateId, design.elementStyles, customer, meta, items, customFields]);

  useEffect(() => {
    const snapshot = JSON.stringify({ customer, meta, design, items, customFields });
    const history = historyRef.current;
    if (history.last === null) { history.last = snapshot; return; }
    if (history.applying) { history.applying = false; history.last = snapshot; setHistoryState({ canUndo: history.past.length > 0, canRedo: history.future.length > 0 }); return; }
    if (history.last === snapshot) return;
    history.past.push(history.last);
    if (history.past.length > 60) history.past.shift();
    history.future = [];
    history.last = snapshot;
    setHistoryState({ canUndo: history.past.length > 0, canRedo: false });
  }, [customer, meta, design, items, customFields]);

  useEffect(() => {
    if (!editId || isTemplateMode || dataLoading || editLoadedRef.current === editId) return;
    const invoice = (records.invoices || []).find(row => String(row.id) === String(editId));
    if (!invoice) {
      editLoadedRef.current = editId;
      setError('This invoice could not be found in your current workspace. Refresh the invoice list and try again.');
      return;
    }
    if (invoice.status !== 'draft') {
      editLoadedRef.current = editId;
      setError('Only draft invoices can be edited. Issued invoices are kept as financial history.');
      return;
    }
    editLoadedRef.current = editId;
    setEditingInvoiceId(invoice.id);
    setCustomerId(invoice.customerId || '');
    setCustomer({ ...blankCustomer, ...(invoice.customerSnapshot || {}), name: invoice.customerSnapshot?.name || invoice.customerName || '' });
    setCustomerSearch('');
    setMeta(current => ({
      ...current,
      issueDate: invoice.issueDate || today,
      dueDate: invoice.dueDate || future,
      invoiceNumber: invoice.invoiceNumber || current.invoiceNumber,
      manualInvoiceNumber: false,
      purchaseOrder: invoice.purchaseOrder || '',
      reference: invoice.reference || '',
      notes: invoice.notes || '',
      terms: invoice.terms || '',
    }));
    const rowDesign = invoice.design || {};
    setDesign(current => ({ ...current, ...rowDesign, templateId: invoice.templateId || rowDesign.templateId || current.templateId }));
    const loadedItems = (invoice.items || []).map((line, index) => ({
      ...emptyLine(), ...line, id: `edit-${invoice.id}-${index}`,
      name: line.name || line.description || '', quantity: Number(line.quantity || 1),
      rate: Number(line.rate || 0), discount: Number(line.discount || 0), taxRate: Number(line.taxRate || 0),
    }));
    setItems(loadedItems.length ? loadedItems : [emptyLine()]);
    setCustomFields(Array.isArray(invoice.customFields) ? invoice.customFields : []);
    setNotice(`Editing draft ${invoice.invoiceNumber || 'invoice'}.`);
  }, [editId, isTemplateMode, dataLoading, records.invoices]);

  useEffect(() => {
    if (!business) return;
    setDesign(current => ({
      ...current,
      businessName: current.businessName || business.name || '',
      businessAddress: current.businessAddress || business.address || '',
      businessPhone: current.businessPhone || business.phone || '',
      businessEmail: current.businessEmail || business.email || '',
      businessWebsite: current.businessWebsite || business.website || '',
      businessGstin: current.businessGstin || business.gstin || '',
    }));
  }, [business]);

  useEffect(() => {
    const root = invoicePaperRef.current;
    if (!root) return;
    Object.entries(design.textOverrides || {}).forEach(([id, value]) => {
      let node = root.querySelector(`[data-generic-text-id="${id}"]`);
      // Dynamically assigned IDs also work for text nodes that do not need a special template wrapper.
      // Rebuild their DOM path after React re-renders so direct edits remain visible and printable.
      if (!node && id.startsWith('generic-text-')) {
        node = root;
        const indexes = id.slice('generic-text-'.length).split('-').map(Number);
        for (const index of indexes) node = node?.children?.[index] || null;
        if (node) node.setAttribute('data-generic-text-id', id);
      }
      if (node && !node.matches('.xen-inline-edit') && !node.isContentEditable && node.innerText !== String(value ?? '')) {
        node.innerText = String(value ?? '');
      }
    });
  }, [design.textOverrides, design.templateId]);

  useEffect(() => {
    const updateDevice = () => setPreviewDevice(window.innerWidth <= 820 ? 'mobile' : 'desktop');
    window.addEventListener('resize', updateDevice, { passive: true });
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  useEffect(() => {
    const wrap = invoicePaperRef.current?.parentElement;
    if (!wrap) return undefined;
    const update = () => {
      const available = Math.max(250, wrap.clientWidth - 30);
      setTemplateEditorScale(Math.min(1, available / 794));
    };
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(wrap);
    window.addEventListener('resize', update, { passive: true });
    return () => { observer?.disconnect(); window.removeEventListener('resize', update); };
  }, [design.templateId, previewDevice]);

  const setD = (key, value) => setDesign(current => ({ ...current, [key]: value }));
  const onGenericLogoPointerDown = event => {
    if (event.button > 0) return;
    event.preventDefault();
    genericLogoDragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: Number(design.logoOffsetX || 0), y: Number(design.logoOffsetY || 0) };
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* capture is optional in some browsers */ }
  };
  const onGenericLogoPointerMove = event => {
    const drag = genericLogoDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const zoom = Math.max(.7, Number(previewZoom || 100) / 100);
    const x = Math.max(-160, Math.min(160, Math.round(drag.x + (event.clientX - drag.startX) / zoom)));
    const y = Math.max(-100, Math.min(100, Math.round(drag.y + (event.clientY - drag.startY) / zoom)));
    setDesign(current => ({ ...current, logoOffsetX: x, logoOffsetY: y }));
  };
  const onGenericLogoPointerUp = event => {
    genericLogoDragRef.current = null;
    try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch { /* capture may already be released */ }
  };
  const selectedTextStyle = selectedTextElementId ? (design.elementStyles?.[selectedTextElementId] || {}) : {};
  const updateSelectedTextStyle = (key, value) => {
    if (!selectedTextElementId) { setD(key, value); return; }
    setD('elementStyles', {
      ...(design.elementStyles || {}),
      [selectedTextElementId]: { ...(design.elementStyles?.[selectedTextElementId] || {}), [key]: value },
    });
  };
  const resetSelectedTextStyle = () => {
    if (!selectedTextElementId) return;
    setD('elementStyles', Object.fromEntries(Object.entries(design.elementStyles || {}).filter(([key]) => key !== selectedTextElementId)));
  };
  const selectedCustomerRecord = (records.customers || []).find(row => String(row.id) === String(customerId));
  const hasCustomerProfileChanges = Boolean(selectedCustomerRecord && customerProfileKeys.some(key => !sameCustomerField(customer[key], selectedCustomerRecord[key])));
  const customerSearchTerm = customerSearch.trim().toLowerCase();
  const visibleCustomers = (records.customers || []).filter(row => {
    const haystack = [row.customerCode, row.name, row.companyName, row.email, row.phone, row.alternatePhone].filter(Boolean).join(' ').toLowerCase();
    return !customerSearchTerm || haystack.includes(customerSearchTerm) || String(row.id) === String(customerId);
  });

  const applyLayoutPreset = preset => {
    const { id, name, description, ...styles } = preset;
    setDesign(current => ({ ...current, ...styles, tableDensity: styles.tableDensity || 'normal' }));
  };
  const applyPaperBackground = color => setD('paperBackground', color);
  const activePaperBackground = paperBackgrounds.find(item => item.color.toLowerCase() === String(design.paperBackground || '#ffffff').toLowerCase());
  const activeLayoutPreset = layoutPresets.find(item => item.accentColor === design.accentColor && item.fontFamily === design.fontFamily && item.headerStyle === design.headerStyle && item.tableStyle === design.tableStyle && item.frameStyle === design.frameStyle);
  const completionChecks = [
    { label: 'Business identity', done: Boolean(design.businessName?.trim() && design.businessAddress?.trim()) },
    { label: 'Customer details', done: Boolean(customer.name?.trim()) },
    { label: 'Invoice items', done: items.some(item => item.name?.trim() && money(item.quantity) > 0) },
    { label: 'Brand asset', done: Boolean(design.logoDataUrl) },
  ];
  const completionProgress = Math.round(completionChecks.filter(item => item.done).length / completionChecks.length * 100);
  const setM = (key, value) => setMeta(current => ({ ...current, [key]: value }));
  const setC = (key, value) => setCustomer(current => ({ ...current, [key]: value }));
  const selectedTemplate = invoiceTemplates.find(template => template.id === design.templateId) || invoiceTemplates[0];
  const isNewSpyrixTemplate = selectedTemplate.id !== 'xenmark' && Array.isArray(selectedTemplate.parts);
  const quickTemplates = invoiceTemplates.filter(template => (templateCategory === 'All' || template.category === templateCategory) && `${template.name} ${template.category}`.toLowerCase().includes(templateSearch.trim().toLowerCase())).slice(0, 6);
  const backgroundFade = Math.max(0, Math.min(100, Number(design.backgroundImageOpacity ?? 24))) / 100;
  const backgroundTint = design.paperBackground || '#ffffff';
  const invoiceBackgroundImage = design.backgroundImageDataUrl ? `linear-gradient(color-mix(in srgb, ${backgroundTint} ${100 - Math.round(backgroundFade * 100)}%, transparent), color-mix(in srgb, ${backgroundTint} ${100 - Math.round(backgroundFade * 100)}%, transparent)), url("${design.backgroundImageDataUrl}")` : (paperPatternStyles[design.paperPattern || 'plain'] === 'none' ? 'none' : paperPatternStyles[design.paperPattern || 'plain']);
  const calculations = useMemo(() => {
    const lines = items.map(item => {
      const quantity = Math.max(0, money(item.quantity));
      const rate = Math.max(0, money(item.rate));
      const discount = Math.min(quantity * rate, Math.max(0, money(item.discount)));
      const taxable = Math.max(0, quantity * rate - discount);
      const tax = taxable * Math.max(0, Math.min(100, money(item.taxRate))) / 100;
      return { ...item, quantity, rate, discount, taxable, tax, lineTotal: taxable + tax };
    });
    return { lines, subtotal: lines.reduce((sum, item) => sum + item.quantity * item.rate, 0), discount: lines.reduce((sum, item) => sum + item.discount, 0), tax: lines.reduce((sum, item) => sum + item.tax, 0), total: lines.reduce((sum, item) => sum + item.lineTotal, 0) };
  }, [items]);

  const chooseCustomer = value => {
    const found = (records.customers || []).find(item => String(item.id) === String(value));
    setCustomerId(value || '');
    if (found) {
      setCustomer(customerToInvoiceFields(found));
      setCustomerSearch('');
      setNotice(`Filled invoice customer details from ${found.name || 'the saved customer profile'}.`);
      setError('');
    } else {
      setCustomer({ ...blankCustomer });
      setCustomerSearch('');
      setNotice('Enter customer details manually, or search and select a saved customer.');
    }
  };
  const createCustomerFromInvoice = async () => {
    if (customerId) {
      setError('A saved customer is already selected. Use Update customer profile to change that record.');
      return;
    }
    if (!customer.name.trim()) {
      setError('Enter a customer name before saving the customer profile.');
      return;
    }
    if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      setError('Enter a valid customer email address or leave the email field blank.');
      return;
    }
    const email = String(customer.email || '').trim().toLowerCase();
    const phone = String(customer.phone || '').replace(/\D/g, '');
    const duplicate = (records.customers || []).find(row =>
      (email && String(row.email || '').trim().toLowerCase() === email) ||
      (phone.length >= 7 && String(row.phone || '').replace(/\D/g, '') === phone)
    );
    if (duplicate) {
      if (window.confirm(`A customer with the same email or phone already exists: ${duplicate.name}.\n\nUse the existing customer and auto-fill this invoice instead?`)) {
        chooseCustomer(duplicate.id);
        return;
      }
      if (!window.confirm('Create a separate customer profile anyway? This may create a duplicate customer.')) return;
    }
    setCreatingCustomerFromInvoice(true);
    setError('');
    setNotice('');
    try {
      const created = await createRecord('customers', customerProfilePayload(customer));
      setCustomerId(created.id);
      setCustomer(customerToInvoiceFields(created));
      setCustomerSearch('');
      setNotice(`Customer ${created.name} saved to Customers and selected for this invoice.`);
    } catch (err) {
      setError(err.message || 'Could not save this customer profile.');
    } finally {
      setCreatingCustomerFromInvoice(false);
    }
  };
  const updateSelectedCustomerProfile = async () => {
    if (!selectedCustomerRecord) {
      setError('Select a saved customer before updating their profile.');
      return;
    }
    if (!customer.name.trim()) {
      setError('Customer name is required before updating the saved profile.');
      return;
    }
    if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      setError('Enter a valid customer email address or leave the email field blank.');
      return;
    }
    if (!hasCustomerProfileChanges) {
      setNotice('The invoice customer details already match the saved customer profile.');
      setError('');
      return;
    }
    const confirmed = window.confirm(`Update ${selectedCustomerRecord.name || 'this customer'} in Customers with the details currently entered in this invoice?\n\nExisting invoices keep their saved customer snapshots. This updates only the customer profile and the current invoice data.`);
    if (!confirmed) return;
    setUpdatingCustomerProfile(true);
    setError('');
    setNotice('');
    try {
      const updated = await updateRecord('customers', selectedCustomerRecord.id, customerProfilePayload(customer));
      setCustomer(customerToInvoiceFields(updated || customer));
      setCustomerSearch('');
      setNotice(`Customer profile for ${updated?.name || customer.name} updated successfully.`);
    } catch (err) {
      setError(err.message || 'Could not update the saved customer profile.');
    } finally {
      setUpdatingCustomerProfile(false);
    }
  };
  const updateLine = (id, key, value) => setItems(current => current.map(line => line.id === id ? { ...line, [key]: value } : line));
  const addLine = () => setItems(current => [...current, emptyLine()]);
  const removeLine = id => setItems(current => current.length > 1 ? current.filter(line => line.id !== id) : current);
  const chooseProduct = (lineId, productId) => {
    const product = (records.products || []).find(row => row.id === productId);
    if (!product) return updateLine(lineId, 'productId', '');
    setItems(current => current.map(line => line.id === lineId ? { ...line, productId, name: product.name || '', description: product.description || '', sku: product.sku || '', unit: product.unit || 'pcs', rate: Number(product.price || 0), taxRate: Number(product.taxRate || 0) } : line));
  };
  const uploadAsset = key => async event => {
    try { const flattenBackground = key === 'logoDataUrl' || key === 'qrDataUrl'; const dataUrl = await readImageFile(event.target.files?.[0], 6 * 1024 * 1024, { flattenBackground, background: '#ffffff', maxDimension: key === 'qrDataUrl' ? 1600 : 1400 }); setD(key, dataUrl); if (key === 'logoDataUrl') setD('showLogo', true); if (key === 'qrDataUrl') setD('showQr', true); if (key === 'signatureDataUrl') setD('showSignature', true); setError(''); }
    catch (err) { setError(err.message); }
    event.target.value = '';
  };

  const saveTemplateDesign = async () => {
    const suggested = `${design.businessName || 'SPYRIX'} ${selectedTemplate.name || 'Invoice'} Design`.trim();
    const requestedName = window.prompt('Name this reusable invoice design:', suggested);
    if (requestedName === null) return;
    const templateName = requestedName.trim().slice(0, 100);
    if (!templateName) { setError('Enter a name for your reusable template.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const designToSave = { ...design, templateId: selectedTemplate.id };
      const currentSavedTemplate = (records.templates || []).find(item => item.id === design.customTemplateId);
      const templatePayload = {
        name: templateName,
        description: `Custom invoice design based on ${selectedTemplate.name}.`,
        category: 'Custom',
        templateId: selectedTemplate.id,
        design: designToSave,
        favorite: Boolean(currentSavedTemplate?.favorite),
      };
      const savedTemplate = currentSavedTemplate
        ? await updateRecord('templates', currentSavedTemplate.id, templatePayload)
        : await createRecord('templates', templatePayload);
      const saved = { ...designToSave, customTemplateId: savedTemplate.id };
      setDesign(saved);
      saveInvoiceDesign(saved);
      window.dispatchEvent(new CustomEvent('spyrix:invoice-design-updated'));
      let settingsWarning = '';
      if (localStorage.getItem('spyrix_token')) {
        try {
          await apiRequest('/business/settings', { method: 'PUT', body: JSON.stringify({ invoiceDesign: saved }) });
        } catch (settingsError) {
          settingsWarning = ` The template is saved, but the workspace default could not be updated: ${settingsError.message}`;
        }
      }
      setNotice(`Reusable template “${savedTemplate.name}” saved successfully.${settingsWarning}`);
      window.setTimeout(() => navigate('/app/templates'), 1200);
    } catch (err) { setError(err.message || 'Could not save this reusable invoice template.'); }
    finally { setSaving(false); }
  };

  const saveInvoice = async status => {
    if (updatingCustomerProfile || creatingCustomerFromInvoice) {
      setError('Wait for the customer profile operation to finish before saving this invoice.');
      return;
    }
    setError(''); setNotice('');
    if (!customer.name.trim()) return setError('Add a customer name before saving this invoice.');
    if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) return setError('Enter a valid customer email address or leave the email field blank.');
    const activeLines = items.filter(item => item.name.trim());
    if (!activeLines.length) return setError('Add at least one invoice item with a description.');
    if (activeLines.some(item => money(item.quantity) <= 0 || money(item.rate) < 0 || money(item.discount) < 0 || money(item.discount) > money(item.quantity) * money(item.rate) || money(item.taxRate) < 0 || money(item.taxRate) > 100)) return setError('Check item quantities, prices, discounts and tax rates. Quantity must be above zero, discount cannot exceed the line value, and tax must be between 0 and 100%.');
    if (calculations.total < 0) return setError('Invoice total cannot be negative.');
    setSaving(true);
    try {
      let savedCustomerId = customerId;
      const customerRows = records.customers || [];
      let selectedCustomer = customerRows.find(row => String(row.id) === String(savedCustomerId));
      if (!selectedCustomer) {
        const email = String(customer.email || '').trim().toLowerCase();
        const phone = String(customer.phone || '').replace(/\D/g, '');
        const possibleDuplicate = customerRows.find(row => (email && String(row.email || '').trim().toLowerCase() === email) || (phone.length >= 7 && String(row.phone || '').replace(/\D/g, '') === phone));
        if (possibleDuplicate) {
          const useExisting = window.confirm(`A customer with the same email or phone already exists: ${possibleDuplicate.name}.

Use this existing customer instead of creating a duplicate?`);
          if (useExisting) {
            selectedCustomer = possibleDuplicate; savedCustomerId = possibleDuplicate.id; setCustomerId(possibleDuplicate.id);
          } else if (!window.confirm('Create a separate customer record anyway? This may create a duplicate in your customer list.')) {
            throw new Error('Invoice save cancelled. Select the existing customer or confirm creating a separate customer.');
          }
        }
      }
      if (!savedCustomerId || !customerRows.some(row => String(row.id) === String(savedCustomerId))) {
        const createdCustomer = await createRecord('customers', { ...customer, name: customer.name.trim() });
        savedCustomerId = createdCustomer.id;
        selectedCustomer = createdCustomer;
        setCustomerId(createdCustomer.id);
      } else if (selectedCustomer) {
        const changed = customerProfileKeys.some(key => !sameCustomerField(customer[key], selectedCustomer[key]));
        if (changed && window.confirm(`Would you like to update ${selectedCustomer.name || 'this customer'}'s saved customer profile with the details entered on this invoice?\n\nChoose Cancel to keep the new details only on this invoice.`)) {
          await updateRecord('customers', selectedCustomer.id, customerProfilePayload(customer));
        }
      }
      const payload = {
        customerId: savedCustomerId,
        customerName: customer.name,
        ...(!editingInvoiceId && prefillDraft?.sourceQuotationId ? { sourceQuotationId: prefillDraft.sourceQuotationId, sourceQuotationNumber: prefillDraft.sourceQuotationNumber || '' } : {}),
        customerSnapshot: { ...customer },
        items: calculations.lines.filter(line => line.name.trim()).map(({ id: lineId, taxable, tax, lineTotal, ...line }) => ({ ...line, quantity: Number(line.quantity), rate: Number(line.rate), discount: Number(line.discount || 0), taxRate: Number(line.taxRate || 0) })),
        ...(meta.manualInvoiceNumber && String(meta.invoiceNumber || '').trim() ? { invoiceNumber: String(meta.invoiceNumber).trim() } : {}),
        issueDate: meta.issueDate, dueDate: meta.dueDate, purchaseOrder: meta.purchaseOrder, reference: meta.reference,
        notes: meta.notes, terms: meta.terms, customFields, templateId: design.templateId, design, subtotal: calculations.subtotal, discount: calculations.discount, tax: calculations.tax, total: calculations.total, status: 'draft',
      };
      saveInvoiceDesign(design);
      let savedInvoice;
      if (editingInvoiceId) {
        savedInvoice = await updateRecord('invoices', editingInvoiceId, payload);
      } else {
        savedInvoice = await createRecord('invoices', payload);
      }
      if (status === 'issued' && savedInvoice?.status !== 'issued') {
        savedInvoice = await updateRecord('invoices', savedInvoice.id, { status: 'issued' });
      }
      if (!editingInvoiceId && prefillDraft?.sourceQuotationId) {
        const sourceQuote = (records.quotations || []).find(row => row.id === prefillDraft.sourceQuotationId);
        if (sourceQuote) await updateRecord('quotations', sourceQuote.id, { status: 'converted', convertedInvoiceId: savedInvoice.id });
      }
      setNotice(status === 'issued'
        ? `Invoice ${savedInvoice?.invoiceNumber || meta.invoiceNumber} saved and marked as issued.`
        : `Invoice ${savedInvoice?.invoiceNumber || meta.invoiceNumber} draft saved successfully.`);
      window.setTimeout(() => navigate('/app/invoices'), 900);
    } catch (err) { setError(err.message || 'Could not save this invoice. Please try again.'); }
    finally { setSaving(false); }
  };

  const restoreEditorSnapshot = serialized => {
    if (!serialized) return;
    const snapshot = JSON.parse(serialized);
    historyRef.current.applying = true;
    setCustomer(snapshot.customer || { ...blankCustomer });
    setMeta(snapshot.meta || {});
    setDesign(snapshot.design || { ...defaultDesign });
    setItems(snapshot.items || [emptyLine()]);
    setCustomFields(snapshot.customFields || []);
  };
  const undo = () => {
    const history = historyRef.current;
    if (!history.past.length) return;
    const previous = history.past.pop();
    if (history.last) history.future.push(history.last);
    history.last = previous;
    restoreEditorSnapshot(previous);
    setHistoryState({ canUndo: history.past.length > 0, canRedo: history.future.length > 0 });
  };
  const redo = () => {
    const history = historyRef.current;
    if (!history.future.length) return;
    const next = history.future.pop();
    if (history.last) history.past.push(history.last);
    history.last = next;
    restoreEditorSnapshot(next);
    setHistoryState({ canUndo: history.past.length > 0, canRedo: history.future.length > 0 });
  };

  const confirmCustomerProfileBeforeOutput = async () => {
    if (isTemplateMode || !selectedCustomerRecord || !hasCustomerProfileChanges) return 'unchanged';
    if (!customer.name.trim()) throw new Error('Customer name is required before updating the saved profile.');
    if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      throw new Error('Enter a valid customer email address or leave the email field blank.');
    }
    const confirmed = window.confirm(`Would you like to update ${selectedCustomerRecord.name || 'this customer'} in Customers with the details entered in this invoice?\n\nChoose Cancel to keep these details only on this invoice. Existing invoice snapshots will not change.`);
    if (!confirmed) return 'declined';
    setUpdatingCustomerProfile(true);
    try {
      const updated = await updateRecord('customers', selectedCustomerRecord.id, customerProfilePayload(customer));
      setCustomer(customerToInvoiceFields(updated || customer));
      setNotice(`Customer profile for ${updated?.name || customer.name} updated successfully.`);
      return 'updated';
    } finally {
      setUpdatingCustomerProfile(false);
    }
  };
  const openExactPdfPrint = (paper, profileSyncResult = 'unchanged') => {
    if (!paper) throw new Error('Invoice canvas was not found. Please wait for the preview to finish rendering.');
    const isXenmark = paper.classList.contains('template-xenmark');
    const orientation = isXenmark
      ? (paper.classList.contains('is-landscape') ? 'landscape' : 'portrait')
      : (design.pageOrientation === 'landscape' ? 'landscape' : 'portrait');
    const requestedSize = String(design.pageSize || 'A4').toUpperCase();
    const pageSize = ['A4', 'A5', 'LETTER', 'LEGAL'].includes(requestedSize) ? requestedSize : 'A4';
    const dimensions = { A4: [210, 297], A5: [148, 210], LETTER: [216, 279], LEGAL: [216, 356] };
    let [pageWidth, pageHeight] = dimensions[pageSize];
    if (orientation === 'landscape') [pageWidth, pageHeight] = [pageHeight, pageWidth];

    // Native print-to-PDF is intentional here: it prints the real invoice DOM with its current
    // CSS and uploaded data-URL images. Rasterizing the editor through SVG foreignObject changes
    // container-unit sizing in some browsers and can lose transparent logos/QR codes.
    document.getElementById('spyrix-invoice-print-page')?.remove();
    document.getElementById('spyrix-invoice-print-split')?.remove();
    let splitPrintContainer = null;
    const shouldSplitPrint = items.length > 6 && !paper.classList.contains('is-spyr-template');
    if (shouldSplitPrint) {
      // Keep the live editor untouched. Print two faithful DOM copies with the line items split 6 + remainder.
      splitPrintContainer = document.createElement('div');
      splitPrintContainer.id = 'spyrix-invoice-print-split';
      splitPrintContainer.setAttribute('aria-hidden', 'true');
      const firstPage = paper.cloneNode(true);
      const secondPage = paper.cloneNode(true);
      firstPage.classList.add('ic-print-split-page', 'ic-print-split-first');
      secondPage.classList.add('ic-print-split-page', 'ic-print-split-second');
      [firstPage, secondPage].forEach(page => {
        page.querySelectorAll('.ic-editor-only,.xen-add-item-editor,.xen-upload-chip,.xen-upload-empty,input').forEach(node => node.remove());
      });
      const rowSelector = '.xen-items-table tbody tr, .ic-preview-table tbody tr';
      const firstRows = firstPage.querySelectorAll(rowSelector);
      firstRows.forEach((row, index) => { if (index >= 6) row.remove(); });
      const secondRows = secondPage.querySelectorAll(rowSelector);
      secondRows.forEach((row, index) => { if (index < 6) row.remove(); });
      splitPrintContainer.append(firstPage, secondPage);
      document.querySelector('.invoice-creator .ic-preview-area')?.appendChild(splitPrintContainer);
    }
    const style = document.createElement('style');
    style.id = 'spyrix-invoice-print-page';
    style.textContent = `
      @media print {
        @page { size: ${pageSize} ${orientation}; margin: 0; }
        html, body, #root { margin:0!important; padding:0!important; width:${pageWidth}mm!important; min-height:0!important; background:#fff!important; }
        .app-shell, .app-shell .main-area, .app-shell .page-content, .invoice-creator { height:0!important; min-height:0!important; margin:0!important; padding:0!important; overflow:visible!important; }
        body * { visibility:hidden!important; }
        .invoice-creator .ic-preview-area, .invoice-creator .ic-preview-area * { visibility:visible!important; }
        #spyrix-invoice-print-split { display:block!important; position:relative!important; width:${pageWidth}mm!important; }
        #spyrix-invoice-print-split .ic-print-split-page { position:relative!important; inset:auto!important; display:block!important; page-break-after:always!important; break-after:page!important; zoom:1!important; transform:none!important; }
        #spyrix-invoice-print-split .ic-print-split-page:last-child { page-break-after:auto!important; break-after:auto!important; }
        #spyrix-invoice-print-split .ic-print-split-page:not(.template-xenmark) { box-sizing:border-box!important; width:${pageWidth}mm!important; max-width:none!important; min-height:${pageHeight}mm!important; height:auto!important; margin:0!important; padding:12mm!important; overflow:visible!important; box-shadow:none!important; border-radius:0!important; }
        #spyrix-invoice-print-split .ic-print-split-first:not(.template-xenmark) .ic-summary-area,
        #spyrix-invoice-print-split .ic-print-split-first:not(.template-xenmark) .ic-payment-qr,
        #spyrix-invoice-print-split .ic-print-split-first:not(.template-xenmark) .ic-signature-block,
        #spyrix-invoice-print-split .ic-print-split-first:not(.template-xenmark) .ic-paper-footer { display:none!important; }
        #spyrix-invoice-print-split .ic-print-split-second:not(.template-xenmark) .ic-document-top,
        #spyrix-invoice-print-split .ic-print-split-second:not(.template-xenmark) .ic-document-meta,
        #spyrix-invoice-print-split .ic-print-split-second:not(.template-xenmark) .ic-parties,
        #spyrix-invoice-print-split .ic-print-split-second:not(.template-xenmark) .ic-extra-fields { display:none!important; }
        #spyrix-invoice-print-split .ic-print-split-page:not(.template-xenmark) .ic-preview-table { width:100%!important; break-inside:auto!important; }
        #spyrix-invoice-print-split .ic-print-split-page:not(.template-xenmark) .ic-preview-table tr { break-inside:avoid!important; }
        #spyrix-invoice-print-split .ic-print-split-first .xen-payment-total-grid,
        #spyrix-invoice-print-split .ic-print-split-first .xen-service-ribbon,
        #spyrix-invoice-print-split .ic-print-split-first .xen-footer { display:none!important; }
        #spyrix-invoice-print-split .ic-print-split-second .xen-masthead,
        #spyrix-invoice-print-split .ic-print-split-second .xen-party-grid,
        #spyrix-invoice-print-split .ic-print-split-second .xen-date-strip { display:none!important; }
        #spyrix-invoice-print-split .ic-print-split-page.template-xenmark .xenmark-invoice { display:flex!important; flex-direction:column!important; gap:3mm!important; height:auto!important; min-height:0!important; overflow:visible!important; }
        #spyrix-invoice-print-split .ic-print-split-page .xen-table-wrap { flex:1 0 auto!important; overflow:visible!important; }
        #spyrix-invoice-print-split .ic-print-split-page .xen-items-table tr { break-inside:avoid!important; }
        ${shouldSplitPrint
          ? '.invoice-creator .ic-preview-area .ic-paper-wrap > .ic-invoice-paper { display:none!important; }'
          : '.invoice-creator .ic-preview-area .ic-paper-wrap > .ic-invoice-paper { display:block!important; }'}
        .invoice-creator .ic-topbar, .invoice-creator .ic-controls, .invoice-creator .ic-design-tools,
        .invoice-creator .ic-preview-toolbar, .invoice-creator .ic-preview-footnote, .invoice-creator .ic-preview-final-actions,
        .invoice-creator .ic-export-modal-backdrop, .invoice-creator .ic-manual-modal-backdrop,
        .invoice-creator .ic-alert, .invoice-creator .ic-notice, .invoice-creator .ic-tools-export { display:none!important; }
        .invoice-creator .ic-workspace { display:block!important; width:${pageWidth}mm!important; height:0!important; min-height:0!important; margin:0!important; padding:0!important; overflow:visible!important; }
        .invoice-creator .ic-preview-area { display:block!important; position:fixed!important; left:0!important; top:0!important; right:auto!important; bottom:auto!important; width:${pageWidth}mm!important; max-width:${pageWidth}mm!important; height:auto!important; min-height:0!important; margin:0!important; padding:0!important; overflow:visible!important; }
        .invoice-creator .ic-paper-wrap { display:block!important; width:${pageWidth}mm!important; max-width:${pageWidth}mm!important; height:auto!important; min-height:0!important; max-height:none!important; margin:0!important; padding:0!important; border:0!important; background:#fff!important; overflow:visible!important; box-shadow:none!important; }
        .invoice-creator .ic-invoice-paper { box-sizing:border-box!important; width:${pageWidth}mm!important; max-width:${pageWidth}mm!important; height:auto!important; min-height:0!important; margin:0!important; box-shadow:none!important; transform:none!important; zoom:1!important; }
        .invoice-creator .ic-invoice-paper.template-xenmark { display:block!important; position:fixed!important; inset:0 auto auto 0!important; width:${pageWidth}mm!important; height:${pageHeight}mm!important; min-height:0!important; max-width:none!important; max-height:${pageHeight}mm!important; padding:3mm!important; margin:0!important; aspect-ratio:auto!important; overflow:hidden!important; border:0!important; border-radius:0!important; box-shadow:none!important; background:#fff!important; }
        .invoice-creator .ic-invoice-paper.template-xenmark .xenmark-invoice { display:grid!important; grid-template-rows:minmax(0,15.5fr) minmax(0,6fr) minmax(0,17fr) minmax(0,5.1fr) minmax(0,15fr) minmax(0,21fr) minmax(0,6.5fr) minmax(0,9.5fr)!important; gap:.6cqw!important; width:100%!important; height:100%!important; min-height:0!important; max-height:none!important; overflow:hidden!important; font-size:clamp(5.5px,1.53cqw,13px)!important; }
        .invoice-creator .ic-invoice-paper.template-xenmark .xen-masthead,
        .invoice-creator .ic-invoice-paper.template-xenmark .xen-party-card { min-height:0!important; }
        .invoice-creator .ic-invoice-paper.template-xenmark.is-landscape { width:${pageWidth}mm!important; height:${pageHeight}mm!important; max-height:${pageHeight}mm!important; }
        .invoice-creator .ic-invoice-paper .ic-editor-only,
        .invoice-creator .ic-invoice-paper .xen-add-item-editor,
        .invoice-creator .ic-invoice-paper .xen-upload-chip,
        .invoice-creator .ic-invoice-paper .xen-upload-empty,
        .invoice-creator .ic-invoice-paper .xen-upload-target input { display:none!important; }
        .invoice-creator .ic-invoice-paper .xen-upload-target { border-color:transparent!important; outline:0!important; }
        .invoice-creator .ic-invoice-paper .xen-inline-edit { outline:0!important; background:transparent!important; caret-color:transparent!important; }
        .invoice-creator .ic-invoice-paper img { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
        * { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
      }
    `;
    document.head.appendChild(style);
    const cleanup = () => { style.remove(); splitPrintContainer?.remove(); };
    window.addEventListener('afterprint', cleanup, { once: true });
    // Some embedded browsers do not dispatch afterprint reliably; clean the temporary stylesheet later.
    window.setTimeout(cleanup, 120000);
    setShowExportModal(false);
    setNotice(`The print dialog is open. Choose “Save as PDF” to preserve the live invoice layout, logo, QR code and uploaded images without changing the design${items.length > 6 ? ' (items split across 2 pages, first six on page 1)' : ''}.${profileSyncResult === 'declined' ? ' The saved customer profile was not changed.' : profileSyncResult === 'updated' ? ' The saved customer profile was updated.' : ''}`);
    window.print();
  };

  const printInvoice = async () => {
    try {
      const profileSyncResult = await confirmCustomerProfileBeforeOutput();
      const paper = document.querySelector('.invoice-creator .ic-invoice-paper');
      openExactPdfPrint(paper, profileSyncResult);
    } catch (err) {
      setError(err?.message || 'Could not prepare the invoice for printing.');
    }
  };
  const doExport = async format => {
    setError(''); setNotice(''); setExportingFormat(format);
    try {
      const profileSyncResult = await confirmCustomerProfileBeforeOutput();
      const paper = document.querySelector('.invoice-creator .ic-invoice-paper');
      if (!paper) throw new Error('Invoice canvas was not found. Please wait for the preview to finish rendering.');
      if (format === 'pdf') {
        openExactPdfPrint(paper, profileSyncResult);
        return;
      }
      let exportResult = null;
      if (format === 'svg') exportResult = await exportInvoiceSvg(paper);
      else exportResult = await exportInvoiceImage(paper, format, Math.max(2, Math.min(4, Number(exportScale) || 3)));
      const assetWarning = exportResult?.safeFallback
        ? ` A browser security restriction required a resource-free export fallback. Text and invoice layout were retained${exportResult.skippedAssets ? `, but ${exportResult.skippedAssets} image asset(s) may be omitted` : ''}. Upload logo, QR and signature images from your device for the best result.`
        : exportResult?.skippedAssets
          ? ` ${exportResult.skippedAssets} external or unsupported image asset(s) were omitted to prevent a blocked download; upload them directly from your device to include them.`
          : '';
      setNotice(`${format.toUpperCase()} export prepared successfully.${assetWarning}${profileSyncResult === 'declined' ? ' Saved customer profile was not changed; the manually entered values are included only in this export.' : profileSyncResult === 'updated' ? ' Saved customer profile updated successfully.' : ''}`);
    } catch (err) {
      const message = err?.message || `Could not export ${format.toUpperCase()}.`;
      const printFallbackEligible = format === 'pdf' && (err?.name === 'InvoiceExportVisualError' || /could not export|could not generate the pdf|renderer|rendered for export|canvas|tainted|blocked|image asset|blank or near-black|uploaded image/i.test(message));
      if (printFallbackEligible) {
        try {
          // Browser printing is the fidelity-preserving fallback: it prints the real live invoice
          // DOM and locally uploaded images, rather than delivering a PDF whose layout/logo was lost.
          const oldStyle = document.getElementById('spyrix-invoice-print-page');
          if (oldStyle) oldStyle.remove();
          const printStyle = document.createElement('style');
          printStyle.id = 'spyrix-invoice-print-page';
          printStyle.textContent = `@media print { @page { size: ${design.pageSize || 'A4'} ${design.pageOrientation || 'portrait'}; margin: 0; } }`;
          document.head.appendChild(printStyle);
          window.addEventListener('afterprint', () => printStyle.remove(), { once: true });
          window.print();
          setError('');
          setNotice('The direct PDF renderer could not preserve every image safely, so the browser print dialog was opened instead. Choose “Save as PDF” to save the actual invoice preview with its original layout and uploaded logo/images.');
        } catch (printError) {
          setError(`${message} The browser print fallback also failed: ${printError?.message || 'printing is unavailable.'}`);
        }
      } else setError(message);
    }
    finally { setExportingFormat(''); }
  };
  const shareInvoice = async () => {
    try {
      const result = await shareInvoiceSummary({ invoiceNumber: meta.invoiceNumber, customerName: customer.name, total: calculations.total });
      setNotice(result === 'copied' ? 'Invoice summary copied to clipboard.' : result === 'email' ? 'Email composer opened with the invoice summary.' : 'Invoice summary shared.');
    } catch (err) { if (err?.name !== 'AbortError') setError(err?.message || 'Could not share this invoice.'); }
  };
  useEffect(() => {
    const onKeyDown = event => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) { event.preventDefault(); undo(); }
      else if (key === 'y' || (key === 'z' && event.shiftKey)) { event.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const addCustomField = () => setCustomFields(current => [...current, { label: 'Custom field', value: '' }]);
  const updateCustomField = (index, key, value) => setCustomFields(current => current.map((field, i) => i === index ? { ...field, [key]: value } : field));
  const setTemplate = value => {
    const template = invoiceTemplates.find(item => item.id === value);
    if (template) setDesign(current => ({ ...current, templateId: value, accentColor: template.color, fontFamily: template.font, customTemplateId: '', textOverrides: {} }));
  };

  return <div className="invoice-creator" onClick={() => {
    if (!window.matchMedia?.('(max-width: 820px)').matches) return;
    const now = Date.now();
    if (mobileTapTimeRef.current && now - mobileTapTimeRef.current <= 420) {
      mobileTapTimeRef.current = 0;
      setShowDesignTools(false);
      setSelectedPreviewSection('');
      setSelectedTextElementId('');
      return;
    }
    mobileTapTimeRef.current = now;
  }}>
    <header className="ic-topbar">
      <div className="ic-top-title"><button className="ic-back" onClick={() => navigate(isTemplateMode ? '/app/templates' : '/app/invoices')} aria-label="Back"><ArrowLeft size={18}/></button><div><div className="ic-breadcrumb">{isTemplateMode ? 'TEMPLATES' : 'INVOICES'} <span>/</span> {isTemplateMode ? 'DESIGN STUDIO' : editingInvoiceId ? 'EDIT DRAFT' : 'NEW INVOICE'}</div><h1>{editingInvoiceId ? `Edit invoice ${meta.invoiceNumber || ''}` : 'Create invoice'}</h1><p>Fill in customer and item details on the left. Select text or an image in the preview to open its editing tools.</p></div></div>
      <div className="ic-top-actions"><span className="ic-autosave"><span/> LIVE PREVIEW</span>{!isTemplateMode && <div className="ic-top-customer-picker"><UserRound size={16}/><input aria-label="Search saved customers" value={customerSearch} onChange={event => setCustomerSearch(event.target.value)} placeholder="Search customers…"/><select aria-label="Choose customer to auto-fill invoice" value={customerId} onChange={event => chooseCustomer(event.target.value)}><option value="">New / manual customer</option>{visibleCustomers.map(row => <option value={row.id} key={row.id}>{row.customerCode ? `${row.customerCode} · ` : ''}{row.name}{row.companyName ? ` · ${row.companyName}` : ''}{row.phone ? ` · ${row.phone}` : ''}</option>)}</select></div>}<button type="button" className="ic-outline-btn ic-history-btn" title="Undo (Ctrl+Z)" disabled={!historyState.canUndo} onClick={undo}><Undo2 size={15}/> Undo</button><button type="button" className="ic-outline-btn ic-history-btn" title="Redo (Ctrl+Y)" disabled={!historyState.canRedo} onClick={redo}><Redo2 size={15}/> Redo</button><button className="ic-outline-btn" onClick={() => setShowManualEntry(true)}><FileText size={15}/> Guided entry</button><button type="button" className="ic-outline-btn ic-design-tools-toggle" onClick={() => setShowDesignTools(value => !value)} aria-expanded={showDesignTools}><SlidersHorizontal size={15}/>{showDesignTools ? 'Hide design tools' : 'Design tools'}</button><button type="button" className="ic-outline-btn" onClick={() => setShowExportModal(true)} disabled={Boolean(exportingFormat)}><Download size={15}/> Export / Share</button>{isTemplateMode ? <button className="ic-primary-btn" onClick={saveTemplateDesign} disabled={saving}><Save size={15}/>{saving ? 'Saving…' : 'Save template'}</button> : <button className="ic-primary-btn" onClick={() => saveInvoice('draft')} disabled={saving || updatingCustomerProfile || creatingCustomerFromInvoice}><Save size={15}/>{saving ? 'Saving…' : editingInvoiceId ? 'Update draft' : 'Save draft'}</button>}</div>
    </header>
    <section className="ic-studio-hero">
      <div className="ic-hero-mark"><FileText size={31}/><Sparkles size={16}/></div>
      <div className="ic-hero-copy"><span>✦ CREATE STUNNING INVOICES</span><h2>{isTemplateMode ? 'Make this template yours' : 'Your brand. Your invoice. Your style.'}</h2><p>Pick a professional template, personalize every line and export a client-ready document.</p></div>
      <div className="ic-hero-points"><span><Check size={14}/> Editable content</span><span><Check size={14}/> Live A4 preview</span><span><Check size={14}/> Logo · QR · Signature</span></div>
    </section>

    <div className={`ic-workspace ${showDesignTools || isTemplateMode ? 'with-design-tools' : ''} ${selectedPreviewSection && showDesignTools ? 'is-element-editing' : ''}`}>
      <aside className="ic-controls">
        <div className="ic-controls-head"><div><span>{isTemplateMode ? 'TEMPLATE WORKSPACE' : 'INVOICE WORKSPACE'}</span><h2>Invoice details</h2></div><span className="ic-step-count"><Sparkles size={13}/> EDIT</span></div>
        {error && <div className="ic-alert error"><X size={15}/>{error}</div>}{notice && <div className="ic-alert success"><Check size={15}/>{notice}</div>}
        <section className="ic-quick-template-picker">
          <button type="button" className="ic-simple-design-toggle" onClick={() => setShowQuickDesigns(value => !value)} aria-expanded={showQuickDesigns}>
            <span className="ic-simple-design-icon"><LayoutTemplate size={17}/></span>
            <span className="ic-simple-design-copy"><b>Invoice design</b><small>Current: {selectedTemplate.name} · {invoiceTemplates.length} designs available</small></span>
            {showQuickDesigns ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
          {showQuickDesigns && <div className="ic-quick-template-expanded">
            <label className="ic-template-search"><span>⌕</span><input value={templateSearch} onChange={event => setTemplateSearch(event.target.value)} placeholder="Find a design…" aria-label="Search invoice designs"/></label>
            <div className="ic-template-filters">{['All','Manufacturing','Red','Green','Blue','Purple','Orange','Dark','Minimal'].map(category => <button type="button" key={category} className={templateCategory === category ? 'active' : ''} onClick={() => setTemplateCategory(category)}>{category}</button>)}</div>
            <div className="ic-quick-template-grid">{quickTemplates.map(template => <button type="button" key={template.id} className={`ic-quick-template ${design.templateId === template.id ? 'selected' : ''}`} onClick={() => { setTemplate(template.id); setShowQuickDesigns(false); }} title={`Use ${template.name}`}><div className="ic-quick-template-paper"><TemplatePreviewStage template={template} design={{ ...design, templateId: template.id, accentColor: template.color, fontFamily: template.font }} meta={meta} customer={customer} items={items} calculations={calculations} mode="tile"/></div><b>{template.name}</b>{design.templateId === template.id && <em><Check size={11}/></em>}</button>)}</div>
            {!quickTemplates.length && <p className="ic-template-empty">No designs found. Try another search.</p>}
            <button type="button" className="ic-browse-templates" onClick={() => navigate('/app/templates')}>Open template library <ArrowLeft size={13}/></button>
          </div>}
        </section>
        <Section id="ic-section-customer" title="Customer details" description="Choose a saved customer to auto-fill, or enter a new customer" icon={<UserRound size={15}/>} defaultOpen>
          {!isTemplateMode && <>
            <p className="ic-customer-picker-hint">Use the customer picker at the top to fill saved details automatically. Missing information can be entered below. We will ask before changing a saved profile.</p>
            {!customerId && !selectedCustomerRecord && customer.name.trim() && <div className="ic-customer-sync-card">
              <div className="ic-customer-sync-copy"><b>New customer</b><span>Save these details to your Customers list and use them for future invoices.</span></div>
              <button type="button" className="ic-outline-btn" onClick={createCustomerFromInvoice} disabled={creatingCustomerFromInvoice}>
                {creatingCustomerFromInvoice ? 'Saving customer…' : 'Save to Customers'}
              </button>
            </div>}
            {selectedCustomerRecord && <div className="ic-customer-sync-card">
              <div className="ic-customer-sync-copy"><b>{selectedCustomerRecord.customerCode || 'Saved customer'}</b><span>{hasCustomerProfileChanges ? 'You changed customer details. The saved profile updates only after you confirm.' : 'Saved customer selected. Available details filled automatically.'}</span></div>
              <button type="button" className="ic-outline-btn" onClick={updateSelectedCustomerProfile} disabled={updatingCustomerProfile || !hasCustomerProfileChanges}>
                {updatingCustomerProfile ? 'Updating…' : 'Update saved customer'}
              </button>
            </div>}
          </>}
          <Field label="Customer name *" value={customer.name} onChange={v => setC('name', v)} placeholder="Customer full name"/>
          <div className="ic-two-col"><Field label="Company name" value={customer.companyName} onChange={v => setC('companyName', v)} placeholder="Company / organisation"/><Field label="Contact person" value={customer.contactPerson} onChange={v => setC('contactPerson', v)} placeholder="Contact person"/></div>
          <div className="ic-two-col"><Field label="Email" type="email" value={customer.email} onChange={v => setC('email', v)} placeholder="customer@email.com"/><Field label="Mobile number" value={customer.phone} onChange={v => setC('phone', v)} placeholder="Contact number"/></div>
          <Field label="Billing address" value={customer.billingAddress} onChange={v => setC('billingAddress', v)} placeholder="Street address" multiline/>
          <div className="ic-three-col"><Field label="City" value={customer.city} onChange={v => setC('city', v)} placeholder="City"/><Field label="State" value={customer.state} onChange={v => setC('state', v)} placeholder="State"/><Field label="PIN code" value={customer.postalCode} onChange={v => setC('postalCode', v)} placeholder="PIN"/></div>
          <div className="ic-two-col"><Field label="Country" value={customer.country} onChange={v => setC('country', v)} placeholder="India"/><Field label="Customer GSTIN" value={customer.gstin} onChange={v => setC('gstin', v.toUpperCase())} placeholder="GSTIN (optional)"/></div>
          {!isTemplateMode && <details className="ic-customer-extra"><summary>Additional customer details</summary>
            <div className="ic-two-col"><Field label="Alternate phone" value={customer.alternatePhone} onChange={v => setC('alternatePhone', v)} placeholder="Alternate number"/><Field label="State code" value={customer.stateCode} onChange={v => setC('stateCode', v)} placeholder="State code"/></div>
            <Field label="Shipping address" value={customer.shippingAddress} onChange={v => setC('shippingAddress', v)} placeholder="Shipping / delivery address" multiline/>
            <div className="ic-two-col"><Field label="PAN" value={customer.pan} onChange={v => setC('pan', v.toUpperCase())} placeholder="PAN (optional)"/><Field label="Payment terms" value={customer.paymentTerms} onChange={v => setC('paymentTerms', v)} placeholder="Due on receipt"/></div>
            <Field label="Customer notes (internal)" value={customer.notes} onChange={v => setC('notes', v)} placeholder="Optional notes for this customer profile" multiline/>
          </details>}
        </Section>


        <Section id="ic-section-business" title="Business information" description="Company details and printed identity" icon={<Building2 size={15}/>} defaultOpen={false}>
          <Field label="Business / brand name" value={design.businessName} onChange={v => setD('businessName', v)} placeholder="Your Business Name"/>
          <Field label="Registered address" value={design.businessAddress} onChange={v => setD('businessAddress', v)} placeholder="Street, city, state, PIN" multiline/>
          <div className="ic-two-col"><Field label="Mobile / phone number" value={design.businessPhone} onChange={v => setD('businessPhone', v)} placeholder="+91 98765 43210"/><Field label="Business email" type="email" value={design.businessEmail} onChange={v => setD('businessEmail', v)} placeholder="hello@company.com"/></div>
          <div className="ic-two-col"><Field label="Website" value={design.businessWebsite} onChange={v => setD('businessWebsite', v)} placeholder="www.company.com"/><Field label="GSTIN" value={design.businessGstin} onChange={v => setD('businessGstin', v)} placeholder="GSTIN number"/></div>
          <div className="ic-two-col"><Field label="PAN (optional)" value={design.businessPan} onChange={v => setD('businessPan', v)} placeholder="Business PAN"/><Field label="UPI ID" value={design.upiId} onChange={v => setD('upiId', v)} placeholder="business@upi"/></div>
          <Field label="Bank name" value={design.businessBankName} onChange={v => setD('businessBankName', v)} placeholder="Bank name"/>
          <div className="ic-two-col"><Field label="Account number" value={design.businessAccountNumber} onChange={v => setD('businessAccountNumber', v)} placeholder="Account number"/><Field label="IFSC code" value={design.businessIfsc} onChange={v => setD('businessIfsc', v)} placeholder="IFSC code"/></div>
        </Section>

        <Section id="ic-section-invoice" title="Invoice dates & references" description="Dates, purchase order and reference numbers" icon={<FileText size={15}/>} defaultOpen={false}>
          <Field label="Invoice heading / title" value={design.invoiceTitle} onChange={v => setD('invoiceTitle', v)} placeholder="TAX INVOICE"/>
          <div className="ic-two-col"><Field label="Issue date" type="date" value={meta.issueDate} onChange={v => setM('issueDate', v)}/><Field label="Due date" type="date" value={meta.dueDate} onChange={v => setM('dueDate', v)}/></div>
          <div className="ic-two-col"><Field label="Purchase order number" value={meta.purchaseOrder} onChange={v => setM('purchaseOrder', v)} placeholder="PO-0001"/><Field label="Reference" value={meta.reference} onChange={v => setM('reference', v)} placeholder="Project / reference"/></div>
          <div className="ic-two-col"><Field label="Document label" value={design.documentLabel} onChange={v => setD('documentLabel', v)} placeholder="DOCUMENT"/><Field label="Invoice title label" value={design.invoiceTitle} onChange={v => setD('invoiceTitle', v)} placeholder="INVOICE"/></div>
        </Section>

        <Section id="ic-section-items" title="Items & services" description="Add as many products or services as needed" icon={<ListChecks size={15}/>} defaultOpen>
          <button type="button" className="ic-add-line ic-add-line-top" onClick={addLine}><Plus size={15}/> Add more items</button>
          <div className="ic-lines-list">{items.map((line, index) => <div className="ic-line-editor" key={line.id}><div className="ic-line-head"><b>ITEM {String(index + 1).padStart(2, '0')}</b>{items.length > 1 && <button type="button" onClick={() => removeLine(line.id)} title="Remove item"><Trash2 size={14}/></button>}</div>
            {(records.products || []).length > 0 && !isTemplateMode && <Field label="Add from product catalogue" value={line.productId || ''} onChange={v => chooseProduct(line.id, v)}><select value={line.productId || ''} onChange={event => chooseProduct(line.id, event.target.value)}><option value="">Select a saved product (optional)</option>{records.products.map(product => <option value={product.id} key={product.id}>{product.name}</option>)}</select></Field>}
            <Field label="Item / service name" value={line.name} onChange={v => updateLine(line.id, 'name', v)} placeholder="e.g. Website design"/>
            <Field label="Description" value={line.description} onChange={v => updateLine(line.id, 'description', v)} placeholder="Details shown below the item"/>
            <div className="ic-three-col"><Field label="Qty" type="number" value={line.quantity} onChange={v => updateLine(line.id, 'quantity', v)}/><Field label="Unit" value={line.unit} onChange={v => updateLine(line.id, 'unit', v)} placeholder="pcs"/><Field label="Rate (₹)" type="number" value={line.rate} onChange={v => updateLine(line.id, 'rate', v)}/></div>
            <div className="ic-two-col"><Field label="Discount (₹)" type="number" value={line.discount} onChange={v => updateLine(line.id, 'discount', v)}/><Field label="Tax rate (%)" type="number" value={line.taxRate} onChange={v => updateLine(line.id, 'taxRate', v)}/></div>
            <div className="ic-line-total"><span>Line total · including tax</span><b>{currency(calculations.lines[index]?.lineTotal || 0)}</b></div>
          </div>)}</div>
          <button type="button" className="ic-add-line" onClick={addLine}><Plus size={15}/> Add more items</button>
        </Section>

        <Section id="ic-section-notes" title="Notes, payment & footer" description="Messages and payment instructions" icon={<FileText size={15}/>} defaultOpen={false}>
          <Field label="Notes" value={meta.notes} onChange={v => setM('notes', v)} placeholder="Add a message for your customer" multiline/>
          <Field label="Terms & conditions" value={meta.terms} onChange={v => setM('terms', v)} placeholder="Payment and delivery terms" multiline/>
          <Field label="Payment instructions" value={design.paymentInstructions} onChange={v => setD('paymentInstructions', v)} placeholder="How can the customer pay?" multiline/>
          <Field label="Footer message" value={design.footerText} onChange={v => setD('footerText', v)} placeholder="Thank you for your business" multiline/>
          <div className="ic-custom-fields-head"><b>Additional custom fields</b><button type="button" onClick={addCustomField}><Plus size={13}/> Add field</button></div>
          {customFields.map((field, index) => <div className="ic-two-col ic-custom-field" key={index}><Field label="Label" value={field.label} onChange={v => updateCustomField(index, 'label', v)} placeholder="Label"/><Field label="Value" value={field.value} onChange={v => updateCustomField(index, 'value', v)} placeholder="Value"/><button type="button" className="ic-icon-button" onClick={() => setCustomFields(current => current.filter((_, i) => i !== index))}><Trash2 size={14}/></button></div>)}
        </Section>

      </aside>

      <section className="ic-preview-area">
        <div className="ic-preview-toolbar">
          <div><span>LIVE CANVAS</span><b><Eye size={15}/> Live document preview <i className="ic-live-dot"/></b></div>
          <div className="ic-preview-actions">
            <div className="ic-device-switch" aria-label="Preview device">
              <button type="button" className={previewDevice === 'desktop' ? 'active' : ''} onClick={() => setPreviewDevice('desktop')} title="Desktop preview">▣</button>
              <button type="button" className={previewDevice === 'mobile' ? 'active' : ''} onClick={() => setPreviewDevice('mobile')} title="Compact preview">▯</button>
            </div>
            <span>{design.pageSize || 'A4'} · {design.pageOrientation || 'portrait'}</span>
            <div className="ic-zoom-tools"><button type="button" aria-label="Zoom out" onClick={() => setPreviewZoom(value => Math.max(70, value - 10))}>−</button><b>{previewZoom}%</b><button type="button" aria-label="Zoom in" onClick={() => setPreviewZoom(value => Math.min(120, value + 10))}>+</button></div>
            <button type="button" onClick={() => setPreviewZoom(100)} title="Reset zoom">Reset</button>
            <button type="button" onClick={() => setShowExportModal(true)} disabled={Boolean(exportingFormat)}><Download size={14}/> Export</button>
          </div>
        </div>
        <div className="ic-paper-wrap"><article ref={invoicePaperRef} onBlur={event => {
          const genericText = event.target.closest('[data-generic-text-id][data-generic-editable="true"]');
          if (!genericText || genericText.closest('.xenmark-invoice')) return;
          const id = genericText.dataset.genericTextId;
          const value = String(genericText.innerText || '').replace(/\u00a0/g, ' ').trim();
          genericText.setAttribute('contenteditable', 'false');
          setDesign(current => ({ ...current, textOverrides: { ...(current.textOverrides || {}), [id]: value } }));
        }} onClick={event => {
          const clickedInvoiceTable = event.target.closest('.xen-items-table, .ic-preview-table, .xen-table-wrap');
          if (clickedInvoiceTable) {
            setSelectedPreviewSection('items');
            setSelectedTextElementId('');
            setShowDesignTools(true);
            setActiveToolTab('Table');
            return;
          }
          // On phones, tapping the invoice canvas toggles the design inspector. Specific editable
          // text/assets/buttons keep their normal first-click behavior.
          if (window.matchMedia?.('(max-width: 820px)').matches) {
            const interactiveTarget = event.target.closest('.xen-upload-target,button,input,textarea,select,a');
            const insideInvoice = event.target.closest('.ic-invoice-paper');
            if (insideInvoice && !interactiveTarget && showDesignTools) {
              // A second tap on any non-interactive part of the active invoice canvas collapses the inspector on mobile.
              setShowDesignTools(false);
              setSelectedPreviewSection('');
              setSelectedTextElementId('');
              return;
            }
            if (insideInvoice && !interactiveTarget && event.target === insideInvoice) {
              setShowDesignTools(value => !value);
              setSelectedPreviewSection('');
              setSelectedTextElementId('');
              return;
            }
          }
          const inlineText = event.target.closest('.xen-inline-edit,[contenteditable="true"]');
          const uploadTarget = event.target.closest('.xen-upload-target');
          if (inlineText) {
            const editorId = inlineText.dataset.editorId || 'text';
            setSelectedPreviewSection(editorId);
            setSelectedTextElementId(inlineText.dataset.editorType === 'text' ? editorId : '');
            setShowDesignTools(true);
            setActiveToolTab('Fonts');
            return;
          }
          const genericText = event.target.closest('h1,h2,h3,h4,p,span,b,strong,small,th,td,li,label');
          if (genericText && !genericText.closest('.xenmark-invoice') && !genericText.closest('button,a,input,textarea,select')) {
            if (genericText.closest('.ic-preview-table tbody')) {
              setSelectedPreviewSection('items');
              setSelectedTextElementId('');
              setShowDesignTools(true);
              setActiveToolTab('Table');
              return;
            }
            const genericId = genericText.dataset.genericTextId || genericTextPath(invoicePaperRef.current, genericText);
            genericText.dataset.genericTextId = genericId;
            genericText.dataset.editorId = genericId;
            genericText.dataset.editorType = 'text';
            genericText.dataset.genericEditable = 'true';
            genericText.setAttribute('contenteditable', 'true');
            genericText.setAttribute('spellcheck', 'false');
            genericText.setAttribute('aria-label', 'Edit invoice text');
            const clickX = event.clientX;
            const clickY = event.clientY;
            window.requestAnimationFrame(() => {
              if (!genericText.isConnected) return;
              try { genericText.focus({ preventScroll: true }); } catch { genericText.focus(); }
              const range = document.caretRangeFromPoint?.(clickX, clickY);
              if (range && genericText.contains(range.startContainer)) {
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            });
            setSelectedPreviewSection(genericId);
            setSelectedTextElementId(genericId);
            setShowDesignTools(true);
            setActiveToolTab('Fonts');
            return;
          }
          if (uploadTarget) {
            setSelectedPreviewSection(uploadTarget.dataset.editorId || 'logo');
            setSelectedTextElementId('');
            setShowDesignTools(true);
            setActiveToolTab('Uploads');
            return;
          }
          const target = event.target.closest('[data-editor-tab],[data-editor-section]');
          if (!target) { setSelectedPreviewSection(''); setSelectedTextElementId(''); setShowDesignTools(false); return; }
          setSelectedPreviewSection(target.dataset.editorId || target.dataset.editorSection || target.dataset.editorTab || '');
          setSelectedTextElementId('');
          setShowDesignTools(true);
          const tabNames = { Text: 'Fonts', Assets: 'Uploads', Uploads: 'Uploads', Details: 'Details', Table: 'Table' };
          if (target.dataset.editorTab) setActiveToolTab(tabNames[target.dataset.editorTab] || target.dataset.editorTab);
          if (target.dataset.editorSection && !target.dataset.editorId) document.getElementById(target.dataset.editorSection)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }} data-selected-editor={selectedPreviewSection} className={`ic-invoice-paper template-${design.templateId} ${isNewSpyrixTemplate ? 'is-spyr-template' : ''} paper-${String(design.pageSize || 'A4').toLowerCase()} ic-frame-${design.frameStyle || 'thin'} ic-header-${design.headerStyle || 'line'} ic-table-${design.tableStyle || 'clean'} ic-density-${design.tableDensity || 'normal'} ic-pattern-${design.paperPattern || 'plain'} ${design.pageOrientation === 'landscape' ? 'is-landscape' : ''}`} style={{ '--ic-accent': design.accentColor, '--ic-font': design.fontFamily, '--ic-font-scale': 1, '--ic-paper': design.paperBackground || '#ffffff', '--ic-text-color': design.textColor || '#11151b', '--ic-logo-width': `${Number(design.logoWidth || 64)}px`, '--xen-item-count': items.length, '--xen-item-pad': `${Math.max(2, 8 - Math.max(0, items.length - 4) * 1.1)}px`, '--xen-item-font': `${Math.max(6.5, 11 - Math.max(0, items.length - 4) * 0.5)}px`, backgroundColor: isNewSpyrixTemplate ? '#ffffff' : design.paperBackground || '#ffffff', backgroundImage: isNewSpyrixTemplate ? 'none' : invoiceBackgroundImage, backgroundSize: design.backgroundImageDataUrl ? (design.backgroundImageFit || 'cover') : design.paperPattern === 'dots' ? '12px 12px' : design.paperPattern === 'grid' ? '18px 18px' : 'auto', backgroundPosition: 'center', backgroundRepeat: design.backgroundImageDataUrl ? 'no-repeat' : 'repeat', zoom: previewZoom / 100 * (isNewSpyrixTemplate ? templateEditorScale : 1), aspectRatio: design.templateId === 'xenmark' ? (design.pageOrientation === 'landscape' ? '297 / 210' : '210 / 297') : undefined, height: isNewSpyrixTemplate ? '1123px' : design.templateId === 'xenmark' ? 'auto' : undefined, minHeight: isNewSpyrixTemplate ? '1123px' : design.templateId === 'xenmark' ? '0px' : design.pageOrientation === 'landscape' ? '700px' : design.pageSize === 'A5' ? '760px' : '1000px', maxWidth: isNewSpyrixTemplate ? '794px' : design.templateId === 'xenmark' ? (previewDevice === 'mobile' ? '430px' : design.pageOrientation === 'landscape' ? '1120px' : '850px') : previewDevice === 'mobile' ? '430px' : design.pageOrientation === 'landscape' ? '1050px' : design.pageSize === 'A5' ? '650px' : '1024px', width: isNewSpyrixTemplate ? '794px' : previewDevice === 'mobile' ? '100%' : undefined, padding: isNewSpyrixTemplate ? '0' : undefined, display: isNewSpyrixTemplate ? 'block' : undefined, overflow: isNewSpyrixTemplate ? 'hidden' : undefined, flex: isNewSpyrixTemplate ? 'none' : undefined }}>
          <style data-invoice-editor-style>{buildGenericTextStyleCss(design.elementStyles || {})}</style>
          {design.templateId === 'xenmark' ? <XenmarkInvoicePreview
            design={design} setD={setD} meta={meta} setM={setM} customer={customer} setC={setC}
            items={items} updateLine={updateLine} addLine={addLine} calculations={calculations} uploadAsset={uploadAsset} isTemplateMode={isTemplateMode}
          /> : isNewSpyrixTemplate ? <SpyrixTemplateInvoicePreview
            template={selectedTemplate}
            design={design}
            meta={meta}
            customer={customer}
            items={items}
            calculations={calculations}
            editable={!isTemplateMode}
            onLogoUpload={uploadAsset('logoDataUrl')}
            onQrUpload={uploadAsset('qrDataUrl')}
            onSignatureUpload={uploadAsset('signatureDataUrl')}
          /> : <>
          {design.showWatermark && design.watermarkText && <div className="ic-paper-watermark" style={{ opacity: Math.max(1, Math.min(18, Number(design.watermarkOpacity || 7))) / 100 }}>{design.watermarkText}</div>}
          <div className={`ic-document-top ${design.logoPosition === 'right' ? 'logo-right' : ''}`} data-editor-tab="Text" data-editor-section="ic-section-business" data-editor-id="heading" title="Click to edit invoice heading text"><div className="ic-brand-block">{design.showLogo && (design.logoDataUrl ? <img className="ic-business-logo" src={design.logoDataUrl} alt="Business logo" data-editor-tab="Uploads" data-editor-id="logo" title="Click to edit logo settings · drag to reposition" draggable={false} onPointerDown={onGenericLogoPointerDown} onPointerMove={onGenericLogoPointerMove} onPointerUp={onGenericLogoPointerUp} onPointerCancel={onGenericLogoPointerUp} style={{ transform: `translate(${Number(design.logoOffsetX || 0)}px, ${Number(design.logoOffsetY || 0)}px) scale(${Math.max(.45, Math.min(2.5, Number(design.logoZoom || 1)))})`, transformOrigin: 'center center', touchAction: 'none', cursor: 'grab' }}/> : <button type="button" className="ic-logo-placeholder" data-editor-tab="Uploads" data-editor-id="logo" title="Click to upload your business logo"><ImagePlus size={18}/><small>ADD LOGO</small></button>)}<div><h2>{design.businessName || 'YOUR BUSINESS NAME'}</h2>{design.businessTagline && <p className="ic-business-tagline">{design.businessTagline}</p>}<p>{design.businessAddress || 'Your business address will appear here'}</p><p>{[design.businessPhone, design.businessEmail, design.businessWebsite].filter(Boolean).join('  ·  ') || 'Phone · Email · Website'}</p>{design.showBusinessGstin && design.businessGstin && <p>{design.businessGstinLabel || 'GSTIN'}: {design.businessGstin}</p>}{design.businessPan && <p>{design.panLabel || 'PAN'}: {design.businessPan}</p>}</div></div><div className="ic-invoice-title-block" style={{ textAlign: design.headingAlignment || 'right' }}><span>{design.documentLabel || 'DOCUMENT'}</span><h1>{design.invoiceTitle || 'INVOICE'}</h1>{design.invoiceSubtitle && <p className="ic-invoice-subtitle">{design.invoiceSubtitle}</p>}<b>{design.invoiceNumberLabel || 'INVOICE NO.'} · SPY-{new Date(meta.issueDate || today).getFullYear()}-001</b></div></div>
          <div className="ic-document-meta" data-editor-tab="Text" data-editor-section="ic-section-invoice" data-editor-id="meta" title="Click to edit invoice labels"><div><small>{design.issueDateLabel || 'ISSUE DATE'}</small><b>{meta.issueDate ? new Date(`${meta.issueDate}T00:00:00`).toLocaleDateString('en-IN') : '—'}</b></div><div><small>{design.dueDateLabel || 'DUE DATE'}</small><b>{meta.dueDate ? new Date(`${meta.dueDate}T00:00:00`).toLocaleDateString('en-IN') : '—'}</b></div><div><small>{design.referenceLabel || 'REFERENCE'}</small><b>{meta.reference || '—'}</b></div><div><small>{design.purchaseOrderLabel || 'PO NUMBER'}</small><b>{meta.purchaseOrder || '—'}</b></div></div>
          <div className="ic-parties" data-editor-tab="Text" data-editor-section="ic-section-customer" data-editor-id="parties" title="Click to edit the printed section labels"><div><span>{design.billFromLabel || 'BILL FROM'}</span><b>{design.businessName || 'Your business'}</b><p>{design.businessAddress || 'Business address'}</p><p>{design.businessPhone}</p><p>{design.businessEmail}</p></div><div><span>{design.billToLabel || 'BILL TO'}</span><b>{customer.name || 'Customer name'}</b><p>{customer.companyName}</p><p>{customer.billingAddress}</p><p>{[customer.city, customer.state, customer.postalCode, customer.country].filter(Boolean).join(', ')}</p><p>{customer.email} {customer.phone ? `· ${customer.phone}` : ''}</p>{design.showCustomerGstin && customer.gstin && <p>{design.customerGstinLabel || 'GSTIN'}: {customer.gstin}</p>}</div></div>
          {customFields.length > 0 && <div className="ic-extra-fields">{customFields.map((field, index) => <div key={index}><small>{field.label || 'FIELD'}</small><b>{field.value || '—'}</b></div>)}</div>}
          <table className="ic-preview-table" data-editor-tab="Table" data-editor-section="ic-section-items" data-editor-id="items" title="Click to edit table headings"><thead><tr><th>{design.itemLabel || 'DESCRIPTION'}</th>{design.showSku && <th>{design.skuLabel || 'SKU'}</th>}<th>{design.quantityLabel || 'QTY'}</th><th>{design.rateLabel || 'RATE'}</th><th>{design.amountLabel || 'AMOUNT'}</th></tr></thead><tbody>{calculations.lines.map((line, index) => <tr key={line.id}><td><b>{line.name || `Invoice item ${index + 1}`}</b>{line.description && <small>{line.description}</small>}</td>{design.showSku && <td>{line.sku || '—'}</td>}<td>{line.quantity} {line.unit}</td><td>{currency(line.rate)}</td><td>{currency(line.lineTotal)}</td></tr>)}</tbody></table>{!isTemplateMode && <button type="button" className="ic-add-item-canvas ic-editor-only" data-editor-only="true" onClick={event => { event.stopPropagation(); addLine(); setSelectedPreviewSection('items'); setSelectedTextElementId(''); setActiveToolTab('Table'); setShowDesignTools(true); }}><Plus size={14}/> Add more items</button>}
          <div className="ic-summary-area" data-editor-tab="Text" data-editor-section="ic-section-notes" data-editor-id="summary" title="Click to edit summary and payment wording"><div className="ic-summary-notes">{meta.notes && <div><span>{design.notesLabel || 'NOTES'}</span><p>{meta.notes}</p></div>}{meta.terms && <div><span>{design.termsLabel || 'TERMS & CONDITIONS'}</span><p>{meta.terms}</p></div>}{design.showPaymentInstructions && design.paymentInstructions && <div><span>{design.paymentInstructionsLabel || 'PAYMENT INSTRUCTIONS'}</span><p>{design.paymentInstructions}</p></div>}{(design.businessBankName || design.upiId || design.businessAccountNumber) && <div><span>{design.paymentDetailsLabel || 'PAYMENT DETAILS'}</span><p>{[design.businessBankName, design.businessAccountNumber && `${design.accountNumberLabel || 'A/C'} ${design.businessAccountNumber}`, design.businessIfsc && `${design.ifscLabel || 'IFSC'} ${design.businessIfsc}`, design.upiId && `${design.upiLabel || 'UPI'} ${design.upiId}`].filter(Boolean).join(' · ')}</p></div>}</div><div className="ic-totals"><div><span>{design.subtotalLabel || 'Subtotal'}</span><b>{currency(calculations.subtotal)}</b></div>{calculations.discount > 0 && <div><span>{design.discountLabel || 'Discount'}</span><b>− {currency(calculations.discount)}</b></div>}<div><span>{design.taxLabel || 'Tax'}</span><b>{currency(calculations.tax)}</b></div><div className="grand-total"><span>{design.totalLabel || 'Total Due'}</span><b>{currency(calculations.total)}</b></div></div></div>
          {design.showQr && <div className={`ic-payment-qr is-${design.qrPosition || 'right'}`} data-editor-tab="Assets" data-editor-id="qr" title="Click to edit QR placement and caption"><div className="ic-qr-art" style={{ width: `${Number(design.qrWidth || 82)}px`, height: `${Number(design.qrWidth || 82)}px` }}>{design.qrDataUrl ? <img src={design.qrDataUrl} alt="Payment QR code"/> : <div className="ic-qr-placeholder"><QrCode size={26}/><small>ADD QR</small></div>}</div><div><b>{design.qrCaption || 'SCAN TO PAY'}</b><span>{design.qrInstruction || design.upiId || 'Use your UPI app to pay this invoice'}</span></div></div>}
          {design.showSignature && <div className={`ic-signature-block is-${design.signatureAlignment || 'right'}`} data-editor-tab="Assets" data-editor-id="signature" title="Click to edit signature details"><span className="ic-signature-caption">{design.signatureCaption || 'AUTHORISED SIGNATORY'}</span><div className="ic-signature-art">{design.signatureDataUrl ? <img src={design.signatureDataUrl} alt="Authorised signature" style={{ width: `${Number(design.signatureWidth || 170)}px` }}/> : <span>Signature</span>}</div><div className="ic-signature-line"/><b>{design.signatureName || design.businessName || 'Authorised Signatory'}</b><small>{design.signatureTitle || 'Authorised Signatory'}</small></div>}
          {design.showFooter && <footer className="ic-paper-footer" data-editor-tab="Text" data-editor-id="footer" title="Click to edit footer text"><b>{design.footerText || 'Thank you for your business.'}</b><span>{design.businessName || 'SPYRIX INVOICE'}</span></footer>}
          </>}
        </article></div>
        <div className="ic-preview-footnote"><ShieldCheck size={14}/> Live preview · Tap any text in the document to edit it directly. Upload the logo, payment QR and signature from their positions in the invoice.</div>
        <div className="ic-preview-final-actions">{isTemplateMode ? <><button type="button" className="ic-outline-btn" onClick={() => navigate('/app/templates')}><X size={15}/> Cancel</button><button type="button" className="ic-primary-btn" onClick={saveTemplateDesign} disabled={saving}><Save size={15}/>{saving ? 'Saving…' : 'Save template design'}</button></> : <><button type="button" className="ic-outline-btn" onClick={() => navigate('/app/invoices')}><X size={15}/> Cancel</button><button type="button" className="ic-primary-btn" onClick={() => saveInvoice('draft')} disabled={saving || updatingCustomerProfile || creatingCustomerFromInvoice}><Save size={15}/> {editingInvoiceId ? 'Update draft' : 'Save draft'}</button><button type="button" className="ic-issue-btn" onClick={() => saveInvoice('issued')} disabled={saving || updatingCustomerProfile || creatingCustomerFromInvoice}><Check size={15}/>{saving ? 'Saving…' : 'Save & issue'}</button></>}</div>
      </section>

      {(showDesignTools || isTemplateMode) && <aside className="ic-design-tools">
        <div className="ic-controls-head"><div><span>DESIGN STUDIO</span><h2>{selectedTextElementId ? 'Edit selected text' : selectedPreviewSection ? 'Edit selected element' : 'Make it yours'}</h2></div>{selectedPreviewSection ? <button type="button" className="ic-outline-btn ic-back-to-details" onClick={() => { setSelectedPreviewSection(''); setSelectedTextElementId(''); setShowDesignTools(false); }}><ArrowLeft size={13}/> Invoice details</button> : <span className="ic-step-count"><SlidersHorizontal size={13}/> STYLE</span>}</div>
        <div className="ic-readiness-card"><div className="ic-readiness-top"><div><span>DOCUMENT READINESS</span><b>{completionProgress}% complete</b></div><strong>{completionChecks.filter(item => item.done).length}/{completionChecks.length}</strong></div><div className="ic-readiness-track"><i style={{ width: `${completionProgress}%` }}/></div><div className="ic-readiness-checks">{completionChecks.map(item => <span key={item.label} className={item.done ? 'complete' : ''}><i>{item.done ? '✓' : '·'}</i>{item.label}</span>)}</div></div>
        <div className="ic-inspector-tabs" role="tablist" aria-label="Invoice design tools">
          {[['Design', Palette], ['Fonts', Type], ['Elements', Shapes], ['Uploads', ImagePlus], ['Table', Table2], ['Layout', LayoutTemplate], ['Details', FileText], ['Payment', QrCode], ['Advanced', SlidersIcon]].map(([tab, Icon]) => <button type="button" key={tab} role="tab" aria-selected={activeToolTab === tab} className={activeToolTab === tab ? 'active' : ''} onClick={() => setActiveToolTab(tab)}><Icon size={15}/><span>{tab}</span></button>)}
        </div>

        {activeToolTab === 'Design' && <div className="ic-inspector-content">
          <Section title="Quick design moods" description="Apply a complete visual style in one click" icon={<Sparkles size={15}/>} defaultOpen>
            <div className="ic-layout-preset-grid">{layoutPresets.map(preset => <button type="button" key={preset.id} className={`ic-layout-preset ${activeLayoutPreset?.id === preset.id ? 'active' : ''}`} onClick={() => applyLayoutPreset(preset)}><span className="ic-layout-preset-art" style={{ '--preset-accent': preset.accentColor }}><i/><i/><i/><b/></span><span><b>{preset.name}</b><small>{preset.description}</small></span>{activeLayoutPreset?.id === preset.id && <Check size={14}/>}</button>)}</div>
          </Section>
          <Section title="Invoice background gallery" description="Five colour finishes · same invoice layout" icon={<Palette size={15}/>}>
            <div className="ic-background-gallery">{paperBackgrounds.map(preset => <button type="button" key={preset.id} className={`ic-background-card ${String(design.paperBackground || '#ffffff').toLowerCase() === preset.color.toLowerCase() ? 'selected' : ''}`} onClick={() => applyPaperBackground(preset.color)} aria-pressed={String(design.paperBackground || '#ffffff').toLowerCase() === preset.color.toLowerCase()}><span className="ic-background-thumb" style={{ '--preview-paper': preset.color, '--preview-accent': design.accentColor }}><span className="ic-background-invoice"><i className="mini-brand"/><i className="mini-title"/><i className="mini-meta"/><i className="mini-party"/><i className="mini-table-head"/><i className="mini-table-row"/><i className="mini-table-row short"/><i className="mini-total"/></span></span><span className="ic-background-info"><b>{preset.name}</b><small>{preset.description}</small></span>{String(design.paperBackground || '#ffffff').toLowerCase() === preset.color.toLowerCase() && <span className="ic-background-check"><Check size={12}/></span>}</button>)}</div>
            <div className="ic-selected-background"><span style={{ background: design.paperBackground || '#fff' }}/><div><b>{activePaperBackground?.name || 'Custom background'}</b><small>{design.paperBackground || '#ffffff'} · live invoice paper</small></div><button type="button" onClick={() => setD('paperBackground', '#ffffff')}>Reset</button></div>
          </Section>
          <Section title="Brand colour" description="Choose the signature accent used across the invoice" icon={<Palette size={15}/>}>
            <Field label="Accent colour" value={design.accentColor} onChange={v => setD('accentColor', v)}><div className="ic-color-input"><input type="color" value={design.accentColor} onChange={event => setD('accentColor', event.target.value)}/><code>{design.accentColor}</code></div></Field>
            <div className="ic-color-swatches">{['#171717','#dfff00','#92172b','#1d4ed8','#167653','#6540a2','#b45309','#ed0018'].map(color => <button type="button" key={color} title={color} style={{ background: color }} className={design.accentColor === color ? 'selected' : ''} onClick={() => setD('accentColor', color)}/>)}</div>
          </Section>
          <Section title="Paper finish" description="Texture and watermark options" icon={<Eye size={15}/>}>
            <Field label="Paper texture" value={design.paperPattern || 'plain'} onChange={v => setD('paperPattern', v)}><select value={design.paperPattern || 'plain'} onChange={event => setD('paperPattern', event.target.value)}><option value="plain">Plain paper</option><option value="dots">Soft dot texture</option><option value="grid">Fine grid</option><option value="diagonal">Diagonal texture</option></select></Field>
            <label className="ic-switch-row"><span>Show document watermark</span><input type="checkbox" checked={Boolean(design.showWatermark)} onChange={event => setD('showWatermark', event.target.checked)}/></label>
            {design.showWatermark && <><Field label="Watermark text" value={design.watermarkText || ''} onChange={v => setD('watermarkText', v)} placeholder="SPYRIX / PAID / DRAFT"/><Field label={`Watermark opacity · ${design.watermarkOpacity || 7}%`} value={design.watermarkOpacity || 7} onChange={v => setD('watermarkOpacity', Number(v))}><input type="range" min="1" max="18" step="1" value={design.watermarkOpacity || 7} onChange={event => setD('watermarkOpacity', Number(event.target.value))}/></Field></>}
          </Section>
        </div>}

        {activeToolTab === 'Fonts' && <div className="ic-inspector-content">
          <p className="ic-inspector-hint">{selectedTextElementId ? 'These controls style only the text you selected on the invoice. Changes update the canvas immediately.' : 'Set the invoice-wide typography or click a text item in the preview to style it independently.'}</p>
          <Section title={selectedTextElementId ? 'Selected text' : 'Invoice typography'} description={selectedTextElementId ? 'Font, colour and emphasis for this text' : 'Document-wide typography defaults'} icon={<Type size={15}/>} defaultOpen>
            <Field label="Font family" value={selectedTextStyle.fontFamily || design.fontFamily || 'Arial'} onChange={v => selectedTextElementId ? updateSelectedTextStyle('fontFamily', v) : setD('fontFamily', v)}><select value={selectedTextStyle.fontFamily || design.fontFamily || 'Arial'} onChange={event => selectedTextElementId ? updateSelectedTextStyle('fontFamily', event.target.value) : setD('fontFamily', event.target.value)}>{['Inter','Roboto','Poppins','Montserrat','Open Sans','Lato','Nunito','Playfair Display','Merriweather','Arial','Georgia','Tahoma','Verdana','Trebuchet MS','Courier New','Times New Roman','Consolas'].map(font => <option key={font} value={font}>{font}</option>)}</select></Field>
            <Field label={selectedTextElementId ? `Font size · ${Number.parseFloat(selectedTextStyle.fontSize || 12)}px` : `Base font size · ${design.fontSize || 10}px`} value={selectedTextElementId ? Number.parseFloat(selectedTextStyle.fontSize || 12) : (design.fontSize || 10)}><input type="range" min="8" max={selectedTextElementId ? '42' : '18'} step="1" value={selectedTextElementId ? Number.parseFloat(selectedTextStyle.fontSize || 12) : (design.fontSize || 10)} onChange={event => selectedTextElementId ? updateSelectedTextStyle('fontSize', `${event.target.value}px`) : setD('fontSize', Number(event.target.value))}/></Field>
            <Field label="Text colour" value={selectedTextStyle.color || (selectedTextElementId ? '#111111' : design.textColor || '#11151b')}><input type="color" value={selectedTextStyle.color || (selectedTextElementId ? '#111111' : design.textColor || '#11151b')} onChange={event => selectedTextElementId ? updateSelectedTextStyle('color', event.target.value) : setD('textColor', event.target.value)}/></Field>
            {selectedTextElementId ? <>
              <div className="ic-text-style-buttons"><button type="button" className={selectedTextStyle.fontWeight === '700' ? 'active' : ''} aria-pressed={selectedTextStyle.fontWeight === '700'} onClick={() => updateSelectedTextStyle('fontWeight', selectedTextStyle.fontWeight === '700' ? '400' : '700')}><b>B</b> Bold</button><button type="button" className={selectedTextStyle.fontStyle === 'italic' ? 'active' : ''} aria-pressed={selectedTextStyle.fontStyle === 'italic'} onClick={() => updateSelectedTextStyle('fontStyle', selectedTextStyle.fontStyle === 'italic' ? 'normal' : 'italic')}><i>I</i> Italic</button><button type="button" className={selectedTextStyle.textDecoration === 'underline' ? 'active' : ''} aria-pressed={selectedTextStyle.textDecoration === 'underline'} onClick={() => updateSelectedTextStyle('textDecoration', selectedTextStyle.textDecoration === 'underline' ? 'none' : 'underline')}><u>U</u> Underline</button></div>
              <Field label="Text alignment" value={selectedTextStyle.textAlign || 'left'}><select value={selectedTextStyle.textAlign || 'left'} onChange={event => updateSelectedTextStyle('textAlign', event.target.value)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select></Field>
              <div className="ic-two-col"><Field label="Line height" value={selectedTextStyle.lineHeight || '1.2'}><select value={selectedTextStyle.lineHeight || '1.2'} onChange={event => updateSelectedTextStyle('lineHeight', event.target.value)}><option value="1">Tight</option><option value="1.2">Normal</option><option value="1.5">Relaxed</option><option value="1.8">Wide</option></select></Field><Field label="Letter spacing" value={selectedTextStyle.letterSpacing || '0px'}><select value={selectedTextStyle.letterSpacing || '0px'} onChange={event => updateSelectedTextStyle('letterSpacing', event.target.value)}><option value="0px">Normal</option><option value=".5px">0.5 px</option><option value="1px">1 px</option><option value="2px">2 px</option></select></Field></div>
              <button type="button" className="ic-outline-btn full" onClick={resetSelectedTextStyle}>Reset selected text style</button>
            </> : <Field label="Heading alignment" value={design.headingAlignment || 'right'}><select value={design.headingAlignment || 'right'} onChange={event => setD('headingAlignment', event.target.value)}><option value="right">Right</option><option value="left">Left</option><option value="center">Center</option></select></Field>}
          </Section>
        </div>}
        {activeToolTab === 'Uploads' && <div className="ic-inspector-content">
          <Section title="Business logo" description="Upload and position your brand mark" icon={<ImagePlus size={15}/>} defaultOpen>
            <UploadAsset title="Business logo" hint="Transparent PNG recommended · JPG and WEBP supported" value={design.logoDataUrl} onUpload={uploadAsset('logoDataUrl')} onRemove={() => setD('logoDataUrl', '')} icon={ImagePlus}/>
            <Field label={`Logo width · ${design.logoWidth || 64}px`} value={design.logoWidth || 64} onChange={v => setD('logoWidth', Number(v))}><input type="range" min="34" max="180" step="2" value={design.logoWidth || 64} onChange={event => setD('logoWidth', Number(event.target.value))}/></Field>
            <Field label={`Logo zoom · ${Math.round((Number(design.logoZoom) || 1) * 100)}%`} value={design.logoZoom || 1} onChange={v => setD('logoZoom', Number(v))}><input type="range" min="0.45" max="2.5" step="0.05" value={design.logoZoom || 1} onChange={event => setD('logoZoom', Number(event.target.value))}/></Field>
            <p className="ic-inspector-hint">Tip: drag the logo directly on the invoice to reposition it.</p>
            <div className="ic-two-col"><Field label="Logo horizontal offset" value={design.logoOffsetX || 0} onChange={v => setD('logoOffsetX', Number(v))}><input type="range" min="-160" max="160" step="2" value={design.logoOffsetX || 0} onChange={event => setD('logoOffsetX', Number(event.target.value))}/></Field><Field label="Logo vertical offset" value={design.logoOffsetY || 0} onChange={v => setD('logoOffsetY', Number(v))}><input type="range" min="-100" max="100" step="2" value={design.logoOffsetY || 0} onChange={event => setD('logoOffsetY', Number(event.target.value))}/></Field></div>
            <button type="button" className="ic-outline-btn full" onClick={() => { setD('logoZoom', 1); setD('logoOffsetX', 0); setD('logoOffsetY', 0); }}>Reset logo fit</button>
            <Field label="Logo position" value={design.logoPosition || 'left'} onChange={v => setD('logoPosition', v)}><select value={design.logoPosition || 'left'} onChange={event => setD('logoPosition', event.target.value)}><option value="left">Left</option><option value="right">Right</option></select></Field>
            <label className="ic-switch-row"><span>Show logo on invoice</span><input type="checkbox" checked={Boolean(design.showLogo)} onChange={event => setD('showLogo', event.target.checked)}/></label>
          </Section>
          <Section title="Payment QR code" description="Let customers scan and pay directly" icon={<QrCode size={15}/>}>
            <UploadAsset title="Payment QR code" hint="UPI QR or payment QR image · max 900 KB" value={design.qrDataUrl} onUpload={uploadAsset('qrDataUrl')} onRemove={() => setD('qrDataUrl', '')} icon={QrCode}/>
            <Field label={`QR image size · ${design.qrWidth || 82}px`} value={design.qrWidth || 82} onChange={v => setD('qrWidth', Number(v))}><input type="range" min="55" max="150" step="1" value={design.qrWidth || 82} onChange={event => setD('qrWidth', Number(event.target.value))}/></Field>
            <Field label="QR block alignment" value={design.qrPosition || 'right'} onChange={v => setD('qrPosition', v)}><select value={design.qrPosition || 'right'} onChange={event => setD('qrPosition', event.target.value)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></Field>
            <Field label="QR heading" value={design.qrCaption || ''} onChange={v => setD('qrCaption', v)} placeholder="SCAN TO PAY"/>
            <Field label="QR helper text" value={design.qrInstruction || ''} onChange={v => setD('qrInstruction', v)} placeholder="Scan with your UPI app" multiline/>
            <label className="ic-switch-row"><span>Show QR on invoice</span><input type="checkbox" checked={Boolean(design.showQr)} onChange={event => setD('showQr', event.target.checked)}/></label>
          </Section>
          <Section title="Authorised signature" description="Add a signed approval to the invoice" icon={<Check size={15}/>}>
            <UploadAsset title="Signature image" hint="Transparent PNG recommended · JPG or WEBP supported" value={design.signatureDataUrl} onUpload={uploadAsset('signatureDataUrl')} onRemove={() => setD('signatureDataUrl', '')} icon={ImagePlus}/>
            <Field label="Signatory name" value={design.signatureName || ''} onChange={v => setD('signatureName', v)} placeholder={design.businessName || 'Name of authorised person'}/>
            <Field label="Designation" value={design.signatureTitle || ''} onChange={v => setD('signatureTitle', v)} placeholder="Authorised Signatory"/>
            <Field label={`Signature width · ${design.signatureWidth || 170}px`} value={design.signatureWidth || 170} onChange={v => setD('signatureWidth', Number(v))}><input type="range" min="90" max="260" step="5" value={design.signatureWidth || 170} onChange={event => setD('signatureWidth', Number(event.target.value))}/></Field>
            <Field label="Signature alignment" value={design.signatureAlignment || 'right'} onChange={v => setD('signatureAlignment', v)}><select value={design.signatureAlignment || 'right'} onChange={event => setD('signatureAlignment', event.target.value)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></Field>
            <Field label="Signature label" value={design.signatureCaption || ''} onChange={v => setD('signatureCaption', v)} placeholder="AUTHORISED SIGNATORY"/>
            <label className="ic-switch-row"><span>Show signature on invoice</span><input type="checkbox" checked={Boolean(design.showSignature)} onChange={event => setD('showSignature', event.target.checked)}/></label>
          </Section>
          <Section title="Invoice background artwork" description="Upload a soft paper texture, brand motif or subtle background image" icon={<ImagePlus size={15}/>}>
            <UploadAsset title="Background image" hint="Choose a light texture or branded artwork · max 900 KB" value={design.backgroundImageDataUrl || ''} onUpload={uploadAsset('backgroundImageDataUrl')} onRemove={() => setD('backgroundImageDataUrl', '')} icon={ImagePlus}/>
            {design.backgroundImageDataUrl && <><Field label={`Artwork visibility · ${design.backgroundImageOpacity ?? 24}%`} value={design.backgroundImageOpacity ?? 24} onChange={v => setD('backgroundImageOpacity', Number(v))}><input type="range" min="5" max="100" step="1" value={design.backgroundImageOpacity ?? 24} onChange={event => setD('backgroundImageOpacity', Number(event.target.value))}/></Field><Field label="Artwork fit" value={design.backgroundImageFit || 'cover'} onChange={v => setD('backgroundImageFit', v)}><select value={design.backgroundImageFit || 'cover'} onChange={event => setD('backgroundImageFit', event.target.value)}><option value="cover">Cover page</option><option value="contain">Fit inside page</option><option value="auto">Original size</option></select></Field></>}
          </Section>
        </div>}

        {activeToolTab === 'Details' && <div className="ic-inspector-content">
          <p className="ic-inspector-hint">Edit the printed wording and labels below. Every change appears in the invoice preview immediately.</p>
          <Section title="Brand & invoice heading" description="Customize the main text at the top of the document" icon={<FileText size={15}/>} defaultOpen>
            <Field label="Business tagline" value={design.businessTagline || ''} onChange={v => setD('businessTagline', v)} placeholder="Your business promise or service line"/>
            <Field label="Document label" value={design.documentLabel || ''} onChange={v => setD('documentLabel', v)} placeholder="DOCUMENT"/>
            <Field label="Invoice title" value={design.invoiceTitle || ''} onChange={v => setD('invoiceTitle', v)} placeholder="TAX INVOICE"/>
            <Field label="Invoice subtitle" value={design.invoiceSubtitle || ''} onChange={v => setD('invoiceSubtitle', v)} placeholder="Original for recipient / Payment invoice"/>
            <Field label="Invoice number caption" value={design.invoiceNumberLabel || ''} onChange={v => setD('invoiceNumberLabel', v)} placeholder="INVOICE NO."/>
          </Section>
          <Section title="Section headings" description="Rename the labels printed throughout the invoice" icon={<SlidersHorizontal size={15}/>}>
            <div className="ic-two-col"><Field label="Bill from" value={design.billFromLabel || ''} onChange={v => setD('billFromLabel', v)}/><Field label="Bill to" value={design.billToLabel || ''} onChange={v => setD('billToLabel', v)}/></div>
            <div className="ic-two-col"><Field label="Issue date" value={design.issueDateLabel || ''} onChange={v => setD('issueDateLabel', v)}/><Field label="Due date" value={design.dueDateLabel || ''} onChange={v => setD('dueDateLabel', v)}/></div>
            <div className="ic-two-col"><Field label="Reference" value={design.referenceLabel || ''} onChange={v => setD('referenceLabel', v)}/><Field label="PO number" value={design.purchaseOrderLabel || ''} onChange={v => setD('purchaseOrderLabel', v)}/></div>
            <div className="ic-two-col"><Field label="Items" value={design.itemLabel || ''} onChange={v => setD('itemLabel', v)}/><Field label="SKU" value={design.skuLabel || ''} onChange={v => setD('skuLabel', v)}/></div>
            <div className="ic-three-col"><Field label="Quantity" value={design.quantityLabel || ''} onChange={v => setD('quantityLabel', v)}/><Field label="Rate" value={design.rateLabel || ''} onChange={v => setD('rateLabel', v)}/><Field label="Amount" value={design.amountLabel || ''} onChange={v => setD('amountLabel', v)}/></div>
            <div className="ic-two-col"><Field label="Subtotal" value={design.subtotalLabel || ''} onChange={v => setD('subtotalLabel', v)}/><Field label="Discount" value={design.discountLabel || ''} onChange={v => setD('discountLabel', v)}/></div>
            <div className="ic-two-col"><Field label="Tax" value={design.taxLabel || ''} onChange={v => setD('taxLabel', v)}/><Field label="Grand total" value={design.totalLabel || ''} onChange={v => setD('totalLabel', v)}/></div>
            <div className="ic-two-col"><Field label="Notes heading" value={design.notesLabel || ''} onChange={v => setD('notesLabel', v)}/><Field label="Terms heading" value={design.termsLabel || ''} onChange={v => setD('termsLabel', v)}/></div>
            <div className="ic-two-col"><Field label="Payment instructions" value={design.paymentInstructionsLabel || ''} onChange={v => setD('paymentInstructionsLabel', v)}/><Field label="Payment details" value={design.paymentDetailsLabel || ''} onChange={v => setD('paymentDetailsLabel', v)}/></div>
            <div className="ic-two-col"><Field label="Business GSTIN" value={design.businessGstinLabel || ''} onChange={v => setD('businessGstinLabel', v)}/><Field label="Customer GSTIN" value={design.customerGstinLabel || ''} onChange={v => setD('customerGstinLabel', v)}/></div>
            <div className="ic-two-col"><Field label="PAN caption" value={design.panLabel || ''} onChange={v => setD('panLabel', v)}/><Field label="Account caption" value={design.accountNumberLabel || ''} onChange={v => setD('accountNumberLabel', v)}/></div>
            <div className="ic-two-col"><Field label="IFSC caption" value={design.ifscLabel || ''} onChange={v => setD('ifscLabel', v)}/><Field label="UPI caption" value={design.upiLabel || ''} onChange={v => setD('upiLabel', v)}/></div>
          </Section>
          <Section title="Customer messages & footer" description="Edit the body copy shown on the document" icon={<FileText size={15}/>}>
            <Field label="Notes" value={meta.notes} onChange={v => setM('notes', v)} multiline placeholder="Add a message for your customer"/>
            <Field label="Terms & conditions" value={meta.terms} onChange={v => setM('terms', v)} multiline placeholder="Payment and delivery terms"/>
            <Field label="Payment instructions" value={design.paymentInstructions || ''} onChange={v => setD('paymentInstructions', v)} multiline placeholder="Explain how to pay"/>
            <Field label="Footer message" value={design.footerText || ''} onChange={v => setD('footerText', v)} multiline placeholder="Thank you for your business"/>
          </Section>
        </div>}

        {activeToolTab === 'Layout' && <div className="ic-inspector-content">
          <Section title="Choose a template" description="Select a visual invoice design" icon={<LayoutTemplate size={15}/>} defaultOpen>
            <div className="ic-template-gallery">{invoiceTemplates.map(template => <button type="button" key={template.id} className={`ic-template-tile ${design.templateId === template.id ? 'selected' : ''}`} onClick={() => setTemplate(template.id)}><div className="ic-template-thumb"><TemplatePreviewStage template={template} design={{ ...design, templateId: template.id, accentColor: template.color, fontFamily: template.font }} meta={meta} customer={customer} items={items} calculations={calculations} mode="tile"/></div><b>{template.name}</b><small>{template.category}</small>{design.templateId === template.id && <em><Check size={11}/></em>}</button>)}</div>
          </Section>
          <Section title="Frame, header & table" description="Control the printed document structure" icon={<SlidersHorizontal size={15}/>}>
            <Field label="Page frame" value={design.frameStyle || 'thin'} onChange={v => setD('frameStyle', v)}><select value={design.frameStyle || 'thin'} onChange={event => setD('frameStyle', event.target.value)}><option value="none">No frame</option><option value="thin">Thin border</option><option value="double">Double border</option><option value="dashed">Dashed border</option></select></Field>
            <Field label="Header style" value={design.headerStyle || 'line'} onChange={v => setD('headerStyle', v)}><select value={design.headerStyle || 'line'} onChange={event => setD('headerStyle', event.target.value)}><option value="line">Accent underline</option><option value="band">Solid colour band</option><option value="split">Split header</option><option value="minimal">Minimal header</option></select></Field>
            <Field label="Table style" value={design.tableStyle || 'clean'} onChange={v => setD('tableStyle', v)}><select value={design.tableStyle || 'clean'} onChange={event => setD('tableStyle', event.target.value)}><option value="clean">Clean lines</option><option value="striped">Striped rows</option><option value="boxed">Boxed grid</option><option value="minimal">Minimal</option></select></Field>
            <Field label="Table density" value={design.tableDensity || 'normal'} onChange={v => setD('tableDensity', v)}><select value={design.tableDensity || 'normal'} onChange={event => setD('tableDensity', event.target.value)}><option value="compact">Compact</option><option value="normal">Comfortable</option><option value="spacious">Spacious</option></select></Field>
            <div className="ic-two-col"><Field label="Paper size" value={design.pageSize} onChange={v => setD('pageSize', v)}><select value={design.pageSize} onChange={event => setD('pageSize', event.target.value)}><option>A4</option><option>A5</option><option>Letter</option></select></Field><Field label="Orientation" value={design.pageOrientation} onChange={v => setD('pageOrientation', v)}><select value={design.pageOrientation} onChange={event => setD('pageOrientation', event.target.value)}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></Field></div>
            {[['showSku','Show SKU column'],['showPaymentInstructions','Show payment instructions'],['showFooter','Show footer message'],['showBusinessGstin','Show business GSTIN'],['showCustomerGstin','Show customer GSTIN']].map(([key,label]) => <label className="ic-switch-row" key={key}><span>{label}</span><input type="checkbox" checked={Boolean(design[key])} onChange={event => setD(key, event.target.checked)}/></label>)}
          </Section>
        </div>}

        {activeToolTab === 'Elements' && <div className="ic-inspector-content">
          <p className="ic-inspector-hint">Add editable content to your invoice. New text fields appear on the document where supported, and table rows are added to the live item grid.</p>
          <Section title="Add content" description="Insert fields and editable blocks" icon={<Shapes size={15}/>} defaultOpen>
            <div className="ic-element-action-grid">
              <button type="button" onClick={() => { addCustomField(); setNotice('Added a new editable custom field.'); }}><Type size={17}/><b>Text field</b><small>Label and value</small></button>
              <button type="button" onClick={() => { addCustomField(); setNotice('Added a new additional detail field.'); }}><FileText size={17}/><b>Detail block</b><small>Invoice information</small></button>
              <button type="button" onClick={() => { addLine(); setActiveToolTab('Table'); }}><Table2 size={17}/><b>Table row</b><small>Add a product line</small></button>
              <button type="button" onClick={() => setActiveToolTab('Uploads')}><ImagePlus size={17}/><b>Image / logo</b><small>Upload and adjust</small></button>
            </div>
          </Section>
          <Section title="Custom text & values" description="Edit items placed on this invoice" icon={<FileText size={15}/>}>
            <div className="ic-custom-fields-head"><b>Additional custom fields</b><button type="button" onClick={addCustomField}><Plus size={13}/> Add field</button></div>
            {customFields.map((field, index) => <div className="ic-two-col ic-custom-field" key={index}><Field label="Label" value={field.label} onChange={v => updateCustomField(index, 'label', v)} placeholder="Label"/><Field label="Value" value={field.value} onChange={v => updateCustomField(index, 'value', v)} placeholder="Value"/><button type="button" className="ic-icon-button" onClick={() => setCustomFields(current => current.filter((_, i) => i !== index))}><Trash2 size={14}/></button></div>)}
          </Section>
        </div>}

        {activeToolTab === 'Table' && <div className="ic-inspector-content">
          <button type="button" className="ic-table-add-sticky" onClick={addLine}><Plus size={16}/> Add more items · {items.length} currently</button>
          <Section title="Table appearance" description="Style product rows and financial columns" icon={<Table2 size={15}/>} defaultOpen>
            <Field label="Table design" value={design.tableStyle || 'clean'} onChange={v => setD('tableStyle', v)}><select value={design.tableStyle || 'clean'} onChange={event => setD('tableStyle', event.target.value)}><option value="clean">Clean lines</option><option value="striped">Striped rows</option><option value="boxed">Boxed grid</option><option value="minimal">Minimal</option></select></Field>
            <Field label="Row density" value={design.tableDensity || 'normal'} onChange={v => setD('tableDensity', v)}><select value={design.tableDensity || 'normal'} onChange={event => setD('tableDensity', event.target.value)}><option value="compact">Compact</option><option value="normal">Comfortable</option><option value="spacious">Spacious</option></select></Field>
            <div className="ic-two-col"><Field label="Item header" value={design.itemLabel || ''} onChange={v => setD('itemLabel', v)}/><Field label="Quantity header" value={design.quantityLabel || ''} onChange={v => setD('quantityLabel', v)}/></div>
            <div className="ic-two-col"><Field label="Rate header" value={design.rateLabel || ''} onChange={v => setD('rateLabel', v)}/><Field label="Amount header" value={design.amountLabel || ''} onChange={v => setD('amountLabel', v)}/></div>
            <label className="ic-switch-row"><span>Show SKU column</span><input type="checkbox" checked={Boolean(design.showSku)} onChange={event => setD('showSku', event.target.checked)}/></label>
            <Field label="SKU column heading" value={design.skuLabel || ''} onChange={v => setD('skuLabel', v)}/>
            <button type="button" className="ic-primary-btn full" onClick={addLine}><Plus size={15}/> Add more items</button>
          </Section>
          <Section title="Current item rows" description={`${items.length} rows · calculations update as you edit`} icon={<ListChecks size={15}/>}>
            <div className="ic-table-row-manager">{items.map((item, index) => <div key={item.id}><span><b>{String(index+1).padStart(2,'0')}</b><small>{item.name || 'Untitled item'}</small></span><strong>{currency(Math.max(0,money(item.quantity))*Math.max(0,money(item.rate))-Math.max(0,money(item.discount)))}</strong><button type="button" onClick={() => removeLine(item.id)} disabled={items.length===1} title="Remove row"><Trash2 size={14}/></button></div>)}</div>
          </Section>
        </div>}

        {activeToolTab === 'Payment' && <div className="ic-inspector-content">
          <Section title="Payment details" description="Show customers where and how to pay" icon={<QrCode size={15}/>} defaultOpen>
            <Field label="Bank name" value={design.businessBankName || ''} onChange={v => setD('businessBankName', v)}/>
            <Field label="Account holder / number" value={design.businessAccountNumber || ''} onChange={v => setD('businessAccountNumber', v)}/>
            <Field label="IFSC" value={design.businessIfsc || ''} onChange={v => setD('businessIfsc', v)}/>
            <Field label="UPI ID" value={design.upiId || ''} onChange={v => setD('upiId', v)}/>
            <Field label="Payment instructions" value={design.paymentInstructions || ''} onChange={v => setD('paymentInstructions', v)} multiline/>
            <UploadAsset title="Payment QR" hint="PNG, JPG or JPEG · max 900 KB" value={design.qrDataUrl} onUpload={uploadAsset('qrDataUrl')} onRemove={() => setD('qrDataUrl','')} icon={QrCode}/>
            <div className="ic-two-col"><Field label="QR size (px)" value={design.qrWidth || 82} onChange={v => setD('qrWidth', Math.max(48, Math.min(220, Number(v)||82)))} type="number"/><Field label="QR caption" value={design.qrCaption || ''} onChange={v => setD('qrCaption', v)}/></div>
            <label className="ic-switch-row"><span>Show QR on invoice</span><input type="checkbox" checked={Boolean(design.showQr)} onChange={event => setD('showQr', event.target.checked)}/></label>
          </Section>
        </div>}

        {activeToolTab === 'Advanced' && <div className="ic-inspector-content">
          <Section title="Document visibility" description="Choose which sections are printed" icon={<SlidersIcon size={15}/>} defaultOpen>
            {[['showLogo','Show company logo'],['showQr','Show payment QR'],['showSignature','Show signature'],['showWatermark','Show watermark'],['showBusinessGstin','Show business GSTIN'],['showCustomerGstin','Show customer GSTIN'],['showPaymentInstructions','Show payment instructions'],['showFooter','Show footer']].map(([key,label])=><label className="ic-switch-row" key={key}><span>{label}</span><input type="checkbox" checked={Boolean(design[key])} onChange={event => setD(key,event.target.checked)}/></label>)}
          </Section>
          <Section title="Watermark" description="Add a light text watermark to the page" icon={<SparklesIcon size={15}/>}>
            <Field label="Watermark text" value={design.watermarkText || ''} onChange={v => setD('watermarkText', v)} />
            <Field label="Opacity (%)" type="number" value={design.watermarkOpacity ?? 7} onChange={v => setD('watermarkOpacity', Math.max(0,Math.min(30,Number(v)||0)))}/>
            <Field label="Paper pattern" value={design.paperPattern || 'plain'} onChange={v => setD('paperPattern', v)}><select value={design.paperPattern || 'plain'} onChange={event => setD('paperPattern',event.target.value)}><option value="plain">Plain</option><option value="dots">Subtle dots</option><option value="grid">Grid</option><option value="diagonal">Diagonal lines</option></select></Field>
          </Section>
          <Section title="Export quality" description="Higher quality uses more memory on large invoices" icon={<FileImage size={15}/>}>
            <Field label="Image quality" value={exportScale} onChange={setExportScale}><select value={exportScale} onChange={event=>setExportScale(event.target.value)}><option value="2">Standard · 2×</option><option value="3">High · 3×</option><option value="4">Print quality · 4×</option></select></Field>
          </Section>
        </div>}

        <div className="ic-tools-export"><div><ShieldCheck size={16}/><span>Design and export options are available here when needed.</span></div><div className="ic-export-grid"><button type="button" className="ic-primary-btn full" disabled={Boolean(exportingFormat)} onClick={() => setShowExportModal(true)}><Download size={15}/>{exportingFormat==='pdf'?'Opening print…':'Save as PDF'}</button><button type="button" className="ic-outline-btn full" disabled={Boolean(exportingFormat)} onClick={() => setShowExportModal(true)}><FileImage size={15}/> Export PNG</button><button type="button" className="ic-outline-btn full" disabled={Boolean(exportingFormat)} onClick={() => setShowExportModal(true)}>Export JPG</button><button type="button" className="ic-outline-btn full" disabled={Boolean(exportingFormat)} onClick={() => setShowExportModal(true)}>Export SVG</button><button type="button" className="ic-outline-btn full" onClick={() => setShowExportModal(true)}><Printer size={15}/> Print</button><button type="button" className="ic-outline-btn full" onClick={() => setShowExportModal(true)}><Share2 size={15}/> Share / Copy summary</button></div>{isTemplateMode ? <button type="button" className="ic-issue-btn full" onClick={saveTemplateDesign} disabled={saving}><Save size={15}/>{saving ? 'Saving…' : 'Save default design'}</button> : <button type="button" className="ic-issue-btn full" onClick={() => saveInvoice('issued')} disabled={saving || updatingCustomerProfile || creatingCustomerFromInvoice}><Check size={15}/>{saving ? 'Saving…' : 'Save & issue invoice'}</button>}</div>
      </aside>}
    </div>
    {showExportModal && <div className="ic-export-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowExportModal(false); }}><section className="ic-export-modal" role="dialog" aria-modal="true" aria-labelledby="ic-export-title">
      <header className="ic-export-modal-head"><div><span>INVOICE OUTPUT</span><h2 id="ic-export-title">Export, print or share</h2><p>PDF uses the browser print engine to preserve the live invoice design and uploaded images. Choose “Save as PDF” in the print dialog.</p></div><button type="button" className="ic-icon-button" onClick={() => setShowExportModal(false)} aria-label="Close export options"><X size={18}/></button></header>
      {(error || notice) && <div className={`ic-export-message ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>{error || notice}</div>}
      <div className="ic-export-choice-grid">
        <button type="button" disabled={Boolean(exportingFormat)} onClick={() => doExport('pdf')}><span className="pdf">PDF</span><b>{exportingFormat === 'pdf' ? 'Opening print…' : 'Save as PDF'}</b><small>Preserves the live invoice and uploaded images</small></button>
        <button type="button" disabled={Boolean(exportingFormat)} onClick={() => doExport('png')}><span className="png">PNG</span><b>Download PNG</b><small>Sharp transparent-free image</small></button>
        <button type="button" disabled={Boolean(exportingFormat)} onClick={() => doExport('jpg')}><span className="jpg">JPG</span><b>Download JPG</b><small>Compressed image file</small></button>
        <button type="button" disabled={Boolean(exportingFormat)} onClick={() => doExport('svg')}><span className="svg">SVG</span><b>Download SVG</b><small>Scalable image format</small></button>
        <button type="button" onClick={() => { setShowExportModal(false); printInvoice(); }}><span className="print"><Printer size={19}/></span><b>Print invoice</b><small>Print just the invoice page</small></button>
        <button type="button" onClick={shareInvoice}><span className="share"><Share2 size={19}/></span><b>Share invoice summary</b><small>Share or copy summary details</small></button>
        <button type="button" disabled={saving || isTemplateMode} onClick={async () => { setShowExportModal(false); await saveInvoice('draft'); }}><span className="save"><Save size={19}/></span><b>Save draft</b><small>Keep editing this invoice later</small></button>
      </div>
      <footer><label className="ic-export-quality"><span>Image quality</span><select value={exportScale} onChange={event => setExportScale(event.target.value)}><option value="2">Standard · 2×</option><option value="3">High · 3×</option><option value="4">Print quality · 4×</option></select></label><button type="button" className="ic-outline-btn" onClick={() => setShowExportModal(false)}>Back to editor</button></footer>
    </section></div>}

    {showManualEntry && <div className="ic-manual-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowManualEntry(false); }}><section className="ic-manual-modal" role="dialog" aria-modal="true" aria-labelledby="ic-manual-title"><header><div><span>MANUAL ENTRY / STEP {manualStep + 1} OF 5</span><h2 id="ic-manual-title">Enter invoice details manually</h2><p>Each change is reflected in the live invoice preview.</p></div><button type="button" className="ic-icon-button" onClick={() => setShowManualEntry(false)} aria-label="Close manual entry"><X size={18}/></button></header><nav className="ic-manual-steps">{['Invoice','Customer','Items','Payment','Additional'].map((label,index)=><button type="button" key={label} className={manualStep===index?'active':manualStep>index?'complete':''} onClick={()=>setManualStep(index)}><span>{manualStep>index?'✓':index+1}</span>{label}</button>)}</nav><div className="ic-manual-body">{manualStep===0 && <><div className="ic-two-col"><Field label="Invoice number" value={meta.invoiceNumber} onChange={v=>{setM('invoiceNumber',v);setM('manualInvoiceNumber',Boolean(v.trim()));}}/><Field label="Invoice date" type="date" value={meta.issueDate} onChange={v=>setM('issueDate',v)}/><Field label="Due date" type="date" value={meta.dueDate} onChange={v=>setM('dueDate',v)}/><Field label="Purchase order" value={meta.purchaseOrder} onChange={v=>setM('purchaseOrder',v)}/></div></>}{manualStep===1 && <><Field label="Choose saved customer" value={customerId} onChange={chooseCustomer}><select value={customerId} onChange={event=>chooseCustomer(event.target.value)}><option value="">New / manual customer</option>{(records.customers||[]).map(row=><option key={row.id} value={row.id}>{row.name}{row.companyName?` · ${row.companyName}`:''}</option>)}</select></Field><div className="ic-two-col"><Field label="Customer name" value={customer.name} onChange={v=>setC('name',v)}/><Field label="Business name" value={customer.companyName} onChange={v=>setC('companyName',v)}/><Field label="Phone" value={customer.phone} onChange={v=>setC('phone',v)}/><Field label="Email" value={customer.email} onChange={v=>setC('email',v)}/><Field label="GSTIN" value={customer.gstin} onChange={v=>setC('gstin',v)}/><Field label="PIN code" value={customer.postalCode} onChange={v=>setC('postalCode',v)}/></div><Field label="Billing address" value={customer.billingAddress} onChange={v=>setC('billingAddress',v)} multiline/></>}{manualStep===2 && <><div className="ic-manual-item-head"><b>Product and service rows</b><button type="button" className="ic-outline-btn" onClick={addLine}><Plus size={14}/> Add more items</button></div>{items.map((item,index)=><div className="ic-manual-item" key={item.id}><b>Item {index+1}</b><div className="ic-two-col"><Field label="Description" value={item.name} onChange={v=>updateLine(item.id,'name',v)}/><Field label="Quantity" type="number" value={item.quantity} onChange={v=>updateLine(item.id,'quantity',v)}/><Field label="Rate" type="number" value={item.rate} onChange={v=>updateLine(item.id,'rate',v)}/><Field label="Discount" type="number" value={item.discount} onChange={v=>updateLine(item.id,'discount',v)}/><Field label="GST %" type="number" value={item.taxRate} onChange={v=>updateLine(item.id,'taxRate',v)}/><Field label="Unit" value={item.unit} onChange={v=>updateLine(item.id,'unit',v)}/></div></div>)}</>}{manualStep===3 && <><div className="ic-two-col"><Field label="Bank name" value={design.businessBankName} onChange={v=>setD('businessBankName',v)}/><Field label="Account number" value={design.businessAccountNumber} onChange={v=>setD('businessAccountNumber',v)}/><Field label="IFSC" value={design.businessIfsc} onChange={v=>setD('businessIfsc',v)}/><Field label="UPI ID" value={design.upiId} onChange={v=>setD('upiId',v)}/></div><UploadAsset title="Payment QR" hint="Upload your payment QR image" value={design.qrDataUrl} onUpload={uploadAsset('qrDataUrl')} onRemove={()=>setD('qrDataUrl','')} icon={QrCode}/></>}{manualStep===4 && <><Field label="Notes" value={meta.notes} onChange={v=>setM('notes',v)} multiline/><Field label="Terms and conditions" value={meta.terms} onChange={v=>setM('terms',v)} multiline/><UploadAsset title="Company logo" hint="Upload a transparent PNG or JPG logo" value={design.logoDataUrl} onUpload={uploadAsset('logoDataUrl')} onRemove={()=>setD('logoDataUrl','')} icon={Building2}/><UploadAsset title="Signature" hint="Upload signature image" value={design.signatureDataUrl} onUpload={uploadAsset('signatureDataUrl')} onRemove={()=>setD('signatureDataUrl','')} icon={FileText}/></>}</div><footer><button type="button" className="ic-outline-btn" onClick={()=>manualStep===0?setShowManualEntry(false):setManualStep(v=>Math.max(0,v-1))}>{manualStep===0?'Cancel':'Previous'}</button>{manualStep<4?<button type="button" className="ic-primary-btn" onClick={()=>setManualStep(v=>Math.min(4,v+1))}>Continue <ArrowLeft size={14} style={{transform:'rotate(180deg)'}}/></button>:<button type="button" className="ic-primary-btn" onClick={()=>{setShowManualEntry(false);setNotice('Invoice details applied to the live preview. Save or issue the invoice when ready.');}}>Apply details <Check size={15}/></button>}</footer></section></div>}
  </div>;
}
