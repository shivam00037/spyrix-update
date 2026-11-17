const EXPORT_SCALE = 3;
const A4 = { portrait: { widthPt: 595.276, heightPt: 841.89, widthPx: 2480, heightPx: 3508 }, landscape: { widthPt: 841.89, heightPt: 595.276, widthPx: 3508, heightPx: 2480 } };

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function computedStyleToInline(source, target, view = source.ownerDocument?.defaultView || window) {
  if (source.nodeType === Node.ELEMENT_NODE && target.nodeType === Node.ELEMENT_NODE) {
    const style = view.getComputedStyle(source);
    for (let i = 0; i < style.length; i += 1) {
      const property = style.item(i);
      try { target.style.setProperty(property, style.getPropertyValue(property), style.getPropertyPriority(property)); } catch { /* unsupported computed CSS property */ }
    }
    target.removeAttribute('contenteditable');
    target.removeAttribute('data-selected-editor');
    target.removeAttribute('title');
    target.style.setProperty('animation', 'none', 'important');
    target.style.setProperty('transition', 'none', 'important');
    target.style.setProperty('caret-color', 'transparent', 'important');
  }
  const srcChildren = Array.from(source.childNodes || []);
  const dstChildren = Array.from(target.childNodes || []).filter(child => !(child.nodeType === Node.ELEMENT_NODE && child.hasAttribute('data-export-pseudo')));
  srcChildren.forEach((child, index) => { if (dstChildren[index]) computedStyleToInline(child, dstChildren[index], view); });
}

function appendComputedPseudoElements(source, clone, view) {
  if (!source || !clone || source.nodeType !== Node.ELEMENT_NODE || clone.nodeType !== Node.ELEMENT_NODE) return;
  const sourceChildren = Array.from(source.childNodes || []);
  const cloneChildren = Array.from(clone.childNodes || []).filter(child => !(child.nodeType === Node.ELEMENT_NODE && child.hasAttribute('data-export-pseudo')));
  sourceChildren.forEach((child, index) => { if (cloneChildren[index]) appendComputedPseudoElements(child, cloneChildren[index], view); });
  for (const pseudo of ['::before', '::after']) {
    let pseudoStyle;
    try { pseudoStyle = view.getComputedStyle(source, pseudo); } catch { continue; }
    const content = String(pseudoStyle.content || '').trim();
    if (!content || ['none', 'normal', 'normal normal'].includes(content) || pseudoStyle.display === 'none' || pseudoStyle.visibility === 'hidden' || Number(pseudoStyle.opacity) === 0 || /^url\(/i.test(content)) continue;
    const span = source.ownerDocument.createElement('span');
    span.setAttribute('data-export-pseudo', pseudo.slice(2));
    span.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < pseudoStyle.length; i += 1) {
      const property = pseudoStyle.item(i);
      if (property === 'content' || property === 'animation' || property === 'transition' || property === 'caret-color') continue;
      try { span.style.setProperty(property, pseudoStyle.getPropertyValue(property), pseudoStyle.getPropertyPriority(property)); } catch { /* ignore CSS properties unsupported by inline style */ }
    }
    if (/^(["']).*\1$/.test(content)) span.textContent = content.slice(1, -1).replace(/\\([\\"'])/g, '$1');
    if (pseudo === '::before') clone.insertBefore(span, clone.firstChild); else clone.appendChild(span);
  }
}

const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const SAFE_EXPORT_NS = 'http://www.w3.org/1999/xhtml';

function fromBlobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Could not read image asset.'));
    reader.readAsDataURL(blob);
  });
}

