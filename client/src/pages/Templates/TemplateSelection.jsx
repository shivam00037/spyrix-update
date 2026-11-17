import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, FilePlus2, LayoutGrid, Monitor, Search, Smartphone, Sparkles } from 'lucide-react';
import { defaultInvoiceDesign, invoiceTemplates, loadInvoiceDesign, saveInvoiceDesign } from '../Invoices/invoiceDesign';
import TemplatePreviewStage, { templateSampleData } from './TemplatePreviewStage';
import './TemplateSelection.css';

const categories = ['All', 'Manufacturing', 'Red', 'Green', 'Blue', 'Purple', 'Orange', 'Dark', 'Minimal'];

function makeTemplateDesign(current, template) {
  return {
    ...defaultInvoiceDesign,
    ...current,
    templateId: template.id,
    accentColor: template.color,
    fontFamily: template.font,
    customTemplateId: '',
    textOverrides: {},
  };
}

export default function TemplateSelection() {
  const navigate = useNavigate();
  const [design, setDesign] = useState(() => loadInvoiceDesign());
  const initialTemplate = invoiceTemplates.find(item => item.id === design.templateId) || invoiceTemplates[0];
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
  const [activeTab, setActiveTab] = useState('gallery');
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [device, setDevice] = useState('desktop');

  const visibleTemplates = useMemo(() => invoiceTemplates.filter(template =>
    (filter === 'All' || template.category === filter) &&
    `${template.name} ${template.description} ${template.category}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [filter, query]);

  const chooseTemplate = template => {
    const next = makeTemplateDesign(design, template);
    setSelectedTemplate(template);
    setDesign(next);
    saveInvoiceDesign(next);
    setActiveTab('preview');
  };

  const openGallery = () => setActiveTab('gallery');
  const createInvoice = () => {
    const next = makeTemplateDesign(design, selectedTemplate);
    saveInvoiceDesign(next);
    navigate('/app/invoices/new');
  };
  const pagePreviewData = templateSampleData({ ...design, ...makeTemplateDesign(design, selectedTemplate) });
  const currentDesign = { ...pagePreviewData.design, ...makeTemplateDesign(design, selectedTemplate) };

  return <div className={`module-page template-gallery-v2 ${activeTab === 'preview' ? 'is-preview-mode' : ''}`}>
    <div className="module-breadcrumb">Workspace <span>›</span> <strong>Invoice templates</strong></div>
    <header className="template-gallery-hero">
      <div className="template-gallery-hero-copy">
        <div className="template-gallery-kicker"><Sparkles size={14}/> SPYRIX DESIGN COLLECTION</div>
        <h1>Find the invoice that fits your brand.</h1>
        <p>21 full invoice designs. Every card shows the actual document layout, not a placeholder image.</p>
        <div className="template-gallery-stat-row"><span><b>21</b> live designs</span><span><b>1</b> original default preserved</span><span><b>20</b> new layouts</span></div>
      </div>
      <div className="template-gallery-hero-art" aria-hidden="true">
        <div className="template-art-sheet sheet-back"><i/><i/><i/><b/></div>
        <div className="template-art-sheet sheet-front"><span>SPYRIX</span><strong>INVOICE</strong><i/><i/><i/><b/></div>
        <div className="template-art-orbit orbit-one"/><div className="template-art-orbit orbit-two"/>
      </div>
    </header>

    <nav className="template-view-tabs" aria-label="Template page views">
      <button type="button" className={activeTab === 'gallery' ? 'active' : ''} onClick={openGallery}><LayoutGrid size={16}/> Gallery <span>21</span></button>
      <button type="button" className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}><Eye size={16}/> Preview <span>{selectedTemplate.name}</span></button>
      <div className="template-view-tabs-spacer"/>
      <div className="template-gallery-selected-label"><span/> Selected: <b>{selectedTemplate.name}</b></div>
    </nav>

    {activeTab === 'gallery' ? <>
      <section className="template-gallery-tools">
        <label className="template-gallery-search"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search invoice designs" aria-label="Search invoice designs"/><kbd>{visibleTemplates.length} / 21</kbd></label>
        <div className="template-gallery-filters" aria-label="Filter by design style">{categories.map(category => <button type="button" key={category} className={filter === category ? 'active' : ''} onClick={() => setFilter(category)}>{category}</button>)}</div>
      </section>
      <section className="template-live-grid" aria-label="Live invoice template previews">
        {visibleTemplates.map((template, index) => {
          const cardDesign = { ...currentDesign, templateId: template.id, accentColor: template.color, fontFamily: template.font };
          return <article className={`template-live-card ${selectedTemplate.id === template.id ? 'is-current' : ''}`} key={template.id}>
            <button type="button" className="template-live-card-open" onClick={() => chooseTemplate(template)} aria-label={`Preview ${template.name}`}>
              <div className="template-live-card-paper"><TemplatePreviewStage template={template} design={cardDesign} mode="tile"/></div>
              <span className="template-live-number">{String(index + 1).padStart(2, '0')}</span>
              {template.id === 'xenmark' && <span className="template-default-label">ORIGINAL DEFAULT</span>}
              {selectedTemplate.id === template.id && <span className="template-live-selected"><Check size={13}/> Selected</span>}
              <span className="template-live-hover"><Eye size={15}/> View full invoice</span>
            </button>
            <div className="template-live-card-info"><div><span>{template.category}</span><h3>{template.name}</h3><p>{template.description}</p></div><button type="button" onClick={() => chooseTemplate(template)} aria-label={`Select ${template.name}`}><ArrowRight size={17}/></button></div>
          </article>;
        })}
      </section>
      {!visibleTemplates.length && <div className="template-gallery-empty">No designs match that search. Try another name or style.</div>}
    </> : <section className={`template-full-preview template-device-${device}`}>
      <header className="template-preview-heading">
        <div><button type="button" onClick={openGallery}><ArrowLeft size={16}/> All templates</button><div><span>{selectedTemplate.category} DESIGN</span><h2>{selectedTemplate.name}</h2><p>{selectedTemplate.description}</p></div></div>
        <div className="template-device-switch" aria-label="Preview device"><button type="button" className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={16}/> PC</button><button type="button" className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={16}/> Mobile</button></div>
      </header>
      <div className="template-full-preview-canvas">
        <div className="template-full-preview-device"><TemplatePreviewStage template={selectedTemplate} design={currentDesign} {...pagePreviewData} mode="fit"/></div>
      </div>
      <footer className="template-preview-footer"><div><span>READY TO USE</span><b>{selectedTemplate.name}</b><small>The created invoice opens with this exact design and live editing enabled.</small></div><button type="button" onClick={createInvoice}>Create invoice <ArrowRight size={17}/></button></footer>
    </section>}
  </div>;
}
