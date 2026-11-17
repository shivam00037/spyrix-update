import { createContext, useContext, useId, useRef, useState } from 'react';
import { ImagePlus, Upload, Scissors, Shirt, HardHat, Package, BadgeCheck, MapPin, Phone, Globe, Instagram, Printer, Palette, CalendarDays, FilePlus2, ClipboardList, UserRound, Building2, Plus } from 'lucide-react';
import './XenmarkInvoicePreview.css';

const XenmarkEditorStyleContext = createContext({});

const displayMoney = value => `₹ ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))}`;
const displayDate = value => {
  if (!value) return '—';
  const date = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return `${date.slice(8, 10)}-${date.slice(5, 7)}-${date.slice(0, 4)}`;
  return date;
};
const normaliseDate = (text, fallback) => {
  const value = String(text || '').trim();
  let match = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? value : fallback;
};
const numberFromText = value => {
  const amount = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};

function InlineEdit({ as = 'span', value = '', onCommit, placeholder = 'Tap to edit', className = '', multiline = false, title }) {
  const Tag = as;
  const rawId = useId();
  const editorId = `xen-text-${rawId.replace(/:/g, '')}`;
  const styleMap = useContext(XenmarkEditorStyleContext);
  const selectedStyle = styleMap?.[editorId] || undefined;
  return <Tag
    className={`xen-inline-edit ${className}`.trim()}
    contentEditable
    suppressContentEditableWarning
    spellCheck={false}
    role="textbox"
    data-editor-id={editorId}
    data-editor-type="text"
    aria-label={title || placeholder}
    data-placeholder={placeholder}
    title={title || 'Tap or click to edit this text'}
    style={selectedStyle}
    onBlur={event => {
      const next = String(event.currentTarget.innerText || '').replace(/\u00a0/g, ' ').trim();
      if (next !== String(value ?? '').trim()) onCommit?.(next);
    }}
    onKeyDown={event => {
      if (event.key === 'Enter' && !multiline) { event.preventDefault(); event.currentTarget.blur(); }
    }}
  >{value ?? ''}</Tag>;
}

function UploadTarget({ value, title, hint, onUpload, className = '', draggable = false, imageScale = 1, imageOffset = { x: 0, y: 0 }, onDragPosition }) {
  const inputRef = useRef(null);
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const editorId = className.includes('xen-logo-target') ? 'logo' : className.includes('xen-qr-target') ? 'qr' : className.includes('xen-signature-target') ? 'signature' : 'image';
  const openPicker = event => {
    event.preventDefault();
    event.stopPropagation();
    inputRef.current?.click();
  };
  const onPointerDown = event => {
    if (!draggable || !value || event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { startX: event.clientX, startY: event.clientY, x: Number(imageOffset?.x || 0), y: Number(imageOffset?.y || 0), moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
  };
  const onPointerMove = event => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
    if (!dragRef.current.moved) return;
    onDragPosition?.({
      x: Math.max(-160, Math.min(160, Math.round(dragRef.current.x + dx))),
      y: Math.max(-100, Math.min(100, Math.round(dragRef.current.y + dy))),
    });
  };
  const onPointerUp = event => {
    dragRef.current = null;
    setIsDragging(false);
    try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch { /* pointer capture may already be released by the browser */ }
  };
  const imageTransform = draggable
    ? `translate(${Number(imageOffset?.x || 0)}px, ${Number(imageOffset?.y || 0)}px) scale(${Math.max(.45, Math.min(2.5, Number(imageScale) || 1))})`
    : undefined;
  return <div className={`xen-upload-target ${className} ${isDragging ? 'is-dragging' : ''}`.trim()} title={title} data-editor-id={editorId} data-editor-type="asset" data-editor-tab="Uploads">
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" aria-label={title} onChange={event => { onUpload(event); event.target.value = ''; }}/>
    {value
      ? <><img src={value} alt={title} draggable={false} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} style={imageTransform ? { transform: imageTransform, transformOrigin: 'center center', touchAction: 'none', cursor: isDragging ? 'grabbing' : draggable ? 'grab' : 'default' } : undefined}/><button type="button" className="xen-upload-chip" onClick={openPicker}><Upload size={12}/> Replace</button></>
      : <button type="button" className="xen-upload-empty" onClick={openPicker}><ImagePlus size={23}/><b>{title}</b><small>{hint || 'Tap to upload image'}</small></button>}
  </div>;
}
const serviceIcons = [Shirt, HardHat, Package, Shirt, Scissors, Printer, Palette];
const ribbonIcons = [Shirt, HardHat, Package, Shirt, Printer, Scissors, Palette];

