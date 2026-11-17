import { Router } from 'express';
import Business from '../models/Business.js';

const router = Router();
const clean = value => String(value ?? '').trim();
const designKeys = ['customTemplateId', 'templateId', 'accentColor', 'textColor', 'fontFamily', 'elementStyles', 'textOverrides', 'xenmarkRevision', 'showLogo', 'showQr', 'showSignature', 'showWatermark', 'watermarkText', 'watermarkOpacity', 'paperBackground', 'paperPattern', 'backgroundImageDataUrl', 'backgroundImageOpacity', 'backgroundImageFit', 'fontSize', 'frameStyle', 'headerStyle', 'tableStyle', 'tableDensity', 'showBusinessGstin', 'showCustomerGstin', 'showSku', 'showPaymentInstructions', 'showFooter', 'footerText', 'paymentInstructions', 'logoDataUrl', 'qrDataUrl', 'signatureDataUrl', 'signatureName', 'signatureTitle', 'signatureWidth', 'signatureAlignment', 'signatureCaption', 'logoWidth', 'logoZoom', 'logoOffsetX', 'logoOffsetY', 'logoPosition', 'qrWidth', 'qrPosition', 'qrCaption', 'qrInstruction', 'businessName', 'businessAddress', 'businessPhone', 'businessEmail', 'businessWebsite', 'businessGstin', 'businessPan', 'businessBankName', 'businessAccountNumber', 'businessIfsc', 'businessServices', 'businessTagline', 'businessServiceLine', 'businessServiceLine2', 'businessSocialHandle', 'ribbonServices', 'serviceBannerText', 'qrPaymentProvider', 'qrScanText', 'qrScanSubtext', 'customerNameLabel', 'customerCompanyLabel', 'customerAddressLabel', 'customerPhoneLabel', 'customerEmailLabel', 'businessNameLabel', 'businessAddressLabel', 'businessPhoneLabel', 'businessEmailLabel', 'websiteLabel', 'thankYouText', 'trustText', 'paymentStatusText', 'amountPaidLabel', 'dueAmountLabel', 'invoiceSubtitle', 'invoiceNumberLabel', 'paymentDetailsLabel', 'businessGstinLabel', 'customerGstinLabel', 'panLabel', 'accountNumberLabel', 'ifscLabel', 'upiLabel', 'upiId', 'invoiceTitle', 'documentLabel', 'issueDateLabel', 'dueDateLabel', 'referenceLabel', 'purchaseOrderLabel', 'paymentInstructionsLabel', 'skuLabel', 'pageSize', 'pageOrientation', 'headingAlignment', 'billToLabel', 'billFromLabel', 'itemLabel', 'quantityLabel', 'rateLabel', 'amountLabel', 'subtotalLabel', 'discountLabel', 'taxLabel', 'totalLabel', 'notesLabel', 'termsLabel'];

function sanitizeTextOverrides(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const result = {};
  for (const [id, value] of Object.entries(input).slice(0, 100)) {
    if (!/^generic-text-[A-Za-z0-9_-]{1,100}$/.test(id)) continue;
    if (!['string', 'number'].includes(typeof value)) continue;
    result[id] = String(value).slice(0, 2000);
  }
  return result;
}

