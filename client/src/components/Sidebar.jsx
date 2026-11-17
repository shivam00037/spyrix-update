import { NavLink, useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';
import './Sidebar.css';
import {
  Home, FileText, LayoutTemplate, Users, Package, Boxes,
  CreditCard, Wallet, ChartNoAxesCombined, CalendarDays, Folder, Bot,
  Bell, Download, Database, Settings, CircleHelp, X, WandSparkles, UserRound,
  ClipboardList, RefreshCw, MoreHorizontal, StickyNote, MessageSquareText,
} from 'lucide-react';

const primary = [
  ['Dashboard', '/app/dashboard', Home],
  ['Invoices', '/app/invoices', FileText],
  ['Customers', '/app/customers', Users],
  ['Products', '/app/products', Package],
  ['Inventory', '/app/inventory', Boxes],
  ['Templates', '/app/templates', LayoutTemplate],
  ['Reports', '/app/reports', ChartNoAxesCombined],
  ['Calendar', '/app/calendar', CalendarDays],
  ['Brand Studio', '/app/tools', WandSparkles],
  ['AI Assistant', '/app/ai-assistant', Bot],
  ['Notes', '/app/notes', StickyNote],
  ['Settings', '/app/settings', Settings],
  ['Profile', '/app/business-settings', UserRound],
  ['Feedback', '/app/feedback', MessageSquareText],
];
const more = [
  ['Payments', '/app/payments', CreditCard],
  ['Expenses', '/app/expenses', Wallet],
  ['Quotations', '/app/quotations', ClipboardList],
  ['Recurring Invoices', '/app/recurring', RefreshCw],
  ['Documents', '/app/documents', Folder],
  ['Downloads', '/app/downloads', Download],
  ['Notifications', '/app/notifications', Bell],
  ['Backup & Restore', '/app/backups', Database],
  ['Import Data', '/app/imports', Database],
  ['Help & Support', '/app/help', CircleHelp],
];

function NavGroup({ items, onNavigate }) {
  return items.map(([label, to, Icon]) => (
    <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <Icon size={19} strokeWidth={2.2} /><span>{label}</span>{to === '/app/dashboard' && <span className="nav-chevron">›</span>}
    </NavLink>
  ));
}

export default function Sidebar({ mobileOpen, onClose, theme = 'neon-green' }) {
  const navigate = useNavigate();
  const openDashboardFromLogo = () => {
    window.dispatchEvent(new CustomEvent('spyrix:show-loader', { detail: { duration: 600 } }));
    navigate('/app/dashboard');
    onClose?.();
  };
  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand"><button type="button" className="sidebar-brand-home" aria-label="Go to SPYRIX dashboard" onClick={openDashboardFromLogo}><BrandLogo theme={theme} surface="dark" className="sidebar-brand-logo" /></button><button className="sidebar-close" onClick={onClose} aria-label="Close menu"><X size={20} /></button></div>
        <nav className="sidebar-nav">
          <NavGroup items={primary} onNavigate={onClose} />
          <details className="sidebar-more">
            <summary><MoreHorizontal size={18} /><span>More workspace</span><span className="sidebar-more-chevron">⌄</span></summary>
            <div className="sidebar-more-list"><NavGroup items={more} onNavigate={onClose} /></div>
          </details>
        </nav>
        <div className="sidebar-growth"><img className="growth-spyrix-mark" src="/assets/branding/spyrix-master-lockup.png" alt="SPYRIX" /><div className="growth-copy"><strong>Grow Your Business</strong><span>Smarter. Stronger. Bigger.</span></div></div>
      </aside>
    </>
  );
}
