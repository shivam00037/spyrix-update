import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, BadgeIndianRupee, Bell, Boxes, CalendarDays,
  Check, CheckCircle2, ChevronDown, CircleHelp, ClipboardList, CloudDownload, Download,
  FileText, Filter, Folder, Gauge, LayoutTemplate, Mail, Package, Plus, Printer,
  RefreshCw, Search, Settings, ShieldCheck, SlidersHorizontal, Trash2, TrendingUp,
  Upload, Users, Wallet, X, Zap, Pencil, Eye, AlertTriangle, RotateCcw, Archive, LockKeyhole, UserRound, Contrast, Building2, MapPin, Globe, Phone, MessageCircle,
} from 'lucide-react';
import { useData } from '../../../data/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../api';
import CustomerPicker from '../../Customers/components/CustomerPicker';
import { loadInvoiceDesign } from '../../Invoices/invoiceDesign';
import { invoiceTemplates } from '../../Invoices/invoiceDesign';
import ModuleActionGrid from './ModuleActionGrid';
import { DEFAULT_WORKSPACE_THEME, WORKSPACE_THEMES, normalizeWorkspaceTheme } from './modulePage.config.js';

const titles = {
  invoices: 'Create Invoice', templates: 'Invoice Templates', quotations: 'Quotations', customers: 'Customers',
  products: 'Products & Services', inventory: 'Inventory Management', payments: 'Payments', expenses: 'Expenses',
  reports: 'Reports & Analytics', calendar: 'Billing Calendar', recurring: 'Recurring Invoices', documents: 'Documents',
  notifications: 'Notifications', downloads: 'Download Center', backups: 'Backup & Restore', imports: 'Import Data',
  'business-settings': 'Business Settings', settings: 'Account Settings', help: 'Help & Support', tools: 'All Business Tools',
};
const resourceFor = { invoices: 'invoices', quotations: 'quotations', customers: 'customers', products: 'products', inventory: 'products', payments: 'payments', expenses: 'expenses' };
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const dateLabel = value => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const moduleMeta = {
  invoices: { description: 'Create, issue, track and print professional customer invoices.', icon: FileText, cta: 'Create invoice', tabs: ['All', 'Draft', 'Issued', 'Partially paid', 'Paid', 'Overdue'] },
  quotations: { description: 'Prepare estimates and quotations, then track customer decisions.', icon: ClipboardList, cta: 'Create quotation', tabs: ['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Converted'] },
  customers: { description: 'Keep your customer details organised and ready for every transaction.', icon: Users, cta: 'Add customer', tabs: ['All customers', 'Active'] },
  products: { description: 'Manage products, services, selling prices and tax defaults.', icon: Package, cta: 'Add product', tabs: ['All products', 'Low stock'] },
  payments: { description: 'Record collections, allocate them to invoices and review payment history.', icon: BadgeIndianRupee, cta: 'Record payment', tabs: ['All', 'Completed', 'Pending'] },
  expenses: { description: 'Record operating costs and keep a clear view of business spending.', icon: Wallet, cta: 'Add expense', tabs: ['All expenses', 'Paid', 'Unpaid'] },
};

function StatusPill({ status }) {
  const label = String(status || 'active').replaceAll('_', ' ');
  return <span className={`status-pill status-${String(status || 'active').replaceAll('_', '-')}`}>{label}</span>;
}

