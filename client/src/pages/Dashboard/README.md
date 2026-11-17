# Dashboard Page

- `DashboardPage.jsx` — dashboard data, KPI values, quick actions and banner slide content.
- `DashboardPage.css` — the original dashboard layout and banner design. **Keep the `.db-hero`, `.db-banner-*` and banner artwork rules unchanged** when updating dashboard cards.
- `DashboardTheme.css` — isolated theme overrides for dashboard KPI cards only. Edit this file to change the KPI card accent without touching the banner.
- `page.config.js` — page identity and accessible label.

The dashboard banner layout, artwork, slide colours, controls and animation have been preserved. The workspace's selected burgundy accent is read by the banner's existing theme variables; the banner CSS and markup have not been edited.

KPI values are calculated from records provided by `DataContext`: active customer records, completed payments, outstanding invoice balances and paid invoices. No trend percentage is fabricated.
