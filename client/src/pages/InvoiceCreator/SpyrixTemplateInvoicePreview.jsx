import { useRef } from 'react';
import './SpyrixTemplateInvoicePreview.css';

const inr = value => `₹ ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))}`;
const dateText = value => {
  if (!value) return '—';
  const text = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text.slice(8, 10)}-${text.slice(5, 7)}-${text.slice(0, 4)}`;
  return text;
};

function Logo({ design, editable, onUpload }) {
  const inputRef = useRef(null);
  const content = design.logoDataUrl
    ? <img src={design.logoDataUrl} alt="Business logo" />
    : <span className="sp-tpl-mark">S</span>;
  if (!editable) return <div className="sp-tpl-logo">{content}</div>;
  return <div className="sp-tpl-logo sp-tpl-logo-edit" data-editor-tab="Uploads" data-editor-section="ic-section-assets" data-editor-id="logo">
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={onUpload} aria-label="Upload business logo" />
    <button type="button" title="Click to upload or replace your logo" onClick={event => { event.stopPropagation(); inputRef.current?.click(); }}>{content}<small>EDIT LOGO</small></button>
  </div>;
}

function Qr({ design, editable, onUpload }) {
  const inputRef = useRef(null);
  if (design.showQr === false) return null;
  const inner = design.qrDataUrl
    ? <img src={design.qrDataUrl} alt="Payment QR code" />
    : <i className="sp-tpl-qr-pattern" />;
  if (!editable) return <div className="sp-tpl-qr">{inner}</div>;
  return <div className="sp-tpl-qr sp-tpl-qr-edit" data-editor-tab="Uploads" data-editor-section="ic-section-assets" data-editor-id="qr">
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onUpload} aria-label="Upload payment QR code" />
    <button type="button" title="Click to upload payment QR" onClick={event => { event.stopPropagation(); inputRef.current?.click(); }}>{inner}<small>EDIT QR</small></button>
  </div>;
}

function Signature({ design, editable, onUpload }) {
  const inputRef = useRef(null);
  if (!design.showSignature) return null;
  const content = design.signatureDataUrl ? <img src={design.signatureDataUrl} alt="Signature" /> : <span>+ Add signature</span>;
  if (!editable) return design.signatureDataUrl ? <div className="sp-tpl-signature"><img src={design.signatureDataUrl} alt="Signature" />{design.signatureName && <b>{design.signatureName}</b>}<small>{design.signatureCaption || 'AUTHORISED SIGNATORY'}</small></div> : null;
  return <div className="sp-tpl-signature sp-tpl-signature-edit" data-editor-tab="Uploads" data-editor-section="ic-section-assets" data-editor-id="signature">
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} aria-label="Upload or replace signature" />
    <button type="button" title="Click to upload or replace signature" onClick={event => { event.stopPropagation(); inputRef.current?.click(); }}>{content}</button>
    {design.signatureName && <b>{design.signatureName}</b>}<small>{design.signatureCaption || 'AUTHORISED SIGNATORY'}</small>
  </div>;
}

function PartyBlock({ title, values, variant, block, textOverrides = {} }) {
  const titleId = `${block}-title`;
  return <section className={`sp-tpl-party sp-tpl-party-${variant}`}>
    <h4 data-generic-text-id={titleId}>{textOverrides[titleId] ?? title}</h4>
    {values.filter(([, value]) => String(value || '').trim()).map(([label, value], index) => {
      const labelId = `${block}-label-${index}`;
      const valueId = `${block}-value-${index}`;
      return <div className="sp-tpl-party-row" key={`${label}-${index}`}><span data-generic-text-id={labelId}>{textOverrides[labelId] ?? label}</span><b data-generic-text-id={valueId}>{textOverrides[valueId] ?? value}</b></div>;
    })}
  </section>;
}

function TotalBox({ calculations, design }) {
  const overrides = design.textOverrides || {};
  const value = (id, fallback) => overrides[id] ?? fallback;
  return <div className="sp-tpl-total-box">
    <div><span data-generic-text-id="subtotal-label">{value('subtotal-label', design.subtotalLabel || 'Sub Total')}</span><b data-generic-text-id="subtotal-value">{value('subtotal-value', inr(calculations.subtotal))}</b></div>
    {Number(calculations.discount || 0) > 0 && <div><span data-generic-text-id="discount-label">{value('discount-label', design.discountLabel || 'Discount')}</span><b data-generic-text-id="discount-value">{value('discount-value', `− ${inr(calculations.discount)}`)}</b></div>}
    <div><span data-generic-text-id="tax-label">{value('tax-label', design.taxLabel || 'GST')}</span><b data-generic-text-id="tax-value">{value('tax-value', inr(calculations.tax))}</b></div>
    <div className="sp-tpl-total-grand"><span data-generic-text-id="total-label">{value('total-label', design.totalLabel || 'Total Amount')}</span><b data-generic-text-id="total-value">{value('total-value', inr(calculations.total))}</b></div>
  </div>;
}

export default function SpyrixTemplateInvoicePreview({
  template, design = {}, meta = {}, customer = {}, items = [], calculations = { lines: [], subtotal: 0, discount: 0, tax: 0, total: 0 },
  editable = false, onLogoUpload, onQrUpload, onSignatureUpload,
}) {
  const [header, parties, table, bottom, footer] = template?.parts || [0, 0, 0, 0, 0];
  const accent = design.accentColor || template?.color || '#7a1220';
  const dark = template?.dark || '#171a22';
  const font = design.fontFamily || template?.font || 'Arial';
  const businessName = design.businessName || (editable ? 'YOUR BUSINESS' : 'SPYRIX');
  const customerName = customer.companyName || customer.name || (editable ? 'Customer name' : 'ARABWEARS');
  const customerAddress = [customer.billingAddress, customer.city, customer.state, customer.postalCode].filter(Boolean).join(', ');
  const businessLines = [
    [design.businessNameLabel || 'Name', businessName],
    [design.businessAddressLabel || 'Address', design.businessAddress || 'Business address'],
    [design.businessPhoneLabel || 'Phone', design.businessPhone || 'Phone number'],
    ...(design.showBusinessGstin === false ? [] : [[design.businessGstinLabel || 'GSTIN', design.businessGstin || '']]),
  ];
  const customerLines = [
    [design.customerNameLabel || 'Name', customerName],
    [design.customerCompanyLabel || 'Company', customer.companyName || customer.name || ''],
    [design.customerAddressLabel || 'Address', customerAddress || customer.billingAddress || ''],
    [design.customerPhoneLabel || 'Phone', customer.phone || ''],
    ...(design.showCustomerGstin === false ? [] : [[design.customerGstinLabel || 'GSTIN', customer.gstin || '']]),
  ];
  const invoiceNo = meta.invoiceNumber || 'SP-1042';
  const invoiceDate = dateText(meta.issueDate || '2025-10-30');
  const dueDate = dateText(meta.dueDate || '2025-11-30');
  const title = design.invoiceTitle || 'INVOICE';
  const textOverrides = design.textOverrides || {};
  const text = (id, fallback) => textOverrides[id] ?? fallback;
  const dateInfo = <div className="sp-tpl-date-info"><b data-generic-text-id="invoice-number-label">{text('invoice-number-label', design.invoiceNumberLabel || 'Bill No.')}</b> <span data-generic-text-id="invoice-number">{text('invoice-number', invoiceNo)}</span><br/><b data-generic-text-id="issue-date-label">{text('issue-date-label', design.topIssueDateLabel || 'Date')}</b> <span data-generic-text-id="issue-date">{text('issue-date', invoiceDate)}</span><br/><b data-generic-text-id="due-date-label">{text('due-date-label', design.dueDateLabel || 'Due Date')}</b> <span data-generic-text-id="due-date">{text('due-date', dueDate)}</span></div>;
  const businessTagline = design.businessTagline || 'GARMENT MANUFACTURER & PRINTING HOUSE';
  const serviceLine = design.businessServiceLine || 'T-SHIRTS | CAPS | HOODIES | JACKETS';
  const serviceLine2 = design.businessServiceLine2 || 'EMBROIDERY | DTF | DTG | CUSTOM PRINTING';
  const lineItems = (calculations.lines?.length ? calculations.lines : items).filter(item => item && (item.name || item.description || items.length));
  const paymentCopy = String(design.paymentInstructions || 'Scan the QR code and pay the amount. Share the payment screenshot with your bill number. Thank you for your business.').split('\n').filter(Boolean);
  const terms = meta.terms || '1. Goods once sold will not be taken back.\n2. Payment is due within 30 days.\n3. Custom orders are made to order.';
  const footerText = design.footerText || 'GARMENTS  |  PRINTING  |  CUSTOMIZATION';
  const themeStyle = { '--sp-tpl-a': accent, '--sp-tpl-b': dark, '--sp-tpl-l': `${accent}1c`, '--sp-tpl-font': font };

  const logo = design.showLogo === false ? null : <Logo design={design} editable={editable} onUpload={onLogoUpload}/>;
  const headerNode = (() => {
    switch (header) {
      case 0: return <><div className="sp-tpl-head-basic"><div className="sp-tpl-brand">{logo}<div><b data-generic-text-id="business-name">{text('business-name', businessName)}</b><small data-generic-text-id="business-tagline">{text('business-tagline', businessTagline)}</small></div></div><div className="sp-tpl-head-services"><span data-generic-text-id="service-line-1">{text('service-line-1', serviceLine)}</span><br/><span data-generic-text-id="service-line-2">{text('service-line-2', serviceLine2)}</span></div></div><div className="sp-tpl-service-ribbon"><span data-generic-text-id="ribbon-services">{text('ribbon-services', 'T-SHIRTS  •  CAPS  •  HOODIES  •  JACKETS  •  EMBROIDERY  •  DTF / DTG')}</span></div><div className="sp-tpl-banner"><h1 data-generic-text-id="invoice-title">{text('invoice-title', title)}</h1>{dateInfo}</div></>;
      case 1: return <div className="sp-tpl-head-rail"><div className="sp-tpl-rail"/><div className="sp-tpl-head-row"><div className="sp-tpl-brand">{logo}<div><b data-generic-text-id="business-name">{text('business-name', businessName)}</b><small data-generic-text-id="business-tagline">{text('business-tagline', businessTagline)}</small></div></div><h1 data-generic-text-id="invoice-title">{text('invoice-title', title)}</h1></div><p className="sp-tpl-head-meta" data-generic-text-id="invoice-date-line">{text('invoice-date-line', `${invoiceNo}　•　${invoiceDate}　•　${dueDate}`)}</p></div>;
      case 2: return <div className="sp-tpl-head-centre"><div className="sp-tpl-brand sp-tpl-brand-centre">{logo}<div><b data-generic-text-id="business-name">{text('business-name', businessName)}</b><small data-generic-text-id="business-tagline">{text('business-tagline', businessTagline)}</small></div></div><h1 data-generic-text-id="invoice-title">{text('invoice-title', title)}</h1><div className="sp-tpl-centre-rule"><span data-generic-text-id="invoice-number">{text('invoice-number', invoiceNo)}</span> <i/> <span data-generic-text-id="issue-date">{text('issue-date', invoiceDate)}</span> <i/> <span data-generic-text-id="due-date">{text('due-date', dueDate)}</span></div></div>;
      case 3: return <div className="sp-tpl-head-block"><div className="sp-tpl-brand sp-tpl-brand-white">{logo}<div><b data-generic-text-id="business-name">{text('business-name', businessName)}</b><small data-generic-text-id="business-tagline">{text('business-tagline', businessTagline)}</small></div></div><div className="sp-tpl-head-block-title"><h1 data-generic-text-id="invoice-title">{text('invoice-title', title)}</h1><p data-generic-text-id="invoice-date-line">{text('invoice-date-line', `${invoiceNo}　•　${invoiceDate}　•　${dueDate}`)}</p></div></div>;
      case 4: return <div className="sp-tpl-head-frame"><div className="sp-tpl-frame-corner"/><div className="sp-tpl-head-row"><div className="sp-tpl-brand">{logo}<div><b data-generic-text-id="business-name">{text('business-name', businessName)}</b><small data-generic-text-id="business-tagline">{text('business-tagline', businessTagline)}</small></div></div><div><h1 data-generic-text-id="invoice-title">{text('invoice-title', title)}</h1>{dateInfo}</div></div></div>;
      case 5: return <div className="sp-tpl-head-split"><div className="sp-tpl-split-brand sp-tpl-brand-white"><div className="sp-tpl-brand">{logo}<div><b data-generic-text-id="business-name">{text('business-name', businessName)}</b><small data-generic-text-id="business-tagline">{text('business-tagline', businessTagline)}</small></div></div></div><div className="sp-tpl-split-info"><h1 data-generic-text-id="invoice-title">{text('invoice-title', title)}</h1>{dateInfo}</div></div>;
      case 6: return <div className="sp-tpl-head-vertical"><div className="sp-tpl-vertical-title"><span data-generic-text-id="invoice-title">{text('invoice-title', title)}</span></div><div className="sp-tpl-head-row"><div className="sp-tpl-brand">{logo}<div><b data-generic-text-id="business-name">{text('business-name', businessName)}</b><small data-generic-text-id="business-tagline">{text('business-tagline', businessTagline)}</small></div></div>{dateInfo}</div><hr/></div>;
      case 7: return <div className="sp-tpl-head-minimal"><div className="sp-tpl-brand">{logo}<div><b data-generic-text-id="business-name">{text('business-name', businessName)}</b><small data-generic-text-id="business-tagline">{text('business-tagline', businessTagline)}</small></div></div><div className="sp-tpl-watermark-title"><span data-generic-text-id="invoice-title">{text('invoice-title', title)}</span><small data-generic-text-id="invoice-date-line">{text('invoice-date-line', `${invoiceNo}　•　${invoiceDate}　•　${dueDate}`)}</small></div><hr/></div>;
      case 8: return <><div className="sp-tpl-head-chip sp-tpl-brand-white"><div className="sp-tpl-brand">{logo}<div><b data-generic-text-id="business-name">{text('business-name', businessName)}</b><small data-generic-text-id="business-tagline">{text('business-tagline', businessTagline)}</small></div></div><div className="sp-tpl-amount-chip"><small data-generic-text-id="amount-due-label">{text('amount-due-label', 'AMOUNT DUE')}</small><b data-generic-text-id="amount-due-value">{text('amount-due-value', inr(calculations.total))}</b></div></div><h1 className="sp-tpl-chip-title" data-generic-text-id="invoice-title">{text('invoice-title', title)}<small data-generic-text-id="invoice-date-line">{text('invoice-date-line', `${invoiceNo}　•　${invoiceDate}　•　${dueDate}`)}</small></h1></>;
      default: return <div className="sp-tpl-head-badge"><div className="sp-tpl-brand">{logo}<div><b data-generic-text-id="business-name">{text('business-name', businessName)}</b><small data-generic-text-id="business-tagline">{text('business-tagline', businessTagline)}</small></div></div><div className="sp-tpl-round-badge"><span data-generic-text-id="invoice-title">{text('invoice-title', title)}</span><small data-generic-text-id="invoice-number">#{text('invoice-number', invoiceNo)}</small></div><div className="sp-tpl-dots-rule"/></div>;
    }
  })();

  const partiesNode = <div className={`sp-tpl-parties sp-tpl-parties-${parties}`}>
    <PartyBlock title={design.billToLabel || 'BILL TO'} values={customerLines} variant={parties} block="bill-to" textOverrides={textOverrides}/>
    <PartyBlock title={design.billFromLabel || 'BILL BY'} values={businessLines} variant={parties} block="bill-from" textOverrides={textOverrides}/>
  </div>;

  const tableClass = `sp-tpl-items sp-tpl-items-${table}`;
  const tableNode = <table className={tableClass} data-editor-tab="Table" data-editor-section="ic-section-items" data-editor-id="items"><thead><tr>
    <th style={{ width: 58 }} data-generic-text-id="table-col-0">{text('table-col-0', design.documentLabel || 'S. No.')}</th><th data-generic-text-id="table-col-1">{text('table-col-1', design.itemLabel || 'Description')}</th><th data-generic-text-id="table-col-2">{text('table-col-2', design.quantityLabel || 'Pieces')}</th><th data-generic-text-id="table-col-3">{text('table-col-3', design.rateLabel || 'Rate (₹)')}</th><th data-generic-text-id="table-col-4">{text('table-col-4', design.amountLabel || 'Amount (₹)')}</th>
  </tr></thead><tbody>{lineItems.map((item, index) => <tr key={item.id || index}>
    <td data-generic-text-id={`item-${index}-number`}>{text(`item-${index}-number`, index + 1)}</td><td><b data-generic-text-id={`item-${index}-name`}>{text(`item-${index}-name`, item.name || item.description || `Item ${index + 1}`)}</b>{item.description && item.name && <small data-generic-text-id={`item-${index}-description`}>{text(`item-${index}-description`, item.description)}</small>}</td><td data-generic-text-id={`item-${index}-quantity`}>{text(`item-${index}-quantity`, `${item.quantity ?? 1} ${item.unit || ''}`)}</td><td data-generic-text-id={`item-${index}-rate`}>{text(`item-${index}-rate`, inr(item.rate))}</td><td data-generic-text-id={`item-${index}-amount`}>{text(`item-${index}-amount`, inr(item.lineTotal ?? Number(item.quantity || 0) * Number(item.rate || 0)))}</td>
  </tr>)}</tbody></table>;

  const paymentNode = <section className="sp-tpl-payment" data-editor-tab="Uploads" data-editor-section="ic-section-assets" data-editor-id="qr"><h3 data-generic-text-id="payment-title">{text('payment-title', design.paymentDetailsLabel || 'Payment Details')}</h3><div className="sp-tpl-payment-inner"><Qr design={design} editable={editable} onUpload={onQrUpload}/><div><ul>{paymentCopy.slice(0, 4).map((line, index) => <li key={index} data-generic-text-id={`payment-instruction-${index}`}>{text(`payment-instruction-${index}`, line.replace(/^•\s*/, ''))}</li>)}</ul><p data-generic-text-id="payment-status">{text('payment-status', design.paymentStatusText || 'PAYMENT STATUS: UNPAID')}</p></div></div></section>;
  const totalNode = <TotalBox calculations={calculations} design={design}/>;
  const thankYou = <div className="sp-tpl-thank-you"><span data-generic-text-id="thank-you">{text('thank-you', design.thankYouText || 'Thank You!')}</span><small data-generic-text-id="trust-text">{text('trust-text', design.trustText || 'FOR YOUR TRUST')}</small></div>;
  const termsNode = <div className="sp-tpl-terms"><b data-generic-text-id="terms-title">{text('terms-title', 'Terms & conditions')}</b>{terms.split('\n').filter(Boolean).map((line, index) => <p key={index} data-generic-text-id={`terms-${index}`}>{text(`terms-${index}`, line)}</p>)}</div>;
  const bottomNode = (() => {
    switch (bottom) {
      case 0: return <div className="sp-tpl-bottom sp-tpl-bottom-0">{paymentNode}<div>{totalNode}{thankYou}<Signature design={design} editable={editable} onUpload={onSignatureUpload}/></div></div>;
      case 1: return <div className="sp-tpl-bottom sp-tpl-bottom-1">{termsNode}<div>{totalNode}</div><div className="sp-tpl-bottom-wide">{paymentNode}</div></div>;
      case 2: return <div className="sp-tpl-bottom sp-tpl-bottom-2">{paymentNode}<div><div className="sp-tpl-total-pill"><small>Total payable</small><b>{inr(calculations.total)}</b></div>{thankYou}<Signature design={design} editable={editable} onUpload={onSignatureUpload}/></div></div>;
      case 3: return <div className="sp-tpl-bottom sp-tpl-bottom-3"><div>{totalNode}{thankYou}<Signature design={design} editable={editable} onUpload={onSignatureUpload}/></div>{paymentNode}</div>;
      default: return <div className="sp-tpl-bottom sp-tpl-bottom-4"><div className="sp-tpl-total-banner"><span data-generic-text-id="banner-total-label">{text('banner-total-label', design.totalLabel || 'Total Amount')}</span><b data-generic-text-id="banner-total-value">{text('banner-total-value', inr(calculations.total))}</b></div><div className="sp-tpl-bottom-two">{paymentNode}{termsNode}</div></div>;
    }
  })();

  const footerNode = (() => {
    switch (footer) {
      case 0: return <div className="sp-tpl-footer sp-tpl-footer-0"><div><span data-generic-text-id="footer-address">{text('footer-address', design.businessAddress || 'Business address')}</span><span data-generic-text-id="footer-phone">{text('footer-phone', design.businessPhone || 'Phone number')}</span><span data-generic-text-id="footer-website">{text('footer-website', design.businessWebsite || 'www.spyrix.in')}</span></div><b data-generic-text-id="footer-text">{text('footer-text', footerText)}</b></div>;
      case 1: return <div className="sp-tpl-footer sp-tpl-footer-1"><span data-generic-text-id="footer-address">{text('footer-address', design.businessAddress || 'Business address')}</span>　•　<span data-generic-text-id="footer-phone">{text('footer-phone', design.businessPhone || 'Phone number')}</span>　•　<span data-generic-text-id="footer-website">{text('footer-website', design.businessWebsite || 'www.spyrix.in')}</span></div>;
      case 2: return <div className="sp-tpl-footer sp-tpl-footer-2"><span data-generic-text-id="footer-address">{text('footer-address', design.businessAddress || 'Business address')}</span><br/><span data-generic-text-id="footer-phone">{text('footer-phone', design.businessPhone || 'Phone number')}</span>　|　<span data-generic-text-id="footer-gstin">{text('footer-gstin', design.businessGstin || 'GSTIN')}</span>　|　<span data-generic-text-id="footer-website">{text('footer-website', design.businessWebsite || 'www.spyrix.in')}</span></div>;
      case 3: return <div className="sp-tpl-footer sp-tpl-footer-3"><span data-generic-text-id="footer-address">{text('footer-address', design.businessAddress || 'Business address')}</span><span data-generic-text-id="footer-phone">{text('footer-phone', design.businessPhone || 'Phone number')}</span><span data-generic-text-id="footer-website">{text('footer-website', design.businessWebsite || 'www.spyrix.in')}</span></div>;
      default: return <div className="sp-tpl-footer sp-tpl-footer-4"><span data-generic-text-id="footer-address">{text('footer-address', design.businessAddress || 'Business address')}</span>　•　<span data-generic-text-id="footer-phone">{text('footer-phone', design.businessPhone || 'Phone number')}</span>　•　<span data-generic-text-id="footer-website">{text('footer-website', design.businessWebsite || 'www.spyrix.in')}</span></div>;
    }
  })();

  return <div className={`spyr-template-document spyr-head-${header} spyr-parties-${parties} spyr-bottom-${bottom}`} style={themeStyle}>
    <div className="sp-tpl-content" data-editor-tab="Text" data-editor-section="ic-section-business" data-editor-id="heading">
      {headerNode}
      {parties === 0 || parties === 3 ? <div className="sp-tpl-metadata-strip"><div><small data-generic-text-id="meta-issue-label">{text('meta-issue-label', 'Invoice Date')}</small><b data-generic-text-id="meta-issue-value">{text('meta-issue-value', invoiceDate)}</b></div><div><small data-generic-text-id="meta-due-label">{text('meta-due-label', 'Due Date')}</small><b data-generic-text-id="meta-due-value">{text('meta-due-value', dueDate)}</b></div><div><small data-generic-text-id="meta-po-label">{text('meta-po-label', 'PO No.')}</small><b data-generic-text-id="meta-po-value">{text('meta-po-value', meta.purchaseOrder || '—')}</b></div><div><small data-generic-text-id="meta-reference-label">{text('meta-reference-label', 'Reference')}</small><b data-generic-text-id="meta-reference-value">{text('meta-reference-value', meta.reference || '—')}</b></div></div> : null}
      <div data-editor-tab="Details" data-editor-section="ic-section-customer" data-editor-id="parties">{partiesNode}</div>
      <div className="sp-tpl-table-wrap">{tableNode}</div>
      <div className="sp-tpl-bottom-area" data-editor-tab="Text" data-editor-section="ic-section-notes" data-editor-id="summary">{bottomNode}</div>
    </div>
    {design.showFooter !== false && <div className={`sp-tpl-footer-wrap sp-tpl-footer-wrap-${footer}`} data-editor-tab="Text" data-editor-section="ic-section-notes" data-editor-id="footer">{footerNode}</div>}
  </div>;
}
