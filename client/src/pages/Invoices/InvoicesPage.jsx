import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Clock3, FilePlus2, FileText, IndianRupee,
  LayoutTemplate, ListChecks, Sparkles, Upload, Users, Wallet,
} from 'lucide-react';
import { useData } from '../../data/DataContext';
import { useAuth } from '../../context/AuthContext';
import { invoiceTemplates, loadInvoiceDesign, saveInvoiceDesign } from './invoiceDesign';
import TemplateMiniPreview from '../Templates/TemplateMiniPreview';
import ModulePage from '../shared/ModulePage/ModulePage';
import './InvoicesPage.css';

const formatMoney = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
const formatDate = value => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function RecentInvoicePreview({ invoice, business }) {
  const savedDesign = invoice.design || {};
  const template = invoiceTemplates.find(item => item.id === (invoice.templateId || savedDesign.templateId)) || invoiceTemplates[0];
  const accent = savedDesign.accentColor || template.color;
  const items = Array.isArray(invoice.items) && invoice.items.length ? invoice.items.slice(0, 3) : [{ name: 'Professional services', quantity: 1, rate: invoice.total || 0 }];
  const amount = Number(invoice.total || invoice.grandTotal || 0);
  return (
    <div className={`ih-recent-paper layout-${template.layout} header-${savedDesign.headerStyle || 'line'} table-${savedDesign.tableStyle || 'clean'} frame-${savedDesign.frameStyle || 'thin'}`} style={{ '--recent-accent': accent, '--recent-font': savedDesign.fontFamily || template.font, '--recent-font-size': `${Number(savedDesign.fontSize || 10) * 0.72}px`, '--recent-paper': savedDesign.paperBackground || '#ffffff', '--recent-logo-width': `${Math.max(18, Math.min(44, Number(savedDesign.logoWidth || 64) * 0.45))}px` }}>
      <div className="ih-paper-head">
        <div className="ih-paper-brand">
          {savedDesign.showLogo && savedDesign.logoDataUrl ? <img src={savedDesign.logoDataUrl} alt="Business logo"/> : <span className="ih-paper-mark">S</span>}
          <div><b>{savedDesign.businessName || business?.name || 'SPYRIX BUSINESS'}</b><small>{savedDesign.businessAddress || business?.address || 'Business address'}</small></div>
        </div>
        <div className="ih-paper-number"><strong>{savedDesign.invoiceTitle || 'INVOICE'}</strong><small>{invoice.invoiceNumber || `INV-${String(invoice.id || '').slice(-6).toUpperCase()}`}</small><small>{formatDate(invoice.issueDate || invoice.createdAt)}</small></div>
      </div>
      <div className="ih-paper-parties">
        <div><small>BILL TO</small><b>{invoice.customerName || invoice.customerSnapshot?.name || 'Customer'}</b><span>{invoice.customerSnapshot?.companyName || ''}</span></div>
        <div><small>BILL FROM</small><b>{savedDesign.businessName || business?.name || 'Your business'}</b><span>{savedDesign.businessPhone || business?.phone || ''}</span></div>
      </div>
      <div className="ih-paper-table">
        <div className="ih-paper-row ih-paper-table-head"><b>DESCRIPTION</b><b>QTY</b><b>AMOUNT</b></div>
        {items.map((line, index) => <div className="ih-paper-row" key={line.id || line.name || index}><span>{line.name || line.description || 'Item'}</span><span>{line.quantity || 1}</span><span>{formatMoney(line.lineTotal ?? ((Number(line.quantity || 1) * Number(line.rate || 0)) + (Number(line.tax || 0))))}</span></div>)}
      </div>
      <div className="ih-paper-total"><span>TOTAL DUE</span><b>{formatMoney(amount)}</b></div>
      {savedDesign.showQr && savedDesign.qrDataUrl && <div className="ih-paper-qr"><img src={savedDesign.qrDataUrl} alt="Payment QR"/><span>SCAN TO PAY</span></div>}
      <div className="ih-paper-foot"><span>{template.name}</span><span>{savedDesign.footerText || 'THANK YOU'}</span></div>
    </div>
  );
}

