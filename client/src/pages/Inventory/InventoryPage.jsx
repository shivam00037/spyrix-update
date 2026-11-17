import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'inventory',
  className: 'inventory-page',
  title: 'Inventory',
});
const pageStyles = String.raw`/* Inventory only. Add selectors here without affecting other modules. */
.inventory-page {
  --page-local-accent: var(--accent);
}
`;

export default function InventoryPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
