import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'business-settings',
  className: 'business-settings-page',
  title: 'Business Settings',
});
const pageStyles = String.raw`/* BusinessSettings only. Add selectors here without affecting other modules. */
.business-settings-page {
  --page-local-accent: var(--accent);
}
`;

export default function BusinessSettingsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
