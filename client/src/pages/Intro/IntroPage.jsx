import { useEffect, useMemo, useRef } from 'react';
import introDocument from './IntroDocument.html?raw';
import { introPageConfig } from './page.config.js';
import './IntroPage.css';
import spyrixLoaderCss from '../../components/SpyrixLoader.css?raw';

/** Intro HTML is kept as an editable document; the app-wide MacBook loader is retained unchanged. */
export default function IntroPage() {
  const frameRef = useRef(null);

  useEffect(() => {
    document.title = introPageConfig.documentTitle;
    const siteUrl = `${window.location.origin}/`;
    const siteName = 'SPYRIX Invoice';
    const description = 'Create professional invoices online with SPYRIX Invoice Maker. Manage GST billing, customers, products, payments, inventory, quotations and expenses in one business management workspace.';
    const seoTitle = 'Online Invoice Maker | GST Billing & Business Management Software | SPYRIX';
    const setMeta = (name, content, attribute = 'name') => {
      let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, name); document.head.appendChild(element); }
      element.setAttribute('content', content);
    };
    setMeta('description', description);
    setMeta('robots', 'index,follow,max-image-preview:large');
    setMeta('keywords', 'invoice maker, online invoice maker, invoice generator, GST invoice maker India, GST billing software, business management software, billing software, customer management, payment tracking, inventory management, quotations, expenses');
    setMeta('og:type', 'website', 'property');
    setMeta('og:site_name', siteName, 'property');
    setMeta('og:title', seoTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', siteUrl, 'property');
    setMeta('og:image', `${window.location.origin}/assets/hero-art.png`, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', seoTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', `${window.location.origin}/assets/hero-art.png`);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = siteUrl;
    let schema = document.getElementById('spyrix-public-schema');
    if (!schema) { schema = document.createElement('script'); schema.id = 'spyrix-public-schema'; schema.type = 'application/ld+json'; document.head.appendChild(schema); }
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': `${siteUrl}#organization`, name: 'SPYRIX', url: siteUrl, logo: `${window.location.origin}/assets/branding/spyrix-master-lockup.png`, description },
        { '@type': 'WebSite', '@id': `${siteUrl}#website`, name: siteName, url: siteUrl, publisher: { '@id': `${siteUrl}#organization` }, inLanguage: 'en-IN' },
        { '@type': 'WebPage', '@id': `${siteUrl}#webpage`, name: seoTitle, url: siteUrl, description, isPartOf: { '@id': `${siteUrl}#website` }, about: { '@id': `${siteUrl}#application` }, inLanguage: 'en-IN' },
        { '@type': 'WebApplication', '@id': `${siteUrl}#application`, name: siteName, url: siteUrl, applicationCategory: 'BusinessApplication', operatingSystem: 'Web browser', description, keywords: ['invoice maker', 'GST invoice maker', 'business management software', 'invoice generator', 'billing software'], featureList: ['Online invoice creation', 'GST-ready billing', 'Customer management', 'Product and inventory management', 'Payment tracking', 'Quotations and expenses', 'Business reports and data exports'], publisher: { '@id': `${siteUrl}#organization` } },
        { '@type': 'FAQPage', '@id': `${siteUrl}#faq`, mainEntity: [
          { '@type': 'Question', name: 'What is SPYRIX Invoice?', acceptedAnswer: { '@type': 'Answer', text: 'SPYRIX Invoice is an online business workspace for invoice creation, customer records, products, payments and reports.' } },
          { '@type': 'Question', name: 'Can I create GST invoices online?', acceptedAnswer: { '@type': 'Answer', text: 'SPYRIX Invoice includes GSTIN fields and configurable tax rates for invoice creation.' } },
          { '@type': 'Question', name: 'Can I track payments and stock?', acceptedAnswer: { '@type': 'Answer', text: 'SPYRIX Invoice helps businesses record payments, view outstanding balances and track product stock.' } }
        ] } 
      ]
    });
  }, []);

  const hostedDocument = useMemo(() => {
    const sharedLoaderCss = spyrixLoaderCss.replaceAll('.spyrix-loader-screen', '.site-loader');
    const loaderSafety = `<style data-spyrix-preserved-loader>
      ${sharedLoaderCss}
      .site-loader { opacity:1; visibility:visible; transition:opacity .35s ease,visibility .35s ease; background:#030704!important; }
      .site-loader.is-hidden { opacity:0!important; visibility:hidden!important; pointer-events:none!important; }
      .site-loader .spyrix-loader-stage { min-height:100svh; }
      @media (max-width:760px){.site-loader .spyrix-macbook-inner{animation:spyrix-macbook-rotate 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-screen{animation:spyrix-macbook-lid-screen 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-body{animation:spyrix-macbook-lid-body 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-body-face{animation:spyrix-macbook-keyboard-area 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-shade{animation:spyrix-macbook-screen-shade 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-key{animation:spyrix-macbook-keys 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-shadow{animation:spyrix-macbook-shadow 7s ease infinite!important}}
      @media (prefers-reduced-motion:reduce){.site-loader .spyrix-macbook-inner{animation:spyrix-macbook-rotate 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-screen{animation:spyrix-macbook-lid-screen 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-body{animation:spyrix-macbook-lid-body 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-body-face{animation:spyrix-macbook-keyboard-area 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-shade{animation:spyrix-macbook-screen-shade 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-key{animation:spyrix-macbook-keys 7s ease-in-out infinite!important}.site-loader .spyrix-macbook-shadow{animation:spyrix-macbook-shadow 7s ease infinite!important}}
    </style>`;
    const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
    const apiBase = configuredApiBase || (import.meta.env.DEV ? 'http://localhost:5000/api/v1' : '');
    const feedbackApi = apiBase ? `${apiBase}/feedback` : '';
    const feedbackConfig = `<script>window.SPYRIX_FEEDBACK_ENDPOINT=${JSON.stringify(feedbackApi)};<\/script>`;
    return introDocument.replace('</head>', `${loaderSafety}</head>`).replace('</body>', `${feedbackConfig}</body>`);
  }, []);

  return (
    <main className="intro-page-host" aria-label={introPageConfig.accessibleName}>
      <iframe ref={frameRef} className="intro-page-frame" srcDoc={hostedDocument} title={introPageConfig.accessibleName} allow="clipboard-read; clipboard-write" />
    </main>
  );
}
