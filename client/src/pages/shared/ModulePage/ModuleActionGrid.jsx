import {
  Activity, Archive, ArrowDownToLine, BarChart3, Bell, CalendarDays, CheckCircle2,
  CreditCard, Database, Download, FilePlus2, FileSpreadsheet, FileText, FolderOpen,
  LayoutTemplate, Package, Plus, RefreshCw, Search, ShieldCheck, SlidersHorizontal,
  Upload, Users, Wallet, Wrench,
} from 'lucide-react';
import './ModuleActionGrid.css';

const action = (id, title, detail, icon, type, value) => ({ id, title, detail, icon, type, value });

const moduleActions = {
  invoices: [
    action('create', 'Create invoice', 'Start a new customer bill', FilePlus2, 'create'),
    action('draft', 'Review drafts', 'Continue invoices not yet issued', FileText, 'filter', 'Draft'),
    action('issued', 'Issued invoices', 'Review sent and issued documents', CheckCircle2, 'filter', 'Issued'),
    action('partial', 'Part payments', 'Find invoices with a remaining balance', CreditCard, 'filter', 'Partially paid'),
    action('paid', 'Paid invoices', 'Review fully settled invoices', CheckCircle2, 'filter', 'Paid'),
    action('overdue', 'Overdue follow-up', 'Find balances past their due date', Activity, 'filter', 'Overdue'),
    action('design', 'Design templates', 'Choose your document appearance', LayoutTemplate, 'navigate', '/app/templates'),
    action('customers', 'Customer directory', 'Find saved billing details', Users, 'navigate', '/app/customers'),
    action('payments', 'Record payment', 'Allocate a customer collection', Wallet, 'navigate', '/app/payments'),
    action('export', 'Export register', 'Download the invoice list as CSV', Download, 'export'),
  ],
  customers: [
    action('create', 'Add customer', 'Save a reusable customer profile', Plus, 'create'),
    action('search', 'Find a customer', 'Search name, company, phone or GSTIN', Search, 'search'),
    action('active', 'Active customers', 'Show active customer profiles', Users, 'filter', 'Active'),
    action('invoice', 'Create invoice', 'Use a saved customer in an invoice', FilePlus2, 'navigate', '/app/invoices/new'),
    action('payment', 'Record payment', 'Review customer collections', Wallet, 'navigate', '/app/payments'),
    action('import', 'Import customers', 'Preview a customer CSV', FileSpreadsheet, 'navigate', '/app/imports'),
    action('export', 'Export directory', 'Download customer data as CSV', Download, 'export'),
    action('products', 'Product catalogue', 'Manage reusable products and rates', Package, 'navigate', '/app/products'),
    action('reports', 'Business reports', 'Review balances and collections', BarChart3, 'navigate', '/app/reports'),
    action('refresh', 'Refresh records', 'Reload workspace customer data', RefreshCw, 'refresh'),
  ],
  products: [
    action('create', 'Add product', 'Save an item or service', Plus, 'create'),
    action('search', 'Find a product', 'Search name, SKU or category', Search, 'search'),
    action('low', 'Low stock items', 'Filter products at their alert level', Package, 'filter', 'Low stock'),
    action('inventory', 'Stock overview', 'Review on-hand quantities', Package, 'navigate', '/app/inventory'),
    action('invoice', 'Use in an invoice', 'Add catalogue items to a customer bill', FilePlus2, 'navigate', '/app/invoices/new'),
    action('customers', 'Customer directory', 'Open customer accounts', Users, 'navigate', '/app/customers'),
    action('import', 'Import catalogue', 'Open the CSV import workflow', FileSpreadsheet, 'navigate', '/app/imports'),
    action('reports', 'Product reports', 'Review product and stock data', BarChart3, 'navigate', '/app/reports'),
    action('export', 'Export catalogue', 'Download product records as CSV', Download, 'export'),
    action('refresh', 'Refresh catalogue', 'Reload saved products and services', RefreshCw, 'refresh'),
  ],
  payments: [
    action('create', 'Record payment', 'Add a full or partial collection', Plus, 'create'),
    action('completed', 'Completed collections', 'Show saved completed payments', CheckCircle2, 'filter', 'Completed'),
    action('pending', 'Pending payments', 'Review payments awaiting completion', CreditCard, 'filter', 'Pending'),
    action('invoices', 'Invoice balances', 'Review unpaid customer invoices', FileText, 'navigate', '/app/invoices'),
    action('customers', 'Customer accounts', 'Find customer payment history', Users, 'navigate', '/app/customers'),
    action('expenses', 'Expense register', 'Compare money received and spent', Wallet, 'navigate', '/app/expenses'),
    action('reports', 'Collection reports', 'Analyse recorded cash collections', BarChart3, 'navigate', '/app/reports'),
    action('calendar', 'Due-date calendar', 'Review upcoming payment dates', CalendarDays, 'navigate', '/app/calendar'),
    action('export', 'Export payment history', 'Download payment records as CSV', Download, 'export'),
    action('refresh', 'Refresh payments', 'Reload the payment ledger', RefreshCw, 'refresh'),
  ],
  expenses: [
    action('create', 'Add expense', 'Record a business cost', Plus, 'create'),
    action('paid', 'Paid expenses', 'Review completed expense entries', CheckCircle2, 'filter', 'Paid'),
    action('unpaid', 'Unpaid expenses', 'Review expenses still to be paid', CreditCard, 'filter', 'Unpaid'),
    action('search', 'Find a vendor or expense', 'Search title, vendor or category', Search, 'search'),
    action('payments', 'Payment ledger', 'Open received customer payments', Wallet, 'navigate', '/app/payments'),
    action('reports', 'Expense analysis', 'Compare spending with collections', BarChart3, 'navigate', '/app/reports'),
    action('calendar', 'Expense dates', 'Review dates alongside invoice due dates', CalendarDays, 'navigate', '/app/calendar'),
    action('documents', 'Business documents', 'Open saved invoices and records', FolderOpen, 'navigate', '/app/documents'),
    action('export', 'Export expense register', 'Download expense data as CSV', Download, 'export'),
    action('refresh', 'Refresh expenses', 'Reload expense records', RefreshCw, 'refresh'),
  ],
  inventory: [
    action('products', 'Manage products', 'Update SKU, price and stock threshold', Package, 'navigate', '/app/products'),
    action('low', 'Low-stock report', 'Download items at or below alert level', FileSpreadsheet, 'report', 'low-stock'),
    action('out', 'Out-of-stock report', 'Download products with zero stock', Archive, 'report', 'out-of-stock'),
    action('search', 'Find stock item', 'Search products by name or SKU', Search, 'search'),
    action('invoice', 'Create invoice', 'Use catalogue items in a customer invoice', FilePlus2, 'navigate', '/app/invoices/new'),
    action('import', 'Import product list', 'Open the CSV import centre', Upload, 'navigate', '/app/imports'),
    action('reports', 'Inventory analytics', 'Review stock and sales summaries', BarChart3, 'navigate', '/app/reports'),
    action('alerts', 'Stock alerts', 'Review items needing attention', Bell, 'navigate', '/app/notifications'),
    action('export', 'Export stock list', 'Download all product quantities', Download, 'report', 'stock'),
    action('refresh', 'Refresh stock', 'Reload quantities from the workspace', RefreshCw, 'refresh'),
  ],
  reports: [
    action('cash', 'Collections report', 'Export recorded completed payments', FileSpreadsheet, 'report', 'collections'),
    action('invoice', 'Invoice register', 'Export invoices and statuses', FileText, 'report', 'invoice-register'),
    action('outstanding', 'Outstanding balances', 'Export open invoice balances', Activity, 'report', 'outstanding'),
    action('expenses', 'Expense register', 'Export paid and unpaid expenses', Wallet, 'report', 'expenses'),
    action('customers', 'Customer directory', 'Export customer records', Users, 'report', 'customers'),
    action('products', 'Product catalogue', 'Export products and services', Package, 'report', 'products'),
    action('stock', 'Stock snapshot', 'Export current stock on hand', Package, 'report', 'stock'),
    action('tax', 'Tax summary', 'Export saved invoice tax totals', FileSpreadsheet, 'report', 'tax'),
    action('downloads', 'Download centre', 'Open generated export workflows', Download, 'navigate', '/app/downloads'),
    action('refresh', 'Refresh analytics', 'Reload workspace figures', RefreshCw, 'refresh'),
  ],
  calendar: [
    action('new', 'Create invoice', 'Add a new dated customer invoice', FilePlus2, 'navigate', '/app/invoices/new'),
    action('invoices', 'Invoice register', 'Review issued and draft invoices', FileText, 'navigate', '/app/invoices'),
    action('payments', 'Record collection', 'Allocate a payment to an invoice', Wallet, 'navigate', '/app/payments'),
    action('expenses', 'Add expense', 'Record a dated business expense', Plus, 'navigate', '/app/expenses'),
    action('customers', 'Customer directory', 'Find customer contact details', Users, 'navigate', '/app/customers'),
    action('reports', 'Due-date reporting', 'Review collection and balance metrics', BarChart3, 'navigate', '/app/reports'),
    action('notifications', 'Business reminders', 'Review overdue and low-stock alerts', Bell, 'navigate', '/app/notifications'),
    action('downloads', 'Download centre', 'Open exports and saved files', Download, 'navigate', '/app/downloads'),
    action('export', 'Export due dates', 'Download open invoices with due dates', Download, 'report', 'due-dates'),
    action('refresh', 'Refresh calendar', 'Reload invoice dates and balances', RefreshCw, 'refresh'),
  ],
  documents: [
    action('invoice', 'Create invoice', 'Generate a new customer document', FilePlus2, 'navigate', '/app/invoices/new'),
    action('records', 'Invoice records', 'Open saved invoice details', FileText, 'navigate', '/app/invoices'),
    action('templates', 'Choose template', 'Set the default invoice appearance', LayoutTemplate, 'navigate', '/app/templates'),
    action('customers', 'Customer details', 'Find saved billing information', Users, 'navigate', '/app/customers'),
    action('downloads', 'Download centre', 'Review generated files', Download, 'navigate', '/app/downloads'),
    action('payments', 'Payment receipts', 'Open allocated payment records', CreditCard, 'navigate', '/app/payments'),
    action('reports', 'Document summary', 'Review document-related metrics', BarChart3, 'navigate', '/app/reports'),
    action('imports', 'Import records', 'Open supported CSV imports', FileSpreadsheet, 'navigate', '/app/imports'),
    action('backups', 'Backup records', 'Create a workspace JSON snapshot', Database, 'navigate', '/app/backups'),
    action('refresh', 'Refresh library', 'Reload saved business documents', RefreshCw, 'refresh'),
  ],
  downloads: [
    action('invoices', 'Invoice register', 'Export invoice records', FileText, 'report', 'invoice-register'),
    action('customers', 'Customer list', 'Export customer records', Users, 'report', 'customers'),
    action('products', 'Product list', 'Export catalogue data', Package, 'report', 'products'),
    action('payments', 'Payment history', 'Export recorded collections', CreditCard, 'report', 'collections'),
    action('expenses', 'Expense register', 'Export expense entries', Wallet, 'report', 'expenses'),
    action('outstanding', 'Outstanding balances', 'Export open invoice balances', Activity, 'report', 'outstanding'),
    action('stock', 'Inventory snapshot', 'Export current product quantities', Package, 'report', 'stock'),
    action('tax', 'Tax summary', 'Export saved tax values from invoices', FileSpreadsheet, 'report', 'tax'),
    action('backup', 'JSON backup', 'Download a structured data snapshot', Database, 'report', 'backup'),
    action('refresh', 'Refresh download options', 'Reload current workspace data', RefreshCw, 'refresh'),
  ],
  imports: [
    action('upload', 'Upload CSV', 'Jump to the import preview area', Upload, 'scroll', 'import-panel'),
    action('customers', 'Customer import', 'Review customer field requirements', Users, 'navigate', '/app/customers'),
    action('products', 'Product catalogue', 'Open product records', Package, 'navigate', '/app/products'),
    action('expenses', 'Expense records', 'Open the expense module', Wallet, 'navigate', '/app/expenses'),
    action('template', 'Customer CSV template', 'Download a ready-to-fill CSV header', FileSpreadsheet, 'report', 'customer-template'),
    action('downloads', 'Import results', 'Open the download centre', Download, 'navigate', '/app/downloads'),
    action('backup', 'Backup first', 'Create a safe data snapshot', ShieldCheck, 'navigate', '/app/backups'),
    action('invoices', 'Invoice register', 'Review existing invoice records', FileText, 'navigate', '/app/invoices'),
    action('inventory', 'Stock overview', 'Review current product quantities', Package, 'navigate', '/app/inventory'),
    action('help', 'Import guidance', 'Read supported CSV guidance', Wrench, 'navigate', '/app/help'),
  ],
  backups: [
    action('snapshot', 'Create JSON backup', 'Download records currently loaded', Database, 'report', 'backup'),
    action('imports', 'Import centre', 'Review and import supported CSV data', FileSpreadsheet, 'navigate', '/app/imports'),
    action('downloads', 'Download centre', 'Open exported files', Download, 'navigate', '/app/downloads'),
    action('customers', 'Customer records', 'Review customer data', Users, 'navigate', '/app/customers'),
    action('products', 'Product records', 'Review catalogue and inventory', Package, 'navigate', '/app/products'),
    action('invoices', 'Invoice history', 'Review saved financial documents', FileText, 'navigate', '/app/invoices'),
    action('payments', 'Payment history', 'Review recorded collections', CreditCard, 'navigate', '/app/payments'),
    action('expenses', 'Expense history', 'Review recorded expenses', Wallet, 'navigate', '/app/expenses'),
    action('help', 'Backup guidance', 'Understand supported backup coverage', ShieldCheck, 'navigate', '/app/help'),
  ],
  notifications: [
    action('invoices', 'Overdue invoices', 'Open invoice balances and statuses', FileText, 'navigate', '/app/invoices'),
    action('inventory', 'Low-stock items', 'Review stock needing attention', Package, 'navigate', '/app/inventory'),
    action('payments', 'Recent collections', 'Review recorded payments', CreditCard, 'navigate', '/app/payments'),
    action('calendar', 'Billing calendar', 'Review upcoming due dates', CalendarDays, 'navigate', '/app/calendar'),
    action('customers', 'Customer accounts', 'Find customer contact details', Users, 'navigate', '/app/customers'),
    action('reports', 'Business reports', 'Review collection and balance data', BarChart3, 'navigate', '/app/reports'),
    action('expenses', 'Expense register', 'Review business spending', Wallet, 'navigate', '/app/expenses'),
    action('documents', 'Document library', 'Open saved invoices and documents', FolderOpen, 'navigate', '/app/documents'),
    action('downloads', 'Download reports', 'Open exported files', Download, 'navigate', '/app/downloads'),
    action('refresh', 'Refresh alerts', 'Recalculate alerts from loaded records', RefreshCw, 'refresh'),
  ],
  recurring: [
    action('new', 'Create an invoice', 'Start a new customer invoice', FilePlus2, 'navigate', '/app/invoices/new'),
    action('invoice-list', 'Invoice register', 'Review saved invoices and statuses', FileText, 'navigate', '/app/invoices'),
    action('customers', 'Customer accounts', 'Choose customers for repeat work', Users, 'navigate', '/app/customers'),
    action('templates', 'Invoice templates', 'Set up document branding', LayoutTemplate, 'navigate', '/app/templates'),
    action('payments', 'Payment history', 'Review collections against invoices', CreditCard, 'navigate', '/app/payments'),
    action('calendar', 'Billing calendar', 'Review planned dates and due items', CalendarDays, 'navigate', '/app/calendar'),
    action('reports', 'Collection reports', 'Monitor repeat customer collections', BarChart3, 'navigate', '/app/reports'),
    action('documents', 'Document library', 'Open saved business documents', FolderOpen, 'navigate', '/app/documents'),
    action('downloads', 'Export records', 'Download your business data', Download, 'navigate', '/app/downloads'),
    action('refresh', 'Refresh schedules', 'Reload workspace records', RefreshCw, 'refresh'),
  ],
  settings: [
    action('theme', 'Workspace theme', 'Choose one of six SPYRIX themes', SlidersHorizontal, 'scroll', 'settings-theme-panel'),
    action('profile', 'Account profile', 'Open personal account details', Users, 'navigate', '/app/settings'),
    action('account', 'Account security', 'Review your profile and access settings', SlidersHorizontal, 'navigate', '/app/settings'),
    action('templates', 'Invoice branding', 'Choose or preview invoice designs', LayoutTemplate, 'navigate', '/app/templates'),
    action('backup', 'Create a backup', 'Download records before making changes', ShieldCheck, 'navigate', '/app/backups'),
    action('imports', 'Import records', 'Open supported CSV import options', FileSpreadsheet, 'navigate', '/app/imports'),
    action('downloads', 'Download centre', 'Open exported files', Download, 'navigate', '/app/downloads'),
    action('help', 'Help centre', 'Read product workflow guidance', Wrench, 'navigate', '/app/help'),
    action('notifications', 'Business alerts', 'Open account and record notifications', Bell, 'navigate', '/app/notifications'),
    action('refresh', 'Refresh workspace', 'Reload the latest workspace data', RefreshCw, 'refresh'),
  ],
  help: [
    action('invoice', 'Invoice guide', 'Open the invoice creation workflow', FileText, 'navigate', '/app/invoices'),
    action('customers', 'Customer guide', 'Review saved customer details', Users, 'navigate', '/app/customers'),
    action('products', 'Product guide', 'Review the product catalogue', Package, 'navigate', '/app/products'),
    action('inventory', 'Stock guide', 'Review quantities and stock alerts', Package, 'navigate', '/app/inventory'),
    action('payments', 'Payment guide', 'Open the payment ledger', CreditCard, 'navigate', '/app/payments'),
    action('expenses', 'Expense guide', 'Open business expenses', Wallet, 'navigate', '/app/expenses'),
    action('reports', 'Reports guide', 'Review the reporting workspace', BarChart3, 'navigate', '/app/reports'),
    action('templates', 'Design guide', 'Customise your invoice appearance', LayoutTemplate, 'navigate', '/app/templates'),
    action('imports', 'Import guide', 'Review supported CSV imports', FileSpreadsheet, 'navigate', '/app/imports'),
    action('downloads', 'Export guide', 'Open generated downloads', Download, 'navigate', '/app/downloads'),
  ],
  tools: [
    action('invoice', 'Create invoice', 'Prepare a customer invoice', FilePlus2, 'navigate', '/app/invoices/new'),
    action('customer', 'Add customer', 'Save customer billing information', Users, 'navigate', '/app/customers'),
    action('product', 'Add product', 'Update your reusable catalogue', Package, 'navigate', '/app/products'),
    action('inventory', 'Manage stock', 'Review on-hand product quantities', Package, 'navigate', '/app/inventory'),
    action('payment', 'Record payment', 'Add a customer collection', CreditCard, 'navigate', '/app/payments'),
    action('expense', 'Add expense', 'Record a business cost', Wallet, 'navigate', '/app/expenses'),
    action('reports', 'View reports', 'Review collections and balances', BarChart3, 'navigate', '/app/reports'),
    action('calendar', 'Billing calendar', 'View upcoming invoice dates', CalendarDays, 'navigate', '/app/calendar'),
    action('templates', 'Invoice design', 'Choose and customise templates', LayoutTemplate, 'navigate', '/app/templates'),
    action('downloads', 'Download centre', 'Export current business records', Download, 'navigate', '/app/downloads'),
  ],
};