function sanitizeElementStyles(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const allowedProperties = ['fontFamily', 'fontSize', 'color', 'fontWeight', 'fontStyle', 'textDecoration', 'textAlign', 'lineHeight', 'letterSpacing'];
  const numericLike = /^(?:\d+(?:\.\d+)?)(?:px|pt|em|rem|%)?$/i;
  const result = {};
  for (const [id, styles] of Object.entries(input).slice(0, 100)) {
    if (!/^(?:generic-text|xen-text)-[A-Za-z0-9_-]{1,100}$/.test(id) || !styles || typeof styles !== 'object' || Array.isArray(styles)) continue;
    const safe = {};
    for (const key of allowedProperties) {
      if (styles[key] === undefined || !['string', 'number'].includes(typeof styles[key])) continue;
      const value = String(styles[key]).replace(/[;{}<>]/g, '').trim().slice(0, 100);
      if (!value) continue;
      if (key === 'fontSize' && !numericLike.test(value)) continue;
      if (key === 'color' && !/^(?:#[0-9a-f]{3,8}|[a-z]{3,24})$/i.test(value)) continue;
      if (key === 'fontWeight' && !/^(?:normal|bold|[1-9]00)$/i.test(value)) continue;
      if (key === 'fontStyle' && !/^(?:normal|italic|oblique)$/i.test(value)) continue;
      if (key === 'textDecoration' && !/^(?:none|underline|line-through|overline)$/i.test(value)) continue;
      if (key === 'textAlign' && !/^(?:left|right|center|justify|start|end)$/i.test(value)) continue;
      if (['lineHeight', 'letterSpacing'].includes(key) && !/^-?(?:\d+(?:\.\d+)?)(?:px|pt|em|rem|%)?$/i.test(value)) continue;
      if (key === 'fontFamily' && /[()\\]/.test(value)) continue;
      safe[key] = value;
    }
    if (Object.keys(safe).length) result[id] = safe;
  }
  return result;
}

function sanitizeDesign(input = {}) {
  const output = {};
  for (const key of designKeys) {
    if (input[key] === undefined) continue;
    if (key === 'elementStyles') { output[key] = sanitizeElementStyles(input[key]); continue; }
    if (key === 'textOverrides') { output[key] = sanitizeTextOverrides(input[key]); continue; }
    if (['showLogo', 'showQr', 'showSignature', 'showWatermark', 'showBusinessGstin', 'showCustomerGstin', 'showSku', 'showPaymentInstructions', 'showFooter'].includes(key)) output[key] = Boolean(input[key]);
    else if (['watermarkOpacity', 'backgroundImageOpacity', 'fontSize', 'signatureWidth', 'logoWidth', 'qrWidth'].includes(key)) output[key] = Math.max(0, Math.min(key === 'watermarkOpacity' ? 30 : key === 'backgroundImageOpacity' ? 100 : 300, Number(input[key]) || 0));
    else if (['logoZoom'].includes(key)) output[key] = Math.max(0.45, Math.min(2.5, Number(input[key]) || 1));
    else if (['logoOffsetX'].includes(key)) output[key] = Math.max(-160, Math.min(160, Number(input[key]) || 0));
    else if (['logoOffsetY'].includes(key)) output[key] = Math.max(-100, Math.min(100, Number(input[key]) || 0));
    else output[key] = String(input[key] ?? '').slice(0, key.endsWith('DataUrl') ? 1_250_000 : 4000);
  }
  return output;
}

router.get('/settings', async (req, res, next) => {
  try {
    const business = await Business.findById(req.auth.businessId).select('-ownerId').lean();
    if (!business) return res.status(404).json({ message: 'Business workspace not found.' });
    res.json({ business });
  } catch (error) { next(error); }
});

router.put('/settings', async (req, res, next) => {
  try {
    if (!['Owner', 'Admin'].includes(req.auth.role)) return res.status(403).json({ message: 'Only a workspace owner or admin can change business settings.' });
    const body = req.body || {};
    const allowed = ['name', 'address', 'phone', 'email', 'website', 'gstin', 'state', 'stateCode', 'postalCode', 'country', 'invoicePrefix'];
    const update = Object.fromEntries(allowed.filter(key => body[key] !== undefined).map(key => [key, key === 'email' ? clean(body[key]).toLowerCase() : key === 'gstin' ? clean(body[key]).toUpperCase() : clean(body[key])]));
    if (body.theme !== undefined) {
      const canonicalThemes = ['mono', 'red', 'neon-yellow', 'neon-green', 'ocean', 'neon-red', 'chili-spice', 'neon-blue-black', 'violet'];
      const aliases = { orange: 'chili-spice', 'neon-purple': 'violet', purple: 'violet', burgundy: 'red', blue: 'ocean' };
      const requestedTheme = clean(body.theme).toLowerCase();
      const theme = aliases[requestedTheme] || requestedTheme;
      if (!canonicalThemes.includes(theme)) return res.status(400).json({ message: 'Select a valid SPYRIX workspace theme.' });
      update.theme = theme;
    }
    if (body.invoiceDesign !== undefined) update.invoiceDesign = sanitizeDesign(body.invoiceDesign);
    const business = await Business.findByIdAndUpdate(req.auth.businessId, update, { new: true, runValidators: true }).select('-ownerId').lean();
    if (!business) return res.status(404).json({ message: 'Business workspace not found.' });
    res.json({ business, source: 'mongodb' });
  } catch (error) { next(error); }
});

export default router;
