import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'reports',
  className: 'reports-page',
  title: 'Reports',
});
const pageStyles = String.raw`/* Reports only. Add selectors here without affecting other modules. */
.reports-page {
  --page-local-accent: var(--accent);
}
`;

export default function ReportsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