function InvoicesOverview() {
  const navigate = useNavigate();
  const { records = {}, loading } = useData();
  const { business } = useAuth();
  const invoices = records.invoices || [];
  const recent = useMemo(() => [...invoices].sort((a, b) => new Date(b.createdAt || b.issueDate || 0) - new Date(a.createdAt || a.issueDate || 0)).slice(0, 5), [invoices]);
  const totalRevenue = invoices.filter(row => !['draft', 'cancelled'].includes(String(row.status || '').toLowerCase())).reduce((sum, row) => sum + Number(row.total || row.grandTotal || 0), 0);
  const pendingRevenue = invoices.filter(row => !['draft', 'cancelled', 'paid'].includes(String(row.status || '').toLowerCase())).reduce((sum, row) => sum + Math.max(0, Number(row.total || 0) - Number(row.paidAmount || 0)), 0);
  const customerCount = (records.customers || []).length;
  const savedDesign = loadInvoiceDesign();
  const featuredTemplates = invoiceTemplates.slice(0, 5);

  const selectTemplate = template => {
    saveInvoiceDesign({ ...savedDesign, templateId: template.id, accentColor: template.color, fontFamily: template.font });
    navigate('/app/invoices/new');
  };

  const actions = [
    { title: 'Create Invoice', detail: 'Build a new invoice', icon: FilePlus2, primary: true, onClick: () => navigate('/app/invoices/new') },
    { title: 'Browse Templates', detail: 'Explore all 20 designs', icon: LayoutTemplate, onClick: () => navigate('/app/templates') },
    { title: 'Import Invoice Data', detail: 'Upload CSV or spreadsheet', icon: Upload, onClick: () => navigate('/app/imports') },
    { title: 'View Invoice Records', detail: 'Search and manage invoices', icon: ListChecks, onClick: () => navigate('/app/invoices/records') },
    { title: 'Customers', detail: 'Manage customer profiles', icon: Users, onClick: () => navigate('/app/customers') },
  ];

  return (
    <div className="invoice-hub">
      <section className="ih-hero">
        <div className="ih-hero-copy">
          <span className="ih-kicker"><Sparkles size={14}/> SPYRIX INVOICE STUDIO</span>
          <h1>Create invoices.<br/><em>Make business move.</em></h1>
          <p>Build beautifully branded invoices, track what is paid, and keep every customer document in one clear workspace.</p>
          <div className="ih-hero-actions">
            <button className="ih-button ih-button-primary" onClick={() => navigate('/app/invoices/new')}><FilePlus2 size={17}/> Create invoice <ArrowRight size={16}/></button>
            <button className="ih-button ih-button-glass" onClick={() => navigate('/app/templates')}><LayoutTemplate size={16}/> Explore templates</button>
          </div>
          <div className="ih-hero-proof"><span><i/> Live preview</span><span><i/> A4-ready export</span><span><i/> Saved to your workspace</span></div>
        </div>
        <div className="ih-hero-visual" aria-hidden="true">
          <div className="ih-orbit ih-orbit-one"/><div className="ih-orbit ih-orbit-two"/>
          <div className="ih-hero-sheet"><div className="ih-sheet-top"><span>✦ SPYRIX</span><b>INVOICE</b></div><div className="ih-sheet-info"><i/><i/><i/><i/></div><div className="ih-sheet-parties"><div/><div/></div><div className="ih-sheet-table"><b/><b/><b/><i/><i/><i/><i/><i/><i/></div><div className="ih-sheet-total"><span>TOTAL DUE</span><b>₹ 48,500</b></div></div>
          <div className="ih-float-chip"><span><Wallet size={16}/></span><div><small>Payments tracked</small><b>All in one place</b></div></div>
          <div className="ih-float-stamp"><span>✦</span> SMART<br/>INVOICING</div>
        </div>
      </section>

      <div className="ih-main-layout">
        <main className="ih-left-column">
          <section className="ih-panel ih-action-panel">
            <div className="ih-section-heading"><div><span className="ih-overline">QUICK WORKSPACE</span><h2>What would you like to do?</h2></div><span className="ih-live-tag"><i/> READY</span></div>
            <div className="ih-action-grid">
              {actions.map(({ title, detail, icon: Icon, primary, onClick }) => <button key={title} className={`ih-action-card ${primary ? 'primary' : ''}`} onClick={onClick}><span className="ih-action-icon"><Icon size={20}/></span><span className="ih-action-copy"><b>{title}</b><small>{detail}</small></span><ArrowUpRight className="ih-action-arrow" size={17}/></button>)}
            </div>
          </section>

          <section className="ih-stats-grid" aria-label="Invoice metrics">
            <article className="ih-stat-card"><span className="ih-stat-icon"><FileText size={19}/></span><div><small>Total invoices</small><strong>{invoices.length.toLocaleString('en-IN')}</strong><span>All invoice records</span></div></article>
            <article className="ih-stat-card"><span className="ih-stat-icon"><IndianRupee size={19}/></span><div><small>Total revenue</small><strong>{formatMoney(totalRevenue)}</strong><span>Issued invoice value</span></div></article>
            <article className="ih-stat-card"><span className="ih-stat-icon"><Clock3 size={19}/></span><div><small>Pending revenue</small><strong>{formatMoney(pendingRevenue)}</strong><span>Unpaid issued invoices</span></div></article>
            <article className="ih-stat-card"><span className="ih-stat-icon"><Users size={19}/></span><div><small>Customers</small><strong>{customerCount.toLocaleString('en-IN')}</strong><span>Saved customer profiles</span></div></article>
          </section>

          <section className="ih-panel ih-template-panel">
            <div className="ih-section-heading"><div><span className="ih-overline">DESIGN COLLECTION</span><h2>Choose your invoice look</h2><p>These previews use the same template artwork shown in Template Studio.</p></div><button className="ih-text-link" onClick={() => navigate('/app/templates')}>View more templates <ArrowRight size={15}/></button></div>
            <div className="ih-template-grid">
              {featuredTemplates.map(template => <article className="ih-template-card" key={template.id}>
                <button className="ih-template-preview-button" onClick={() => selectTemplate(template)} aria-label={`Use ${template.name}`}><TemplateMiniPreview template={template} selected={savedDesign}/></button>
                <div className="ih-template-card-info"><div><small>{template.category}</small><b>{template.name}</b></div><button onClick={() => selectTemplate(template)} aria-label={`Use ${template.name}`}><ArrowRight size={15}/></button></div>
              </article>)}
            </div>
            <button className="ih-more-templates" onClick={() => navigate('/app/templates')}>Browse all 20 invoice templates <ArrowRight size={15}/></button>
          </section>
        </main>

        <aside className="ih-right-column">
          <section className="ih-panel ih-recent-panel">
            <div className="ih-recent-heading"><div><span className="ih-overline">YOUR ACTIVITY</span><h2>Recent invoices</h2><p>The latest documents created in this workspace.</p></div><span className="ih-recent-count">{invoices.length}</span></div>
            {loading ? <div className="ih-empty-state">Loading recent invoices…</div> : recent.length ? <div className="ih-recent-list">
              {recent.map(invoice => {
                const invoiceNo = invoice.invoiceNumber || `INV-${String(invoice.id || '').slice(-6).toUpperCase()}`;
                const customerName = invoice.customerName || invoice.customerSnapshot?.name || 'Customer';
                const status = String(invoice.status || 'draft').replaceAll('_', ' ');
                return <article className="ih-recent-card" key={invoice.id || invoiceNo}>
                  <RecentInvoicePreview invoice={invoice} business={business}/>
                  <div className="ih-recent-card-meta"><div className="ih-recent-card-title"><b>{invoiceNo}</b><span className={`ih-status ih-status-${status.replaceAll(' ', '-')}`}>{status}</span></div><span>{customerName}</span><div><small>{formatDate(invoice.issueDate || invoice.createdAt)}</small><strong>{formatMoney(invoice.total)}</strong></div></div>
                </article>;
              })}
            </div> : <div className="ih-empty-state"><span className="ih-empty-icon"><FileText size={25}/></span><b>No invoices yet</b><p>Your newly created invoices will appear here as clear document previews.</p><button onClick={() => navigate('/app/invoices/new')}>Create your first invoice <ArrowRight size={14}/></button></div>}
            <button className="ih-view-records" onClick={() => navigate('/app/invoices/records')}>View all invoice records <ArrowRight size={15}/></button>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (pathname.endsWith('/records')) {
    return <div className="invoice-records-view"><div className="ih-records-heading"><div><span className="ih-overline">INVOICE MANAGEMENT</span><h1>Invoice records</h1><p>Search, review and manage your saved invoice records.</p></div><button className="ih-records-back" onClick={() => navigate('/app/invoices')}>Back to invoice home</button></div><ModulePage sectionOverride="invoices" pageClassName="invoices-page-content"/></div>;
  }
  return <InvoicesOverview/>;
}
