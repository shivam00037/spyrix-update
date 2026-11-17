import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'quotations',
  className: 'quotations-page',
  title: 'Quotations',
});
const pageStyles = String.raw`/* Quotations only. Add selectors here without affecting other modules. */
.quotations-page {
  --page-local-accent: var(--accent);
}
`;

export default function QuotationsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
