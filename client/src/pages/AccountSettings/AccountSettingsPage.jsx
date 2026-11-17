import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'settings',
  className: 'settings-page',
  title: 'Account Settings',
});
const pageStyles = String.raw`/* AccountSettings only. Add selectors here without affecting other modules. */
.settings-page {
  --page-local-accent: var(--accent);
}
`;

export default function AccountSettingsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
