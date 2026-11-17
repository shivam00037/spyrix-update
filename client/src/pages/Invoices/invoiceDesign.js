export const invoiceTemplates = [
  // Keep the established Xenmark invoice exactly as the first/default design.
  { id: 'xenmark', name: 'Xenmark Reference', category: 'Manufacturing', description: 'Your original reference-matched invoice. This default design is preserved.', color: '#85172d', font: 'Arial', layout: 'xenmark' },
  // The 20 new, structurally distinct designs supplied in the template-gallery reference.
  { id: 'spyrix-classic', name: 'Spyrix Classic', category: 'Red', description: 'A bold manufacturer header, classic invoice ribbon and structured payment footer.', color: '#7a1220', dark: '#171a22', font: 'Arial', parts: [0, 0, 0, 0, 0] },
  { id: 'neon-edge', name: 'Neon Edge', category: 'Green', description: 'An outlined invoice title, vivid green side rail and crisp ledger table.', color: '#17a800', dark: '#06260f', font: 'Trebuchet MS', parts: [1, 2, 1, 1, 1] },
  { id: 'ocean-block', name: 'Ocean Block', category: 'Blue', description: 'A deep-blue masthead with clean rounded sections and a strong payment panel.', color: '#0b5cab', dark: '#0a2540', font: 'Verdana', parts: [3, 3, 2, 2, 2] },
  { id: 'emerald-frame', name: 'Emerald Frame', category: 'Green', description: 'A framed premium sheet with a diagonal split header and soft table accents.', color: '#0f7b5f', dark: '#12332b', font: 'Georgia', parts: [4, 1, 3, 3, 3] },
  { id: 'midnight-gold', name: 'Midnight Gold', category: 'Dark', description: 'A midnight-blue and gold split masthead with a dramatic vertical invoice title.', color: '#1f2a44', dark: '#c9a227', font: 'Palatino Linotype', parts: [5, 4, 4, 4, 4] },
  { id: 'vertical-ink', name: 'Vertical Ink', category: 'Dark', description: 'An editorial vertical title bar, sharp black table grid and compact information blocks.', color: '#111111', dark: '#ff3b30', font: 'Arial', parts: [6, 0, 5, 0, 1] },
  { id: 'minimal-mono', name: 'Minimal Mono', category: 'Minimal', description: 'An understated monochrome layout with quiet rules and spacious typography.', color: '#333333', dark: '#888888', font: 'Tahoma', parts: [7, 1, 1, 3, 1] },
  { id: 'violet-chip', name: 'Violet Chip', category: 'Purple', description: 'A dark violet masthead with a bright amount-due chip and softly grouped details.', color: '#6d28d9', dark: '#1e1038', font: 'Verdana', parts: [8, 3, 2, 2, 0] },
  { id: 'coral-badge', name: 'Coral Badge', category: 'Red', description: 'A circular invoice badge, coral accents and a friendly rounded finance layout.', color: '#e5484d', dark: '#3a1417', font: 'Trebuchet MS', parts: [9, 2, 4, 1, 3] },
  { id: 'sunset-block', name: 'Sunset Block', category: 'Orange', description: 'A warm split-color masthead with a bold total banner and rich footer treatment.', color: '#e0561b', dark: '#3a1d10', font: 'Georgia', parts: [3, 4, 0, 4, 2] },
  { id: 'teal-centre', name: 'Teal Centre', category: 'Green', description: 'A centered typographic header, dotted separator and calm teal accounting details.', color: '#0e7c86', dark: '#0b3b40', font: 'Tahoma', parts: [2, 3, 5, 3, 4] },
  { id: 'gold-luxe', name: 'Gold Luxe', category: 'Orange', description: 'A gold-accented framed invoice with classic serif details and refined spacing.', color: '#a87a14', dark: '#1c1608', font: 'Palatino Linotype', parts: [4, 0, 3, 2, 0] },
  { id: 'berry-split', name: 'Berry Split', category: 'Purple', description: 'A dramatic berry split masthead balanced by airy information and payment blocks.', color: '#8a1f5e', dark: '#2a0c1e', font: 'Arial', parts: [5, 1, 2, 0, 2] },
  { id: 'forest-side', name: 'Forest Side', category: 'Green', description: 'A forest-green side rail with softly divided customer details and rounded sections.', color: '#2e6b34', dark: '#14281a', font: 'Verdana', parts: [1, 4, 4, 1, 4] },
  { id: 'sky-badge', name: 'Sky Badge', category: 'Blue', description: 'A circular sky-blue invoice badge with a light ledger and balanced footer.', color: '#0284c7', dark: '#082f49', font: 'Trebuchet MS', parts: [9, 3, 1, 3, 1] },
  { id: 'slate-vertical', name: 'Slate Vertical', category: 'Dark', description: 'A slate vertical title bar and high-contrast accounting structure.', color: '#475569', dark: '#0f172a', font: 'Georgia', parts: [6, 2, 0, 4, 3] },
  { id: 'plum-minimal', name: 'Plum Minimal', category: 'Purple', description: 'A restrained plum monochrome title with a minimal grid and circular total.', color: '#7e22ce', dark: '#1e1038', font: 'Arial', parts: [7, 0, 5, 2, 0] },
  { id: 'amber-chip', name: 'Amber Chip', category: 'Orange', description: 'A warm amber masthead and compact chip-style invoice with clean line items.', color: '#d97706', dark: '#2b1a05', font: 'Tahoma', parts: [8, 1, 3, 0, 2] },
  { id: 'rose-centre', name: 'Rose Centre', category: 'Red', description: 'A centered rose header, soft party cards and a distinctive rounded financial footer.', color: '#c2336b', dark: '#3b1224', font: 'Palatino Linotype', parts: [2, 2, 2, 1, 4] },
  { id: 'ink-split', name: 'Ink Split', category: 'Blue', description: 'A deep-ink and gold angled masthead with a clean two-column finish.', color: '#0b3d91', dark: '#e0b100', font: 'Verdana', parts: [5, 3, 0, 3, 3] },
];

