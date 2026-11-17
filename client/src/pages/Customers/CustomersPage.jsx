import ModulePage from '../shared/ModulePage/ModulePage';

// The customer dashboard uses the same app shell and monochrome reference layout
// as the other workspace pages. Keep this wrapper separate for easy page editing.
export default function CustomersPage() {
  return <ModulePage sectionOverride="customers" pageClassName="customers-page" />;
}