function decodeDataUrl(dataUrl) {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return '';
  const metadata = dataUrl.slice(5, comma);
  const payload = dataUrl.slice(comma + 1);
  if (/;base64/i.test(metadata)) {
    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  try { return decodeURIComponent(payload); } catch { return payload; }
}

function encodeSvgDataUrl(markup) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

function sanitizeSvgMarkup(markup) {
  // Uploaded SVGs can themselves contain remote <image>, CSS url(), scripts or foreignObject
  // elements. Those nested resources can taint a canvas even when the outer src is a data URL.
  try {
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    if (parsed.querySelector('parsererror')) throw new Error('Invalid SVG');
    parsed.querySelectorAll('script,foreignObject,iframe,object,embed,audio,video').forEach(node => node.remove());
    parsed.querySelectorAll('*').forEach(node => {
      Array.from(node.attributes || []).forEach(attribute => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value || '';
        if (name.startsWith('on')) { node.removeAttribute(attribute.name); return; }
        if (['href', 'xlink:href', 'src'].includes(name)) {
          const trimmed = value.trim();
          const internal = trimmed.startsWith('#');
          const rasterData = /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(trimmed);
          if (!internal && !rasterData) node.removeAttribute(attribute.name);
          return;
        }
        if (/url\(/i.test(value)) {
          const safeValue = value.replace(/url\(([^)]*)\)/gi, (whole, token) => {
            const href = token.trim().replace(/^['"]|['"]$/g, '');
            return href.startsWith('#') || /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(href) ? whole : 'none';
          });
          node.setAttribute(attribute.name, safeValue);
        }
      });
      if (node.tagName?.toLowerCase() === 'style') {
        node.textContent = String(node.textContent || '').replace(/@import[^;]+;?/gi, '').replace(/url\(([^)]*)\)/gi, (whole, token) => {
          const href = token.trim().replace(/^['"]|['"]$/g, '');
          return href.startsWith('#') || /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(href) ? whole : 'none';
        });
      }
    });
    return new XMLSerializer().serializeToString(parsed.documentElement);
  } catch {
    return String(markup)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject\s*>/gi, '')
      .replace(/\s(?:on[a-z]+)\s*=\s*(['"]).*?\1/gi, '')
      .replace(/\s(?:href|xlink:href|src)\s*=\s*(['"])(?!#|data:image\/(?:png|jpe?g|gif|webp|avif);base64,)[\s\S]*?\1/gi, '')
      .replace(/url\((?!\s*['"]?#)[^)]*\)/gi, 'none');
  }
}

function sanitizeSvgDataUrl(dataUrl) {
  const svgMarkup = decodeDataUrl(dataUrl);
  if (!svgMarkup || !/<svg[\s>]/i.test(svgMarkup)) return dataUrl;
  return encodeSvgDataUrl(sanitizeSvgMarkup(svgMarkup));
}

const assetCache = new Map();
async function assetAsSafeDataUrl(sourceUrl) {
  if (!sourceUrl || sourceUrl.startsWith('#')) return null;
  if (assetCache.has(sourceUrl)) return assetCache.get(sourceUrl);
  const task = (async () => {
    if (/^data:image\//i.test(sourceUrl)) {
      return /^data:image\/svg\+xml/i.test(sourceUrl) ? sanitizeSvgDataUrl(sourceUrl) : sourceUrl;
    }
    try {
      const resolved = new URL(sourceUrl, document.baseURI);
      if (!['http:', 'https:', 'blob:'].includes(resolved.protocol)) return null;
      // Never use a no-CORS opaque response as an export source. If a remote asset does not
      // permit CORS, it will be replaced with a local placeholder instead of tainting the canvas.
      const response = await fetch(resolved.href, {
        mode: 'cors',
        credentials: resolved.origin === window.location.origin ? 'same-origin' : 'omit',
        cache: 'force-cache',
      });
      if (!response.ok || response.type === 'opaque') return null;
      const blob = await response.blob();
      if (!/^image\//i.test(blob.type || '')) return null;
      const dataUrl = await fromBlobToDataUrl(blob);
      return /^image\/svg\+xml/i.test(blob.type || '') || /^data:image\/svg\+xml/i.test(dataUrl)
        ? sanitizeSvgDataUrl(dataUrl)
        : dataUrl;
    } catch {
      return null;
    }
  })();
  assetCache.set(sourceUrl, task);
  const result = await task;
  assetCache.set(sourceUrl, result);
  return result;
}


const flattenedExportAssetCache = new Map();
function isTransparentCssColor(value) {
  const color = String(value || '').trim().toLowerCase();
  if (!color || color === 'transparent') return true;
  const rgba = color.match(/^rgba\([^)]*,\s*([\d.]+)\s*\)$/i);
  return Boolean(rgba && Number(rgba[1]) <= 0.01);
}
function nearestImageMatte(sourceImage, root, view) {
  let current = sourceImage?.parentElement;
  while (current) {
    const background = view.getComputedStyle(current).backgroundColor;
    if (!isTransparentCssColor(background)) return background;
    if (current === root) break;
    current = current.parentElement;
  }
  const rootBackground = root ? view.getComputedStyle(root).backgroundColor : '';
  return !isTransparentCssColor(rootBackground) ? rootBackground : '#ffffff';
}
function waitForDecodedImage(image, timeout = 5000) {
  if (!image) return Promise.reject(new Error('No image was provided.'));
  const decoded = typeof image.decode === 'function'
    ? image.decode().catch(() => undefined)
    : new Promise(resolve => {
      if (image.complete) return resolve();
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  return Promise.race([decoded, wait(timeout)]).then(() => {
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Image did not decode.');
    return image;
  });
}
async function flattenImageDataUrlForExport(dataUrl, matte = '#ffffff') {
  const key = `${matte}|${dataUrl}`;
  if (flattenedExportAssetCache.has(key)) return flattenedExportAssetCache.get(key);
  const task = (async () => {
    const image = new Image();
    image.decoding = 'async';
    image.src = dataUrl;
    await waitForDecodedImage(image);
    const width = Math.max(1, image.naturalWidth || image.width || 1);
    const height = Math.max(1, image.naturalHeight || image.height || 1);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not prepare an invoice image for export.');
    context.fillStyle = matte || '#ffffff';
    context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);
    context.getImageData(0, 0, 1, 1);
    return canvas.toDataURL('image/png');
  })().catch(() => dataUrl);
  flattenedExportAssetCache.set(key, task);
  const result = await task;
  flattenedExportAssetCache.set(key, result);
  return result;
}

function extractCssUrl(token) {
  return String(token || '').trim().replace(/^['"]|['"]$/g, '');
}

function sanitizeInlineSvgReferences(root, safeMode = false) {
  let skipped = 0;
  root.querySelectorAll('svg').forEach(svgRoot => {
    const svgNodes = [svgRoot, ...svgRoot.querySelectorAll('*')];
    svgNodes.forEach(node => {
      const tag = String(node.tagName || '').toLowerCase();
      if (safeMode && tag === 'foreignobject') {
        node.remove(); skipped += 1; return;
      }
      Array.from(node.attributes || []).forEach(attribute => {
        const name = attribute.name.toLowerCase();
        const value = String(attribute.value || '').trim();
        if (name.startsWith('on')) { node.removeAttribute(attribute.name); return; }
        if (['href', 'xlink:href', 'src'].includes(name)) {
          const allowedFragment = value.startsWith('#');
          const allowedRaster = /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(value) || /^data:image\/svg\+xml(?:;|,)/i.test(value);
          if (!allowedFragment && !(tag === 'image' && allowedRaster)) {
            node.removeAttribute(attribute.name); skipped += 1;
          }
          return;
        }
        if (/url\(/i.test(value)) {
          const safeValue = value.replace(/url\(([^)]*)\)/gi, (full, token) => {
            const href = extractCssUrl(token);
            return href.startsWith('#') || /^data:image\//i.test(href) ? full : 'none';
          });
          if (safeValue !== value) skipped += 1;
          node.setAttribute(attribute.name, safeValue);
        }
      });
    });
    svgRoot.querySelectorAll('style').forEach(styleNode => {
      const text = String(styleNode.textContent || '').replace(/@import[^;]+;?/gi, '').replace(/url\(([^)]*)\)/gi, (full, token) => {
        const href = extractCssUrl(token);
        if (href.startsWith('#') || /^data:image\//i.test(href)) return full;
        skipped += 1; return 'none';
      });
      styleNode.textContent = text;
    });
  });
  return skipped;
}

async function sanitizeCssUrls(source, clone, cache, safeMode = false) {
  if (!source || !clone || source.nodeType !== Node.ELEMENT_NODE || clone.nodeType !== Node.ELEMENT_NODE) return 0;
  let skipped = 0;
  for (let index = 0; index < clone.style.length; index += 1) {
    const property = clone.style.item(index);
    const value = clone.style.getPropertyValue(property);
    if (!/url\(/i.test(value)) continue;
    if (safeMode) {
      const sanitized = value.replace(/url\(([^)]*)\)/gi, (full, token) => {
        const href = extractCssUrl(token);
        if (href.startsWith('#') || /^data:image\//i.test(href)) return full;
        skipped += 1;
        return 'none';
      });
      clone.style.setProperty(property, sanitized, 'important');
      continue;
    }
    let sanitized = value;
    const matches = [...value.matchAll(/url\(([^)]*)\)/gi)];
    for (const match of matches) {
      const full = match[0];
      const href = extractCssUrl(match[1]);
      if (href.startsWith('#')) continue;
      const safeUrl = await assetAsSafeDataUrl(href);
      if (safeUrl) sanitized = sanitized.replace(full, `url("${safeUrl}")`);
      else {
        sanitized = sanitized.replace(full, `url("${TRANSPARENT_PIXEL}")`);
        skipped += 1;
      }
    }
    clone.style.setProperty(property, sanitized, clone.style.getPropertyPriority(property) || 'important');
  }
  const sourceChildren = Array.from(source.children || []);
  const cloneChildren = Array.from(clone.children || []).filter(child => !child.hasAttribute('data-export-pseudo'));
  for (let index = 0; index < Math.min(sourceChildren.length, cloneChildren.length); index += 1) {
    skipped += await sanitizeCssUrls(sourceChildren[index], cloneChildren[index], cache, safeMode);
  }
  return skipped;
}

function exportPlaceholder(altText = 'Image') {
  const label = String(altText || 'Image').replace(/[<>&"']/g, '').slice(0, 26) || 'Image';
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="90" viewBox="0 0 180 90"><rect x="1" y="1" width="178" height="88" rx="7" fill="#f7f7f7" stroke="#d1d5db" stroke-dasharray="4 3"/><path d="M68 38l12-12 15 17 8-8 13 14H64z" fill="#c7cbd1"/><circle cx="106" cy="29" r="5" fill="#c7cbd1"/><text x="90" y="67" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#737984">${label}</text></svg>`;
  return encodeSvgDataUrl(markup);
}

async function inlineImages(source, clone, safeMode = false) {
  let skipped = 0;
  // Remove responsive <source> candidates: a <picture> source's remote srcset can override
  // the safe, inlined <img src> and taint the canvas even after the img itself was sanitized.
  clone.querySelectorAll('picture source, source, track').forEach(node => node.remove());
  clone.querySelectorAll('picture').forEach(node => {
    const image = node.querySelector('img');
    if (image) node.replaceWith(image);
    else node.remove();
  });
  const originalImages = Array.from(source.querySelectorAll('img'));
  const clonedImages = Array.from(clone.querySelectorAll('img'));
  await Promise.all(clonedImages.map(async (image, index) => {
    const original = originalImages[index];
    const src = original?.currentSrc || original?.getAttribute('src') || image.getAttribute('src') || '';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.removeAttribute('crossorigin');
    if (!src) { image.src = exportPlaceholder(image.alt); skipped += 1; return; }
    // Local assets (including uploaded logo and QR data URLs) stay visible in both modes.
    // Only use a placeholder after the same-origin/CORS-safe inlining attempt actually fails.
    const dataUrl = await assetAsSafeDataUrl(src);
    if (dataUrl) {
      try {
        // Re-rasterize each uploaded/local image against the same opaque background it uses in
        // the invoice. This removes alpha-black artifacts from PNG/JPEG PDF encoders while
        // preserving the logo/QR's actual placement and CSS object-fit/transform.
        const matte = nearestImageMatte(original || image, source, source.ownerDocument?.defaultView || window);
        image.src = await flattenImageDataUrlForExport(dataUrl, matte);
        await waitForDecodedImage(image);
      } catch {
        image.src = exportPlaceholder(image.alt);
        skipped += 1;
      }
    } else { image.src = exportPlaceholder(image.alt); skipped += 1; }
  }));

  const sourceSvgImages = Array.from(source.querySelectorAll('svg image'));
  const cloneSvgImages = Array.from(clone.querySelectorAll('svg image'));
  await Promise.all(cloneSvgImages.map(async (node, index) => {
    const original = sourceSvgImages[index];
    const attr = original?.getAttribute('href') || original?.getAttribute('xlink:href') || node.getAttribute('href') || node.getAttribute('xlink:href') || '';
    if (!attr || attr.startsWith('#')) return;
    const safeUrl = await assetAsSafeDataUrl(attr);
    if (safeUrl) { node.setAttribute('href', safeUrl); node.removeAttribute('xlink:href'); }
    else { node.removeAttribute('href'); node.removeAttribute('xlink:href'); skipped += 1; }
  }));
  return skipped;
}

function wait(milliseconds) { return new Promise(resolve => window.setTimeout(resolve, milliseconds)); }

async function waitForExportFrame(doc, stylesheetPromises = []) {
  await Promise.race([Promise.allSettled(stylesheetPromises), wait(2200)]);
  try { await Promise.race([doc.fonts?.ready || Promise.resolve(), wait(900)]); } catch { /* font fallback is acceptable */ }
  const imagePromises = Array.from(doc.images || []).map(image => {
    if (image.complete) return Promise.resolve();
    return new Promise(resolve => {
      const finish = () => resolve();
      image.addEventListener('load', finish, { once: true });
      image.addEventListener('error', finish, { once: true });
      window.setTimeout(finish, 1600);
    });
  });
  await Promise.race([Promise.allSettled(imagePromises), wait(1800)]);
  const view = doc.defaultView;
  if (view?.requestAnimationFrame) {
    await new Promise(resolve => view.requestAnimationFrame(() => view.requestAnimationFrame(resolve)));
  }
}

function addPseudoCssSafety(clone, safeMode = false) {
  clone.querySelectorAll('[data-export-pseudo]').forEach(node => {
    if (!node.style) return;
    for (const property of Array.from(node.style)) {
      const value = node.style.getPropertyValue(property);
      if (!/url\(/i.test(value)) continue;
      if (safeMode) node.style.setProperty(property, value.replace(/url\([^)]*\)/gi, 'none'), 'important');
      else node.style.setProperty(property, value.replace(/url\(([^)]*)\)/gi, (whole, token) => {
        const href = extractCssUrl(token);
        return href.startsWith('#') || /^data:image\//i.test(href) ? whole : 'none';
      }), 'important');
    }
  });
}


function sampledCanvasStats(canvas, rect = null, sampleWidth = 96, sampleHeight = 128) {
  const sample = document.createElement('canvas');
  sample.width = sampleWidth;
  sample.height = sampleHeight;
  const context = sample.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!context) return null;
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, sampleWidth, sampleHeight);
  try {
    if (rect) context.drawImage(canvas, rect.x, rect.y, rect.width, rect.height, 0, 0, sampleWidth, sampleHeight);
    else context.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, sampleWidth, sampleHeight);
    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
    let totalLuma = 0, nonWhite = 0, dark = 0, sum = 0, sumSq = 0;
    const pixels = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const luma = .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2];
      totalLuma += luma;
      sum += luma; sumSq += luma * luma;
      if (Math.min(data[i], data[i + 1], data[i + 2]) < 238) nonWhite += 1;
      if (luma < 40) dark += 1;
    }
    const average = totalLuma / pixels;
    return { average, nonWhiteRatio: nonWhite / pixels, darkRatio: dark / pixels, variance: Math.max(0, sumSq / pixels - (sum / pixels) ** 2) };
  } catch { return null; }
}
function assertInvoiceCanvasIsVisible(canvas, element) {
  const isXenmark = element.classList?.contains('template-xenmark');
  if (!isXenmark) return;
  const stats = sampledCanvasStats(canvas);
  if (stats && (stats.average < 48 || stats.variance < 3.5 || stats.nonWhiteRatio < 0.004)) {
    const error = new Error('The invoice renderer produced a blank or near-black image instead of the invoice. The original preview will be offered through browser printing so its layout and uploaded images are preserved.');
    error.name = 'InvoiceExportVisualError';
    throw error;
  }

  // Validate uploaded/data-backed logos and QR images individually. A PDF with the correct page
  // dimensions but an omitted company logo is not considered a successful export.
  const rootRect = element.getBoundingClientRect();
  const rootWidth = Math.max(1, rootRect.width);
  const rootHeight = Math.max(1, rootRect.height);
  for (const image of Array.from(element.querySelectorAll('img'))) {
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) continue;
    const sourceUrl = image.currentSrc || image.getAttribute('src') || '';
    if (!/^data:image\//i.test(sourceUrl)) continue;
    const sourceStatsCanvas = document.createElement('canvas');
    sourceStatsCanvas.width = 48; sourceStatsCanvas.height = 48;
    const sourceContext = sourceStatsCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!sourceContext) continue;
    sourceContext.fillStyle = '#ffffff'; sourceContext.fillRect(0, 0, 48, 48);
    try { sourceContext.drawImage(image, 0, 0, 48, 48); } catch { continue; }
    const originalStats = sampledCanvasStats(sourceStatsCanvas, null, 48, 48);
    if (!originalStats || originalStats.nonWhiteRatio < 0.035) continue;
    const regionElement = image.closest('.xen-upload-target') || image;
    const rect = regionElement.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) continue;
    const mapped = {
      x: Math.max(0, (rect.left - rootRect.left) / rootWidth * canvas.width),
      y: Math.max(0, (rect.top - rootRect.top) / rootHeight * canvas.height),
      width: Math.min(canvas.width, rect.width / rootWidth * canvas.width),
      height: Math.min(canvas.height, rect.height / rootHeight * canvas.height),
    };
    if (mapped.width < 2 || mapped.height < 2) continue;
    const renderedStats = sampledCanvasStats(canvas, mapped, 48, 48);
    if (renderedStats && renderedStats.nonWhiteRatio < 0.008) {
      const error = new Error(`The uploaded image “${image.alt || 'invoice image'}” was not visible in the export canvas. The actual invoice will be opened in the browser print dialog instead.`);
      error.name = 'InvoiceExportVisualError';
      throw error;
    }
  }
}

async function createExportSvg(element, { safeMode = false } = {}) {
  if (!element) throw new Error('Invoice preview was not found. Open the invoice preview and try again.');

  // Export the actual invoice node that the user is editing. The old implementation rebuilt the
  // document inside a fixed-width iframe, which re-ran responsive layout rules and could move
  // columns, change table sizing, or lose an uploaded image. A direct clone with computed styles
  // keeps the exact live invoice design and strips only editor-only controls.
  const view = element.ownerDocument?.defaultView || window;
  const isXenmarkSheet = element.classList?.contains('template-xenmark');
  const sheetOrientation = element.classList?.contains('is-landscape') ? 'landscape' : 'portrait';
  const sourceStyle = view.getComputedStyle(element);
  const zoom = Math.max(0.1, Number.parseFloat(sourceStyle.zoom) || 1);
  const rect = element.getBoundingClientRect();
  const parseCssPx = value => {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  };
  // Computed width is in CSS pixels, while the visible rectangle also reflects CSS zoom. Prefer
  // the computed value, then use the visual rect divided by zoom as the fallback.
  let width = Math.round(parseCssPx(sourceStyle.width) || ((element.offsetWidth || rect.width) / zoom));
  width = Math.max(300, Math.min(2400, width));
  let height = Math.round(parseCssPx(sourceStyle.height) || ((element.offsetHeight || rect.height) / zoom));
  if (isXenmarkSheet) {
    // XENMARK is designed as one A4 sheet; enforce the paper aspect ratio without changing its
    // internal elements, typography, spacing, or uploaded images.
    height = Math.round(width * (sheetOrientation === 'landscape' ? 210 / 297 : 297 / 210));
  } else {
    height = Math.max(400, Math.min(16000, height || 1000));
  }

  const clone = element.cloneNode(true);
  clone.setAttribute('xmlns', SAFE_EXPORT_NS);
  computedStyleToInline(element, clone, view);
  appendComputedPseudoElements(element, clone, view);

  // Remove the editor selection ring from the export, but leave the actual text/style state alone.
  const selectedId = element.getAttribute('data-selected-editor');
  clone.removeAttribute('data-selected-editor');
  if (selectedId) {
    clone.querySelectorAll('[data-editor-id]').forEach(node => {
      if (node.getAttribute('data-editor-id') !== selectedId) return;
      node.style.setProperty('outline', 'none', 'important');
      node.style.setProperty('box-shadow', 'none', 'important');
      node.style.setProperty('outline-offset', '0', 'important');
    });
  }
  // Make paper geometry explicit. All interior computed styles are retained from the selected
  // invoice, not recomputed against a different viewport as the user experienced before.
  clone.style.setProperty('position', 'relative', 'important');
  clone.style.setProperty('left', 'auto', 'important');
  clone.style.setProperty('top', 'auto', 'important');
  clone.style.setProperty('right', 'auto', 'important');
  clone.style.setProperty('bottom', 'auto', 'important');
  clone.style.setProperty('zoom', '1', 'important');
  clone.style.setProperty('transform', 'none', 'important');
  clone.style.setProperty('width', `${width}px`, 'important');
  clone.style.setProperty('min-width', `${width}px`, 'important');
  clone.style.setProperty('max-width', 'none', 'important');
  clone.style.setProperty('height', `${height}px`, 'important');
  clone.style.setProperty('min-height', `${height}px`, 'important');
  clone.style.setProperty('max-height', `${height}px`, 'important');
  clone.style.setProperty('aspect-ratio', 'auto', 'important');
  clone.style.setProperty('box-sizing', 'border-box', 'important');
  clone.style.setProperty('overflow', isXenmarkSheet ? 'hidden' : 'visible', 'important');
  clone.style.setProperty('margin', '0', 'important');
  clone.style.setProperty('border-radius', '0', 'important');
  clone.style.setProperty('box-shadow', 'none', 'important');
  clone.style.setProperty('outline', 'none', 'important');
  clone.style.setProperty('print-color-adjust', 'exact', 'important');
  clone.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');

  // Inline image and background URLs before serializing. User-uploaded data URLs are kept in the
  // export; unsafe remote URLs are replaced only when they cannot be fetched with CORS permission.
  let skippedAssets = await inlineImages(element, clone, safeMode);

  // Convert canvases only after pairing original and cloned <img> nodes so logo/QR sources cannot
  // shift to the wrong image when uploads are serialized. This also preserves canvas-based QR or
  // annotation art when it is origin-clean.
  const originalCanvases = Array.from(element.querySelectorAll('canvas'));
  const cloneCanvases = Array.from(clone.querySelectorAll('canvas'));
  originalCanvases.forEach((sourceCanvas, index) => {
    const targetCanvas = cloneCanvases[index];
    if (!targetCanvas) return;
    try {
      const image = element.ownerDocument.createElement('img');
      image.src = sourceCanvas.toDataURL('image/png');
      image.alt = sourceCanvas.getAttribute('aria-label') || 'Invoice graphic';
      const computed = view.getComputedStyle(sourceCanvas);
      for (let i = 0; i < computed.length; i += 1) {
        const property = computed.item(i);
        try { image.style.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property)); } catch { /* unsupported CSS property */ }
      }
      targetCanvas.replaceWith(image);
    } catch {
      const replacement = element.ownerDocument.createElement('span');
      replacement.style.cssText = targetCanvas.getAttribute('style') || '';
      targetCanvas.replaceWith(replacement);
    }
  });
  skippedAssets += await sanitizeCssUrls(element, clone, assetCache, safeMode);
  addPseudoCssSafety(clone, safeMode);
  skippedAssets += sanitizeInlineSvgReferences(clone, safeMode);

  // Remove editor-only controls only after source/clone image and style trees have been paired.
  // The uploaded images and the invoice's visual layout are retained in the final document.
  clone.querySelectorAll('[data-editor-only],.ic-editor-only,.xen-upload-empty,.xen-upload-chip,.ic-logo-placeholder,style[data-invoice-editor-style]').forEach(node => node.remove());
  clone.querySelectorAll('[contenteditable]').forEach(node => {
    node.removeAttribute('contenteditable');
    node.removeAttribute('spellcheck');
    node.style.setProperty('outline', 'none', 'important');
    node.style.setProperty('caret-color', 'transparent', 'important');
  });
  clone.querySelectorAll('input,textarea,select,button').forEach(node => node.remove());
  clone.querySelectorAll('picture source,source,track,iframe,object,embed,video,audio,link[rel="stylesheet"]').forEach(node => node.remove());
  // Never leave a non-data remote reference that could taint the canvas after SVG decoding.
  clone.querySelectorAll('*').forEach(node => {
    Array.from(node.attributes || []).forEach(attribute => {
      const name = attribute.name.toLowerCase();
      const value = String(attribute.value || '').trim();
      if (name.startsWith('on') || ['srcset','sizes','poster','background','manifest'].includes(name)) { node.removeAttribute(attribute.name); return; }
      if (['href','xlink:href','src','data'].includes(name)) {
        const safeReference = value.startsWith('#') || /^data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml)(?:;|,)/i.test(value);
        if (!safeReference) node.removeAttribute(attribute.name);
      }
    });
  });

  // A wrapper with a white matte prevents alpha in transparent logo PNGs from being interpreted
  // as black by image/PDF encoders. The source image itself remains untouched and theme-neutral.
  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/><foreignObject x="0" y="0" width="${width}" height="${height}">${serialized}</foreignObject></svg>`;
  return { svg, width, height, skippedAssets, singlePage: isXenmarkSheet, sheetOrientation };
}

function isCanvasSecurityError(error) {
  return error?.name === 'SecurityError' || /tainted canvases|taint|cross-origin|origin-clean|cannot be exported/i.test(String(error?.message || ''));
}

async function renderInvoiceCanvas(element, scale = EXPORT_SCALE, safeMode = false) {
  const { svg, width, height, skippedAssets = 0, singlePage = false, sheetOrientation = 'portrait' } = await createExportSvg(element, { safeMode });
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('The invoice preview could not be rendered for export.'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Your browser could not create an export canvas.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Readback tests canvas origin-clean before a downstream toDataURL/toBlob call is allowed.
    try { context.getImageData(0, 0, 1, 1); }
    catch (securityError) {
      if (!safeMode && isCanvasSecurityError(securityError)) return await renderInvoiceCanvas(element, scale, true);
      throw new Error('The invoice image was still blocked after the secure export retry.');
    }
    assertInvoiceCanvasIsVisible(canvas, element);
    if (skippedAssets > 0) {
      const missingAssetsError = new Error(`The export renderer could not safely include ${skippedAssets} image asset(s). The invoice will be opened in browser printing so the original design can be preserved.`);
      missingAssetsError.name = 'InvoiceExportVisualError';
      throw missingAssetsError;
    }
    canvas.__spyrixSkippedAssets = skippedAssets;
    canvas.__spyrixSafeFallback = safeMode;
    canvas.__spyrixSinglePage = singlePage;
    canvas.__spyrixSheetOrientation = sheetOrientation;
    return canvas;
  } catch (error) {
    // Some browsers reject SVG foreignObject decoding before a canvas can even be inspected.
    // Rebuild it once in safe mode, where all external and image-bearing nodes are removed.
    if (!safeMode && (isCanvasSecurityError(error) || error?.name === 'InvoiceExportVisualError' || /could not be rendered for export/i.test(String(error?.message || '')))) {
      return await renderInvoiceCanvas(element, scale, true);
    }
    throw error;
  } finally { URL.revokeObjectURL(url); }
}

function canvasBlob(canvas, type, quality = 0.96) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The browser could not encode the invoice image. Please try a lower export quality.')), type, quality));
}

function xmlEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function safeSvgColor(value, fallback = '#111111') {
  const input = String(value || '').trim();
  if (!input || input === 'transparent') return null;
  const rgba = input.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
  if (rgba) {
    const alphaRaw = rgba[4] === undefined ? 1 : (rgba[4].endsWith('%') ? Number(rgba[4].slice(0, -1)) / 100 : Number(rgba[4]));
    const alpha = Math.max(0, Math.min(1, Number.isFinite(alphaRaw) ? alphaRaw : 1));
    if (alpha <= 0.02) return null;
    const channels = [1, 2, 3].map(index => {
      const n = Number(rgba[index]);
      return Math.max(0, Math.min(255, Math.round(n * alpha + 255 * (1 - alpha))));
    });
    return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
  }
  if (/^#[\da-f]{3,8}$/i.test(input)) return input;
  // Use the browser's CSS color parser only; this canvas is used for colour parsing/measurement
  // and never draws an external image, so it cannot inherit the invoice canvas origin state.
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) { context.fillStyle = fallback; context.fillStyle = input; return context.fillStyle || fallback; }
  } catch { /* use the fallback */ }
  return fallback;
}

function wrapSafeText(text, style, maxWidth) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  let context = null;
  try { context = document.createElement('canvas').getContext('2d'); } catch { context = null; }
  const fontSize = Math.max(6, Number.parseFloat(style.fontSize) || 12);
  const fontWeight = style.fontWeight === 'bold' || Number(style.fontWeight) >= 600 ? 'bold' : 'normal';
  const fontStyle = style.fontStyle === 'italic' ? 'italic' : 'normal';
  if (context) context.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
  const measure = line => context ? context.measureText(line).width : line.length * fontSize * 0.52;
  const available = Math.max(fontSize * 2, maxWidth || 400);
  const lines = [];
  let line = '';
  normalized.split(' ').forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (line && measure(test) > available) { lines.push(line); line = word; }
    else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

function safeVectorSvgFromElement(element) {
  if (!element) throw new Error('Invoice preview was not found. Open the invoice preview and try again.');
  const rootRect = element.getBoundingClientRect();
  const css = getComputedStyle(element);
  const zoom = Number.parseFloat(css.zoom) || 1;
  const isXenmarkSheet = element.classList?.contains('template-xenmark');
  const sheetOrientation = element.classList?.contains('is-landscape') ? 'landscape' : 'portrait';
  const width = Math.max(300, Math.round(isXenmarkSheet
    ? (element.offsetWidth || rootRect.width / zoom)
    : Math.max(element.offsetWidth || 0, rootRect.width / zoom, element.scrollWidth || 0)));
  const height = isXenmarkSheet
    ? Math.max(400, Math.round(width * (sheetOrientation === 'landscape' ? 210 / 297 : 297 / 210)))
    : Math.max(400, Math.round(Math.max(rootRect.height / zoom, (element.scrollHeight || 0) * zoom)));
  const shapes = [];
  const texts = [];
  const shapeCommands = [];
  const textCommands = [];
  const ignoredSelector = '[data-editor-only],.ic-editor-only,.xen-upload-chip,.xen-upload-empty,.ic-logo-placeholder,button,input,textarea,select,script,style,iframe,object,embed,video,audio,canvas';
  const allElements = [element, ...element.querySelectorAll('*')];
  allElements.forEach(node => {
    if (!(node instanceof Element) || node.matches(ignoredSelector) || node.closest(ignoredSelector)) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nodeStyle = getComputedStyle(node);
    if (nodeStyle.display === 'none' || nodeStyle.visibility === 'hidden' || Number(nodeStyle.opacity) === 0) return;
    const x = rect.left - rootRect.left;
    const y = rect.top - rootRect.top;
    const bg = safeSvgColor(nodeStyle.backgroundColor, '#ffffff');
    if (bg) {
      const radius = Math.min(24, Math.max(0, Number.parseFloat(nodeStyle.borderTopLeftRadius) || 0));
      shapes.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${rect.width.toFixed(2)}" height="${rect.height.toFixed(2)}" rx="${radius.toFixed(2)}" fill="${xmlEscape(bg)}"/>`);
      shapeCommands.push({ type: 'fill', x, y, width: rect.width, height: rect.height, radius, color: bg });
    }
    const borderWidth = Math.max(Number.parseFloat(nodeStyle.borderTopWidth) || 0, Number.parseFloat(nodeStyle.borderRightWidth) || 0, Number.parseFloat(nodeStyle.borderBottomWidth) || 0, Number.parseFloat(nodeStyle.borderLeftWidth) || 0);
    const borderColor = safeSvgColor(nodeStyle.borderTopColor, '#dddddd');
    if (borderWidth > 0 && borderColor && nodeStyle.borderTopStyle !== 'none') {
      shapes.push(`<rect x="${(x + borderWidth / 2).toFixed(2)}" y="${(y + borderWidth / 2).toFixed(2)}" width="${Math.max(0, rect.width - borderWidth).toFixed(2)}" height="${Math.max(0, rect.height - borderWidth).toFixed(2)}" fill="none" stroke="${xmlEscape(borderColor)}" stroke-width="${borderWidth.toFixed(2)}"/>`);
      shapeCommands.push({ type: 'stroke', x: x + borderWidth / 2, y: y + borderWidth / 2, width: Math.max(0, rect.width - borderWidth), height: Math.max(0, rect.height - borderWidth), color: borderColor, lineWidth: borderWidth });
    }
  });
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let textNode;
  while ((textNode = walker.nextNode())) {
    const text = String(textNode.nodeValue || '').replace(/\s+/g, ' ').trim();
    const parent = textNode.parentElement;
    if (!text || !parent || parent.closest(ignoredSelector)) continue;
    const style = getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const textRect = range.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    if (!textRect.width || !textRect.height || !parentRect.width) continue;
    const fontSize = Math.max(6, Number.parseFloat(style.fontSize) || 12);
    const lineHeight = style.lineHeight === 'normal' ? fontSize * 1.25 : Math.max(fontSize, Number.parseFloat(style.lineHeight) || fontSize * 1.25);
    const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(style.paddingRight) || 0;
    const lines = wrapSafeText(text, style, parentRect.width - paddingLeft - paddingRight);
    const color = safeSvgColor(style.color, '#1b1b1b') || '#1b1b1b';
    const weight = style.fontWeight === 'bold' || Number(style.fontWeight) >= 600 ? '700' : '400';
    const fontStyle = style.fontStyle === 'italic' ? 'italic' : 'normal';
    const fontFamily = String(style.fontFamily || 'Arial').split(',')[0].replace(/["']/g, '').trim() || 'Arial';
    const align = style.textAlign === 'center' ? 'middle' : ['right','end'].includes(style.textAlign) ? 'end' : 'start';
    let x = textRect.left - rootRect.left;
    if (align === 'middle') x = parentRect.left - rootRect.left + parentRect.width / 2;
    if (align === 'end') x = parentRect.right - rootRect.left - paddingRight;
    const maxLines = Math.max(1, Math.min(lines.length, Math.ceil((parentRect.height + lineHeight) / lineHeight)));
    for (let lineIndex = 0; lineIndex < maxLines; lineIndex += 1) {
      // The last-resort canvas renderer can paint Unicode using the browser's font fallback,
      // so keep Indian currency symbols and non-Latin customer/business names intact.
      const cleanLine = lines[lineIndex] || '';
      const top = textRect.top - rootRect.top + lineIndex * lineHeight;
      const baseline = top + fontSize * 0.86;
      texts.push(`<text x="${x.toFixed(2)}" y="${baseline.toFixed(2)}" fill="${xmlEscape(color)}" font-family="${xmlEscape(fontFamily)}" font-size="${fontSize.toFixed(2)}" font-weight="${weight}" font-style="${fontStyle}" text-anchor="${align}">${xmlEscape(cleanLine)}</text>`);
      textCommands.push({ text: cleanLine, x, y: baseline, color, fontSize, weight, fontStyle, fontFamily, align });
    }
  }
  const imageCount = element.querySelectorAll('img,svg image,svg use').length;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/>${shapes.join('')}${texts.join('')}</svg>`;
  return { svg, width, height, skippedAssets: imageCount, safeFallback: true, singlePage: isXenmarkSheet, sheetOrientation, shapeCommands, textCommands };
}

async function renderSafeVectorCanvas(element, scale = EXPORT_SCALE) {
  // Last-resort renderer uses Canvas 2D fill/stroke/text primitives only. It intentionally does
  // not load images, SVG blobs, web fonts, or CSS resources, so no remote content can taint it.
  const vector = safeVectorSvgFromElement(element);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(vector.width * scale));
  canvas.height = Math.max(1, Math.round(vector.height * scale));
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Your browser could not create a safe invoice export canvas.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  const roundedRect = (x, y, width, height, radius) => {
    const r = Math.max(0, Math.min(Number(radius) || 0, width / 2, height / 2));
    context.beginPath();
    if (typeof context.roundRect === 'function') context.roundRect(x, y, width, height, r);
    else {
      context.moveTo(x + r, y);
      context.lineTo(x + width - r, y); context.quadraticCurveTo(x + width, y, x + width, y + r);
      context.lineTo(x + width, y + height - r); context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      context.lineTo(x + r, y + height); context.quadraticCurveTo(x, y + height, x, y + height - r);
      context.lineTo(x, y + r); context.quadraticCurveTo(x, y, x + r, y); context.closePath();
    }
  };
  for (const shape of vector.shapeCommands || []) {
    if (shape.type === 'fill') {
      context.fillStyle = shape.color || '#ffffff';
      roundedRect(shape.x, shape.y, shape.width, shape.height, shape.radius);
      context.fill();
    } else if (shape.type === 'stroke') {
      context.strokeStyle = shape.color || '#dddddd';
      context.lineWidth = Math.max(0.5, Number(shape.lineWidth) || 1);
      context.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
  }
  for (const item of vector.textCommands || []) {
    context.fillStyle = item.color || '#1b1b1b';
    context.textAlign = item.align === 'middle' ? 'center' : item.align === 'end' ? 'right' : 'left';
    context.textBaseline = 'alphabetic';
    const family = String(item.fontFamily || 'Arial').replace(/[\\"']/g, '').trim() || 'Arial';
    context.font = `${item.fontStyle || 'normal'} ${item.weight || '400'} ${Math.max(6, Number(item.fontSize) || 12)}px "${family}"`;
    context.fillText(String(item.text || ''), item.x, item.y, Math.max(20, vector.width - item.x));
  }
  // A readback assertion verifies the fallback remains origin-clean before PDF/image encoding.
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.getImageData(0, 0, 1, 1);
  canvas.__spyrixSkippedAssets = vector.skippedAssets;
  canvas.__spyrixSafeFallback = true;
  canvas.__spyrixVectorFallback = true;
  canvas.__spyrixSinglePage = Boolean(vector.singlePage);
  canvas.__spyrixSheetOrientation = vector.sheetOrientation || 'portrait';
  return canvas;
}

async function renderInvoiceCanvasResilient(element, scale = EXPORT_SCALE) {
  try {
    return await renderInvoiceCanvas(element, scale, false);
  } catch (firstError) {
    try { return await renderInvoiceCanvas(element, scale, true); }
    catch (secondError) {
      // Never silently use the simplified geometry renderer: that changes the layout and logo.
      // Preserve the user's design by returning a useful export error instead.
      const reason = String(secondError?.message || firstError?.message || 'Unknown rendering error');
      throw new Error(`Could not export the invoice with its original design. Check uploaded images and try again. Details: ${reason}`);
    }
  }
}

export async function exportInvoiceImage(element, format = 'png', scale = EXPORT_SCALE) {
  let canvas = await renderInvoiceCanvasResilient(element, scale);
  if ((canvas.__spyrixSkippedAssets || 0) > 0) {
    throw new Error(`The ${format.toUpperCase()} export was cancelled because ${canvas.__spyrixSkippedAssets} image asset(s) could not be included. Upload those images directly to the invoice and retry.`);
  }
  const type = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
  let blob;
  try { blob = await canvasBlob(canvas, type, 0.96); }
  catch (error) {
    if (!canvas.__spyrixVectorFallback) {
      // Some browsers report a tainted canvas from toBlob as a null blob instead of throwing.
      // Retry the same full-layout renderer with URL resources sanitized; never alter the invoice geometry.
      try { canvas = await renderInvoiceCanvas(element, scale, true); blob = await canvasBlob(canvas, type, 0.96); }
      catch { throw new Error(`Could not encode the ${format.toUpperCase()} invoice with its original layout. Upload logo/QR images directly from your device and retry.`); }
    } else throw error;
  }
  saveBlob(blob, `SPYRIX-Invoice.${format === 'jpeg' ? 'jpg' : format}`);
  return { skippedAssets: canvas.__spyrixSkippedAssets || 0, safeFallback: Boolean(canvas.__spyrixSafeFallback) };
}

export async function exportInvoiceSvg(element) {
  try {
    const { svg, skippedAssets = 0 } = await createExportSvg(element);
    saveBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'SPYRIX-Invoice.svg');
    return { skippedAssets, safeFallback: false };
  } catch (error) {
    throw new Error(`Could not export the invoice SVG without changing its layout. ${error?.message || ''}`.trim());
  }
}

function toBytes(text) { return new TextEncoder().encode(text); }
function concatBytes(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}
function decodeJpegData(dataUrl) {
  const data = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
function makePdf(jpegPages, pageSize) {
  const objectCount = 2 + jpegPages.length * 3;
  const parts = [toBytes('%PDF-1.4\n%SPYRIX\n')];
  const offsets = new Array(objectCount + 1).fill(0);
  let byteLength = parts[0].length;
  const appendObject = (id, bodyParts) => {
    offsets[id] = byteLength;
    const all = [toBytes(`${id} 0 obj\n`), ...bodyParts, toBytes('\nendobj\n')];
    const bytes = concatBytes(all); parts.push(bytes); byteLength += bytes.length;
  };
  const pageIds = jpegPages.map((_, index) => 3 + index * 3);
  const kids = pageIds.map(id => `${id} 0 R`).join(' ');
  appendObject(1, [toBytes('<< /Type /Catalog /Pages 2 0 R >>')]);
  appendObject(2, [toBytes(`<< /Type /Pages /Kids [${kids}] /Count ${jpegPages.length} >>`)]);
  jpegPages.forEach((jpeg, index) => {
    const pageId = 3 + index * 3, imageId = pageId + 1, streamId = pageId + 2;
    const content = toBytes(`q\n${pageSize.widthPt.toFixed(3)} 0 0 ${pageSize.heightPt.toFixed(3)} 0 0 cm\n/Im0 Do\nQ`);
    appendObject(pageId, [toBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageSize.widthPt.toFixed(3)} ${pageSize.heightPt.toFixed(3)}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${streamId} 0 R >>`)]);
    appendObject(imageId, [toBytes(`<< /Type /XObject /Subtype /Image /Width ${jpeg.width} /Height ${jpeg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.bytes.length} >>\nstream\n`), jpeg.bytes, toBytes('\nendstream')]);
    appendObject(streamId, [toBytes(`<< /Length ${content.length} >>\nstream\n`), content, toBytes('\nendstream')]);
  });
  const xrefOffset = byteLength;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objectCount; id += 1) xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(toBytes(xref));
  return new Blob([concatBytes(parts)], { type: 'application/pdf' });
}