export const defaultInvoiceDesign = {
  templateId: 'xenmark',
  xenmarkRevision: 5,
  accentColor: '#85172d',
  fontFamily: 'Arial',
  invoiceTitle: 'INVOICE',
  showLogo: true,
  showQr: true,
  showBusinessGstin: true,
  showCustomerGstin: true,
  showItemSku: true,
  showItemDescription: true,
  showUnitColumn: true,
  showPurchaseReference: true,
  showDueDate: true,
  showFooter: true,
  showTaxBreakdown: true,
  footerText: 'GARMENTS | PRINTING | CUSTOMIZATION',
  paymentInstructions: '• Please scan the QR code and pay the amount.\n• After payment, share the screenshot with your order/bill number.\n• For any payment issues, contact us.\n• Thank you for your business.',
  logoDataUrl: '',
  qrDataUrl: '',
  signatureDataUrl: '',
  showSignature: false,
  signatureName: '',
  signatureTitle: 'Authorised Signatory',
  signatureWidth: 170,
  signatureAlignment: 'right',
  signatureCaption: 'AUTHORISED SIGNATORY',
  qrWidth: 82,
  qrPosition: 'right',
  qrCaption: 'SCAN TO PAY',
  qrInstruction: 'Scan the QR code with your UPI app to complete payment.',
  businessTagline: 'GARMENT MANUFACTURER & PRINTING HOUSE',
  businessServiceLine: 'T-SHIRTS | CAPS | HOODIES | JACKETS',
  businessServiceLine2: 'EMBROIDERY | DTF | DTG | CUSTOM PRINTING',
  topIssueDateLabel: 'Date',
  ribbonServices: 'T-SHIRTS | CAPS | HOODIES | JACKETS | DTF / DTG | EMBROIDERY | CUSTOM PRINTS',
  serviceBannerText: 'CUSTOM APPAREL\nFOR YOUR\nBRAND & BUSINESS',
  businessSocialHandle: '',
  qrPaymentProvider: 'PhonePe',
  qrScanText: 'Scan & Pay',
  qrScanSubtext: 'Pay with any UPI App',
  invoiceSubtitle: '',
  invoiceNumberLabel: 'Bill No.',
  paymentDetailsLabel: 'Payment Details',
  subtotalLabel: 'Sub Total',
  taxLabel: 'GST (18%)',
  totalLabel: 'Total Amount',
  amountPaidLabel: 'Amount paid:',
  dueAmountLabel: 'Due amount:',
  businessGstinLabel: 'GSTIN',
  customerGstinLabel: 'GSTIN',
  customerNameLabel: 'Name',
  customerCompanyLabel: 'Company Name',
  customerAddressLabel: 'Address',
  customerPhoneLabel: 'Phone',
  customerEmailLabel: 'Email',
  businessNameLabel: 'Name',
  businessAddressLabel: 'Address',
  businessPhoneLabel: 'Phone',
  businessEmailLabel: 'Email',
  websiteLabel: 'Website',
  panLabel: 'PAN',
  accountNumberLabel: 'A/C',
  ifscLabel: 'IFSC',
  upiLabel: 'UPI',
  logoWidth: 64,
  logoPosition: 'left',
  paperBackground: '#ffffff',
  paperPattern: 'plain',
  backgroundImageDataUrl: '',
  backgroundImageOpacity: 24,
  backgroundImageFit: 'cover',
  showWatermark: false,
  watermarkText: 'SPYRIX',
  watermarkOpacity: 7,
  fontSize: 10,
  frameStyle: 'thin',
  headerStyle: 'line',
  tableStyle: 'clean',
  tableDensity: 'normal',
  businessName: '',
  businessAddress: '',
  businessPhone: '',
  businessEmail: '',
  businessWebsite: '',
  businessGstin: '',
  businessPan: '',
  businessBankName: '',
  businessAccountNumber: '',
  businessIfsc: '',
  businessServices: 'T-SHIRTS | CAPS | HOODIES | JACKETS | EMBROIDERY | DTF / DTG | CUSTOM PRINTS',
  documentLabel: 'S. No.',
  issueDateLabel: 'Invoice Date',
  dueDateLabel: 'Due Date',
  purchaseOrderLabel: 'PO No.',
  referenceLabel: 'Reference',
  billToLabel: 'BILL TO',
  billFromLabel: 'BILL BY',
  paymentDetailsLabel: 'Payment Details',
  thankYouText: 'Thank You!',
  trustText: 'FOR YOUR TRUST',
  paymentStatusText: 'PAYMENT STATUS: UNPAID',
  showPaymentStatusSummary: false,
  amountPaidLabel: 'Amount paid',
  dueAmountLabel: 'Due amount',
  upiId: '',
  pageSize: 'A4',
  pageOrientation: 'portrait',
  layoutDensity: 'comfortable',
  borderStyle: 'solid',
  headingAlignment: 'left',
  showBusinessServices: true,
};

