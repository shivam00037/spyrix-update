import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'notifications',
  className: 'notifications-page',
  title: 'Notifications',
});
const pageStyles = String.raw`/* Notifications only. Add selectors here without affecting other modules. */
.notifications-page {
  --page-local-accent: var(--accent);
}
`;

export default function NotificationsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