export default function XenmarkInvoicePreview({ design, setD, meta, setM, customer, setC, items, updateLine, addLine, calculations, uploadAsset, isTemplateMode }) {
  const serviceLabels = String(design.businessServices || 'T-SHIRTS | CAPS | HOODIES | JACKETS | EMBROIDERY | DTF / DTG | CUSTOM PRINTS')
    .split(/[|\n]/).map(value => value.trim()).filter(Boolean).slice(0, 7);
  const setServiceLabel = (index, text) => {
    const next = [...serviceLabels];
    next[index] = text;
    setD('businessServices', next.join(' | '));
  };
  const ribbonLabels = String(design.ribbonServices || 'T-SHIRTS | CAPS | HOODIES | JACKETS | DTF / DTG | EMBROIDERY | CUSTOM PRINTS')
    .split(/[|\n]/).map(value => value.trim()).filter(Boolean).slice(0, 7);
  const setRibbonLabel = (index, text) => {
    const next = [...ribbonLabels];
    next[index] = text;
    setD('ribbonServices', next.join(' | '));
  };
  const businessName = design.businessName || (isTemplateMode ? 'XENMARK' : '');
  const businessAddress = design.businessAddress || (isTemplateMode ? 'RAJ LAKSHMI COMPLEX, KALYANPUR, LUCKNOW.' : '');
  const businessPhone = design.businessPhone || (isTemplateMode ? '+91 6387731661' : '');
  const businessGstin = design.businessGstin || (isTemplateMode ? '09LLIPK4037P1Z' : '');
  const businessSocial = design.businessSocialHandle || (isTemplateMode ? '@xenmark_' : '');
  const signValue = design.signatureDataUrl || '';
  const displayLogo = design.logoDataUrl || '/assets/xenmark-reference-logo.png';
  const displayQr = design.qrDataUrl || '/assets/xenmark-reference-qr.png';
  const lines = calculations.lines;
  const displayCalculations = calculations;
  // Paid amounts are derived from recorded payment transactions, not edited as invoice text.
  const amountPaid = 0;
  const dueAmount = Math.max(0, displayCalculations.total - amountPaid);

  return <XenmarkEditorStyleContext.Provider value={design.elementStyles || {}}><div className="xenmark-invoice">
    <header className="xen-masthead" data-editor-tab="Uploads" data-editor-section="ic-section-assets" data-editor-id="heading">
      <div className="xen-logo-side">
        <UploadTarget value={displayLogo} title="Upload business logo" hint="Your logo goes here" onUpload={uploadAsset('logoDataUrl')} className="xen-logo-target" draggable imageScale={design.logoZoom || 1} imageOffset={{ x: design.logoOffsetX || 0, y: design.logoOffsetY || 0 }} onDragPosition={position => { setD('logoOffsetX', position.x); setD('logoOffsetY', position.y); }}/>
      </div>
      <div className="xen-business-head">
        <InlineEdit as="h2" value={design.businessTagline || ''} placeholder="GARMENT MANUFACTURER & PRINTING HOUSE" onCommit={value => setD('businessTagline', value)} className="xen-manufacturer-title"/>
        <InlineEdit as="p" value={design.businessServiceLine || ''} placeholder="T-SHIRTS   |   CAPS   |   HOODIES   |   JACKETS" onCommit={value => setD('businessServiceLine', value)} className="xen-service-line"/>
        <InlineEdit as="p" value={design.businessServiceLine2 || ''} placeholder="EMBROIDERY   |   DTF   |   DTG   |   CUSTOM PRINTING" onCommit={value => setD('businessServiceLine2', value)} className="xen-service-line xen-service-line-secondary"/>
        <div className="xen-service-icons">
          {serviceLabels.map((label, index) => {
            const Icon = serviceIcons[index % serviceIcons.length];
            return <div className="xen-service-icon" key={`${index}-${label}`}>
              <Icon size={19} strokeWidth={1.8}/>
              <InlineEdit as="span" value={label} placeholder="Service" onCommit={value => setServiceLabel(index, value)} className="xen-service-label"/>
            </div>;
          })}
          {serviceLabels.length === 0 && <InlineEdit as="span" value="" placeholder="Tap to add service categories" onCommit={value => setD('businessServices', value)} />}
        </div>
      </div>
    </header>

    <section className="xen-invoice-band" data-editor-tab="Details" data-editor-section="ic-section-invoice" data-editor-id="invoice-band">
      <InlineEdit as="h1" value={design.invoiceTitle || ''} placeholder="INVOICE" onCommit={value => setD('invoiceTitle', value)} className="xen-invoice-heading"/>
      <div className="xen-invoice-quick-meta">
        <div><InlineEdit as="span" value={design.invoiceNumberLabel || ''} placeholder="Bill No." onCommit={value => setD('invoiceNumberLabel', value)}/><span className="xen-meta-colon">:</span><InlineEdit as="b" value={meta.invoiceNumber || ''} placeholder="" onCommit={value => { setM('invoiceNumber', value); setM('manualInvoiceNumber', true); }}/></div>
        <div><InlineEdit as="span" value={design.topIssueDateLabel || 'Date'} placeholder="Date" onCommit={value => setD('topIssueDateLabel', value)}/><span className="xen-meta-colon">:</span><InlineEdit as="b" value={displayDate(meta.issueDate)} placeholder="DD-MM-YYYY" onCommit={value => setM('issueDate', normaliseDate(value, meta.issueDate))}/></div>
        <div><InlineEdit as="span" value={design.dueDateLabel || ''} placeholder="Due Date" onCommit={value => setD('dueDateLabel', value)}/><span className="xen-meta-colon">:</span><InlineEdit as="b" value={displayDate(meta.dueDate)} placeholder="DD-MM-YYYY" onCommit={value => setM('dueDate', normaliseDate(value, meta.dueDate))}/></div>
      </div>
    </section>

    <section className="xen-party-grid">
      <div className="xen-party-card" data-editor-tab="Details" data-editor-section="ic-section-customer" data-editor-id="customer">
        <h3><span className="xen-party-heading-icon"><UserRound size={22} fill="currentColor"/></span><InlineEdit value={design.billToLabel || ''} placeholder="BILL TO" onCommit={value => setD('billToLabel', value)}/></h3>
        <div className="xen-party-details">
          <div><InlineEdit value={design.customerNameLabel || 'Name'} placeholder="Name" onCommit={value => setD('customerNameLabel', value)}/><b>:</b><InlineEdit value={customer.name || ''} placeholder="" onCommit={value => setC('name', value)} className="xen-customer-value"/></div>
          <div><InlineEdit value={design.customerCompanyLabel || 'Company Name'} placeholder="Company Name" onCommit={value => setD('customerCompanyLabel', value)}/><b>:</b><InlineEdit value={customer.companyName || ''} placeholder="" onCommit={value => setC('companyName', value)} className="xen-customer-value"/></div>
          <div><InlineEdit value={design.customerAddressLabel || 'Address'} placeholder="Address" onCommit={value => setD('customerAddressLabel', value)}/><b>:</b><InlineEdit value={customer.billingAddress || ''} placeholder="" onCommit={value => setC('billingAddress', value)} className="xen-customer-value xen-customer-address"/></div>
          <div><InlineEdit value={design.customerPhoneLabel || 'Phone'} placeholder="Phone" onCommit={value => setD('customerPhoneLabel', value)}/><b>:</b><InlineEdit value={customer.phone || ''} placeholder="" onCommit={value => setC('phone', value)} className="xen-customer-value"/></div>
          <div><InlineEdit value={design.customerGstinLabel || 'GSTIN'} placeholder="GSTIN" onCommit={value => setD('customerGstinLabel', value)}/><b>:</b><InlineEdit value={customer.gstin || ''} placeholder="" onCommit={value => setC('gstin', value)} className="xen-customer-value"/></div>
        </div>
      </div>
      <div className="xen-party-card" data-editor-tab="Uploads" data-editor-section="ic-section-business" data-editor-id="business">
        <h3><span className="xen-party-grid-icon"><Building2 size={18}/></span><InlineEdit value={design.billFromLabel || ''} placeholder="BILL BY" onCommit={value => setD('billFromLabel', value)}/></h3>
        <div className="xen-party-details">
          <div><InlineEdit value={design.businessNameLabel || 'Name'} placeholder="Name" onCommit={value => setD('businessNameLabel', value)}/><b>:</b><InlineEdit value={businessName} placeholder="Business name" onCommit={value => setD('businessName', value)}/></div>
          <div><InlineEdit value={design.businessAddressLabel || 'Address'} placeholder="Address" onCommit={value => setD('businessAddressLabel', value)}/><b>:</b><InlineEdit value={businessAddress} placeholder="Business address" onCommit={value => setD('businessAddress', value)}/></div>
          <div><InlineEdit value={design.businessPhoneLabel || 'Phone'} placeholder="Phone" onCommit={value => setD('businessPhoneLabel', value)}/><b>:</b><InlineEdit value={businessPhone} placeholder="Phone number" onCommit={value => setD('businessPhone', value)}/></div>
          <div><InlineEdit value={design.businessGstinLabel || 'GSTIN'} placeholder="GSTIN" onCommit={value => setD('businessGstinLabel', value)}/><b>:</b><InlineEdit value={businessGstin} placeholder="Business GSTIN" onCommit={value => setD('businessGstin', value)}/></div>
        </div>
      </div>
    </section>

    <section className="xen-date-strip" data-editor-tab="Details" data-editor-section="ic-section-invoice" data-editor-id="meta">
      <div><span className="xen-meta-symbol"><CalendarDays size={31}/></span><span className="xen-meta-content"><InlineEdit as="small" value={design.issueDateLabel || ''} placeholder="Invoice Date" onCommit={value => setD('issueDateLabel', value)}/><InlineEdit as="b" value={displayDate(meta.issueDate)} placeholder="DD-MM-YYYY" onCommit={value => setM('issueDate', normaliseDate(value, meta.issueDate))}/></span></div>
      <div><span className="xen-meta-symbol"><CalendarDays size={31}/></span><span className="xen-meta-content"><InlineEdit as="small" value={design.dueDateLabel || ''} placeholder="Due Date" onCommit={value => setD('dueDateLabel', value)}/><InlineEdit as="b" value={displayDate(meta.dueDate)} placeholder="DD-MM-YYYY" onCommit={value => setM('dueDate', normaliseDate(value, meta.dueDate))}/></span></div>
      <div><span className="xen-meta-symbol"><FilePlus2 size={31}/></span><span className="xen-meta-content"><InlineEdit as="small" value={design.purchaseOrderLabel || ''} placeholder="PO No." onCommit={value => setD('purchaseOrderLabel', value)}/><span className="xen-meta-inline"><small>(If Any)</small><InlineEdit as="b" value={meta.purchaseOrder || ''} placeholder="" className="xen-meta-edit-line" onCommit={value => setM('purchaseOrder', value)}/></span></span></div>
      <div><span className="xen-meta-symbol"><ClipboardList size={31}/></span><span className="xen-meta-content"><InlineEdit as="small" value={design.referenceLabel || ''} placeholder="Reference" onCommit={value => setD('referenceLabel', value)}/><span className="xen-meta-inline"><small>(If Any)</small><InlineEdit as="b" value={meta.reference || ''} placeholder="" className="xen-meta-edit-line" onCommit={value => setM('reference', value)}/></span></span></div>
    </section>

    <div className="xen-table-wrap" data-editor-tab="Table" data-editor-section="ic-section-items" data-editor-id="items">
      <table className="xen-items-table"><thead><tr>
        <th><InlineEdit value={design.documentLabel || ''} placeholder="S. No." onCommit={value => setD('documentLabel', value)}/></th>
        <th><InlineEdit value={design.itemLabel || ''} placeholder="Description" onCommit={value => setD('itemLabel', value)}/></th>
        <th><InlineEdit value={design.quantityLabel || ''} placeholder="Pieces" onCommit={value => setD('quantityLabel', value)}/></th>
        <th><InlineEdit value={design.rateLabel || ''} placeholder="Rate (₹)" onCommit={value => setD('rateLabel', value)}/></th>
        <th><InlineEdit value={design.amountLabel || ''} placeholder="Amount (₹)" onCommit={value => setD('amountLabel', value)}/></th>
      </tr></thead><tbody>
        {lines.map((line, index) => <tr key={line.id}>
          <td className="xen-row-num">{index + 1}</td>
          <td><InlineEdit as="span" value={line.name || ''} placeholder={`Item ${index + 1} description`} onCommit={value => updateLine(line.id, 'name', value)} className="xen-line-name"/><InlineEdit as="small" value={line.description || ''} placeholder="Additional item details" onCommit={value => updateLine(line.id, 'description', value)} className="xen-line-description" multiline/></td>
          <td className="xen-centered"><InlineEdit value={String(line.quantity ?? 1)} placeholder="1" onCommit={value => updateLine(line.id, 'quantity', numberFromText(value) || 1)}/></td>
          <td className="xen-centered"><InlineEdit value={displayMoney(line.rate)} placeholder="₹ 0.00" onCommit={value => updateLine(line.id, 'rate', numberFromText(value))}/></td>
          <td className="xen-centered"><InlineEdit value={displayMoney(Number(line.quantity || 0) * Number(line.rate || 0))} placeholder="₹ 0.00" onCommit={value => {
            const amount = numberFromText(value);
            const quantity = Math.max(1, Number(line.quantity || 1));
            updateLine(line.id, 'rate', Math.max(0, amount / quantity));
          }}/></td>
        </tr>)}
        {lines.length === 0 && <tr><td colSpan="5" className="xen-empty-row">Tap here to add invoice items in the Items & Services section.</td></tr>}
      </tbody></table>
      {!isTemplateMode && <button type="button" className="xen-add-item-editor ic-editor-only" data-editor-only="true" onClick={addLine}><Plus size={15}/> Add more items</button>}
    </div>

    <section className="xen-payment-total-grid" data-editor-tab="Uploads" data-editor-section="ic-section-assets" data-editor-id="payment">
      <div className="xen-payment-box">
        <h3><InlineEdit value={design.paymentDetailsLabel || ''} placeholder="Payment Details" onCommit={value => setD('paymentDetailsLabel', value)}/></h3>
        <div className="xen-payment-content">
          <div className="xen-qr-card">
            <div className="xen-qr-brand"><span className="xen-phonepe-mark" aria-hidden="true">₹</span><InlineEdit value={design.qrPaymentProvider || 'PhonePe'} placeholder="PhonePe" onCommit={value => setD('qrPaymentProvider', value)}/></div>
            <UploadTarget value={displayQr} title="Upload payment QR" hint="Tap to add UPI QR" onUpload={uploadAsset('qrDataUrl')} className="xen-qr-target"/>
            <div className="xen-qr-caption"><InlineEdit as="b" value={design.qrScanText || 'Scan & Pay'} placeholder="Scan & Pay" onCommit={value => setD('qrScanText', value)}/><InlineEdit as="small" value={design.qrScanSubtext || 'Pay with any UPI App'} placeholder="Payment caption" onCommit={value => setD('qrScanSubtext', value)}/></div>
          </div>
          <div className="xen-payment-instructions">
            <b><InlineEdit value={design.paymentInstructionsLabel || ''} placeholder="Payment Instructions" onCommit={value => setD('paymentInstructionsLabel', value)}/></b>
            <InlineEdit as="p" value={design.paymentInstructions || ''} placeholder="• Please scan the QR code and pay the amount.\n• After payment, share the screenshot with your order/bill number.\n• For any payment issues, contact us.\n• Thank you for your business." onCommit={value => setD('paymentInstructions', value)} multiline/>
            {design.showPaymentStatusSummary && <><div className="xen-payment-status"><InlineEdit value={design.paymentStatusText || ''} placeholder="PAYMENT STATUS: UNPAID" onCommit={value => setD('paymentStatusText', value)}/></div><div className="xen-payment-numbers"><span><InlineEdit value={design.amountPaidLabel || ''} placeholder="Amount paid" onCommit={value => setD('amountPaidLabel', value)}/> <b>{displayMoney(amountPaid)}</b></span><span><InlineEdit value={design.dueAmountLabel || ''} placeholder="Due amount" onCommit={value => setD('dueAmountLabel', value)}/> <b>{displayMoney(dueAmount)}</b></span></div></>}
          </div>
        </div>
      </div>
      <div className="xen-total-box">
        <div className="xen-total-line"><InlineEdit value={design.subtotalLabel || ''} placeholder="Sub Total" onCommit={value => setD('subtotalLabel', value)}/><b>{displayMoney(displayCalculations.subtotal)}</b></div>
        <div className="xen-total-line"><InlineEdit value={design.discountLabel || ''} placeholder="Discount" onCommit={value => setD('discountLabel', value)}/><b>{displayMoney(displayCalculations.discount)}</b></div>
        <div className="xen-total-line"><InlineEdit value={design.taxLabel || ''} placeholder="GST (0%)" onCommit={value => setD('taxLabel', value)}/><b>{displayMoney(displayCalculations.tax)}</b></div>
        <div className="xen-grand-total"><InlineEdit value={design.totalLabel || ''} placeholder="Total Amount" onCommit={value => setD('totalLabel', value)}/><b>{displayMoney(displayCalculations.total)}</b></div>
        <div className="xen-thank-you">
          <InlineEdit as="strong" value={design.thankYouText || ''} placeholder="Thank You!" onCommit={value => setD('thankYouText', value)}/>
          <InlineEdit as="small" value={design.trustText || ''} placeholder="FOR YOUR TRUST" onCommit={value => setD('trustText', value)}/>
          <UploadTarget value={signValue} title="Upload signature" hint="Authorised signature" onUpload={uploadAsset('signatureDataUrl')} className="xen-signature-target"/>
        </div>
      </div>
    </section>

    <section className="xen-service-ribbon" data-editor-tab="Details" data-editor-section="ic-section-assets" data-editor-id="services">
      <div className="xen-service-ribbon-title"><InlineEdit as="strong" value={design.serviceBannerText || 'CUSTOM APPAREL\nFOR YOUR\nBRAND & BUSINESS'} placeholder="CUSTOM APPAREL FOR YOUR BRAND & BUSINESS" onCommit={value => setD('serviceBannerText', value)} multiline/></div>
      <div className="xen-service-ribbon-icons">
        {ribbonLabels.map((label, index) => {
          const Icon = ribbonIcons[index % ribbonIcons.length];
          return <div className="xen-ribbon-icon" key={`${index}-${label}`}><Icon size={20} strokeWidth={1.7}/><InlineEdit value={label} placeholder="Service" onCommit={value => setRibbonLabel(index, value)} className="xen-ribbon-label"/></div>;
        })}
      </div>
    </section>

    <footer className="xen-footer">
      <div className="xen-footer-main">
        <div><MapPin size={13}/><InlineEdit value={businessAddress} placeholder="Business address" onCommit={value => setD('businessAddress', value)}/></div>
        <div className="xen-footer-contact"><span><Phone size={12}/><InlineEdit value={businessPhone} placeholder="Phone number" onCommit={value => setD('businessPhone', value)}/></span><span><Instagram size={12}/><InlineEdit value={businessSocial} placeholder="Social handle" onCommit={value => setD('businessSocialHandle', value)}/></span></div>
        <div><span><BadgeCheck size={12}/><InlineEdit value={businessGstin} placeholder="GSTIN" onCommit={value => setD('businessGstin', value)}/></span><span><Globe size={12}/><InlineEdit value={design.businessWebsite || (isTemplateMode ? 'www.xenmark.in' : '')} placeholder="Website" onCommit={value => setD('businessWebsite', value)}/></span></div>
      </div>
      <div className="xen-footer-strip"><InlineEdit value={design.footerText || ''} placeholder="GARMENTS   |   PRINTING   |   CUSTOMIZATION" onCommit={value => setD('footerText', value)}/></div>
    </footer>
  </div></XenmarkEditorStyleContext.Provider>;
}
