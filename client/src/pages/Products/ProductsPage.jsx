import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'products',
  className: 'products-page',
  title: 'Products',
});
const pageStyles = String.raw`/* Products only. Add selectors here without affecting other modules. */
.products-page {
  --page-local-accent: var(--accent);
}
`;

export default function ProductsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