export function loadInvoiceDesign() {
  try {
    const hasSavedDesign = Boolean(localStorage.getItem('spyrix_invoice_design') || localStorage.getItem('spyrix_invoice_template'));
    const stored = JSON.parse(localStorage.getItem('spyrix_invoice_design') || '{}');
    const savedTemplateId = stored.templateId || localStorage.getItem('spyrix_invoice_template') || 'xenmark';
    const selected = invoiceTemplates.find(item => item.id === savedTemplateId);
    // The retired 19-template collection is no longer selectable. Keep the original Xenmark
    // as the safe active design for browser sessions that still reference those old IDs.
    const retiredTemplate = Boolean(savedTemplateId && !selected);
    const templateId = retiredTemplate ? 'xenmark' : savedTemplateId;
    const merged = {
      ...defaultInvoiceDesign,
      ...(selected ? { accentColor: selected.color, fontFamily: selected.font } : {}),
      ...stored,
      ...(retiredTemplate ? { templateId: 'xenmark', accentColor: '#85172d', fontFamily: 'Arial', customTemplateId: '', textOverrides: {} } : {}),
      ...(!hasSavedDesign ? { templateId: 'xenmark', accentColor: '#85172d', fontFamily: 'Arial' } : {}),
    };

    // One-time refresh of the old built-in Xenmark layout so existing browsers receive
    // the new reference-matched defaults without losing their logo, QR, signature or business data.
    if (templateId === 'xenmark' && Number(stored.xenmarkRevision || 0) < 5) {
      const refreshed = {
        ...merged,
        xenmarkRevision: 5,
        accentColor: '#85172d',
        fontFamily: 'Arial',
        invoiceTitle: 'INVOICE',
        topIssueDateLabel: 'Date',
        invoiceNumberLabel: 'Bill No.',
        issueDateLabel: 'Invoice Date',
        dueDateLabel: 'Due Date',
        purchaseOrderLabel: 'PO No.',
        referenceLabel: 'Reference',
        billToLabel: 'BILL TO',
        billFromLabel: 'BILL BY',
        documentLabel: 'S. No.',
        itemLabel: 'Description',
        quantityLabel: 'Pieces',
        rateLabel: 'Rate (₹)',
        amountLabel: 'Amount (₹)',
        subtotalLabel: 'Sub Total',
        discountLabel: 'Discount',
        taxLabel: 'GST (18%)',
        totalLabel: 'Total Amount',
        paymentDetailsLabel: 'Payment Details',
        paymentInstructionsLabel: 'Payment Instructions',
        paymentStatusText: 'PAYMENT STATUS: UNPAID',
  showPaymentStatusSummary: false,
        amountPaidLabel: 'Amount paid:',
        dueAmountLabel: 'Due amount:',
        thankYouText: 'Thank You!',
        trustText: 'FOR YOUR TRUST',
        footerText: 'GARMENTS | PRINTING | CUSTOMIZATION',
        ribbonServices: 'T-SHIRTS | CAPS | HOODIES | JACKETS | DTF / DTG | EMBROIDERY | CUSTOM PRINTS',
        serviceBannerText: 'CUSTOM APPAREL\nFOR YOUR\nBRAND & BUSINESS',
        qrPaymentProvider: 'PhonePe',
        qrScanText: 'Scan & Pay',
        qrScanSubtext: 'Pay with any UPI App',
        businessSocialHandle: merged.businessSocialHandle || '@xenmark_',
        businessName: (!merged.businessName || merged.businessName === 'X-E-N-M-A-R-K Denmark') ? 'XENMARK' : merged.businessName,
        businessAddress: merged.businessAddress || 'RAJ LAKSHMI COMPLEX, KALYANPUR, LUCKNOW.',
        businessPhone: merged.businessPhone || '+91 6387731661',
        businessWebsite: merged.businessWebsite || 'www.xenmark.in',
        businessGstin: merged.businessGstin || '09LLIPK4037P1Z',
      };
      localStorage.setItem('spyrix_invoice_design', JSON.stringify(refreshed));
      localStorage.setItem('spyrix_invoice_template', 'xenmark');
      return refreshed;
    }
    return merged;
  } catch {
    return { ...defaultInvoiceDesign };
  }
}

