import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, BadgeIndianRupee, Check, CheckCircle2, Circle,
  ClipboardList, FileText, Package, Sparkles, UserRound, Wallet,
} from 'lucide-react';
import { useData } from '../../data/DataContext';
import { useAuth } from '../../context/AuthContext';
import './DashboardWorkspaceExtras.css';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
const dateOnly = value => String(value || '').slice(0, 10);
const toDate = value => {
  if (!value) return null;
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const dateLabel = value => {
  const date = toDate(value);
  return date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable';
};

function getActivity(records) {
  const rows = [];
  (records.invoices || []).forEach(row => rows.push({
    id: `invoice-${row.id}`, kind: 'invoice', title: `Invoice ${row.invoiceNumber || 'created'}`,
    detail: `${row.customerName || 'Customer'} · ${money(row.total)}`, date: row.createdAt || row.issueDate,
    to: '/app/invoices', status: row.status || 'draft',
  }));
  (records.payments || []).forEach(row => rows.push({
    id: `payment-${row.id}`, kind: 'payment', title: 'Payment recorded',
    detail: `${row.customerName || row.invoiceNumber || 'Customer'} · ${money(row.amount)}`, date: row.createdAt || row.paymentDate,
    to: '/app/payments', status: row.status || 'completed',
  }));
  (records.quotations || []).forEach(row => rows.push({
    id: `quotation-${row.id}`, kind: 'quotation', title: `Quotation ${row.quotationNumber || 'created'}`,
    detail: `${row.customerName || 'Customer'} · ${money(row.total)}`, date: row.createdAt,
    to: '/app/quotations', status: row.status || 'draft',
  }));
  (records.customers || []).forEach(row => rows.push({
    id: `customer-${row.id}`, kind: 'customer', title: 'Customer added',
    detail: row.companyName || row.name || 'Customer profile', date: row.createdAt,
    to: '/app/customers', status: row.status || 'active',
  }));
  (records.products || []).forEach(row => rows.push({
    id: `product-${row.id}`, kind: 'product', title: 'Product or service added',
    detail: [row.name, row.sku].filter(Boolean).join(' · ') || 'Catalogue item', date: row.createdAt,
    to: '/app/products', status: row.active === false ? 'inactive' : 'active',
  }));
  (records.expenses || []).forEach(row => rows.push({
    id: `expense-${row.id}`, kind: 'expense', title: 'Expense recorded',
    detail: `${row.title || row.vendor || row.category || 'Business expense'} · ${money(row.amount)}`, date: row.createdAt || row.expenseDate,
    to: '/app/expenses', status: row.status || 'paid',
  }));
  return rows.filter(row => toDate(row.date)).sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 7);
}

const activityIcon = { invoice: FileText, payment: BadgeIndianRupee, quotation: ClipboardList, customer: UserRound, product: Package, expense: Wallet };