async function downloadPdfFromCanvas(source, orientation = 'portrait', singlePage = Boolean(source.__spyrixSinglePage)) {
  const page = A4[orientation === 'landscape' ? 'landscape' : 'portrait'];
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = page.widthPx;
  pageCanvas.height = page.heightPx;
  const ctx = pageCanvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Your browser could not prepare the PDF page.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const jpegPages = [];

  if (singlePage) {
    // XENMARK is a one-sheet invoice by design. Fit the entire exported sheet into one A4 page
    // while preserving its aspect ratio. Do not slice by scrollHeight or create extra pages.
    const scale = Math.min(page.widthPx / source.width, page.heightPx / source.height);
    const drawWidth = Math.max(1, Math.round(source.width * scale));
    const drawHeight = Math.max(1, Math.round(source.height * scale));
    const x = Math.round((page.widthPx - drawWidth) / 2);
    const y = Math.round((page.heightPx - drawHeight) / 2);
    ctx.drawImage(source, 0, 0, source.width, source.height, x, y, drawWidth, drawHeight);
    let dataUrl;
    try { dataUrl = pageCanvas.toDataURL('image/jpeg', 0.98); }
    catch (error) { if (isCanvasSecurityError(error)) throw error; throw new Error('Could not encode the invoice PDF page.'); }
    jpegPages.push({ bytes: decodeJpegData(dataUrl), width: page.widthPx, height: page.heightPx });
  } else {
    // Other invoice designs may be longer than one page; preserve pagination for those layouts.
    const scaledHeight = Math.max(1, Math.round(source.height * page.widthPx / source.width));
    const normalized = document.createElement('canvas');
    normalized.width = page.widthPx;
    normalized.height = scaledHeight;
    const nctx = normalized.getContext('2d', { alpha: false });
    if (!nctx) throw new Error('Your browser could not prepare the PDF pages.');
    nctx.fillStyle = '#ffffff'; nctx.fillRect(0, 0, normalized.width, normalized.height);
    nctx.imageSmoothingEnabled = true; nctx.imageSmoothingQuality = 'high';
    nctx.drawImage(source, 0, 0, normalized.width, normalized.height);
    const pageCount = Math.max(1, Math.ceil(normalized.height / page.heightPx));
    for (let index = 0; index < pageCount; index += 1) {
      const current = document.createElement('canvas');
      current.width = page.widthPx; current.height = page.heightPx;
      const currentCtx = current.getContext('2d', { alpha: false });
      if (!currentCtx) throw new Error('Your browser could not prepare a PDF page.');
      currentCtx.fillStyle = '#ffffff'; currentCtx.fillRect(0, 0, current.width, current.height);
      const sourceY = index * page.heightPx;
      const pieceHeight = Math.min(page.heightPx, normalized.height - sourceY);
      currentCtx.drawImage(normalized, 0, sourceY, normalized.width, pieceHeight, 0, 0, page.widthPx, pieceHeight);
      let dataUrl;
      try { dataUrl = current.toDataURL('image/jpeg', 0.98); }
      catch (error) { if (isCanvasSecurityError(error)) throw error; throw new Error('Could not encode a PDF page image.'); }
      jpegPages.push({ bytes: decodeJpegData(dataUrl), width: page.widthPx, height: page.heightPx });
    }
  }
  saveBlob(makePdf(jpegPages, page), 'SPYRIX-Invoice.pdf');
  return { skippedAssets: source.__spyrixSkippedAssets || 0, safeFallback: Boolean(source.__spyrixSafeFallback), singlePage: Boolean(singlePage) };
}

