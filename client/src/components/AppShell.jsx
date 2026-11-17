import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';
import { DataProvider } from '../data/DataContext';
import { SPYRIX_THEME_IDS, getInitialSpyrixTheme, persistSpyrixThemeChoice, getSpyrixThemeStyle } from '../themeConfig';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import InvoicesPage from '../pages/Invoices/InvoicesPage';
import InvoiceCreatorPage from '../pages/InvoiceCreator/InvoiceCreatorPage';
import TemplatesPage from '../pages/Templates/TemplatesPage';
import QuotationsPage from '../pages/Quotations/QuotationsPage';
import CustomersPage from '../pages/Customers/CustomersPage';
import ProductsPage from '../pages/Products/ProductsPage';
import InventoryPage from '../pages/Inventory/InventoryPage';
import PaymentsPage from '../pages/Payments/PaymentsPage';
import ExpensesPage from '../pages/Expenses/ExpensesPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import CalendarPage from '../pages/Calendar/CalendarPage';
import RecurringPage from '../pages/Recurring/RecurringPage';
import DocumentsPage from '../pages/Documents/DocumentsPage';
import NotificationsPage from '../pages/Notifications/NotificationsPage';
import DownloadsPage from '../pages/Downloads/DownloadsPage';
import BackupsPage from '../pages/Backups/BackupsPage';
import ImportsPage from '../pages/Imports/ImportsPage';
import BusinessSettingsPage from '../pages/BusinessSettings/BusinessSettingsPage';
import AccountSettingsPage from '../pages/AccountSettings/AccountSettingsPage';
import HelpPage from '../pages/Help/HelpPage';
import ToolsPage from '../pages/Tools/ToolsPage';
import AIAssistantPage from '../pages/AIAssistant/AIAssistantPage';
import NotesPage from '../pages/Notes/NotesPage';
import SpyrixLoader from './SpyrixLoader.jsx';
import FeedbackPage from '../pages/Feedback/FeedbackPage.jsx';

function AppShellContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [showPageLoader, setShowPageLoader] = useState(true);
  const loaderTimerRef = useRef(null);
  const runPageLoader = (duration = 600) => {
    window.clearTimeout(loaderTimerRef.current);
    setShowPageLoader(true);
    loaderTimerRef.current = window.setTimeout(() => setShowPageLoader(false), duration);
  };

  useEffect(() => {
    runPageLoader(600);
    return () => window.clearTimeout(loaderTimerRef.current);
  }, [location.pathname]);

  useEffect(() => {
    const onShowLoader = event => runPageLoader(Math.max(250, Number(event.detail?.duration) || 600));
    window.addEventListener('spyrix:show-loader', onShowLoader);
    return () => {
      window.removeEventListener('spyrix:show-loader', onShowLoader);
      window.clearTimeout(loaderTimerRef.current);
    };
  }, []);
  const { business, session, refreshSession } = useAuth();
  const allowedThemes = SPYRIX_THEME_IDS;
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('spyrix_theme');
    const preferred = saved || business?.theme;
    return getInitialSpyrixTheme(preferred);
  });

  const changeTheme = (nextTheme) => {
    if (!allowedThemes.includes(nextTheme)) return;
    setTheme(nextTheme);
    persistSpyrixThemeChoice(nextTheme);
    window.dispatchEvent(new CustomEvent('spyrix:theme-change', { detail: nextTheme }));
    if (localStorage.getItem('spyrix_token')) {
      apiRequest('/business/settings', { method: 'PUT', body: JSON.stringify({ theme: nextTheme }) })
        .then(() => refreshSession?.())
        .catch(() => { /* Local preference remains available if this account cannot edit workspace settings. */ });
    }
  };
  useEffect(() => {
    const handleThemeChange = event => {
      const nextTheme = event.detail;
      if (!allowedThemes.includes(nextTheme)) return;
      setTheme(nextTheme);
      persistSpyrixThemeChoice(nextTheme);
    };
    window.addEventListener('spyrix:theme-change', handleThemeChange);
    return () => window.removeEventListener('spyrix:theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    const preferred = localStorage.getItem('spyrix_theme') || business?.theme;
    const normalized = getInitialSpyrixTheme(preferred);
    setTheme(normalized);
    localStorage.setItem('spyrix_theme', normalized);
  }, [business?.id, business?.theme]);

  return (
    <div className="app-shell" data-theme={theme} style={getSpyrixThemeStyle(theme)}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} theme={theme} />
      <main className="main-area">
        <Topbar onOpenMenu={() => setMobileOpen(true)} theme={theme} onThemeChange={changeTheme} />
        <div className="page-content">
          <Routes>
            <Route path="dashboard" element={<DashboardPage theme={theme} />} />
            <Route path="ai-assistant" element={<AIAssistantPage />} />
            <Route path="invoices/new" element={<InvoiceCreatorPage />} />
            <Route path="invoices/*" element={<InvoicesPage />} />
            <Route path="templates/*" element={<TemplatesPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="recurring" element={<RecurringPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="downloads" element={<DownloadsPage />} />
            <Route path="backups" element={<BackupsPage />} />
            <Route path="imports" element={<ImportsPage />} />
            <Route path="business-settings" element={<BusinessSettingsPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </main>
      {showPageLoader && <SpyrixLoader className="workspace-loader" />}
    </div>
  );
}

export default function AppShell() {
  const { session } = useAuth();
  return <DataProvider><AppShellContent /></DataProvider>;
}