function EmptyState({ title, description, onAction, action }) {
  return <div className="module-empty"><span className="module-empty-icon"><Folder size={25} /></span><h3>{title}</h3><p>{description}</p>{onAction && <button className="primary-button" onClick={onAction}><Plus size={16} />{action || 'Create first record'}</button>}</div>;
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return <div className="module-modal-backdrop" onMouseDown={onClose}><section className={`module-modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><header className="module-modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></header>{children}</section></div>;
}

function Field({ label, children, full = false, hint }) {
  return <label className={`module-field ${full ? 'full' : ''}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}

function csvValue(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportCsv(filename, rows) {
  if (!rows.length) return false;
  const keys = Object.keys(rows[0]);
  const csv = [keys.map(csvValue).join(','), ...rows.map(row => keys.map(key => csvValue(row[key])).join(','))].join('\r\n');
  downloadFile(filename, `\uFEFF${csv}`, 'text/csv;charset=utf-8');
  return true;
}

function printInvoice(invoice, designOverride, business) {
  const win = window.open('', '_blank', 'width=1000,height=1100');
  if (!win) return;
  const design = { ...loadInvoiceDesign(), ...(invoice.design || {}), ...(designOverride || {}) };
  const accent = /^#[0-9a-f]{6}$/i.test(design.accentColor || '') ? design.accentColor : '#92172b';
  const font = ['Arial','Inter','Poppins','Georgia','Tahoma','Verdana','Trebuchet MS','Courier New','Times New Roman','Consolas'].includes(design.fontFamily) ? design.fontFamily : 'Arial';
  const imageData = value => /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(String(value || '')) ? value : '';
  const logo = design.showLogo ? imageData(design.logoDataUrl) : '';
  const qr = design.showQr ? imageData(design.qrDataUrl) : '';
  const signature = design.showSignature ? imageData(design.signatureDataUrl) : '';
  const pageSize = ['A4','A5','Letter'].includes(design.pageSize) ? design.pageSize : 'A4';
  const pageOrientation = ['portrait','landscape'].includes(design.pageOrientation) ? design.pageOrientation : 'portrait';
  const borderStyle = ['solid','dashed','double','none'].includes(design.borderStyle) ? design.borderStyle : 'solid';
  const logoWidth = Math.max(48, Math.min(220, Number(design.logoWidth) || 120));
  const density = ['compact','comfortable','spacious'].includes(design.layoutDensity) ? design.layoutDensity : 'comfortable';
  const tableDensity = ['compact','normal','spacious'].includes(design.tableDensity) ? design.tableDensity : 'normal';
  const customer = invoice.customerSnapshot || {};
  const templateId = invoiceTemplates.some(item => item.id === design.templateId) ? design.templateId : 'xenmark';
  const businessName = design.businessName || business?.name || 'Your Business';
  const rows = (invoice.items || []).map((item, index) => {
    const qty = Number(item.quantity || 1);
    const rate = Number(item.rate || 0);
    const discount = Number(item.discount || 0);
    const tax = Number(item.tax || 0);
    const lineTotal = Number(item.lineTotal ?? (qty * rate - discount + tax));
    const description = design.showItemDescription === false ? '' : (item.description ? `<small>${safe(item.description)}</small>` : '');
    const sku = design.showItemSku === false || !item.sku ? '' : `<small>SKU: ${safe(item.sku)}</small>`;
    const quantity = `${qty}${design.showUnitColumn === false ? '' : ` ${safe(item.unit || 'pcs')}`}`;
    return `<tr><td class="serial">${index + 1}</td><td><strong>${safe(item.name || 'Item')}</strong>${description}${sku}</td><td>${quantity}</td><td>${money(rate)}</td><td>${money(lineTotal)}</td></tr>`;
  }).join('');
  const address = [customer.billingAddress, customer.city, customer.state, customer.postalCode, customer.country].filter(Boolean).join(', ');
  const businessAddress = design.businessAddress || business?.address || '';
  const businessPhone = design.businessPhone || business?.phone || '';
  const businessEmail = design.businessEmail || business?.email || '';
  const businessGstin = design.businessGstin || business?.gstin || '';
  const businessWebsite = design.businessWebsite || business?.website || '';
  const businessServices = design.businessServices || 'BUSINESS SERVICES · PRODUCTS · CUSTOM WORK';
  const businessGstinHtml = design.showBusinessGstin === false ? '' : `<br/>GSTIN: ${safe(businessGstin)}`;
  const customerGstinHtml = design.showCustomerGstin === false ? '' : `<p><span>GSTIN</span>: ${safe(customer.gstin || '—')}</p>`;
  const purchaseReferenceHtml = design.showPurchaseReference === false ? '' : `<div class="meta-field"><span>PO No.</span><b>${safe(invoice.purchaseOrder || '—')}</b></div><div class="meta-field"><span>Reference</span><b>${safe(invoice.reference || '—')}</b></div>`;
  const dueDateHtml = design.showDueDate === false ? '' : `<br/><b>Due Date</b> &nbsp; ${dateLabel(invoice.dueDate)}`;
  const customFields = (invoice.customFields || []).map(field => `<div class="meta-field"><span>${safe(field.label)}</span><b>${safe(field.value)}</b></div>`).join('');
  const customerCustom = (customer.customFields || []).map(field => `<p><span>${safe(field.label)}:</span> ${safe(field.value)}</p>`).join('');
  const paymentHtml = (qr || design.paymentInstructions || design.upiId) ? `<section class="bottom-grid"><div class="payment-box"><h3>Payment Details</h3><div class="payment-inner">${qr ? `<img class="qr" src="${qr}" alt="Payment QR code"/>` : ''}<div><b>Payment Instructions</b><p>${safe(design.paymentInstructions || 'Please complete the payment and share the transaction reference.')}</p>${design.upiId ? `<p><b>UPI ID:</b> ${safe(design.upiId)}</p>` : ''}<p><b>Payment status:</b> ${safe(invoice.status || 'draft').toUpperCase()}</p><p><b>Amount paid:</b> ${money(invoice.paidAmount)}</p><p><b>Due amount:</b> ${money(Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0)))}</p></div></div></div><div class="total-box"><div><span>Sub Total</span><b>${money(invoice.subtotal)}</b></div>${design.showTaxBreakdown === false ? '' : `<div><span>Discount</span><b>${money(invoice.discount || 0)}</b></div><div><span>GST / Tax</span><b>${money(invoice.tax)}</b></div>`}<div class="grand-total"><span>Total Amount</span><b>${money(invoice.total)}</b></div><div class="thank-you">Thank You!<small>FOR YOUR BUSINESS</small></div></div></section>` : `<section class="total-box solo-total"><div><span>Sub Total</span><b>${money(invoice.subtotal)}</b></div>${design.showTaxBreakdown === false ? '' : `<div><span>Discount</span><b>${money(invoice.discount || 0)}</b></div><div><span>GST / Tax</span><b>${money(invoice.tax)}</b></div>`}<div class="grand-total"><span>Total Amount</span><b>${money(invoice.total)}</b></div></section>`;
  const templateStyles = `
    .sheet{--document-border:${borderStyle};--document-density:${density};}
    .sheet .party-box,.sheet .meta-strip,.sheet .payment-box,.sheet .total-box{border-style:${borderStyle === 'none' ? 'hidden' : borderStyle}}
    .sheet .items-table td,.sheet .items-table th{border-style:${borderStyle === 'none' ? 'hidden' : borderStyle}}
    .sheet .items-table td,.sheet .items-table th{padding:${tableDensity === 'compact' ? '6px' : tableDensity === 'spacious' ? '14px' : '10px'} 8px}
    .sheet .brand-identity{justify-content:${design.logoPosition === 'center' ? 'center' : design.logoPosition === 'right' ? 'flex-end' : 'flex-start'}}
    .sheet .brand-logo{max-width:${logoWidth}px}
    .sheet .brand-services{display:${design.showBusinessServices === false ? 'none' : 'block'}}
    .sheet .invoice-band h1{text-align:${['left','center','right'].includes(design.headingAlignment) ? design.headingAlignment : 'left'}}
    .sheet.template-executive .brand-head{border-bottom:6px solid ${accent};padding-bottom:15px}.sheet.template-executive .invoice-band{border-radius:2px 18px 2px 18px}
    .sheet.template-classic .invoice-band{background:${accent};border-left:12px solid #222}.sheet.template-classic .party-box{border-radius:0}
    .sheet.template-minimal .invoice-band{background:#fff;color:#17191d;border-bottom:3px solid ${accent};padding-left:0}.sheet.template-minimal .items-table th{background:#f0f0f2;color:#222;border-color:#ddd}.sheet.template-minimal .party-title{background:#f1f1f3;color:#222}
    .sheet.template-corporate .brand-head{border-bottom:4px double ${accent}}.sheet.template-corporate .meta-strip{background:#f5f7f9;border-color:${accent}}
    .sheet.template-modern .invoice-band{clip-path:polygon(0 0,96% 0,100% 100%,0 100%);border-radius:0}.sheet.template-modern .party-title{clip-path:polygon(0 0,100% 0,88% 100%,0 100%)}
    .sheet.template-elegant .invoice-band{background:#fff;color:${accent};border-top:2px solid ${accent};border-bottom:2px solid ${accent}}.sheet.template-elegant .items-table th{background:#f4edf0;color:${accent}}
    .sheet.template-gst .meta-strip{border:2px solid ${accent}}.sheet.template-gst .items-table th{font-size:10px}.sheet.template-gst .party-box{min-height:170px}
    .sheet.template-retail .invoice-band{padding:9px 14px}.sheet.template-retail .party-box{min-height:118px}.sheet.template-retail .items-table td,.sheet.template-retail .items-table th{padding:7px 6px}
    .sheet.template-service .brand-services{background:#f2f5f8;padding:12px 16px;border-left:5px solid ${accent}}.sheet.template-service .invoice-band{background:${accent}}
    .sheet.template-freelancer .brand-head{grid-template-columns:1fr;text-align:center}.sheet.template-freelancer .brand-logo{margin:auto}.sheet.template-freelancer .brand-services{border:0;padding:0}.sheet.template-freelancer .invoice-band{border-radius:24px}
    .sheet.template-creative .invoice-band{background:linear-gradient(110deg,${accent},#17191f 82%);border-radius:18px 2px 18px 2px}.sheet.template-creative .party-box{border-color:${accent}}
    .sheet.template-international .invoice-band{background:${accent};border-bottom:5px solid #d4e5e8}.sheet.template-international .meta-strip{background:#f0f6f7}
    .sheet.template-luxury .invoice-band{background:#171717;color:${accent};border:1px solid ${accent}}.sheet.template-luxury .party-title{background:#171717;color:${accent}}.sheet.template-luxury .items-table th{background:#222;color:${accent}}.sheet.template-luxury .grand-total,.sheet.template-luxury .payment-box h3{background:#171717;color:${accent}}
    .sheet.template-navy .invoice-band,.sheet.template-navy .party-title,.sheet.template-navy .items-table th,.sheet.template-navy .grand-total,.sheet.template-navy .payment-box h3{background:${accent}}
    .sheet.template-green .invoice-band,.sheet.template-green .party-title,.sheet.template-green .items-table th,.sheet.template-green .grand-total,.sheet.template-green .payment-box h3{background:${accent}}
    .sheet.template-tech .party-box,.sheet.template-tech .meta-strip,.sheet.template-tech .payment-box,.sheet.template-tech .total-box{border-style:dashed}.sheet.template-tech .invoice-band{border-radius:0;letter-spacing:2px}
    .sheet.template-mono .invoice-band,.sheet.template-mono .party-title,.sheet.template-mono .items-table th,.sheet.template-mono .grand-total,.sheet.template-mono .payment-box h3,.sheet.template-mono .thanks-footer{background:${accent}}
    .sheet.template-compact{padding:14px}.sheet.template-compact .party-box{min-height:100px}.sheet.template-compact .party-content,.sheet.template-compact .items-table{font-size:9px}.sheet.template-compact .items-table td,.sheet.template-compact .items-table th{padding:6px}
    .sheet.template-bold .invoice-band{padding:20px 22px}.sheet.template-bold .invoice-band h1{font-size:44px}.sheet.template-bold .grand-total{font-size:20px;padding:16px}.sheet.template-bold .items-table th{font-size:12px}
    .sheet.template-xenmark .invoice-band{border-radius:7px}.sheet.template-xenmark .party-title{min-width:42%}
  `;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${safe(invoice.invoiceNumber || 'SPYRIX invoice')}</title><style>
    *{box-sizing:border-box}body{margin:0;padding:22px;background:#f3f3f4;color:#1b1b20;font-family:${font},Arial,sans-serif}.sheet{font-family:${font},Arial,sans-serif;width:100%;max-width:${pageOrientation === 'landscape' ? '1450px' : '1100px'};margin:0 auto;padding:${density === 'compact' ? '16px' : density === 'spacious' ? '38px' : '28px'};background:#fff;border:1px solid #e6e0e2;box-shadow:0 5px 28px rgba(0,0,0,.06)}.brand-head{display:grid;grid-template-columns:34% 1fr;gap:24px;align-items:center;padding-bottom:19px}.brand-identity{display:flex;align-items:center;gap:12px;min-width:0}.brand-logo{max-width:${logoWidth}px;max-height:78px;object-fit:contain;flex:0 0 auto}.business-title{font-size:19px;font-weight:900;letter-spacing:1px}.business-copy{margin-top:5px;color:#4d4d52;font-size:10px;line-height:1.55}.brand-services{padding-left:24px;border-left:3px solid ${accent};font-size:11px;line-height:1.8;font-weight:800;letter-spacing:.7px}.invoice-band{margin:0 0 15px;padding:12px 20px;background:linear-gradient(100deg,${accent},color-mix(in srgb,${accent} 78%,#111));color:#fff;display:flex;align-items:center;justify-content:space-between;gap:18px}.invoice-band h1{margin:0;font-size:35px;letter-spacing:1px}.invoice-band .numbers{font-size:10px;line-height:1.8}.party-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}.party-box{min-height:150px;border:1px solid #b7a4a8;border-radius:6px;overflow:hidden}.party-title{display:inline-flex;min-width:42%;padding:10px 15px;color:#fff;background:${accent};font-weight:900;font-size:12px}.party-content{padding:10px 14px;font-size:11px;line-height:1.85}.party-content p{margin:0}.party-content span{display:inline-block;width:112px;color:#555}.meta-strip{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #cbbfc1;border-radius:6px;margin:0 0 14px;padding:10px}.meta-field{padding:5px 12px;border-right:1px solid #bcb7b8;font-size:10px}.meta-field:last-child{border:0}.meta-field span,.meta-field b{display:block}.meta-field span{color:#656168;margin-bottom:4px}.items-table{width:100%;border-collapse:collapse;font-size:11px}.items-table th{padding:10px 8px;color:#fff;background:${accent};border:1px solid #d5c5c8;text-align:center}.items-table td{padding:10px 8px;border:1px solid #d6d6d6;vertical-align:top}.items-table tbody tr:nth-child(even){background:#f4f5f5}.items-table td small{display:block;color:#777;margin-top:3px}.items-table .serial{text-align:center;width:42px}.items-table td:nth-child(3),.items-table td:nth-child(4),.items-table td:nth-child(5){text-align:center;white-space:nowrap}.bottom-grid{display:grid;grid-template-columns:1.25fr .95fr;gap:15px;margin-top:14px}.payment-box,.total-box{border:1px solid #cbbfc1;border-radius:7px;overflow:hidden}.payment-box h3{margin:0;padding:10px 14px;background:${accent};color:white;font-size:14px}.payment-inner{padding:11px;display:grid;grid-template-columns:145px 1fr;gap:12px;font-size:10px;line-height:1.6}.payment-inner .qr{width:145px;height:145px;object-fit:contain;border:1px solid #aaa;border-radius:5px;padding:6px}.payment-inner p{margin:6px 0}.payment-inner > div>b{display:block;padding:6px;color:#fff;background:${accent};text-align:center}.total-box>div:not(.thank-you){padding:10px 13px;border-bottom:1px solid #ddd;display:flex;justify-content:space-between;gap:10px;font-size:11px}.total-box .grand-total{background:${accent};color:#fff;font-size:16px;font-weight:900}.thank-you{padding:14px;text-align:center;color:${accent};font-family:inherit;font-size:28px;font-style:italic}.thank-you small{display:block;margin-top:3px;color:#222;font:800 9px ${font},Arial,sans-serif;letter-spacing:1px}.solo-total{width:48%;margin:14px 0 0 auto}.footer-band{margin-top:17px;padding:11px 16px;background:#161921;color:#fff;display:flex;justify-content:space-between;gap:15px;font-size:10px;line-height:1.6}.signature{max-width:150px;max-height:48px;object-fit:contain}.notes{margin-top:12px;color:#45454a;font-size:10px;line-height:1.6}.thanks-footer{margin-top:12px;padding:10px;text-align:center;color:#fff;background:${accent};font-size:10px;letter-spacing:2px}.custom-fields{margin-top:8px;font-size:10px;color:#555}.custom-fields p{margin:3px 0}@media print{body{padding:0;background:#fff}.sheet{max-width:none;border:0;box-shadow:none;padding:12mm}.invoice-band,.party-title,.items-table th,.grand-total,.payment-box h3,.footer-band,.thanks-footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:${pageSize} ${pageOrientation};margin:8mm}}@media(max-width:680px){body{padding:0}.sheet{padding:12px}.brand-head,.party-grid,.bottom-grid{grid-template-columns:1fr}.brand-identity{align-items:flex-start}.brand-logo{max-width:105px}.brand-services{border-left:0;padding:0}.meta-strip{grid-template-columns:repeat(2,1fr)}.meta-field:nth-child(2){border-right:0}.invoice-band h1{font-size:25px}.payment-inner{grid-template-columns:1fr}.payment-inner .qr{width:120px;height:120px}.solo-total{width:100%}}
  ${templateStyles}
  </style></head><body><main class="sheet template-${templateId}">
    <header class="brand-head"><div class="brand-identity">${logo ? `<img class="brand-logo" src="${logo}" alt="Business logo"/>` : ''}<div><div class="business-title">${safe(businessName)}</div><div class="business-copy">${safe(businessAddress)}<br/>${safe(businessPhone)}<br/>${safe(businessEmail)}${businessGstinHtml}</div></div></div><div class="brand-services">${safe(businessServices).replaceAll('\n', '<br/>')}</div></header>
    <section class="invoice-band"><h1>${safe(design.invoiceTitle || 'INVOICE')}</h1><div class="numbers"><b>Bill No.</b> &nbsp; ${safe(invoice.invoiceNumber)}<br/><b>Date</b> &nbsp; ${dateLabel(invoice.issueDate)}${dueDateHtml}</div></section>
    <section class="party-grid"><div class="party-box"><div class="party-title">● &nbsp; BILL TO</div><div class="party-content"><p><span>Name</span>: ${safe(customer.name || invoice.customerName)}</p><p><span>Company Name</span>: ${safe(customer.companyName || invoice.companyName || '—')}</p><p><span>Contact Person</span>: ${safe(customer.contactPerson || '—')}</p><p><span>Address</span>: ${safe(address || '—')}</p><p><span>Shipping</span>: ${safe(customer.shippingAddress || '—')}</p><p><span>Phone</span>: ${safe(customer.phone || '—')}</p><p><span>Email</span>: ${safe(customer.email || '—')}</p>${customerGstinHtml}<p><span>PAN / State code</span>: ${safe([customer.pan, customer.stateCode].filter(Boolean).join(' / ') || '—')}</p><p><span>Customer ID</span>: ${safe(customer.customerCode || '—')}</p>${customerCustom ? `<div class="custom-fields">${customerCustom}</div>` : ''}</div></div><div class="party-box"><div class="party-title">▦ &nbsp; BILL BY</div><div class="party-content"><p><span>Name</span>: ${safe(businessName)}</p><p><span>Address</span>: ${safe(businessAddress || '—')}</p><p><span>Phone</span>: ${safe(businessPhone || '—')}</p><p><span>Email</span>: ${safe(businessEmail || '—')}</p>${design.showBusinessGstin === false ? '' : `<p><span>GSTIN</span>: ${safe(businessGstin || '—')}</p>`}<p><span>Website</span>: ${safe(businessWebsite || '—')}</p><p><span>UPI ID</span>: ${safe(design.upiId || '—')}</p></div></div></section>
    <section class="meta-strip"><div class="meta-field"><span>Invoice Date</span><b>${dateLabel(invoice.issueDate)}</b></div>${design.showDueDate === false ? '' : `<div class="meta-field"><span>Due Date</span><b>${dateLabel(invoice.dueDate)}</b></div>`}${purchaseReferenceHtml}</section>
    <table class="items-table"><thead><tr><th>S. No.</th><th>Description</th><th>Pieces</th><th>Rate (₹)</th><th>Amount (₹)</th></tr></thead><tbody>${rows}</tbody></table>
    ${paymentHtml}
    ${customFields ? `<div class="custom-fields"><b>Additional Details</b>${customFields}</div>` : ''}
    ${invoice.notes ? `<div class="notes"><b>Notes:</b> ${safe(invoice.notes)}</div>` : ''}${invoice.terms ? `<div class="notes"><b>Terms:</b> ${safe(invoice.terms)}</div>` : ''}
    ${signature ? `<div class="notes"><b>Authorised Signatory</b><br/><img class="signature" src="${signature}" alt="Signature"/></div>` : ''}
    ${design.showFooter === false ? '' : `<footer class="footer-band"><span>${safe(businessAddress || 'Thank you for choosing our business.')}</span><span>${safe(businessPhone)} · ${safe(businessEmail)} · ${safe(businessWebsite)}</span><span>${businessGstin ? `GSTIN: ${safe(businessGstin)}` : 'SPYRIX'}</span></footer><div class="thanks-footer">${safe(design.footerText || 'THANK YOU FOR YOUR BUSINESS')}</div>`}
  </main><script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
}

export default function ModulePage({ sectionOverride, pageClassName = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { business, session, refreshSession } = useAuth();
  const { records, loading, error, refresh, createRecord, updateRecord, deleteRecord } = useData();
  const parts = location.pathname.split('/').filter(Boolean);
  const section = sectionOverride || parts[1] || 'tools';
  const action = parts[2] || '';
  const title = titles[section] || 'Business Workspace';
  const meta = moduleMeta[section];
  const resource = resourceFor[section];
  const Icon = meta?.icon || LayoutTemplate;
  const [query, setQuery] = useState('');
  const moduleSearchRef = useRef(null);
  const [tab, setTab] = useState('All');
  const [dialog, setDialog] = useState('');
  const [detail, setDetail] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({});
  const [lineItems, setLineItems] = useState([{ productId: '', name: '', description: '', quantity: 1, rate: '', taxRate: 0 }]);
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState({ name: '', companyName: '', email: '', phone: '', billingAddress: '', city: '', state: '', gstin: '' });
  const [invoiceDesign, setInvoiceDesign] = useState(loadInvoiceDesign);
  const [theme, setTheme] = useState(() => normalizeWorkspaceTheme(localStorage.getItem('spyrix_theme')));
  const [themeSaveStatus, setThemeSaveStatus] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(() => loadInvoiceDesign().templateId || 'xenmark');
  const [importRows, setImportRows] = useState([]);
  const [importError, setImportError] = useState('');
  const [recurring, setRecurring] = useState(() => { try { return JSON.parse(localStorage.getItem('spyrix_recurring_local') || '[]'); } catch { return []; } });
  const [calendarMonth, setCalendarMonth] = useState(() => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1); });
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [readAlertIds, setReadAlertIds] = useState([]);

  useEffect(() => {
    setTab(meta?.tabs?.[0] || 'All');
    if (section === 'invoices' && action === 'new') openCreate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, action]);

  useEffect(() => {
    const syncTheme = event => setTheme(normalizeWorkspaceTheme(event.detail || localStorage.getItem('spyrix_theme')));
    window.addEventListener('spyrix:theme-change', syncTheme);
    return () => window.removeEventListener('spyrix:theme-change', syncTheme);
  }, []);


  const changeWorkspaceTheme = async value => {
    const next = normalizeWorkspaceTheme(value);
    setTheme(next);
    localStorage.setItem('spyrix_theme', next);
    window.dispatchEvent(new CustomEvent('spyrix:theme-change', { detail: next }));
    if (!localStorage.getItem('spyrix_token')) {
      setThemeSaveStatus('Theme saved in this browser.');
      return;
    }
    setThemeSaveStatus('Saving theme to your workspace…');
    try {
      await apiRequest('/business/settings', { method: 'PUT', body: JSON.stringify({ theme: next }) });
      await refreshSession?.();
      setThemeSaveStatus('Theme saved to your business workspace.');
    } catch (error) {
      setThemeSaveStatus(`Theme is active in this browser, but workspace saving failed: ${error.message || 'Please try again.'}`);
    }
  };

  const rows = resource ? (records[resource] || []) : [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(row => {
      const searchText = JSON.stringify(row).toLowerCase();
      if (needle && !searchText.includes(needle)) return false;
      if (!meta || tab === 'All' || tab === 'All customers' || tab === 'All products' || tab === 'All expenses') return true;
      if (tab === 'Active') return row.status === 'active';
      if (tab === 'Low stock') return Number(row.stockOnHand || 0) <= Number(row.lowStockAt || 0) && Number(row.lowStockAt || 0) > 0;
      return String(row.status || '').toLowerCase().replaceAll('_', ' ') === tab.toLowerCase();
    });
  }, [rows, query, tab, meta]);

  function openCreate() {
    setEditingId(null); setFormError(''); setMessage('');
    setForm({ name: '', customerCode: '', contactPerson: '', companyName: '', email: '', phone: '', alternatePhone: '', billingAddress: '', shippingAddress: '', city: '', state: '', stateCode: '', postalCode: '', country: 'India', gstin: '', pan: '', paymentTerms: 'Due on receipt', customFields: [], sku: '', description: '', category: '', unit: 'pcs', price: '', cost: '', taxRate: 18, stockOnHand: 0, lowStockAt: 5, customerId: '', customerSnapshot: null, invoiceId: '', productId: records.products[0]?.id || '', quantity: 1, amount: '', method: 'upi', reference: '', purchaseOrder: '', title: '', vendor: '', expenseDate: new Date().toISOString().slice(0, 10), dueDate: '', issueDate: new Date().toISOString().slice(0, 10), validUntil: '', notes: '', terms: '' });
    setQuickCustomerOpen(false); setQuickCustomer({ name: '', companyName: '', email: '', phone: '', billingAddress: '', city: '', state: '', gstin: '' });
    const savedDesign = loadInvoiceDesign(); setInvoiceDesign(savedDesign); setSelectedTemplate(savedDesign.templateId || 'xenmark');
    const defaultProduct = records.products[0];
    setLineItems([{ productId: defaultProduct?.id || '', name: defaultProduct?.name || '', description: defaultProduct?.description || '', quantity: 1, rate: defaultProduct ? defaultProduct.price : '', discount: 0, taxRate: defaultProduct?.taxRate ?? 0 }]);
    setDialog('form');
  }

  function openEdit(row) {
    setEditingId(row.id); setFormError(''); setMessage(''); setDialog('form');
    setForm({ ...row, price: row.price ?? '', cost: row.cost ?? '', amount: row.amount ?? '', stockOnHand: row.stockOnHand ?? 0, lowStockAt: row.lowStockAt ?? 0, customFields: row.customFields || [] });
    if (['invoices', 'quotations'].includes(section)) {
      setLineItems((row.items || []).map(item => ({ productId: item.productId || '', name: item.name || '', description: item.description || '', quantity: item.quantity || 1, rate: item.rate ?? '', discount: item.discount ?? 0, taxRate: item.taxRate ?? 0 })));
      const savedDesign = { ...loadInvoiceDesign(), ...(row.design || {}) };
      savedDesign.templateId = row.templateId || savedDesign.templateId || 'xenmark';
      setInvoiceDesign(savedDesign); setSelectedTemplate(savedDesign.templateId);
    }
  }

  function changeForm(key, value) { setForm(current => ({ ...current, [key]: value })); }

  async function submitForm(event) {
    event.preventDefault(); setBusy(true); setFormError(''); setMessage('');
    try {
      let payload;
      if (section === 'customers') payload = { name: form.name, contactPerson: form.contactPerson, companyName: form.companyName, email: form.email, phone: form.phone, alternatePhone: form.alternatePhone, billingAddress: form.billingAddress, shippingAddress: form.shippingAddress, city: form.city, state: form.state, stateCode: form.stateCode, postalCode: form.postalCode, country: form.country, gstin: form.gstin, pan: form.pan, paymentTerms: form.paymentTerms, customFields: form.customFields || [], notes: form.notes };
      else if (section === 'products' || section === 'inventory') payload = { name: form.name, sku: form.sku, description: form.description, category: form.category, unit: form.unit, price: form.price, cost: form.cost, taxRate: form.taxRate, stockOnHand: form.stockOnHand, lowStockAt: form.lowStockAt };
      else if (section === 'invoices' || section === 'quotations') {
        const validItems = lineItems.filter(line => (line.productId || String(line.name || '').trim()) && Number(line.quantity) > 0).map(line => ({ ...(line.productId ? { productId: line.productId } : {}), name: String(line.name || '').trim(), description: line.description || '', quantity: Number(line.quantity), ...(line.rate !== '' ? { rate: Number(line.rate) } : {}), discount: Number(line.discount || 0), taxRate: Number(line.taxRate || 0) }));
        if (!form.customerId) throw new Error('Choose a customer before saving.');
        if (!validItems.length) throw new Error('Add at least one product or service.');
        const selectedCustomer = customerOptions.find(customer => customer.id === form.customerId) || form.customerSnapshot || {};
        const currentDesign = { ...invoiceDesign, templateId: selectedTemplate || invoiceDesign.templateId };
        payload = { customerId: form.customerId, customerSnapshot: selectedCustomer, items: validItems, notes: form.notes, terms: form.terms, purchaseOrder: form.purchaseOrder, reference: form.reference, customFields: form.customFields || [], issueDate: form.issueDate, dueDate: form.dueDate, validUntil: form.validUntil, templateId: currentDesign.templateId, design: currentDesign };
      } else if (section === 'payments') {
        payload = { amount: Number(form.amount), invoiceId: form.invoiceId || undefined, method: form.method, reference: form.reference, paymentDate: form.paymentDate || new Date().toISOString().slice(0, 10) };
        if (!payload.amount || payload.amount <= 0) throw new Error('Enter a payment amount greater than zero.');
      } else if (section === 'expenses') payload = { title: form.title, amount: Number(form.amount), category: form.category, vendor: form.vendor, paymentMethod: form.method, expenseDate: form.expenseDate, notes: form.notes, status: form.status || 'paid' };

      if (editingId) await updateRecord(resource, editingId, payload);
      else await createRecord(resource, payload);
      setDialog('');
      setMessage(editingId ? 'Record updated successfully.' : 'Record created successfully.');
      await refresh();
    } catch (err) { setFormError(err.message || 'Unable to save this record.'); }
    finally { setBusy(false); }
  }


  function convertQuotation(row) {
    if (!row || section !== 'quotations') return;
    const matchedCustomer = (records.customers || []).find(customer => customer.id === row.customerId);
    const snapshot = { ...(row.customerSnapshot || {}), ...(matchedCustomer || {}) };
    const sourceItems = Array.isArray(row.items) ? row.items : [];
    if (!sourceItems.length) { setMessage('This quotation has no line items to convert.'); return; }
    const prefill = {
      sourceQuotationId: row.id, sourceQuotationNumber: row.quotationNumber,
      customerId: matchedCustomer?.id || '', customer: {
        name: snapshot.name || row.customerName || '', contactPerson: snapshot.contactPerson || '', companyName: snapshot.companyName || '',
        email: snapshot.email || '', phone: snapshot.phone || '', alternatePhone: snapshot.alternatePhone || '',
        billingAddress: snapshot.billingAddress || '', shippingAddress: snapshot.shippingAddress || '',
        city: snapshot.city || '', state: snapshot.state || '', stateCode: snapshot.stateCode || '', postalCode: snapshot.postalCode || '',
        country: snapshot.country || 'India', gstin: snapshot.gstin || '', pan: snapshot.pan || '',
        paymentTerms: snapshot.paymentTerms || 'Due on receipt', notes: snapshot.notes || '', customFields: snapshot.customFields || [],
      },
      items: sourceItems.map(item => ({ productId: item.productId ? String(item.productId._id || item.productId) : '', name: item.name || '', description: item.description || '', sku: item.sku || '', quantity: Number(item.quantity || 1), unit: item.unit || 'pcs', rate: Number(item.rate ?? (Number(item.ratePaise || 0) / 100)), discount: Number(item.discount ?? (Number(item.discountPaise || 0) / 100)), taxRate: Number(item.taxRate || 0) })),
      notes: row.notes || '', design: row.design || {}, templateId: row.templateId || row.design?.templateId || 'xenmark', validUntil: row.validUntil || '',
    };
    try { sessionStorage.setItem('spyrix_invoice_prefill', JSON.stringify(prefill)); }
    catch { setMessage('Could not prepare the quotation conversion. Please reduce any unusually large attached image data and try again.'); return; }
    navigate('/app/invoices/new');
  }

  async function actionUpdate(record, payload) {
    try { await updateRecord(resource, record.id, payload); setMessage('Changes saved.'); await refresh(); }
    catch (err) { setMessage(err.message); }
  }

  async function handleArchive(record) {
    if (!window.confirm(`Remove ${record.name || record.title || record.invoiceNumber || 'this record'} from the active list?`)) return;
    try { await deleteRecord(resource, record.id); setMessage('Record removed from the active list.'); await refresh(); }
    catch (err) { setMessage(err.message); }
  }

  const customerOptions = records.customers;
  const productOptions = records.products;
  const unpaidInvoices = records.invoices.filter(invoice => !['paid', 'draft', 'cancelled'].includes(invoice.status) && Number(invoice.total || 0) - Number(invoice.paidAmount || 0) > 0);

  function addLine() { setLineItems(current => [...current, { productId: '', name: '', description: '', quantity: 1, rate: '', discount: 0, taxRate: 0 }]); }
  function updateLine(index, key, value) {
    setLineItems(current => current.map((line, i) => {
      if (i !== index) return line;
      if (key === 'productId') { const product = productOptions.find(item => item.id === value); return { ...line, productId: value, name: product?.name || line.name || '', description: product?.description || line.description || '', rate: product ? product.price : '', discount: 0, taxRate: product?.taxRate || 0 }; }
      return { ...line, [key]: value };
    }));
  }

  if (meta) {
    const isInvoiceLike = section === 'invoices' || section === 'quotations';
    const summaryValue = section === 'customers' ? rows.length : section === 'products' ? rows.length : section === 'invoices' ? money(rows.reduce((sum, row) => sum + Number(row.total || 0), 0)) : section === 'payments' ? money(rows.filter(row => row.status === 'completed').reduce((sum, row) => sum + Number(row.amount || 0), 0)) : section === 'expenses' ? money(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)) : rows.length;
    const activeCustomerCount = rows.filter(row => (row.status || 'active') === 'active' && !row.archived && row.isActive !== false).length;
    const collectedTotal = records.payments.filter(row => row.status === 'completed').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const completedPayments = rows.filter(row => row.status === 'completed');
    const pendingPayments = rows.filter(row => row.status === 'pending');
    const overduePaymentBalance = records.invoices.filter(invoice => !['paid', 'draft', 'cancelled'].includes(invoice.status) && invoice.dueDate && new Date(`${invoice.dueDate}T00:00:00`) < new Date(new Date().toDateString())).reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0)), 0);
    const paymentMonthly = Array.from({ length: 6 }, (_, index) => {
      const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0); start.setMonth(start.getMonth() - (5 - index));
      const end = new Date(start); end.setMonth(end.getMonth() + 1);
      const total = completedPayments.filter(row => { const date = new Date(row.paymentDate || row.createdAt); return !Number.isNaN(date.getTime()) && date >= start && date < end; }).reduce((sum, row) => sum + Number(row.amount || 0), 0);
      return { label: start.toLocaleDateString('en-IN', { month: 'short' }), total };
    });
    const maxPaymentMonth = Math.max(1, ...paymentMonthly.map(item => item.total));
    const paymentTrendPoints = paymentMonthly.map((item, index) => `${18 + index * 92},${128 - (item.total / maxPaymentMonth) * 93}`).join(' ');
    const methodTotals = Object.entries(rows.reduce((totals, row) => { const method = String(row.method || 'Other').replaceAll('_', ' ').toUpperCase(); totals[method] = (totals[method] || 0) + Number(row.amount || 0); return totals; }, {})).sort((a, b) => b[1] - a[1]);
    const methodVolume = methodTotals.reduce((sum, item) => sum + item[1], 0);
    const methodTotal = methodVolume || 1;
    let methodOffset = 0;
    const methodStops = methodTotals.map(([method, amount], index) => { const start = methodOffset; methodOffset += amount / methodTotal * 100; return `${['#111111', '#555555', '#929292', '#c9c9c9'][index % 4]} ${start}% ${methodOffset}%`; }).join(', ');
    const customerRecentRows = [...filtered].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 5);
    return (
      <div className={`module-page ${pageClassName}`}>
        <div className="module-breadcrumb"><span>Workspace</span><ChevronDown size={13} /><strong>{title}</strong></div>
        <header className="module-page-head">
          <div className="module-title-wrap"><span className="module-title-icon"><Icon size={24} /></span><div><div className="module-eyebrow">BUSINESS MANAGEMENT</div><h1>{title}</h1><p>{meta.description}</p></div></div>
          <div className="module-head-actions"><button className="secondary-button" onClick={() => exportCurrent()}><ArrowDownToLine size={16} /> Export</button><button className="primary-button" onClick={openCreate}><Plus size={17} /> {meta.cta}</button></div>
        </header>
        {message && <div className="module-inline-message"><CheckCircle2 size={16} />{message}<button onClick={() => setMessage('')}><X size={14} /></button></div>}
        {section === 'payments' ? (
          <section className="payment-kpi-row">
            <article><span>Total Paid</span><strong>{money(completedPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0))}</strong><small>Completed transactions</small></article>
            <article><span>Pending Amount</span><strong>{money(pendingPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0))}</strong><small>Awaiting confirmation</small></article>
            <article><span>Overdue</span><strong>{money(overduePaymentBalance)}</strong><small>Unpaid balance past due date</small></article>
            <article><span>Total Transactions</span><strong>{rows.length}</strong><small>All recorded payments</small></article>
          </section>
        ) : section === 'customers' ? (
          <section className="customer-kpi-row">
            <article><span>Total Customers</span><strong>{rows.length.toLocaleString('en-IN')}</strong><small>Customer profiles</small></article>
            <article><span>Active Customers</span><strong>{activeCustomerCount.toLocaleString('en-IN')}</strong><small>Available for new invoices</small></article>
            <article><span>Total Revenue</span><strong>{money(collectedTotal)}</strong><small>Completed payments in workspace</small></article>
          </section>
        ) : (
          <section className="module-kpi-row">
            <div className="module-kpi"><span>Total records</span><strong>{rows.length.toLocaleString('en-IN')}</strong><small>In this workspace</small></div>
            <div className="module-kpi"><span>{section === 'invoices' ? 'Invoice value' : section === 'expenses' ? 'Recorded expenses' : 'Current view'}</span><strong>{summaryValue}</strong><small>{section === 'invoices' ? 'Includes saved drafts' : 'Based on loaded records'}</small></div>
            <div className="module-kpi"><span>{section === 'invoices' ? 'Outstanding' : section === 'products' ? 'Low stock items' : 'Last updated'}</span><strong>{section === 'invoices' ? money(rows.filter(row => !['paid', 'draft', 'cancelled'].includes(row.status)).reduce((sum, row) => sum + Math.max(0, Number(row.total || 0) - Number(row.paidAmount || 0)), 0)) : section === 'products' ? rows.filter(row => Number(row.lowStockAt || 0) > 0 && Number(row.stockOnHand || 0) <= Number(row.lowStockAt || 0)).length : dateLabel(new Date().toISOString())}</strong><small>{section === 'invoices' ? 'Issued invoice balances' : 'Live workspace data'}</small></div>
          </section>
        )}
        <ModuleActionGrid section={section} navigate={navigate} onCreate={openCreate} onExport={exportCurrent} onRefresh={refresh} onSearch={() => moduleSearchRef.current?.focus()} onFilter={setTab} onReportExport={exportReport} />
        {section === 'customers' && !loading && !error && filtered.length > 0 && (
          <section className="customer-reference-grid" aria-label="Customer profiles">
            {filtered.slice(0, 8).map(customer => {
              const initials = String(customer.name || 'C').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
              return <article className="customer-reference-card" key={customer.id}>
                <div className="customer-reference-top"><span className="customer-reference-avatar">{initials}</span><StatusPill status={customer.status}/></div>
                <strong className="customer-reference-name">{customer.name}</strong>
                <small className="customer-reference-company">{customer.companyName || 'Individual customer'} · {customer.customerCode || 'Customer ID pending'}</small>
                <div className="customer-reference-contact"><span>{customer.phone || 'Phone not added'}</span><span>{customer.email || 'Email not added'}</span></div>
                <div className="customer-reference-actions"><button className="icon-button" title="View customer" onClick={() => setDetail(customer)}><Eye size={15}/></button><button className="icon-button" title="Edit customer" onClick={() => openEdit(customer)}><Pencil size={15}/></button><button className="icon-button danger-icon" title="Archive customer" onClick={() => handleArchive(customer)}><Archive size={15}/></button></div>
              </article>;
            })}
          </section>
        )}
        {section === 'payments' && (
          <section className="payment-insights-grid" aria-label="Payment overview">
            <article className="payment-insight-card payment-trend-card">
              <header><div><span>PAYMENT OVERVIEW</span><h2>Collection trend</h2><p>Completed payments over the last six months</p></div><b>{money(completedPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0))}</b></header>
              <div className="payment-trend-chart"><svg viewBox="0 0 500 155" role="img" aria-label="Monthly completed payment trend"><defs><linearGradient id="paymentAreaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#777" stopOpacity=".25"/><stop offset="1" stopColor="#777" stopOpacity="0"/></linearGradient></defs><path d={`M ${paymentTrendPoints.replaceAll(' ', ' L ')} L 478 145 L 18 145 Z`} fill="url(#paymentAreaFill)"/><polyline points={paymentTrendPoints} fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{paymentMonthly.map((item, index) => <circle key={item.label} cx={18 + index * 92} cy={128 - (item.total / maxPaymentMonth) * 93} r="4" fill="#111" stroke="#fff" strokeWidth="2"/> )}</svg><div className="payment-month-labels">{paymentMonthly.map(item => <span key={item.label}>{item.label}</span>)}</div></div>
            </article>
            <article className="payment-insight-card payment-method-card">
              <header><div><span>PAYMENT METHODS</span><h2>Where payments come from</h2><p>Share by recorded transaction value</p></div></header>
              <div className="payment-method-content"><div className="payment-method-donut" style={{ background: `conic-gradient(${methodStops || '#111 0 100%'})` }}><div><strong>{money(methodVolume)}</strong><small>Total volume</small></div></div><div className="payment-method-legend">{methodTotals.length ? methodTotals.slice(0, 4).map(([method, amount], index) => <div key={method}><i className={`method-swatch swatch-${index}`}/><span>{method}</span><b>{Math.round(amount / methodTotal * 100)}%</b></div>) : <small>No payment methods recorded yet.</small>}</div></div>
            </article>
          </section>
        )}
        {section === 'customers' && <div className="customer-recent-heading"><div><h2>Recent Customers</h2><p>Latest customer records in your workspace</p></div><span>{rows.length} TOTAL</span></div>}
        {section === 'payments' && <div className="customer-recent-heading"><div><h2>Recent Transactions</h2><p>Latest payment activity from your workspace</p></div><span>{rows.length} TOTAL</span></div>}
        <div className={section === 'customers' ? 'customer-lower-layout' : section === 'payments' ? 'payment-lower-layout' : ''}>
        <section className="module-table-card">
          <div className="module-table-toolbar">
            <div className="module-tabs">{meta.tabs.map(value => <button key={value} className={tab === value ? 'selected' : ''} onClick={() => setTab(value)}>{value}</button>)}</div>
            <div className="module-table-tools"><label className="module-search"><Search size={16} /><input ref={moduleSearchRef} placeholder={`Search ${title.toLowerCase()}...`} value={query} onChange={e => setQuery(e.target.value)} /></label><button className="icon-button" title="Refresh" onClick={refresh}><RefreshCw size={16} /></button></div>
          </div>
          {loading ? <div className="module-loading"><span className="mini-loader" /> Loading workspace records…</div> : error ? <div className="module-error"><AlertTriangle size={17} />{error}<button onClick={refresh}>Try again</button></div> : filtered.length === 0 ? <EmptyState title={query ? 'No matching records' : `No ${title.toLowerCase()} yet`} description={query ? 'Try another search term or clear the search.' : 'Add your first record to start using this module. Your records will stay connected to this workspace.'} onAction={query ? undefined : openCreate} action={meta.cta} /> : (
            <div className="module-table-scroll"><table className="module-table"><thead><tr>{tableHeaders(section).map(head => <th key={head}>{head}</th>)}<th className="actions-th">Actions</th></tr></thead><tbody>{(section === 'customers' ? customerRecentRows : filtered).map(row => <tr key={row.id}>{renderCells(section, row, { onView: () => setDetail(row), onEdit: () => section === 'invoices' ? navigate(`/app/invoices/new?edit=${encodeURIComponent(row.id)}`) : openEdit(row), onIssue: () => actionUpdate(row, { status: 'issued' }), onArchive: () => handleArchive(row), onPrint: () => printInvoice(row, row.design, business), onSend: () => actionUpdate(row, { status: 'sent' }), onAccept: () => actionUpdate(row, { status: 'accepted' }), onConvert: () => convertQuotation(row), onOpenInvoice: () => navigate('/app/invoices') })}</tr>)}</tbody></table></div>
          )}
          <footer className="module-table-footer"><span>Showing <b>{section === 'customers' ? customerRecentRows.length : filtered.length}</b> of <b>{rows.length}</b> records</span><span>Synced with MongoDB workspace</span></footer>
        </section>
        {section === 'customers' && <aside className="customer-growth-card"><Users size={27}/><h2>Grow Your Business</h2><p>Add new customers and build stronger relationships. Keep every business contact organised in one place.</p><button onClick={openCreate}>Add Customer <ArrowRight size={14}/></button></aside>}
        {section === 'payments' && <aside className="payment-quick-actions"><header><Zap size={18}/><h2>Quick Actions</h2></header><div><button onClick={() => navigate('/app/reports')}><TrendingUp size={15}/> View Reports</button><button onClick={() => exportReport('collections')}><Download size={15}/> Download Statements</button><button onClick={() => { setTab('Pending'); setMessage('Showing pending payments in the transaction list.'); }}><RefreshCw size={15}/> Review Pending</button><button onClick={() => exportCurrent()}><ArrowDownToLine size={15}/> Export Transactions</button></div></aside>}
        </div>
        {dialog === 'form' && <Modal wide={isInvoiceLike} title={`${editingId ? 'Edit' : 'Create'} ${section === 'customers' ? 'customer' : section === 'products' ? 'product' : section === 'invoices' ? 'invoice' : section === 'quotations' ? 'quotation' : section === 'payments' ? 'payment' : 'expense'}`} subtitle={isInvoiceLike ? 'Select a customer and add products or services. Totals are calculated from your item details.' : 'Enter the details below. Required fields are marked with *.'} onClose={() => setDialog('')}>
          <form className="module-form" onSubmit={submitForm}>
            {section === 'customers' && <>
              <div className="customer-code-row"><span className="customer-code-badge">CUSTOMER ID</span><strong>{editingId ? (form.customerCode || 'Assigned customer ID') : 'A unique ID is assigned automatically when saved'}</strong></div>
              <div className="module-form-grid">
                <Field label="Customer / contact name *"><input required value={form.name || ''} onChange={e => changeForm('name', e.target.value)} placeholder="e.g. Rahul Sharma" /></Field>
                <Field label="Company name"><input value={form.companyName || ''} onChange={e => changeForm('companyName', e.target.value)} placeholder="Business / company" /></Field>
                <Field label="Contact person"><input value={form.contactPerson || ''} onChange={e => changeForm('contactPerson', e.target.value)} placeholder="Person responsible" /></Field>
                <Field label="Email address"><input type="email" value={form.email || ''} onChange={e => changeForm('email', e.target.value)} placeholder="name@example.com" /></Field>
                <Field label="Phone number"><input value={form.phone || ''} onChange={e => changeForm('phone', e.target.value)} placeholder="+91" /></Field>
                <Field label="Alternate phone"><input value={form.alternatePhone || ''} onChange={e => changeForm('alternatePhone', e.target.value)} placeholder="Optional" /></Field>
                <Field label="City"><input value={form.city || ''} onChange={e => changeForm('city', e.target.value)} placeholder="City" /></Field>
                <Field label="State"><input value={form.state || ''} onChange={e => changeForm('state', e.target.value)} placeholder="State" /></Field>
                <Field label="State code"><input value={form.stateCode || ''} onChange={e => changeForm('stateCode', e.target.value)} placeholder="e.g. 09" /></Field>
                <Field label="Postal / PIN code"><input value={form.postalCode || ''} onChange={e => changeForm('postalCode', e.target.value)} placeholder="Postal code" /></Field>
                <Field label="Country"><input value={form.country || 'India'} onChange={e => changeForm('country', e.target.value)} /></Field>
                <Field label="Payment terms"><select value={form.paymentTerms || 'Due on receipt'} onChange={e => changeForm('paymentTerms', e.target.value)}><option>Due on receipt</option><option>Net 7 days</option><option>Net 15 days</option><option>Net 30 days</option><option>Net 45 days</option><option>Net 60 days</option></select></Field>
                <Field label="GSTIN"><input value={form.gstin || ''} onChange={e => changeForm('gstin', e.target.value.toUpperCase())} placeholder="GST identification number" /></Field>
                <Field label="PAN"><input value={form.pan || ''} onChange={e => changeForm('pan', e.target.value.toUpperCase())} placeholder="PAN (optional)" /></Field>
                <Field label="Billing address" full><textarea value={form.billingAddress || ''} onChange={e => changeForm('billingAddress', e.target.value)} placeholder="Billing address" rows="2" /></Field>
                <Field label="Shipping address" full><textarea value={form.shippingAddress || ''} onChange={e => changeForm('shippingAddress', e.target.value)} placeholder="Shipping address (optional)" rows="2" /></Field>
                <Field label="Notes" full><textarea value={form.notes || ''} onChange={e => changeForm('notes', e.target.value)} rows="2" placeholder="Internal customer notes" /></Field>
              </div>
              <div className="custom-fields-editor"><div className="module-line-head"><strong>Custom customer details</strong><button type="button" className="text-action" onClick={() => changeForm('customFields', [...(form.customFields || []), { label: '', value: '' }])}><Plus size={14}/> Add custom field</button></div>{(form.customFields || []).map((field, index) => <div className="custom-field-row" key={index}><input aria-label="Custom field label" value={field.label || ''} placeholder="Field name" onChange={e => changeForm('customFields', form.customFields.map((item, i) => i === index ? { ...item, label: e.target.value } : item))}/><input aria-label="Custom field value" value={field.value || ''} placeholder="Value" onChange={e => changeForm('customFields', form.customFields.map((item, i) => i === index ? { ...item, value: e.target.value } : item))}/><button type="button" className="icon-button danger-icon" onClick={() => changeForm('customFields', form.customFields.filter((_, i) => i !== index))}><Trash2 size={14}/></button></div>)}</div>
            </>}
            {(section === 'products' || section === 'inventory') && <div className="module-form-grid">
              <Field label="Product / service name *"><input required value={form.name || ''} onChange={e => changeForm('name', e.target.value)} placeholder="Item name" /></Field>
              <Field label="SKU / code"><input value={form.sku || ''} onChange={e => changeForm('sku', e.target.value.toUpperCase())} placeholder="PRD-001" /></Field>
              <Field label="Selling price (₹) *"><input required min="0" step="0.01" type="number" value={form.price ?? ''} onChange={e => changeForm('price', e.target.value)} /></Field>
              <Field label="Cost price (₹)"><input min="0" step="0.01" type="number" value={form.cost ?? ''} onChange={e => changeForm('cost', e.target.value)} /></Field>
              <Field label="Category"><input value={form.category || ''} onChange={e => changeForm('category', e.target.value)} placeholder="General" /></Field>
              <Field label="Unit"><select value={form.unit || 'pcs'} onChange={e => changeForm('unit', e.target.value)}><option value="pcs">Pieces</option><option value="pack">Pack</option><option value="kg">Kilogram</option><option value="hour">Hour</option><option value="project">Project</option><option value="service">Service</option></select></Field>
              <Field label="Tax rate (%)"><input type="number" min="0" max="100" step="0.01" value={form.taxRate ?? 0} onChange={e => changeForm('taxRate', e.target.value)} /></Field>
              <Field label="Stock on hand"><input type="number" min="0" step="1" value={form.stockOnHand ?? 0} onChange={e => changeForm('stockOnHand', e.target.value)} /></Field>
              <Field label="Low stock alert at"><input type="number" min="0" step="1" value={form.lowStockAt ?? 0} onChange={e => changeForm('lowStockAt', e.target.value)} /></Field>
              <Field label="Description" full><textarea rows="2" value={form.description || ''} onChange={e => changeForm('description', e.target.value)} placeholder="Short product description" /></Field>
            </div>}
            {isInvoiceLike && <>
              <div className="invoice-customer-select"><div className="invoice-customer-heading"><strong>Bill to customer *</strong><button type="button" className="text-action" onClick={() => { setQuickCustomer({ name: '', companyName: '', email: '', phone: '', billingAddress: '', city: '', state: '', gstin: '' }); setQuickCustomerOpen(value => !value); }}> <Plus size={14}/> Add customer</button></div><CustomerPicker customers={customerOptions} value={form.customerId || ''} onSelect={(value, customer) => { changeForm('customerId', value); changeForm('customerSnapshot', customer || null); }} onCreate={() => setQuickCustomerOpen(true)}/>
                {quickCustomerOpen && <div className="quick-customer-panel"><div className="quick-customer-head"><strong>Quick add customer</strong><span>Full details can be completed later in Customers.</span></div><div className="module-form-grid"><Field label="Customer name *"><input value={quickCustomer.name} onChange={e => setQuickCustomer(current => ({ ...current, name: e.target.value }))} placeholder="Customer name"/></Field><Field label="Company"><input value={quickCustomer.companyName} onChange={e => setQuickCustomer(current => ({ ...current, companyName: e.target.value }))} placeholder="Company name"/></Field><Field label="Email"><input type="email" value={quickCustomer.email} onChange={e => setQuickCustomer(current => ({ ...current, email: e.target.value }))} placeholder="email@example.com"/></Field><Field label="Phone"><input value={quickCustomer.phone} onChange={e => setQuickCustomer(current => ({ ...current, phone: e.target.value }))} placeholder="+91"/></Field><Field label="Billing address" full><textarea rows="2" value={quickCustomer.billingAddress} onChange={e => setQuickCustomer(current => ({ ...current, billingAddress: e.target.value }))} placeholder="Billing address"/></Field><Field label="City"><input value={quickCustomer.city} onChange={e => setQuickCustomer(current => ({ ...current, city: e.target.value }))} placeholder="City"/></Field><Field label="State"><input value={quickCustomer.state} onChange={e => setQuickCustomer(current => ({ ...current, state: e.target.value }))} placeholder="State"/></Field><Field label="GSTIN"><input value={quickCustomer.gstin} onChange={e => setQuickCustomer(current => ({ ...current, gstin: e.target.value.toUpperCase() }))} placeholder="GSTIN"/></Field></div><div className="quick-customer-actions"><button type="button" className="secondary-button" onClick={() => setQuickCustomerOpen(false)}>Cancel</button><button type="button" className="primary-button" disabled={!quickCustomer.name.trim()} onClick={async () => { try { setBusy(true); const customer = await createRecord('customers', quickCustomer); changeForm('customerId', customer.id); changeForm('customerSnapshot', customer); setQuickCustomerOpen(false); setMessage(`Customer ${customer.customerCode || ''} added and selected.`); await refresh(); } catch (err) { setFormError(err.message); } finally { setBusy(false); } }}>Save & select customer</button></div></div>}
                {(customerOptions.find(customer => customer.id === form.customerId) || form.customerSnapshot) && (() => { const customer = customerOptions.find(row => row.id === form.customerId) || form.customerSnapshot; return <div className="selected-customer-card"><div className="selected-customer-title"><span className="selected-customer-avatar">{(customer.name || 'C').slice(0,1).toUpperCase()}</span><div><strong>{customer.name}</strong><small>{customer.companyName || 'Individual customer'} · {customer.customerCode || 'New customer'}</small></div><span className="selected-customer-check"><CheckCircle2 size={16}/> Selected</span></div><div className="selected-customer-details"><span>{customer.phone || 'No phone'}</span><span>{customer.email || 'No email'}</span><span>{[customer.billingAddress, customer.city, customer.state, customer.postalCode].filter(Boolean).join(', ') || 'No billing address saved'}</span><span>GSTIN: {customer.gstin || 'Not provided'}</span></div></div>; })()}
              </div>
              <div className="module-form-grid invoice-meta-grid"><Field label={section === 'invoices' ? 'Invoice date' : 'Valid until'}><input type="date" value={section === 'invoices' ? form.issueDate || '' : form.validUntil || ''} onChange={e => changeForm(section === 'invoices' ? 'issueDate' : 'validUntil', e.target.value)} /></Field>{section === 'invoices' && <Field label="Due date"><input type="date" value={form.dueDate || ''} onChange={e => changeForm('dueDate', e.target.value)} /></Field>}{section === 'invoices' && <Field label="Purchase order number"><input value={form.purchaseOrder || ''} onChange={e => changeForm('purchaseOrder', e.target.value)} placeholder="PO number"/></Field>}{section === 'invoices' && <Field label="Reference"><input value={form.reference || ''} onChange={e => changeForm('reference', e.target.value)} placeholder="Reference / delivery note"/></Field>}</div>
              <div className="module-line-items"><div className="module-line-head"><strong>Items & services</strong><button type="button" className="text-action" onClick={addLine}><Plus size={15} /> Add line</button></div>
                {lineItems.map((line, index) => <div className="module-line-row invoice-line-row" key={index}><select aria-label="Product" value={line.productId} onChange={e => updateLine(index, 'productId', e.target.value)}><option value="">Custom item / choose product</option>{productOptions.map(product => <option key={product.id} value={product.id}>{product.name} · {money(product.price)}</option>)}</select><input aria-label="Item name or description" value={line.name || ''} placeholder="Item name" onChange={e => updateLine(index, 'name', e.target.value)}/><input aria-label="Quantity" type="number" min="0.001" step="0.001" value={line.quantity} onChange={e => updateLine(index, 'quantity', e.target.value)} /><input aria-label="Rate" type="number" min="0" step="0.01" placeholder="Rate ₹" value={line.rate} onChange={e => updateLine(index, 'rate', e.target.value)} /><input aria-label="Line discount in rupees" type="number" min="0" step="0.01" placeholder="Discount ₹" value={line.discount ?? 0} onChange={e => updateLine(index, 'discount', e.target.value)} /><input aria-label="Tax percentage" type="number" min="0" max="100" step="0.01" placeholder="Tax %" value={line.taxRate} onChange={e => updateLine(index, 'taxRate', e.target.value)} /><button type="button" className="icon-button danger-icon" title="Remove item" onClick={() => setLineItems(current => current.length > 1 ? current.filter((_, i) => i !== index) : current)}><Trash2 size={15} /></button></div>)}
                <p className="module-form-hint">Choose a saved product to fill its rate and tax, or type a custom item. Add any line discount in rupees; the backend validates discounts and recalculates all totals before saving.</p>
              </div>
              <div className="invoice-design-summary"><div><span className="invoice-design-swatch" style={{ background: invoiceDesign.accentColor }}/><div><strong>{invoiceDesign.templateId || 'xenmark'} invoice design</strong><small>{invoiceDesign.fontFamily} · Logo {invoiceDesign.showLogo ? 'on' : 'off'} · QR {invoiceDesign.showQr ? 'on' : 'off'}</small></div></div><button type="button" className="text-action" onClick={() => navigate('/app/templates')}>Customise invoice design <ArrowRight size={14}/></button></div>
              <div className="custom-fields-editor"><div className="module-line-head"><strong>Custom invoice details</strong><button type="button" className="text-action" onClick={() => changeForm('customFields', [...(form.customFields || []), { label: '', value: '' }])}><Plus size={14}/> Add custom detail</button></div>{(form.customFields || []).map((field, index) => <div className="custom-field-row" key={index}><input value={field.label || ''} placeholder="Field name" onChange={e => changeForm('customFields', form.customFields.map((item, i) => i === index ? { ...item, label: e.target.value } : item))}/><input value={field.value || ''} placeholder="Value" onChange={e => changeForm('customFields', form.customFields.map((item, i) => i === index ? { ...item, value: e.target.value } : item))}/><button type="button" className="icon-button danger-icon" onClick={() => changeForm('customFields', form.customFields.filter((_, i) => i !== index))}><Trash2 size={14}/></button></div>)}</div>
              <Field label="Notes" full><textarea rows="2" value={form.notes || ''} onChange={e => changeForm('notes', e.target.value)} placeholder="Notes or payment instructions" /></Field>
              <Field label="Terms & conditions" full><textarea rows="2" value={form.terms || ''} onChange={e => changeForm('terms', e.target.value)} placeholder="Payment terms / delivery terms" /></Field>
            </>}
            {section === 'payments' && <div className="module-form-grid">
              <Field label="Invoice (optional)"><select value={form.invoiceId || ''} onChange={e => { const invoice = unpaidInvoices.find(row => row.id === e.target.value); changeForm('invoiceId', e.target.value); if (invoice) changeForm('amount', Math.max(0, invoice.total - invoice.paidAmount).toFixed(2)); }}><option value="">Unallocated payment</option>{unpaidInvoices.map(invoice => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} · {invoice.customerName} · Balance {money(invoice.total - invoice.paidAmount)}</option>)}</select></Field>
              <Field label="Amount received (₹) *"><input required min="0.01" step="0.01" type="number" value={form.amount || ''} onChange={e => changeForm('amount', e.target.value)} /></Field>
              <Field label="Payment method"><select value={form.method || 'upi'} onChange={e => changeForm('method', e.target.value)}><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="cheque">Cheque</option><option value="card">Card</option><option value="other">Other</option></select></Field>
              <Field label="Reference / transaction ID"><input value={form.reference || ''} onChange={e => changeForm('reference', e.target.value)} placeholder="Optional reference" /></Field>
              <Field label="Payment date"><input type="date" value={form.paymentDate || new Date().toISOString().slice(0, 10)} onChange={e => changeForm('paymentDate', e.target.value)} /></Field>
            </div>}
            {section === 'expenses' && <div className="module-form-grid">
              <Field label="Expense title *"><input required value={form.title || ''} onChange={e => changeForm('title', e.target.value)} placeholder="e.g. Office rent" /></Field>
              <Field label="Amount (₹) *"><input required type="number" min="0.01" step="0.01" value={form.amount || ''} onChange={e => changeForm('amount', e.target.value)} /></Field>
              <Field label="Category"><select value={form.category || 'General'} onChange={e => changeForm('category', e.target.value)}><option>General</option><option>Office</option><option>Inventory</option><option>Utilities</option><option>Travel</option><option>Marketing</option><option>Salaries</option><option>Taxes</option></select></Field>
              <Field label="Vendor"><input value={form.vendor || ''} onChange={e => changeForm('vendor', e.target.value)} placeholder="Payee / vendor" /></Field>
              <Field label="Date"><input type="date" value={form.expenseDate || ''} onChange={e => changeForm('expenseDate', e.target.value)} /></Field>
              <Field label="Payment status"><select value={form.status || 'paid'} onChange={e => changeForm('status', e.target.value)}><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></Field>
            </div>}
            {formError && <div className="module-form-error"><AlertTriangle size={15} />{formError}</div>}
            <footer className="module-form-actions"><button type="button" className="secondary-button" onClick={() => setDialog('')}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save changes' : `Save ${section === 'invoices' ? 'draft invoice' : section === 'quotations' ? 'quotation' : 'record'}`} <ArrowRight size={16} /></button></footer>
          </form>
        </Modal>}
        {detail && <Modal title={detail.invoiceNumber || detail.quotationNumber || detail.name || detail.title || 'Record details'} subtitle="Record details from the current workspace" onClose={() => setDetail(null)} wide>
          <div className="module-detail-grid">{Object.entries(detail).filter(([key, value]) => !['_id', 'id', '__v', 'items', 'customerSnapshot'].includes(key) && typeof value !== 'object').map(([key, value]) => <div key={key}><span>{key.replace(/[A-Z]/g, char => ` ${char}`).replace(/^./, char => char.toUpperCase())}</span><strong>{key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') || key.toLowerCase().includes('price') ? money(value) : String(value ?? '—')}</strong></div>)}</div>
          {detail.items?.length > 0 && <div className="module-detail-items"><h3>Line items</h3>{detail.items.map((line, index) => <div key={index}><span>{line.name} × {line.quantity}</span><strong>{money(line.lineTotal ?? Number(line.quantity || 1) * Number(line.rate || 0))}</strong></div>)}</div>}
          <footer className="module-form-actions"><button className="secondary-button" onClick={() => setDetail(null)}>Close</button>{section === 'invoices' && <button className="primary-button" onClick={() => printInvoice(detail, detail.design, business)}><Printer size={16} /> Print / Save PDF</button>}</footer>
        </Modal>}
      </div>
    );
  }

  function exportCurrent() {
    if (!resource) return;
    const exportRows = (records[resource] || []).map(row => Object.fromEntries(Object.entries(row).filter(([key, value]) => !['_id', 'id', 'items'].includes(key) && (typeof value !== 'object' || value === null))));
    if (exportCsv(`spyrix-${resource}-${new Date().toISOString().slice(0, 10)}.csv`, exportRows)) setMessage(`${exportRows.length} ${resource} exported as CSV.`);
    else setMessage('There are no records to export yet.');
  }

  function exportReport(kind) {
    const flat = list => list.map(row => Object.fromEntries(Object.entries(row).filter(([key, value]) => !['_id', 'id', 'items', 'customerSnapshot', 'design'].includes(key) && (typeof value !== 'object' || value === null))));
    const openInvoices = records.invoices.filter(row => !['paid', 'draft', 'cancelled'].includes(row.status) && Number(row.total || 0) > Number(row.paidAmount || 0));
    let rowsToExport = [];
    let filename = `spyrix-${kind}`;
    if (kind === 'collections') rowsToExport = flat(records.payments.filter(row => row.status === 'completed'));
    else if (kind === 'invoice-register') rowsToExport = records.invoices.map(row => ({ invoiceNumber: row.invoiceNumber, customer: row.customerName, issueDate: row.issueDate, dueDate: row.dueDate, subtotal: row.subtotal, tax: row.tax, total: row.total, paid: row.paidAmount, balance: Math.max(0, Number(row.total || 0) - Number(row.paidAmount || 0)), status: row.status }));
    else if (kind === 'outstanding') rowsToExport = openInvoices.map(row => ({ invoiceNumber: row.invoiceNumber, customer: row.customerName, issueDate: row.issueDate, dueDate: row.dueDate, total: row.total, paid: row.paidAmount, balance: Math.max(0, Number(row.total || 0) - Number(row.paidAmount || 0)), status: row.status }));
    else if (kind === 'expenses') rowsToExport = flat(records.expenses);
    else if (kind === 'customers') rowsToExport = flat(records.customers);
    else if (kind === 'products') rowsToExport = flat(records.products);
    else if (kind === 'stock') rowsToExport = records.products.map(row => ({ name: row.name, sku: row.sku, category: row.category, stockOnHand: row.stockOnHand, lowStockAt: row.lowStockAt, price: row.price }));
    else if (kind === 'low-stock') rowsToExport = records.products.filter(row => Number(row.lowStockAt || 0) > 0 && Number(row.stockOnHand || 0) <= Number(row.lowStockAt || 0)).map(row => ({ name: row.name, sku: row.sku, stockOnHand: row.stockOnHand, lowStockAt: row.lowStockAt }));
    else if (kind === 'out-of-stock') rowsToExport = records.products.filter(row => Number(row.stockOnHand || 0) <= 0).map(row => ({ name: row.name, sku: row.sku, category: row.category, lowStockAt: row.lowStockAt }));
    else if (kind === 'tax') rowsToExport = records.invoices.map(row => ({ invoiceNumber: row.invoiceNumber, customer: row.customerName, subtotal: row.subtotal, tax: row.tax, total: row.total, issueDate: row.issueDate, status: row.status }));
    else if (kind === 'due-dates') rowsToExport = openInvoices.filter(row => row.dueDate).map(row => ({ invoiceNumber: row.invoiceNumber, customer: row.customerName, dueDate: row.dueDate, total: row.total, paid: row.paidAmount, balance: Math.max(0, Number(row.total || 0) - Number(row.paidAmount || 0)), status: row.status }));
    else if (kind === 'customer-template') rowsToExport = [{ name: '', companyName: '', contactPerson: '', email: '', phone: '', billingAddress: '', city: '', state: '', stateCode: '', postalCode: '', gstin: '', pan: '' }];
    else if (kind === 'backup') {
      const payload = { app: 'SPYRIX INVOICE', version: 1, createdAt: new Date().toISOString(), business: business?.name || 'SPYRIX Workspace', records };
      downloadFile(`spyrix-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
      setMessage('A JSON snapshot of the currently loaded workspace records was downloaded.');
      return;
    }
    if (exportCsv(`${filename}-${new Date().toISOString().slice(0, 10)}.csv`, rowsToExport)) setMessage(`${rowsToExport.length} rows exported to CSV.`);
    else setMessage('There are no records in this report yet.');
  }

  if (section === 'templates') {
    const templates = [
      ['classic', 'Classic Red', 'A familiar invoice layout with a bold brand header', 'Classic'], ['minimal', 'Minimal Clean', 'More whitespace and simple typography', 'Minimal'], ['corporate', 'Corporate', 'Structured business layout for professional teams', 'Corporate'], ['modern', 'Modern Edge', 'Bold headings and contemporary section blocks', 'Modern'], ['elegant', 'Elegant', 'Subtle dividers and refined type treatment', 'Elegant'], ['gst', 'GST Detailed', 'Additional tax and registration information areas', 'GST'],
    ];
    return <div className={`module-page ${pageClassName}`}><div className="module-breadcrumb">Workspace <ChevronDown size={13} /> <strong>{title}</strong></div><header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><LayoutTemplate size={24} /></span><div><div className="module-eyebrow">DOCUMENT DESIGN</div><h1>Invoice templates</h1><p>Choose a visual starting point for new invoices. Your invoice data stays unchanged.</p></div></div></header><div className="template-grid">{templates.map(([idValue, name, description, label], index) => <article className={`template-card ${selectedTemplate === idValue ? 'chosen' : ''}`} key={idValue}><div className={`template-preview template-${idValue}`}><div className="preview-paper"><div className="preview-paper-head"><b>SPYRIX</b><span>{label.toUpperCase()}</span></div><div className="preview-lines"><i /><i /><i /></div><div className="preview-table"><i /><i /><i /><i /></div><div className="preview-total" /></div></div><div className="template-card-copy"><div><strong>{name}</strong><p>{description}</p></div>{selectedTemplate === idValue && <span className="template-check"><Check size={14} /></span>}</div><button className={selectedTemplate === idValue ? 'secondary-button selected-template-button' : 'primary-button'} onClick={() => { setSelectedTemplate(idValue); localStorage.setItem('spyrix_invoice_template', idValue); setMessage(`${name} selected for new invoices.`); }}>{selectedTemplate === idValue ? 'Selected' : 'Use template'}</button></article>)}</div><div className="module-info-strip"><ShieldCheck size={18} /><span>Template selection is saved in this browser. Existing issued invoices keep their original saved content.</span></div></div>;
  }

  if (section === 'inventory') {
    const filteredProducts = records.products.filter(product => {
      const haystack = `${product.name || ''} ${product.sku || ''} ${product.category || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(query.trim().toLowerCase());
      const stock = Number(product.stockOnHand || 0);
      const threshold = Number(product.lowStockAt || 0);
      const matchesView = tab === 'Low stock' ? threshold > 0 && stock <= threshold : tab === 'Out of stock' ? stock <= 0 : true;
      return matchesSearch && matchesView;
    });
    const totalUnits = records.products.reduce((sum, product) => sum + Number(product.stockOnHand || 0), 0);
    const lowStockCount = records.products.filter(product => Number(product.lowStockAt || 0) > 0 && Number(product.stockOnHand || 0) <= Number(product.lowStockAt || 0)).length;
    const outOfStockCount = records.products.filter(product => Number(product.stockOnHand || 0) <= 0).length;
    const categoryMap = records.products.reduce((map, product) => {
      const category = String(product.category || 'Uncategorised').trim() || 'Uncategorised';
      if (!map.has(category)) map.set(category, { count: 0, units: 0 });
      const group = map.get(category);
      group.count += 1;
      group.units += Number(product.stockOnHand || 0);
      return map;
    }, new Map());
    const sortedCategories = [...categoryMap.entries()].sort((a, b) => b[1].count - a[1].count);
    const visibleCategories = sortedCategories.slice(0, 5).map(([name, stats]) => ({ name, ...stats }));
    const remainingCategories = sortedCategories.slice(5);
    if (remainingCategories.length) visibleCategories.push({ name: 'Other categories', count: remainingCategories.reduce((sum, [, stats]) => sum + stats.count, 0), units: remainingCategories.reduce((sum, [, stats]) => sum + stats.units, 0) });
    else if (visibleCategories.length < 6) visibleCategories.push({ name: 'Other categories', count: 0, units: 0 });
    return (
      <div className={`module-page ${pageClassName}`}>
        <div className="module-breadcrumb">Workspace <ChevronDown size={13} /> <strong>{title}</strong></div>
        <header className="module-page-head">
          <div className="module-title-wrap"><span className="module-title-icon"><Boxes size={24} /></span><div><div className="module-eyebrow">STOCK CONTROL</div><h1>Inventory</h1><p>Track product quantities, stock value and replenishment needs across your business.</p></div></div>
          <div className="module-head-actions"><button className="secondary-button" onClick={() => navigate('/app/imports')}><Upload size={15}/> Import</button><button className="secondary-button" onClick={() => exportReport('stock')}><ArrowDownToLine size={15}/> Export</button><button className="primary-button" onClick={() => navigate('/app/products')}><Plus size={16}/> Add product</button></div>
        </header>
        <section className="inventory-category-row" aria-label="Product categories">
          {visibleCategories.slice(0, 6).map((category, index) => <article key={category.name}><span className="inventory-category-icon"><Package size={18}/></span><div><small>{category.name}</small><strong>{category.count.toLocaleString('en-IN')}</strong><span>{category.units.toLocaleString('en-IN')} units in stock</span></div></article>)}
        </section>
        <section className="inventory-overview-strip"><span><b>{records.products.length}</b> products</span><span><b>{totalUnits.toLocaleString('en-IN')}</b> units</span><span><b>{lowStockCount}</b> low stock</span><span><b>{outOfStockCount}</b> out of stock</span></section>
        <section className="module-table-card inventory-reference-table">
          <div className="module-table-toolbar">
            <div><strong className="inventory-table-title">All products</strong><small className="inventory-table-subtitle">{filteredProducts.length} products in this view</small></div>
            <div className="module-table-tools">
              <div className="inventory-view-filters"><button className={tab === 'All' ? 'selected' : ''} onClick={() => setTab('All')}>All</button><button className={tab === 'Low stock' ? 'selected' : ''} onClick={() => setTab('Low stock')}>Low stock</button><button className={tab === 'Out of stock' ? 'selected' : ''} onClick={() => setTab('Out of stock')}>Out of stock</button></div>
              <label className="module-search"><Search size={16}/><input ref={moduleSearchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products..." /></label>
              <button className="icon-button" title="Refresh inventory" onClick={refresh}><RefreshCw size={16}/></button>
            </div>
          </div>
          {loading ? <div className="module-loading"><span className="mini-loader"/> Loading inventory…</div> : error ? <div className="module-error"><AlertTriangle size={17}/>{error}<button onClick={refresh}>Try again</button></div> : (
            <div className="module-table-scroll"><table className="module-table"><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              {filteredProducts.map(product => <tr key={product.id}><td><div className="inventory-product-cell"><span className="inventory-product-thumb">{product.imageUrl ? <img src={product.imageUrl} alt=""/> : <Package size={18}/>}</span><span><b>{product.name}</b><small>{product.sku || 'SKU not set'}</small></span></div></td><td>{product.category || 'General'}</td><td><b>{Number(product.stockOnHand || 0).toLocaleString('en-IN')}</b><small className="inventory-stock-note">Reorder at {Number(product.lowStockAt || 0)}</small></td><td>{money(product.price)}</td><td><StatusPill status={Number(product.stockOnHand || 0) <= 0 ? 'cancelled' : Number(product.lowStockAt || 0) > 0 && Number(product.stockOnHand || 0) <= Number(product.lowStockAt || 0) ? 'overdue' : 'active'}/></td><td><div className="inventory-row-actions"><button className="icon-button" title="View product" onClick={() => setDetail(product)}><Eye size={15}/></button><button className="icon-button" title="Edit product" onClick={() => openEdit(product)}><Pencil size={15}/></button><button className="icon-button" title="Increase stock" onClick={() => actionUpdate(product,{stockOnHand:Number(product.stockOnHand || 0)+1})}>+</button></div></td></tr>)}
              {!filteredProducts.length && <tr><td colSpan={6}><EmptyState title="No products found" description="Add a product or change your search and stock filter." onAction={() => navigate('/app/products')} action="Manage products"/></td></tr>}
            </tbody></table></div>
          )}
          <footer className="module-table-footer"><span>Stock adjustments update the connected product record.</span><span>MongoDB workspace inventory</span></footer>
        </section>
      </div>
    );
  }

  if (section === 'reports') {
    const revenue = records.payments.filter(payment => payment.status === 'completed').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const expenses = records.expenses.filter(expense => expense.status === 'paid').reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const outstanding = records.invoices.filter(invoice => !['paid', 'draft', 'cancelled'].includes(invoice.status)).reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0)), 0);
    const monthly = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(); date.setMonth(date.getMonth() - (5 - index));
      const label = date.toLocaleDateString('en-IN', { month: 'short' });
      const total = records.payments.filter(payment => {
        const paymentDate = new Date(`${payment.paymentDate || ''}T00:00:00`);
        return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear() && payment.status === 'completed';
      }).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      return { label, total };
    });
    const maxMonth = Math.max(1, ...monthly.map(month => month.total));
    const linePoints = monthly.map((month, index) => `${28 + index * 108},${178 - (month.total / maxMonth) * 135}`).join(' ');
    const lineArea = `28,178 ${linePoints} 568,178`;
    const productByName = new Map(records.products.map(product => [String(product.name || '').toLowerCase(), product]));
    const productSales = new Map();
    const categorySales = new Map();
    records.invoices.filter(invoice => !['draft', 'cancelled'].includes(invoice.status)).forEach(invoice => {
      (invoice.items || []).forEach(item => {
        const match = productByName.get(String(item.name || '').toLowerCase()) || records.products.find(product => item.productId && product.id === item.productId) || records.products.find(product => item.sku && product.sku === item.sku);
        const name = item.name || match?.name || 'Other item';
        const category = match?.category || 'Uncategorised';
        const amount = Number(item.lineTotal ?? (Number(item.quantity || 1) * Number(item.rate || 0)));
        productSales.set(name, (productSales.get(name) || 0) + amount);
        categorySales.set(category, (categorySales.get(category) || 0) + amount);
      });
    });
    const topProducts = [...productSales.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const categoryTotals = [...categorySales.entries()].sort((a, b) => b[1] - a[1]);
    const categoryTotal = categoryTotals.reduce((sum, item) => sum + item[1], 0);
    const donutColors = ['#111111', '#555555', '#858585', '#b4b4b4', '#dedede'];
    let donutOffset = 0;
    const donutGradient = categoryTotal ? categoryTotals.map((item, index) => {
      const start = donutOffset;
      donutOffset += item[1] / categoryTotal * 100;
      return `${donutColors[index % donutColors.length]} ${start}% ${donutOffset}%`;
    }).join(', ') : '#ededed 0 100%';
    const topProductMax = Math.max(1, ...topProducts.map(item => item[1]));
    return (
      <div className={`module-page ${pageClassName}`}>
        <div className="module-breadcrumb">Workspace <ChevronDown size={13}/> <strong>{title}</strong></div>
        <header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><TrendingUp size={24}/></span><div><div className="module-eyebrow">BUSINESS PERFORMANCE</div><h1>Reports</h1><p>Understand collections, invoice activity and what your customers buy most.</p></div></div><button className="secondary-button" onClick={() => exportCsv('spyrix-report.csv', [{ metric: 'Revenue collected', amount: revenue }, { metric: 'Paid expenses', amount: expenses }, { metric: 'Outstanding invoices', amount: outstanding }])}><ArrowDownToLine size={16}/> Export summary</button></header>
        <ModuleActionGrid section="reports" navigate={navigate} onRefresh={refresh} onReportExport={exportReport}/>
        <div className="report-kpis">
          <div className="report-kpi"><span>Revenue collected</span><strong>{money(revenue)}</strong><small>Completed payment records</small></div>
          <div className="report-kpi"><span>Total orders</span><strong>{records.invoices.length}</strong><small>Saved invoice records</small></div>
          <div className="report-kpi"><span>Total customers</span><strong>{records.customers.length}</strong><small>Customer profiles</small></div>
          <div className="report-kpi"><span>Average order value</span><strong>{money(records.invoices.length ? records.invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0) / records.invoices.length : 0)}</strong><small>Average saved invoice value</small></div>
        </div>
        <div className="report-panels">
          <section className="report-panel report-sales-panel"><header><div><span>SALES OVERVIEW</span><h2>Collection trend</h2><p>Completed payments over the last six months</p></div><span className="report-period">Last 6 months</span></header>
            <div className="report-line-chart"><svg viewBox="0 0 600 220" role="img" aria-label="Completed payments by month"><defs><linearGradient id="reportSalesFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#777" stopOpacity=".22"/><stop offset="1" stopColor="#777" stopOpacity="0"/></linearGradient></defs>{[43,88,133,178].map(y => <line key={y} x1="26" x2="574" y1={y} y2={y} stroke="#ededed" strokeDasharray="4 5"/>)}<polygon points={lineArea} fill="url(#reportSalesFill)"/><polyline points={linePoints} fill="none" stroke="#111" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>{monthly.map((month,index)=><circle key={month.label} cx={28 + index * 108} cy={178 - (month.total / maxMonth) * 135} r="4.5" fill="#111" stroke="#fff" strokeWidth="2"/> )}</svg><div className="report-line-labels">{monthly.map(month=><span key={month.label}>{month.label}</span>)}</div></div>
          </section>
          <section className="report-panel report-category-panel"><header><div><span>PRODUCT-WISE SALES</span><h2>Sales by category</h2><p>Based on saved invoice line items</p></div></header><div className="report-category-content"><div className="report-category-donut" style={{background:`conic-gradient(${donutGradient})`}}><span><strong>{money(categoryTotal)}</strong><small>Invoice items</small></span></div><div className="report-category-legend">{categoryTotals.length ? categoryTotals.slice(0,5).map(([category,amount],index)=><div key={category}><i style={{background:donutColors[index%donutColors.length]}}/><span>{category}</span><b>{Math.round(amount/categoryTotal*100)}%</b></div>) : <small>No invoice item sales recorded yet.</small>}</div></div></section>
        </div>
        <div className="report-bottom-grid">
          <section className="report-panel report-products-panel"><header><div><span>TOP SELLING PRODUCTS</span><h2>Popular items</h2><p>Ranked by saved invoice line totals</p></div><button className="secondary-button compact" onClick={() => navigate('/app/products')}>View all</button></header>{topProducts.length ? topProducts.map(([name,amount],index)=><div className="report-top-product" key={name}><span className="report-product-rank">{index+1}</span><strong>{name}</strong><span className="report-product-track"><i style={{width:`${amount/topProductMax*100}%`}}/></span><b>{money(amount)}</b></div>) : <p className="report-no-data">Sales by product will appear after invoice line items are saved.</p>}</section>
          <section className="report-panel report-sales-category-panel"><header><div><span>FINANCIAL SUMMARY</span><h2>Cash position</h2><p>Based on current recorded transactions</p></div></header><div className="report-cash-row"><span>Revenue collected</span><strong>{money(revenue)}</strong></div><div className="report-cash-row"><span>Paid expenses</span><strong>{money(expenses)}</strong></div><div className="report-cash-row"><span>Outstanding invoices</span><strong>{money(outstanding)}</strong></div><div className="report-cash-total"><span>Estimated net cash</span><strong>{money(revenue-expenses)}</strong></div></section>
        </div>
        <div className="module-info-strip"><AlertTriangle size={18}/><span>Sales category totals use saved invoice line items. Estimated net cash is completed recorded payments minus paid expense records; it is not a tax or accounting profit calculation.</span></div>
      </div>
    );
  }

  if (section === 'calendar') {
    const calendarInvoices = [...records.invoices].filter(invoice => invoice.dueDate && !['paid', 'cancelled'].includes(invoice.status)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const dueByDay = calendarInvoices.reduce((map, invoice) => { const key = String(invoice.dueDate).slice(0, 10); (map[key] ||= []).push(invoice); return map; }, {});
    const localDayKey = day => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const calendarCells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
      const day = index - firstWeekday + 1;
      if (day < 1 || day > daysInMonth) return null;
      return { day, key: localDayKey(day), invoices: dueByDay[localDayKey(day)] || [] };
    });
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const dueThisMonth = calendarInvoices.filter(invoice => String(invoice.dueDate).slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`);
    const monthOutstanding = dueThisMonth.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0)), 0);
    const overdueInvoices = calendarInvoices.filter(invoice => new Date(`${invoice.dueDate}T00:00:00`) < new Date(new Date().toDateString()));
    const upcoming = calendarInvoices.filter(invoice => new Date(`${invoice.dueDate}T00:00:00`) >= new Date(new Date().toDateString())).slice(0, 5);
    const dueWeekdayTotals = Array.from({ length: 7 }, (_, index) => ({ label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][index], amount: dueThisMonth.filter(invoice => new Date(`${invoice.dueDate}T00:00:00`).getDay() === index).reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0)), 0) }));
    const bestDay = [...dueWeekdayTotals].sort((a, b) => b.amount - a.amount)[0];
    return (
      <div className={`module-page ${pageClassName}`}>
        <div className="module-breadcrumb">Workspace <ChevronDown size={13}/> <strong>{title}</strong></div>
        <header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><CalendarDays size={24}/></span><div><div className="module-eyebrow">BILLING & SCHEDULING</div><h1>Business calendar</h1><p>Track upcoming invoice due dates, follow-ups and collection activity.</p></div></div><button className="primary-button" onClick={() => navigate('/app/invoices/new')}><Plus size={16}/> New invoice</button></header>
        <section className="calendar-reference-stats"><article><span>Total due this month</span><strong>{money(monthOutstanding)}</strong><small>{dueThisMonth.length} invoices scheduled</small></article><article><span>Upcoming due dates</span><strong>{calendarInvoices.filter(invoice => new Date(`${invoice.dueDate}T00:00:00`) >= new Date(new Date().toDateString())).length}</strong><small>Open invoices to follow up</small></article><article><span>Overdue invoices</span><strong>{overdueInvoices.length}</strong><small>Past the due date</small></article><article><span>Paid invoices</span><strong>{records.invoices.filter(invoice => invoice.status === 'paid').length}</strong><small>Successfully completed</small></article></section>
        <section className="calendar-reference-layout">
          <article className="calendar-month-panel">
            <header className="calendar-month-head"><div><span>SALES CALENDAR</span><h2>{monthLabel}</h2></div><div><button className="icon-button" aria-label="Previous month" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}><ArrowLeft size={15}/></button><button className="icon-button" aria-label="Next month" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}><ArrowRight size={15}/></button></div></header>
            <div className="calendar-month-grid"><div className="calendar-weekday-row">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <span key={day}>{day}</span>)}</div><div className="calendar-day-grid">{calendarCells.map((cell,index) => cell ? <button type="button" key={cell.key} className={`calendar-day-cell ${isCurrentMonth && cell.day === today.getDate() ? 'today' : ''} ${cell.invoices.length ? 'has-due' : ''}`} onClick={() => { const firstDue = cell.invoices[0]; if (firstDue) setDetail(firstDue); }}><b>{cell.day}</b>{cell.invoices.length > 0 && <span>{cell.invoices.length} due</span>}{cell.invoices.length > 0 && <small>{money(cell.invoices.reduce((sum,invoice)=>sum+Math.max(0,Number(invoice.total||0)-Number(invoice.paidAmount||0)),0))}</small>}</button> : <div className="calendar-day-cell empty" key={`empty-${index}`}/>)}</div></div>
            <footer className="calendar-month-legend"><span><i className="legend-today"/> Today</span><span><i className="legend-due"/> Due date</span><span>Click a marked day to open its first invoice</span></footer>
          </article>
          <aside className="calendar-insights-column">
            <article className="calendar-insight-card"><header><div><span>BEST DAY</span><h3>Collection by weekday</h3></div><CalendarDays size={18}/></header><strong>{bestDay?.label || '—'}</strong><small>{money(bestDay?.amount || 0)} scheduled balance</small><div className="calendar-insight-bars">{dueWeekdayTotals.map(day => <span key={day.label}><i style={{height:`${Math.max(5,day.amount/Math.max(1,...dueWeekdayTotals.map(item=>item.amount))*100)}%`}}/><small>{day.label.slice(0,1)}</small></span>)}</div></article>
            <article className="calendar-insight-card"><header><div><span>BEST WEEK</span><h3>Next collection window</h3></div><TrendingUp size={18}/></header><strong>{upcoming.length ? money(upcoming.slice(0,3).reduce((sum,invoice)=>sum+Math.max(0,Number(invoice.total||0)-Number(invoice.paidAmount||0)),0)) : money(0)}</strong><small>Open balance across the next few due dates</small></article>
            <article className="calendar-upcoming-card"><header><div><span>UPCOMING</span><h3>Next due invoices</h3></div><button onClick={() => navigate('/app/invoices')}>View all</button></header>{upcoming.length ? upcoming.map(invoice => <div className="calendar-upcoming-row" key={invoice.id}><span className="calendar-upcoming-date">{new Date(`${invoice.dueDate}T00:00:00`).getDate()}<small>{new Date(`${invoice.dueDate}T00:00:00`).toLocaleDateString('en-IN',{month:'short'})}</small></span><span><b>{invoice.customerName}</b><small>{invoice.invoiceNumber}</small></span><strong>{money(Math.max(0,Number(invoice.total||0)-Number(invoice.paidAmount||0)))}</strong></div>) : <p>No upcoming open invoices.</p>}</article>
          </aside>
        </section>
        <section className="calendar-due-list"><header><div><span>FOLLOW-UP QUEUE</span><h2>Invoices requiring attention</h2></div><button className="secondary-button compact" onClick={() => navigate('/app/invoices')}>Open invoice register <ArrowRight size={14}/></button></header>{calendarInvoices.length ? calendarInvoices.slice(0,8).map(invoice => <div className="calendar-event" key={invoice.id}><div className="calendar-date"><b>{new Date(`${invoice.dueDate}T00:00:00`).getDate()}</b><small>{new Date(`${invoice.dueDate}T00:00:00`).toLocaleDateString('en-IN',{month:'short'})}</small></div><div className="calendar-event-copy"><strong>{invoice.invoiceNumber} · {invoice.customerName}</strong><small>Due {dateLabel(invoice.dueDate)}</small></div><strong>{money(Math.max(0,Number(invoice.total||0)-Number(invoice.paidAmount||0)))}</strong><StatusPill status={invoice.status}/><button className="icon-button" onClick={() => setDetail(invoice)}><Eye size={15}/></button></div>) : <EmptyState title="Nothing due right now" description="Unpaid invoices with due dates will appear here." onAction={() => navigate('/app/invoices/new')} action="Create invoice"/>}</section>
      </div>
    );
  }

  if (section === 'recurring') {
    function addRecurring(event) { event.preventDefault(); const entry = { id: `rec-${Date.now()}`, title: event.currentTarget.title.value, frequency: event.currentTarget.frequency.value, nextDate: event.currentTarget.nextDate.value }; const next = [entry, ...recurring]; setRecurring(next); localStorage.setItem('spyrix_recurring_local', JSON.stringify(next)); event.currentTarget.reset(); }
    return <div className={`module-page ${pageClassName}`}><div className="module-breadcrumb">Workspace <ChevronDown size={13} /> <strong>{title}</strong></div><header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><RefreshCw size={24} /></span><div><div className="module-eyebrow">REPEAT WORKFLOWS</div><h1>Recurring invoices</h1><p>Keep a list of repeat billing schedules and their next planned dates.</p></div></div></header><ModuleActionGrid section="recurring" navigate={navigate} onRefresh={refresh} onReportExport={exportReport}/><div className="module-info-strip warning"><AlertTriangle size={18} /><span>Schedules created here are saved locally as planning reminders. Automatic invoice generation is not enabled in this starter and will not create invoices in the background.</span></div><div className="recurring-layout"><section className="module-table-card recurring-create"><h2>Add a schedule reminder</h2><form className="module-form" onSubmit={addRecurring}><Field label="Schedule name"><input name="title" required placeholder="Monthly retainer" /></Field><Field label="Frequency"><select name="frequency"><option>Monthly</option><option>Weekly</option><option>Quarterly</option><option>Yearly</option></select></Field><Field label="Next planned date"><input name="nextDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field><button className="primary-button"><Plus size={16} /> Save reminder</button></form></section><section className="module-table-card"><div className="module-section-heading"><h2>Saved schedule reminders</h2><p>{recurring.length} reminders in this browser</p></div>{recurring.length ? recurring.map(item => <div className="calendar-event" key={item.id}><div className="inventory-product-icon"><RefreshCw size={18} /></div><div className="calendar-event-copy"><strong>{item.title}</strong><small>{item.frequency} · Next planned {dateLabel(item.nextDate)}</small></div><button className="icon-button danger-icon" onClick={() => { const next = recurring.filter(row => row.id !== item.id); setRecurring(next); localStorage.setItem('spyrix_recurring_local', JSON.stringify(next)); }}><Trash2 size={15} /></button></div>) : <EmptyState title="No schedules saved" description="Add a reminder to keep recurring billing dates visible." />}</section></div></div>;
  }

  if (section === 'documents') {
    const invoiceDocs = records.invoices.map(item => ({ id: item.id, name: item.invoiceNumber, customer: item.customerName, kind: 'Invoice', date: item.issueDate, total: item.total, row: item }));
    const quoteDocs = records.quotations.map(item => ({ id: item.id, name: item.quotationNumber, customer: item.customerName, kind: 'Quotation', date: item.createdAt, total: item.total, row: item }));
    const docs = [...invoiceDocs, ...quoteDocs].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return <div className={`module-page ${pageClassName}`}><div className="module-breadcrumb">Workspace <ChevronDown size={13} /> <strong>{title}</strong></div><header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><Folder size={24} /></span><div><div className="module-eyebrow">BUSINESS DOCUMENTS</div><h1>Documents</h1><p>Open, print or save invoice and quotation documents from your workspace.</p></div></div></header><ModuleActionGrid section="documents" navigate={navigate} onRefresh={refresh} onReportExport={exportReport}/><section className="module-table-card"><div className="module-section-heading"><h2>Document library</h2><p>Documents are generated from saved business records.</p></div>{docs.length ? docs.map(doc => <div className="calendar-event" key={`${doc.kind}-${doc.id}`}><div className="inventory-product-icon"><FileText size={18} /></div><div className="calendar-event-copy"><strong>{doc.name} · {doc.customer}</strong><small>{doc.kind} · {dateLabel(doc.date)}</small></div><strong>{money(doc.total)}</strong><button className="icon-button" title="View document" onClick={() => { setDetail(doc.row); }}><Eye size={16} /></button>{doc.kind === 'Invoice' && <button className="icon-button" title="Print" onClick={() => printInvoice(doc.row)}><Printer size={16} /></button>}</div>) : <EmptyState title="No documents yet" description="Saved invoices and quotations will appear in this library." onAction={() => navigate('/app/invoices/new')} action="Create invoice" />}</section></div>;
  }

  if (section === 'downloads') {
    const downloadJobs = [
      { key: 'invoices', name: 'Invoice register', description: 'Invoice numbers, dates, tax and balances', icon: FileText, group: 'Invoices' },
      { key: 'customers', name: 'Customer list', description: 'Customer contact and billing details', icon: Users, group: 'Data export' },
      { key: 'products', name: 'Products & services', description: 'Catalogue, prices and stock levels', icon: Package, group: 'Data export' },
      { key: 'payments', name: 'Payment history', description: 'Completed and pending collections', icon: BadgeIndianRupee, group: 'Reports' },
      { key: 'expenses', name: 'Expense register', description: 'Recorded spending and vendors', icon: Wallet, group: 'Reports' },
      { key: 'quotations', name: 'Quotation register', description: 'Saved estimates and customer quotes', icon: ClipboardList, group: 'Invoices' },
    ];
    const totalRecords = ['customers','products','invoices','payments','expenses','quotations'].reduce((sum,key)=>sum+(records[key]||[]).length,0);
    const downloadResource = key => {
      const data = records[key] || [];
      const normalized = data.map(row => Object.fromEntries(Object.entries(row).filter(([field,value]) => !['_id','id','items','customerSnapshot','design'].includes(field) && (typeof value !== 'object' || value === null))));
      if (!exportCsv(`spyrix-${key}-${new Date().toISOString().slice(0,10)}.csv`,normalized)) setMessage(`No ${key} records are available to export yet.`);
    };
    return (
      <div className={`module-page ${pageClassName}`}>
        <div className="module-breadcrumb">Workspace <ChevronDown size={13}/> <strong>{title}</strong></div>
        <header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><Download size={24}/></span><div><div className="module-eyebrow">EXPORT CENTER</div><h1>Download center</h1><p>Find, prepare and export the business information you need.</p></div></div><button className="secondary-button" onClick={() => navigate('/app/backups')}><ShieldCheck size={15}/> Backup & restore</button></header>
        <section className="download-summary-grid"><article><span className="download-summary-icon"><Printer size={19}/></span><div><small>PDF-ready invoices</small><strong>{records.invoices.length}</strong><span>Print or save as PDF</span></div></article><article><span className="download-summary-icon"><FileText size={19}/></span><div><small>Excel exports</small><strong>—</strong><span>Spreadsheet export not enabled</span></div></article><article><span className="download-summary-icon"><CloudDownload size={19}/></span><div><small>CSV export groups</small><strong>{downloadJobs.length}</strong><span>Available data exports</span></div></article><article><span className="download-summary-icon"><Download size={19}/></span><div><small>Total exportable records</small><strong>{totalRecords}</strong><span>Across six data groups</span></div></article></section>
        <div className="download-filter-row"><span>EXPORT LIBRARY</span><button className="selected">All downloads</button><button onClick={() => downloadResource('invoices')}>Invoices</button><button onClick={() => downloadResource('payments')}>Reports</button><button onClick={() => navigate('/app/templates')}>Templates</button><button onClick={() => downloadResource('customers')}>Data export</button></div>
        <section className="download-reference-layout">
          <article className="download-list-panel"><header><div><span>RECENT EXPORT OPTIONS</span><h2>Available downloads</h2><p>Download a fresh CSV from the latest records loaded in your workspace.</p></div><b>{downloadJobs.length} FILE TYPES</b></header>
            <div className="download-table-wrap"><table className="module-table"><thead><tr><th>File / report</th><th>Type</th><th>Records</th><th>Availability</th><th>Action</th></tr></thead><tbody>{downloadJobs.map(job=>{const JobIcon=job.icon;return <tr key={job.key}><td><div className="download-file-name"><span><JobIcon size={17}/></span><div><b>{job.name}</b><small>{job.description}</small></div></div></td><td><span className="download-type">CSV</span></td><td>{(records[job.key]||[]).length}</td><td><span className="download-ready"><i/> Ready</span></td><td><button className="secondary-button compact" onClick={()=>downloadResource(job.key)}><ArrowDownToLine size={14}/> Download</button></td></tr>})}</tbody></table></div>
          </article>
          <aside className="download-quick-panel"><header><span>QUICK DOWNLOAD</span><h2>Popular exports</h2></header><div className="download-quick-grid"><button onClick={()=>downloadResource('invoices')}><FileText size={21}/><b>Invoice report</b><small>All saved invoices</small></button><button onClick={()=>downloadResource('customers')}><Users size={21}/><b>Customer data</b><small>Contact directory</small></button><button onClick={()=>downloadResource('products')}><Package size={21}/><b>Product report</b><small>Stock and prices</small></button><button onClick={()=>downloadResource('payments')}><BadgeIndianRupee size={21}/><b>Payment report</b><small>Collections history</small></button></div><div className="download-export-banner"><span><CloudDownload size={23}/></span><div><b>Export your data</b><small>Download a complete JSON snapshot from Backup & Restore.</small></div><button onClick={()=>navigate('/app/backups')}>Open <ArrowRight size={14}/></button></div></aside>
        </section>
        <div className="module-info-strip"><ShieldCheck size={18}/><span>Exports are generated in your browser from the records currently loaded for this workspace. CSV downloads use UTF-8 text with escaped cell values; JSON snapshots are available in Backup & Restore.</span></div>
      </div>
    );
  }

  if (section === 'backups') {
    function backup() {
      const payload = { app: 'SPYRIX INVOICE', version: 1, createdAt: new Date().toISOString(), business: business?.name || 'SPYRIX Workspace', records };
      downloadFile(`spyrix-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
    }
    return <div className={`module-page ${pageClassName}`}><div className="module-breadcrumb">Workspace <ChevronDown size={13} /> <strong>{title}</strong></div><header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><ShieldCheck size={24} /></span><div><div className="module-eyebrow">DATA PORTABILITY</div><h1>Data backups</h1><p>Download a JSON snapshot of the records loaded from your MongoDB workspace.</p></div></div></header><ModuleActionGrid section="backups" navigate={navigate} onRefresh={refresh} onReportExport={exportReport}/><div className="backup-grid"><article className="backup-card"><span><CloudDownload size={25} /></span><h2>Create data snapshot</h2><p>Download a copy of the customers, products, invoices, payments, expenses, quotations, notes and templates currently loaded in your workspace.</p><button className="primary-button" onClick={backup}><Download size={16} /> Download JSON backup</button></article></div><div className="module-info-strip warning"><AlertTriangle size={18} /><span>This file is a downloadable snapshot, not a database restore package. Store it securely because it may contain customer and financial information.</span></div></div>;
  }

  if (section === 'imports') {
    function parseCsv(text) {
      const rows = []; let row = []; let cell = ''; let quoted = false;
      for (let i = 0; i < text.length; i++) { const char = text[i]; if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { row.push(cell); cell = ''; } else if ((char === '\n' || char === '\r') && !quoted) { if (cell || row.length) { row.push(cell); rows.push(row); } row = []; cell = ''; } else cell += char; }
      if (cell || row.length) { row.push(cell); rows.push(row); }
      const headers = (rows.shift() || []).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
      return rows.filter(r => r.some(Boolean)).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] || ''])));
    }
    async function readImport(file) { setImportError(''); try { const parsed = parseCsv(await file.text()); if (!parsed.length) throw new Error('The CSV file has no data rows.'); setImportRows(parsed); } catch (err) { setImportError(err.message); } }
    async function runImport() { setBusy(true); setImportError(''); try { let count = 0; for (const row of importRows) { if (section === 'imports' && row.name) { await createRecord('customers', { name: row.name || row.customername, companyName: row.companyname || row.company || '', email: row.email || '', phone: row.phone || '' }); count++; } } setMessage(`${count} customer records imported into MongoDB.`); setImportRows([]); } catch (err) { setImportError(err.message); } finally { setBusy(false); } }
    return <div className={`module-page ${pageClassName}`}><div className="module-breadcrumb">Workspace <ChevronDown size={13} /> <strong>{title}</strong></div><header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><Upload size={24} /></span><div><div className="module-eyebrow">BULK DATA ENTRY</div><h1>Import data</h1><p>Import a customer list from CSV with a preview before saving records.</p></div></div></header><ModuleActionGrid section="imports" navigate={navigate} onRefresh={refresh} onReportExport={exportReport}/><section id="import-panel" className="import-panel"><div className="import-drop"><Upload size={30} /><h2>Upload customer CSV</h2><p>Expected columns include <b>name, company, email, phone</b>. The first row must contain column headers.</p><label className="primary-button upload-button">Choose CSV file<input type="file" accept=".csv,text/csv" onChange={e => e.target.files?.[0] && readImport(e.target.files[0])} /></label></div>{importError && <div className="module-form-error"><AlertTriangle size={16} />{importError}</div>}{importRows.length > 0 && <><div className="import-preview-head"><strong>Preview · {importRows.length} rows</strong><span>Review names before importing</span></div><div className="module-table-scroll"><table className="module-table"><thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th></tr></thead><tbody>{importRows.slice(0, 8).map((row, index) => <tr key={index}><td>{row.name || row.customername || '—'}</td><td>{row.company || row.companyname || '—'}</td><td>{row.email || '—'}</td><td>{row.phone || '—'}</td></tr>)}</tbody></table></div><button className="primary-button" disabled={busy} onClick={runImport}><Check size={16} /> {busy ? 'Importing…' : `Import ${importRows.length} customers`}</button></>}</section><div className="module-info-strip"><ShieldCheck size={18} /><span>Import adds new records only in this phase; it does not overwrite existing customer records.</span></div></div>;
  }

  if (section === 'notifications') {
    const alerts = [
      ...records.invoices.filter(invoice => invoice.status === 'overdue').map(invoice => ({ id: `invoice-${invoice.id}`, category: 'Invoices', kind: 'Overdue invoice', title: `${invoice.invoiceNumber} · ${invoice.customerName}`, text: `${money(Math.max(0,Number(invoice.total||0)-Number(invoice.paidAmount||0)))} outstanding`, date: invoice.dueDate, path: '/app/invoices' })),
      ...records.products.filter(product => Number(product.lowStockAt||0)>0 && Number(product.stockOnHand||0)<=Number(product.lowStockAt||0)).map(product => ({ id: `stock-${product.id}`, category: 'Alerts', kind: 'Low stock alert', title: product.name, text: `${product.stockOnHand} remaining · alert at ${product.lowStockAt}`, date: '', path: '/app/inventory' })),
      ...records.invoices.filter(invoice => invoice.status === 'issued').map(invoice => ({ id: `pending-${invoice.id}`, category: 'Invoices', kind: 'Payment pending', title: `${invoice.invoiceNumber} · ${invoice.customerName}`, text: `${money(Math.max(0,Number(invoice.total||0)-Number(invoice.paidAmount||0)))} balance due`, date: invoice.dueDate, path: '/app/invoices' })),
    ].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    const unreadCount = alerts.filter(alert => !readAlertIds.includes(alert.id)).length;
    const visibleAlerts = notificationFilter === 'All' ? alerts : alerts.filter(alert => alert.category === notificationFilter);
    return (
      <div className={`module-page ${pageClassName}`}>
        <div className="module-breadcrumb">Workspace <ChevronDown size={13}/> <strong>{title}</strong></div>
        <header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><Bell size={24}/></span><div><div className="module-eyebrow">BUSINESS ALERTS</div><h1>Notifications</h1><p>Important reminders generated from your invoices and inventory records.</p></div></div><button className="secondary-button" disabled={!unreadCount} onClick={()=>setReadAlertIds(alerts.map(alert=>alert.id))}><Check size={15}/> Mark all read</button></header>
        <section className="notification-summary-row"><article><span>Total notifications</span><strong>{alerts.length}</strong><small>Across your workspace</small></article><article><span>Unread</span><strong>{unreadCount}</strong><small>Needs your attention</small></article><article><span>Read</span><strong>{alerts.length-unreadCount}</strong><small>Already reviewed</small></article></section>
        <section className="notification-panel"><header className="notification-panel-head"><div><h2>Recent activity</h2><p>Notifications stay in this list while the source invoice or stock alert remains active.</p></div><button className="secondary-button compact" onClick={refresh}><RefreshCw size={14}/> Refresh</button></header>
          <div className="notification-filter-row">{['All','Alerts','Invoices'].map(filter=><button type="button" key={filter} className={notificationFilter===filter?'selected':''} onClick={()=>setNotificationFilter(filter)}>{filter}{filter==='All'&&<span>{alerts.length}</span>}</button>)}</div>
          <div className="notification-list">{visibleAlerts.length ? visibleAlerts.map(alert=>{const isRead=readAlertIds.includes(alert.id);return <article className={`notification-row ${isRead?'read':''}`} key={alert.id}><span className="notification-row-icon">{alert.kind.includes('stock')?<Package size={18}/>:alert.kind.includes('Overdue')?<AlertTriangle size={18}/>:<BadgeIndianRupee size={18}/>}</span><div className="notification-row-copy"><div><strong>{alert.title}</strong>{!isRead&&<i className="notification-unread-dot"/>}</div><p>{alert.kind} · {alert.text}</p><small>{alert.date ? dateLabel(alert.date) : 'Current stock status'} · {alert.category}</small></div><span className={`notification-status ${isRead?'':'new'}`}>{isRead?'Read':'New'}</span><button className="secondary-button compact" onClick={()=>{setReadAlertIds(current=>current.includes(alert.id)?current:[...current,alert.id]);navigate(alert.path);}}>View <ArrowRight size={13}/></button></article>}) : <EmptyState title="You're all caught up" description="There are no notifications in this category right now."/>}</div>
        </section>
        <div className="module-info-strip"><ShieldCheck size={18}/><span>These alerts are calculated from your current workspace data. This build does not send push or email notifications.</span></div>
      </div>
    );
  }

  if (section === 'business-settings') {
    const profileName = session?.user?.name || 'Workspace owner';
    const profileEmail = session?.user?.email || business?.email || 'Not provided';
    const profileInitials = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    const profileFields = [
      [Building2, 'Business name', business?.name],
      [Mail, 'Business email', business?.email],
      [Phone, 'Phone number', business?.phone],
      [MapPin, 'Business address', business?.address],
      [Globe, 'Website', business?.website],
      [BadgeIndianRupee, 'GSTIN', business?.gstin],
    ];
    return (
      <div className={`module-page ${pageClassName}`}>
        <div className="module-breadcrumb">Workspace <ChevronDown size={13}/> <strong>Profile</strong></div>
        <header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><UserRound size={24}/></span><div><div className="module-eyebrow">YOUR SPYRIX IDENTITY</div><h1>Profile</h1><p>View the account and business information connected to this workspace.</p></div></div><button className="secondary-button" onClick={() => navigate('/app/settings')}><Settings size={15}/> Account settings</button></header>
        <section className="profile-overview-card"><span className="profile-overview-avatar">{profileInitials || 'SP'}</span><div><small>ACCOUNT OWNER</small><h2>{profileName}</h2><p>{profileEmail}</p></div><span className="profile-overview-status"><i/> CONNECTED ACCOUNT</span></section>
        <section className="profile-details-panel"><header><div><h2>Business profile details</h2><p>Details currently saved against your SPYRIX business workspace.</p></div><Building2 size={20}/></header><div className="profile-details-grid">{profileFields.map(([FieldIcon, label, value]) => <article key={label}><span><FieldIcon size={17}/></span><div><small>{label}</small><strong>{value || 'Not added yet'}</strong></div></article>)}</div></section>
        <div className="module-info-strip"><ShieldCheck size={17}/><span>Profile details are shown from your signed-in workspace. Editing business profile fields is not enabled in this version.</span></div>
      </div>
    );
  }

  if (section === 'settings') {
    const email = session?.user?.email || business?.email || 'Not provided';
    const displayName = session?.user?.name || business?.name || 'SPYRIX Workspace';
    const initials = displayName.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();
    return (
      <div className={`module-page ${pageClassName}`}>
        <div className="module-breadcrumb">Workspace <ChevronDown size={13}/> <strong>{title}</strong></div>
        <header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><Settings size={24}/></span><div><div className="module-eyebrow">ACCOUNT & PREFERENCES</div><h1>Account settings</h1><p>Manage your profile, security preferences and the look of your workspace.</p></div></div></header>
        <section className="account-settings-grid">
          <article className="account-profile-panel"><header><div><span>PROFILE INFORMATION</span><h2>Your account</h2></div><UserRound size={19}/></header><div className="account-profile-identity"><span>{initials}</span><div><strong>{displayName}</strong><small>{email}</small><i>Workspace account</i></div></div><div className="account-profile-details"><div><small>Business name</small><b>{business?.name || 'SPYRIX Workspace'}</b></div><div><small>Email address</small><b>{email}</b></div><div><small>Account mode</small><b>Connected account</b></div></div><div className="account-profile-note"><ShieldCheck size={16}/><span>Your workspace pages use the same saved theme and account session.</span></div></article>
          <article className="account-overview-panel"><header><div><span>ACCOUNT OVERVIEW</span><h2>Workspace status</h2></div><Gauge size={19}/></header><div className="account-overview-list"><div><span>Business workspace</span><strong>{business?.name || 'SPYRIX Workspace'}</strong></div><div><span>Data storage</span><strong>MongoDB workspace</strong></div><div><span>Customer records</span><strong>{records.customers.length}</strong></div><div><span>Invoices created</span><strong>{records.invoices.length}</strong></div><div><span>Current access</span><strong>{session?.user?.role || 'Signed-in user'}</strong></div></div></article>
          <article className="account-security-panel"><header><div><span>SECURITY SETTINGS</span><h2>Account protection</h2></div><LockKeyhole size={19}/></header><div className="account-security-row"><span><ShieldCheck size={17}/></span><div><b>Authenticated workspace</b><small>Your session is connected to the account service.</small></div><em>ACTIVE</em></div><div className="account-security-row"><span><Mail size={17}/></span><div><b>Email identity</b><small>{email}</small></div><em>LINKED</em></div><div className="account-security-row"><span><RefreshCw size={17}/></span><div><b>Data refresh</b><small>Reload current workspace records from the data provider.</small></div><button className="secondary-button compact" onClick={refresh}>Refresh</button></div></article>
          <article className="account-theme-panel"><header><div><span>APPEARANCE</span><h2>Choose your theme</h2><p>Theme colours update the workspace, navigation, KPI cards and intro accents.</p></div><Contrast size={19}/></header><div className="theme-choice-grid">{WORKSPACE_THEMES.map(([value,label,color])=><button type="button" key={value} className={`theme-choice ${theme===value?'active':''}`} aria-pressed={theme===value} onClick={()=>changeWorkspaceTheme(value)}><span style={{background:color}}/><strong>{label}</strong>{theme===value&&<Check size={17}/>}</button>)}</div>{themeSaveStatus && <p className="theme-save-status" role="status">{themeSaveStatus}</p>}</article>
        </section>
      </div>
    );
  }

  if (section === 'help') {
    const faqs = [ ['How do I create an invoice?', 'Open Invoice Studio, select Create invoice, choose a customer and add products or services. Save it as a draft, then use Issue on the invoice list.'], ['How are payments recorded?', 'Open Payments, choose an invoice if the payment should be allocated, enter the amount and method, then save. The invoice balance and status update from its payment allocations.'], ['Where is my business data stored?', 'Your customer, product, invoice and payment records are stored in your authenticated MongoDB workspace.'], ['Can I export data?', 'Use the Export button inside a module or open Download Center to create CSV files for the current records.'] ];
    return <div className={`module-page ${pageClassName}`}><div className="module-breadcrumb">Workspace <ChevronDown size={13} /> <strong>{title}</strong></div><header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><CircleHelp size={24} /></span><div><div className="module-eyebrow">SUPPORT CENTRE</div><h1>Help & support</h1><p>Quick answers to common SPYRIX INVOICE workflows.</p></div></div></header><ModuleActionGrid section="help" navigate={navigate} onRefresh={refresh} onReportExport={exportReport}/><div className="help-layout"><section className="module-table-card"><div className="module-section-heading"><h2>Frequently asked questions</h2><p>Guidance for using the current application build.</p></div>{faqs.map(([q, a]) => <details className="faq-item" key={q}><summary>{q}<ChevronDown size={17} /></summary><p>{a}</p></details>)}</section><aside className="help-contact"><span><Mail size={23} /></span><h2>Need assistance?</h2><p>For development support, share the exact page, action and error message so the workflow can be tested and fixed.</p><a href="mailto:support@example.com">Contact support</a><small>Replace this sample address with your business support email in settings before launch.</small></aside></div></div>;
  }

  return <div className={`module-page ${pageClassName}`}><div className="module-breadcrumb">Workspace <ChevronDown size={13} /> <strong>{title}</strong></div><header className="module-page-head"><div className="module-title-wrap"><span className="module-title-icon"><Zap size={24} /></span><div><div className="module-eyebrow">SPYRIX INVOICE WORKSPACE</div><h1>{title}</h1><p>Open a business tool and continue working with your connected workspace records.</p></div></div></header><ModuleActionGrid section="tools" navigate={navigate} onRefresh={refresh} onReportExport={exportReport}/><div className="tools-grid">{[['Create Invoice','Create and manage customer invoices','/app/invoices',FileText],['Customers','Organise customer records','/app/customers',Users],['Products & Services','Manage prices and stock','/app/products',Package],['Payments','Record collections and balances','/app/payments',BadgeIndianRupee],['Expenses','Track business costs','/app/expenses',Wallet],['Reports','Review cash collections and balances','/app/reports',TrendingUp],['Calendar','Track invoice due dates','/app/calendar',CalendarDays]].map(([name, desc, path, ToolIcon]) => <button className="tool-link-card" key={path} onClick={() => navigate(path)}><span><ToolIcon size={22} /></span><div><strong>{name}</strong><small>{desc}</small></div><ArrowRight size={18} /></button>)}</div></div>;
}