export default function ModuleActionGrid({ section, navigate, onCreate, onExport, onRefresh, onSearch, onFilter, onReportExport }) {
  const baseItems = moduleActions[section] || moduleActions.notifications;
  const extraAction = section === 'help'
    ? action('dashboard-overview', 'Dashboard overview', 'Return to your business snapshot', Activity, 'navigate', '/app/dashboard')
    : action('workflow-guide', 'Workflow guide', 'Open help and product guidance', Wrench, 'navigate', '/app/help');
  const items = [...baseItems, extraAction];
  const run = item => {
    switch (item.type) {
      case 'create': onCreate?.(); break;
      case 'export': onExport?.(); break;
      case 'refresh': onRefresh?.(); break;
      case 'search': onSearch?.(); break;
      case 'filter': onFilter?.(item.value); break;
      case 'report': onReportExport?.(item.value); break;
      case 'scroll': document.getElementById(item.value)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); break;
      case 'navigate': navigate(item.value); break;
      default: break;
    }
  };
  return (
    <section className="module-action-hub" aria-label="Business workflow actions">
      <header className="module-action-hub-head">
        <div><span>WORKFLOW SHORTCUTS</span><h2>Tools to move work forward</h2><p>Each shortcut opens a working screen, applies a filter or downloads workspace data.</p></div>
        <strong>11 ACTIONS</strong>
      </header>
      <div className="module-action-grid">
        {items.map(item => {
          const Icon = item.icon;
          return <button className="module-action-card" type="button" key={item.id} onClick={() => run(item)}><span className="module-action-icon"><Icon size={19}/></span><span className="module-action-copy"><b>{item.title}</b><small>{item.detail}</small></span><span className="module-action-arrow"><ArrowDownToLine size={14}/></span></button>;
        })}
      </div>
    </section>
  );
}
