import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'payments',
  className: 'payments-page',
  title: 'Payments',
});
const pageStyles = String.raw`/* Payments only. Add selectors here without affecting other modules. */
.payments-page {
  --page-local-accent: var(--accent);
}
`;

export default function PaymentsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
