import { Navigate, useLocation } from 'react-router-dom';
import TemplateSelection from './TemplateSelection';
import { templatesPageConfig } from './page.config.js';

export default function TemplatesPage() {
  const { pathname } = useLocation();
  const isGallery = pathname === templatesPageConfig.routeBase || pathname === `${templatesPageConfig.routeBase}/`;
  // The gallery is for choosing/previewing designs; all editing lives in Create Invoice.
  return isGallery ? <TemplateSelection /> : <Navigate to={templatesPageConfig.routeBase} replace />;
}