export async function exportInvoicePdf(element, orientation = 'portrait') {
  const isXenmarkSheet = Boolean(element?.classList?.contains('template-xenmark'));
  const outputOrientation = isXenmarkSheet ? (element.classList.contains('is-landscape') ? 'landscape' : 'portrait') : orientation;
  // Render a lot larger than the screen preview. The actual PDF is drawn onto the fixed A4
  // canvas; the XENMARK canvas ratio stays the same whether the user is on desktop or mobile.
  const renderWidth = isXenmarkSheet ? (element.classList.contains('is-landscape') ? 1120 : 850) : (element?.classList?.contains('paper-a5') ? 650 : element?.classList?.contains('is-landscape') ? 1120 : 850);
  const scale = Math.max(3, Math.min(4, 2550 / Math.max(1, renderWidth)));
  // Render scale follows the fixed export sheet, not its responsive on-screen width. This keeps
  // mobile downloads crisp without creating oversized memory-heavy canvases or mobile CSS layouts.
  let source = await renderInvoiceCanvasResilient(element, scale);
  if ((source.__spyrixSkippedAssets || 0) > 0) {
    const error = new Error(`The direct PDF export could not include ${source.__spyrixSkippedAssets} image asset(s).`);
    error.name = 'InvoiceExportVisualError';
    throw error;
  }
  if (isXenmarkSheet) {
    source.__spyrixSinglePage = true;
    source.__spyrixSheetOrientation = element.classList.contains('is-landscape') ? 'landscape' : 'portrait';
  }
  try {
    return await downloadPdfFromCanvas(source, outputOrientation, isXenmarkSheet);
  } catch (error) {
    if (!source.__spyrixSafeFallback) {
      // Retry with URLs sanitized but keep the full HTML layout so the PDF matches the editor.
      try {
        source = await renderInvoiceCanvas(element, scale, true);
        if (isXenmarkSheet) {
          source.__spyrixSinglePage = true;
          source.__spyrixSheetOrientation = element.classList.contains('is-landscape') ? 'landscape' : 'portrait';
        }
        return await downloadPdfFromCanvas(source, outputOrientation, isXenmarkSheet);
      } catch (retryError) {
        throw new Error(`Could not generate the PDF without changing the invoice design. ${retryError?.message || error?.message || ''}`.trim());
      }
    }
    throw error;
  }
}

export function printInvoiceDocument() {
  window.print();
}

export async function shareInvoiceSummary({ invoiceNumber, customerName, total, currency = 'INR' } = {}) {
  const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(total || 0));
  const text = `Invoice ${invoiceNumber || ''}\nCustomer: ${customerName || 'Customer'}\nTotal: ${amount}\nCreated with SPYRIX INVOICE`;
  if (navigator.share) {
    await navigator.share({ title: `Invoice ${invoiceNumber || ''}`, text });
    return 'shared';
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }
  const mailto = `mailto:?subject=${encodeURIComponent(`Invoice ${invoiceNumber || ''}`)}&body=${encodeURIComponent(text)}`;
  window.location.href = mailto;
  return 'email';
}