export function saveInvoiceDesign(next) {
  const safe = { ...defaultInvoiceDesign, ...next };
  localStorage.setItem('spyrix_invoice_design', JSON.stringify(safe));
  localStorage.setItem('spyrix_invoice_template', safe.templateId);
  return safe;
}

function flattenRasterDataUrl(dataUrl, { background = '#ffffff', maxDimension = 1600 } = {}) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      try {
        const naturalWidth = Math.max(1, image.naturalWidth || image.width || 1);
        const naturalHeight = Math.max(1, image.naturalHeight || image.height || 1);
        const ratio = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(naturalHeight * ratio));
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Could not prepare the uploaded image.');
        // A white matte prevents transparent black logo pixels from turning black in PDF/JPEG exports.
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let result = canvas.toDataURL('image/png');
        // Keep images manageable for MongoDB while keeping QR codes lossless when possible.
        if (result.length > 1_450_000) result = canvas.toDataURL('image/jpeg', 0.94);
        resolve(result);
      } catch (error) { reject(error instanceof Error ? error : new Error('Could not normalize this image.')); }
    };
    image.onerror = () => reject(new Error('This image could not be decoded. Try a PNG or JPG file saved on your device.'));
    image.src = dataUrl;
  });
}

function sanitizeUploadedSvgDataUrl(dataUrl) {
  // Convert user-provided SVG logos to a self-contained drawing before rasterizing. Remote
  // <image>, foreignObject and external CSS/font references can otherwise turn an export canvas
  // black or tainted even though the SVG was uploaded from the user's own device.
  let markup = String(dataUrl || '');
  const comma = markup.indexOf(',');
  if (comma < 0) throw new Error('The SVG logo is not a valid data URL.');
  const meta = markup.slice(0, comma);
  const payload = markup.slice(comma + 1);
  markup = /;base64/i.test(meta) ? atob(payload) : decodeURIComponent(payload);
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
  if (parsed.querySelector('parsererror') || !parsed.documentElement || parsed.documentElement.localName.toLowerCase() !== 'svg') {
    throw new Error('This SVG file could not be parsed. Export it again as SVG, PNG or JPG and retry.');
  }
  parsed.querySelectorAll('script,foreignObject,iframe,object,embed,video,audio').forEach(node => node.remove());
  // Keep embedded raster artwork inside user-supplied SVGs (common for exported logo files), but
  // remove remote image references so the invoice preview and PDF renderer remain origin-clean.
  parsed.querySelectorAll('image').forEach(node => {
    const href = String(node.getAttribute('href') || node.getAttribute('xlink:href') || '').trim();
    if (href.startsWith('#') || /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(href)) return;
    node.remove();
  });
  parsed.querySelectorAll('*').forEach(node => {
    Array.from(node.attributes || []).forEach(attribute => {
      const name = attribute.name.toLowerCase();
      const value = String(attribute.value || '').trim();
      if (name.startsWith('on')) { node.removeAttribute(attribute.name); return; }
      if (['href','xlink:href','src'].includes(name) && !value.startsWith('#') && !/^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(value)) { node.removeAttribute(attribute.name); return; }
      if (/url\(/i.test(value)) {
        const safeValue = value.replace(/url\(([^)]*)\)/gi, (whole, token) => {
          const ref = String(token || '').trim().replace(/^['"]|['"]$/g, '');
          return ref.startsWith('#') || /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(ref) ? whole : 'none';
        });
        node.setAttribute(attribute.name, safeValue);
      }
      if (name === 'style' && /@import/i.test(value)) node.removeAttribute(attribute.name);
    });
    if (String(node.tagName || '').toLowerCase() === 'style') {
      node.textContent = String(node.textContent || '').replace(/@import[^;]+;?/gi, '').replace(/url\(([^)]*)\)/gi, (whole, token) => {
        const ref = String(token || '').trim().replace(/^['"]|['"]$/g, '');
        return ref.startsWith('#') || /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(ref) ? whole : 'none';
      });
    }
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(parsed.documentElement))}`;
}

export function readImageFile(file, maxBytes = 6 * 1024 * 1024, options = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!String(file.type || '').startsWith('image/')) return reject(new Error('Please select an image file.'));
    if (file.size > maxBytes) { const limitLabel = maxBytes >= 1024 * 1024 ? `${Number((maxBytes / (1024 * 1024)).toFixed(1))} MB` : `${Math.round(maxBytes / 1024)} KB`; return reject(new Error(`Please use an image smaller than ${limitLabel}.`)); }
    const reader = new FileReader();
    reader.onload = async () => {
      let dataUrl = String(reader.result || '');
      if (!options.flattenBackground) { resolve(dataUrl); return; }
      try {
        if (/image\/svg\+xml/i.test(file.type) || /^data:image\/svg\+xml/i.test(dataUrl)) dataUrl = sanitizeUploadedSvgDataUrl(dataUrl);
        // Flatten logo and QR transparency over the invoice's white page. This keeps black/transparent
        // source pixels from producing a black tile when a browser encodes the PDF page as JPEG.
        resolve(await flattenRasterDataUrl(dataUrl, options));
      } catch (error) { reject(error instanceof Error ? error : new Error('Could not prepare this image for invoices.')); }
    };
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.readAsDataURL(file);
  });
}