export default function DashboardWorkspaceExtras() {
  const { records } = useData();
  const { business, user } = useAuth();
  const navigate = useNavigate();
  const storageKey = `spyrix-onboarding-dismissed-${business?.id || user?.id || 'workspace'}`;
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { setDismissed(localStorage.getItem(storageKey) === '1'); } catch { setDismissed(false); }
  }, [storageKey]);

  const customerCount = (records.customers || []).length;
  const productCount = (records.products || []).length;
  const invoiceCount = (records.invoices || []).length;
  const businessReady = Boolean(String(business?.name || '').trim() && (String(business?.address || '').trim() || String(business?.email || '').trim()));
  const checklist = [
    { title: 'Complete your business profile', detail: 'Add your business name and contact details.', done: businessReady, to: '/app/business-settings', icon: UserRound },
    { title: 'Add your first customer', detail: 'Save a customer once and reuse the details.', done: customerCount > 0, to: '/app/customers', icon: UserRound },
    { title: 'Add products or services', detail: 'Build a reusable catalogue for invoices.', done: productCount > 0, to: '/app/products', icon: Package },
    { title: 'Create your first invoice', detail: 'Turn your customer and items into a document.', done: invoiceCount > 0, to: '/app/invoices/new', icon: FileText },
  ];
  const doneCount = checklist.filter(item => item.done).length;
  const activity = useMemo(() => getActivity(records), [records]);
  const insights = useMemo(() => {
    const invoices = (records.invoices || []).filter(row => !['draft', 'cancelled', 'void'].includes(String(row.status || '').toLowerCase()));
    const customerMap = new Map();
    invoices.forEach(row => {
      const key = row.customerId || row.customerName || 'unknown';
      const previous = customerMap.get(key) || { label: row.customerName || 'Customer', total: 0, count: 0 };
      previous.total += Number(row.total || 0); previous.count += 1; customerMap.set(key, previous);
    });
    const topCustomer = [...customerMap.values()].sort((a, b) => b.total - a.total)[0] || null;
    const productMap = new Map();
    invoices.forEach(invoice => (invoice.items || []).forEach(item => {
      const label = String(item.name || item.description || item.productName || '').trim();
      if (!label) return;
      const prior = productMap.get(label) || { label, quantity: 0, total: 0 };
      prior.quantity += Number(item.quantity || 0);
      prior.total += Number(item.lineTotal ?? (Number(item.quantity || 0) * Number(item.rate || 0)) ?? 0);
      productMap.set(label, prior);
    }));
    const topProduct = [...productMap.values()].sort((a, b) => b.total - a.total)[0] || null;
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
    const payments = (records.payments || []).filter(row => row.status === 'completed');
    const currentCollections = payments.filter(row => dateOnly(row.paymentDate || row.createdAt).slice(0, 7) === thisMonth).reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const previousCollections = payments.filter(row => dateOnly(row.paymentDate || row.createdAt).slice(0, 7) === previousMonth).reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return { topCustomer, topProduct, currentCollections, previousCollections, invoiceCount: invoices.length };
  }, [records]);

  const dismissChecklist = () => {
    try { localStorage.setItem(storageKey, '1'); } catch { /* Browser storage may be disabled. */ }
    setDismissed(true);
  };

  return (
    <div className="dashboard-extras">
      {!dismissed && doneCount < checklist.length && <section className="dx-onboarding dashboard-panel">
        <div className="dx-onboarding-head">
          <span className="dx-icon-chip"><Sparkles size={19}/></span>
          <div className="dx-section-title"><span className="panel-eyebrow">GET STARTED</span><h2>Set up your SPYRIX workspace</h2><p>A few quick steps make your daily billing faster.</p></div>
          <div className="dx-progress"><strong>{doneCount}/{checklist.length}</strong><span>completed</span><i><b style={{ width: `${doneCount / checklist.length * 100}%` }}/></i></div>
          <button className="dx-dismiss" type="button" onClick={dismissChecklist} aria-label="Dismiss getting started checklist">×</button>
        </div>
        <div className="dx-checklist">{checklist.map((item, index) => {
          const Icon = item.icon;
          return <button className={`dx-check-item ${item.done ? 'is-done' : ''}`} key={item.title} type="button" onClick={() => navigate(item.to)}>
            <span className="dx-step-check">{item.done ? <Check size={15}/> : <Icon size={15}/>}</span>
            <span className="dx-check-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
            <ArrowRight size={16} className="dx-check-arrow"/>
          </button>;
        })}</div>
      </section>}

      <section className="dx-insights-grid">
        <article className="dashboard-panel dx-insight-panel">
          <header className="dashboard-panel-head"><div><span className="panel-eyebrow">CUSTOMER & PRODUCT INSIGHTS</span><h2>What is working best?</h2><p>Based on saved, non-draft invoices.</p></div><span className="dx-icon-chip"><TrendingIcon/></span></header>
          <div className="dx-insight-items">
            <div className="dx-insight-item"><span className="dx-insight-symbol customer"><UserRound size={17}/></span><div><small>Top customer by invoiced value</small><strong>{insights.topCustomer?.label || 'No invoiced customers yet'}</strong><span>{insights.topCustomer ? `${insights.topCustomer.count} invoice${insights.topCustomer.count === 1 ? '' : 's'}` : 'Your customer ranking appears here'}</span></div><b>{insights.topCustomer ? money(insights.topCustomer.total) : '—'}</b></div>
            <div className="dx-insight-item"><span className="dx-insight-symbol product"><Package size={17}/></span><div><small>Top product by line value</small><strong>{insights.topProduct?.label || 'No invoiced items yet'}</strong><span>{insights.topProduct ? `${insights.topProduct.quantity} units/quantity invoiced` : 'Your product ranking appears here'}</span></div><b>{insights.topProduct ? money(insights.topProduct.total) : '—'}</b></div>
            <div className="dx-month-compare"><span className="dx-insight-symbol collection"><BadgeIndianRupee size={17}/></span><div><small>Collections this month</small><strong>{money(insights.currentCollections)}</strong><span>{insights.currentCollections === insights.previousCollections ? 'Same as last month' : `${insights.currentCollections > insights.previousCollections ? 'Up' : 'Down'} ${money(Math.abs(insights.currentCollections - insights.previousCollections))} compared with last month`}</span></div><b className={insights.currentCollections >= insights.previousCollections ? 'positive' : 'negative'}>{insights.currentCollections === insights.previousCollections ? '=' : insights.currentCollections > insights.previousCollections ? '+' : '−'}{money(Math.abs(insights.currentCollections - insights.previousCollections))}</b></div>
          </div>
          <button className="dx-panel-link" type="button" onClick={() => navigate('/app/reports')}>Open detailed reports <ArrowRight size={15}/></button>
        </article>
        <article className="dashboard-panel dx-activity-panel">
          <header className="dashboard-panel-head"><div><span className="panel-eyebrow">WORKSPACE ACTIVITY</span><h2>Recent activity</h2><p>Latest events found in your saved records.</p></div><span className="dx-icon-chip"><Activity size={18}/></span></header>
          {activity.length ? <div className="dx-activity-list">{activity.slice(0, 6).map(item => {
            const Icon = activityIcon[item.kind] || Activity;
            return <button className="dx-activity-item" type="button" key={item.id} onClick={() => navigate(item.to)}><span className={`dx-activity-icon ${item.kind}`}><Icon size={15}/></span><span className="dx-activity-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="dx-activity-date">{dateLabel(item.date)}</span></button>;
          })}</div> : <div className="dx-empty"><Activity size={22}/><strong>No recent activity yet</strong><span>Create an invoice or add a customer to begin your timeline.</span></div>}
        </article>
      </section>
    </div>
  );
}

function TrendingIcon() { return <Activity size={18}/>; }