function tableHeaders(section) {
  return ({ customers: ['Customer / ID', 'Contact', 'Location', 'GSTIN', 'Status'], products: ['Product / Service', 'SKU', 'Category', 'Price', 'Stock'], invoices: ['Invoice', 'Customer', 'Issue date', 'Due date', 'Total', 'Status'], payments: ['Payment', 'Customer', 'Invoice', 'Date', 'Amount', 'Method', 'Status'], expenses: ['Expense', 'Category', 'Vendor', 'Date', 'Amount', 'Status'], quotations: ['Quotation', 'Customer', 'Created', 'Valid until', 'Amount', 'Status'] })[section] || [];
}

function renderCells(section, row, actions) {
  const shareOnWhatsApp = (kind, record) => {
    const snapshot = record.customerSnapshot || {};
    const rawPhone = String(snapshot.phone || record.phone || '').replace(/\D/g, '');
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const total = Number(record.total || 0);
    const paid = Number(record.paidAmount || 0);
    const balance = Math.max(0, total - paid);
    const identifier = kind === 'invoice' ? record.invoiceNumber : record.quotationNumber;
    const due = record.dueDate ? ` Due date: ${dateLabel(record.dueDate)}.` : '';
    const message = kind === 'invoice'
      ? `Hello ${snapshot.name || record.customerName || 'there'}, sharing an update about invoice ${identifier || ''} from ${businessNameForShare()}. Total: ${money(total)}. Paid: ${money(paid)}. Balance due: ${money(balance)}.${due} Please let us know if you have any questions.`
      : `Hello ${snapshot.name || record.customerName || 'there'}, sharing quotation ${identifier || ''}. Quotation amount: ${money(total)}. Valid until: ${dateLabel(record.validUntil)}. Please let us know if you would like to proceed.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const businessNameForShare = () => localStorage.getItem('spyrix_business_name') || 'our business';
  const actionButtons = <td className="row-actions"><button className="icon-button" title="View details" onClick={actions.onView}><Eye size={15} /></button>{(['customers', 'products', 'expenses'].includes(section) || (section === 'invoices' && row.status === 'draft')) && <button className="icon-button" title="Edit" onClick={actions.onEdit}><Pencil size={15} /></button>}{section === 'invoices' && row.status === 'draft' && <button className="table-action-link" onClick={actions.onIssue}>Issue</button>}{section === 'invoices' && <button className="icon-button" title="Print / Save PDF" onClick={actions.onPrint}><Printer size={15} /></button>}{section === 'invoices' && <button className="icon-button" title="Share payment reminder via WhatsApp" onClick={() => shareOnWhatsApp('invoice', row)}><MessageCircle size={15} /></button>}{['customers', 'products', 'expenses', 'quotations'].includes(section) && <button className="icon-button danger-icon" title="Remove" onClick={actions.onArchive}><Archive size={15} /></button>}</td>;
  if (section === 'customers') return <><td><div className="table-primary"><strong>{row.name}</strong><small>{row.companyName || 'Individual customer'} · {row.customerCode || 'No ID'}</small></div></td><td><div className="table-primary"><span>{row.email || '—'}</span><small>{row.phone || 'No phone'}</small></div></td><td>{[row.city, row.state].filter(Boolean).join(', ') || '—'}</td><td>{row.gstin || '—'}</td><td><StatusPill status={row.status} /></td>{actionButtons}</>;
  if (section === 'products') return <><td><div className="table-primary"><strong>{row.name}</strong><small>{row.description || row.unit || ''}</small></div></td><td>{row.sku || '—'}</td><td>{row.category || 'General'}</td><td><strong>{money(row.price)}</strong></td><td><span className={row.lowStockAt > 0 && row.stockOnHand <= row.lowStockAt ? 'stock-low' : 'stock-good'}>{row.stockOnHand ?? 0}</span><small className="table-subtext">Alert at {row.lowStockAt ?? 0}</small></td>{actionButtons}</>;
  if (section === 'invoices') return <><td><strong className="record-code">{row.invoiceNumber}</strong></td><td><div className="table-primary"><strong>{row.customerName}</strong><small>{row.companyName || ''}</small></div></td><td>{dateLabel(row.issueDate)}</td><td>{dateLabel(row.dueDate)}</td><td><strong>{money(row.total)}</strong><small className="table-subtext">Paid {money(row.paidAmount)} </small></td><td><StatusPill status={row.status} /></td>{actionButtons}</>;
  if (section === 'payments') return <><td><strong className="record-code">{row.reference || `PAY-${String(row.id).slice(-5)}`}</strong></td><td>{row.customerName || 'Unallocated'}</td><td>{row.invoiceNumber || '—'}</td><td>{dateLabel(row.paymentDate)}</td><td><strong>{money(row.amount)}</strong></td><td><span className="method-label">{String(row.method || 'other').replaceAll('_', ' ')}</span></td><td><StatusPill status={row.status}/></td>{actionButtons}</>;
  if (section === 'expenses') return <><td><div className="table-primary"><strong>{row.title}</strong><small>{row.notes || ''}</small></div></td><td>{row.category || 'General'}</td><td>{row.vendor || '—'}</td><td>{dateLabel(row.expenseDate)}</td><td><strong>{money(row.amount)}</strong></td><td><StatusPill status={row.status} /></td>{actionButtons}</>;
  const quoteActions = <td className="row-actions"><button className="icon-button" title="View details" onClick={actions.onView}><Eye size={15} /></button><button className="icon-button" title="Share quotation via WhatsApp" onClick={() => { const snapshot = row.customerSnapshot || {}; const rawPhone = String(snapshot.phone || '').replace(/\D/g, ''); const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone; const message = `Hello ${snapshot.name || row.customerName || 'there'}, sharing quotation ${row.quotationNumber || ''} from ${localStorage.getItem('spyrix_business_name') || 'our business'}. Amount: ${money(row.total)}. Valid until: ${dateLabel(row.validUntil)}. Please let us know if you would like to proceed.`; window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer'); }}><MessageCircle size={15} /></button>{row.status === 'draft' && <button className="table-action-link" onClick={actions.onSend}>Mark sent</button>}{row.status === 'sent' && <button className="table-action-link" onClick={actions.onAccept}>Accept</button>}{row.status === 'accepted' && <button className="table-action-link" onClick={actions.onConvert}>Convert to invoice</button>}{row.status === 'converted' && <button className="table-action-link" onClick={actions.onOpenInvoice}>View invoices</button>}<button className="icon-button danger-icon" title="Remove quotation" onClick={actions.onArchive}><Archive size={15} /></button></td>;
  return <><td><strong className="record-code">{row.quotationNumber}</strong></td><td>{row.customerName}</td><td>{dateLabel(row.createdAt)}</td><td>{dateLabel(row.validUntil)}</td><td><strong>{money(row.total)}</strong></td><td><StatusPill status={row.status} /></td>{quoteActions}</>;
}
