import { useMemo, useRef, useState } from 'react';
import { Archive, Bell, Check, CirclePlus, Clock3, FileDown, FileUp, Heart, Pin, Plus, Search, StickyNote, Tags, Trash2, X } from 'lucide-react';
import { useData } from '../../data/DataContext';
import './NotesPage.css';

const colors = [
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'yellow', label: 'Yellow', value: '#fff8ca' },
  { id: 'blue', label: 'Blue', value: '#e7f2ff' },
  { id: 'green', label: 'Green', value: '#e9f7e9' },
  { id: 'pink', label: 'Pink', value: '#ffedf1' },
  { id: 'purple', label: 'Purple', value: '#f2ebff' },
];
const blank = () => ({ title: '', content: '', category: 'General', tagsText: '', color: 'white', pinned: false, favorite: false, archived: false, reminderAt: '', relatedType: '', relatedId: '' });
const fmtDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now';

function applyInline(textarea, setValue, startToken, endToken = startToken) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const source = textarea.value;
  const selected = source.slice(start, end) || 'text';
  const insert = `${startToken}${selected}${endToken}`;
  setValue(source.slice(0, start) + insert + source.slice(end));
  requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(start + startToken.length, start + startToken.length + selected.length); });
}

export default function NotesPage() {
  const { records = {}, createRecord, updateRecord, deleteRecord, loading } = useData();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All notes');
  const [sort, setSort] = useState('recent');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(blank());
  const [showEditor, setShowEditor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const textRef = useRef(null);
  const notes = records.notes || [];
  const categories = useMemo(() => ['General', ...new Set(notes.map(note => note.category).filter(Boolean))].filter((item, index, all) => all.indexOf(item) === index), [notes]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = notes.filter(note => {
      if (categoryFilter === 'Archived' ? !note.archived : note.archived) return false;
      if (categoryFilter === 'Favourites' && !note.favorite) return false;
      if (categoryFilter === 'Pinned' && !note.pinned) return false;
      if (!['All notes', 'Archived', 'Favourites', 'Pinned'].includes(categoryFilter) && note.category !== categoryFilter) return false;
      if (!normalized) return true;
      return `${note.title} ${note.content} ${note.category} ${(note.tags || []).join(' ')}`.toLowerCase().includes(normalized);
    });
    return rows.sort((a, b) => sort === 'title' ? String(a.title).localeCompare(String(b.title)) : sort === 'created' ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0) : Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [notes, query, categoryFilter, sort]);
  const openNew = () => { setEditingId(null); setDraft(blank()); setError(''); setShowEditor(true); };
  const openEdit = note => { setEditingId(note.id); setDraft({ title: note.title || '', content: note.content || '', category: note.category || 'General', tagsText: (note.tags || []).join(', '), color: note.color || 'white', pinned: Boolean(note.pinned), favorite: Boolean(note.favorite), archived: Boolean(note.archived), reminderAt: note.reminderAt ? String(note.reminderAt).slice(0, 16) : '', relatedType: note.relatedType || '', relatedId: note.relatedId || '' }); setError(''); setShowEditor(true); };
  const set = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  const save = async () => {
    if (!draft.title.trim() && !draft.content.trim()) { setError('Add a title or some note content before saving.'); return; }
    setBusy(true); setError('');
    const payload = { ...draft, title: draft.title.trim() || 'Untitled note', tags: draft.tagsText.split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 30), reminderAt: draft.reminderAt || null };
    delete payload.tagsText;
    try {
      if (editingId) await updateRecord('notes', editingId, payload);
      else await createRecord('notes', payload);
      setShowEditor(false);
    } catch (e) { setError(e.message || 'Could not save note. Please try again.'); }
    finally { setBusy(false); }
  };
  const toggleFlag = async (note, key) => { try { await updateRecord('notes', note.id, { [key]: !note[key] }); } catch (e) { setError(e.message); } };
  const archiveNote = async note => { try { await updateRecord('notes', note.id, { archived: !note.archived }); } catch (e) { setError(e.message); } };
  const removeNote = async note => { if (!window.confirm(`Permanently delete “${note.title || 'Untitled note'}”?`)) return; try { await deleteRecord('notes', note.id); } catch (e) { setError(e.message); } };
  const exportNotes = () => {
    const rows = filtered.map(({ title, content, category, tags, createdAt, updatedAt }) => ({ title, content, category, tags: (tags || []).join(', '), createdAt, updatedAt }));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'spyrix-notes.json'; a.click(); URL.revokeObjectURL(url);
  };
  const importNotes = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error('The file must contain an array of notes exported from SPYRIX.');
      for (const item of parsed.slice(0, 500)) await createRecord('notes', { title: String(item.title || 'Imported note').slice(0,180), content: String(item.content || '').slice(0,30000), category: String(item.category || 'Imported'), tags: Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',').map(t=>t.trim()).filter(Boolean), color: colors.some(c=>c.id===item.color) ? item.color : 'white' });
      setError('');
    } catch (e) { setError(e.message || 'Could not import this file.'); }
  };

  return <div className="notes-page">
    <header className="notes-hero"><div className="notes-hero-mark"><StickyNote size={25}/></div><div className="notes-hero-copy"><div className="notes-eyebrow">SPYRIX WORKSPACE / ORGANIZE</div><h1>Notes</h1><p>Capture ideas, keep client details close, and organize your daily work.</p></div><div className="notes-hero-actions"><label className="notes-button notes-button-quiet"><FileUp size={16}/> Import<input type="file" accept="application/json,.json" onChange={importNotes} hidden/></label><button className="notes-button notes-button-primary" onClick={openNew}><Plus size={17}/> New note</button></div></header>
    {error && <div className="notes-alert" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
    <section className="notes-toolbar"><div className="notes-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search notes, tags, content…" aria-label="Search notes"/>{query && <button onClick={()=>setQuery('')} aria-label="Clear search"><X size={14}/></button>}</div><div className="notes-toolbar-right"><label className="notes-select-label">Sort <select value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Recently edited</option><option value="created">Newest created</option><option value="title">Title A–Z</option></select></label><button className="notes-button notes-button-quiet" onClick={exportNotes}><FileDown size={15}/> Export</button></div></section>
    <div className="notes-layout"><aside className="notes-categories"><div className="notes-category-title">YOUR NOTES <span>{notes.filter(n=>!n.archived).length}</span></div>{[['All notes','All notes'],['Pinned','Pinned'],['Favourites','Favourites'],['Archived','Archived']].map(([label,value])=><button key={value} className={categoryFilter===value?'active':''} onClick={()=>setCategoryFilter(value)}>{label==='Pinned'?<Pin size={16}/>:label==='Favourites'?<Heart size={16}/>:label==='Archived'?<Archive size={16}/>:<StickyNote size={16}/>}<span>{label}</span><b>{value==='All notes'?notes.filter(n=>!n.archived).length:value==='Archived'?notes.filter(n=>n.archived).length:notes.filter(n=>n[value==='Pinned'?'pinned':value==='Favourites'?'favorite':value==='Archived'?'archived':'id'] && !n.archived).length}</b></button>)}<div className="notes-category-title notes-category-title-spaced">CATEGORIES</div>{categories.map(category=><button key={category} className={categoryFilter===category?'active':''} onClick={()=>setCategoryFilter(category)}><Tags size={15}/><span>{category}</span><b>{notes.filter(n=>n.category===category&&!n.archived).length}</b></button>)}<button className="notes-add-category" onClick={()=>{openNew();setDraft(d=>({...d,category:'New category'}));}}><CirclePlus size={15}/> New category</button><div className="notes-side-tip"><b>Quick tip</b><p>Use tags for projects, clients, and tasks. Pin the notes you need every day.</p></div></aside>
      <section className="notes-results"><div className="notes-results-head"><div><h2>{categoryFilter}</h2><p>{filtered.length} {filtered.length===1?'note':'notes'} {query?`matching “${query}”`:''}</p></div><button className="notes-create-inline" onClick={openNew}><Plus size={15}/> Create note</button></div>
        {loading ? <div className="notes-empty"><Clock3 size={25}/><b>Loading your notes</b><span>Getting the latest notes from your workspace…</span></div> : filtered.length ? <div className="notes-grid">{filtered.map(note=><article className={`note-card note-color-${note.color||'white'} ${note.pinned?'is-pinned':''}`} key={note.id} onDoubleClick={()=>openEdit(note)}><button className="note-card-main" onClick={()=>openEdit(note)} aria-label={`Edit ${note.title}`}><span className="note-card-kicker">{note.category||'General'}{note.pinned&&<Pin size={12} fill="currentColor"/>}</span><h3>{note.title||'Untitled note'}</h3><p>{(note.content||'No content yet').replace(/[#*_`>-]/g,' ').slice(0,230)}</p><span className="note-card-tags">{(note.tags||[]).slice(0,4).map(tag=><i key={tag}>{tag}</i>)}</span><span className="note-card-date">Edited {fmtDate(note.updatedAt||note.createdAt)}</span></button><div className="note-card-actions"><button className={note.favorite?'selected':''} onClick={()=>toggleFlag(note,'favorite')} title={note.favorite?'Remove favourite':'Favourite'}><Heart size={15} fill={note.favorite?'currentColor':'none'}/></button><button className={note.pinned?'selected':''} onClick={()=>toggleFlag(note,'pinned')} title={note.pinned?'Unpin':'Pin'}><Pin size={15} fill={note.pinned?'currentColor':'none'}/></button><button onClick={()=>archiveNote(note)} title={note.archived?'Restore':'Archive'}><Archive size={15}/></button><button className="note-delete" onClick={()=>removeNote(note)} title="Delete"><Trash2 size={15}/></button></div></article>)}</div> : <div className="notes-empty"><StickyNote size={27}/><b>{query?'No matching notes':'Start with a fresh note'}</b><span>{query?'Try another search term or category.':'Keep ideas, reminders, and customer details in one tidy workspace.'}</span>{!query&&<button className="notes-button notes-button-primary" onClick={openNew}><Plus size={16}/> Create your first note</button>}</div>}
      </section>
    </div>
    {showEditor && <div className="notes-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowEditor(false);}}><section className="notes-editor-modal" role="dialog" aria-modal="true" aria-labelledby="notes-editor-title"><header><div><span className="notes-modal-eyebrow">SPYRIX / NOTES</span><h2 id="notes-editor-title">{editingId?'Edit note':'Create a note'}</h2></div><button className="notes-close" onClick={()=>setShowEditor(false)} aria-label="Close editor"><X size={20}/></button></header><div className="notes-editor-body"><label className="notes-input-label">Title<input value={draft.title} onChange={e=>set('title',e.target.value)} placeholder="What is this note about?" autoFocus maxLength={180}/></label><div className="notes-format-toolbar"><button type="button" onClick={()=>applyInline(textRef.current,v=>set('content',v),'**')}><b>B</b></button><button type="button" onClick={()=>applyInline(textRef.current,v=>set('content',v),'_')}><i>I</i></button><button type="button" onClick={()=>{const ta=textRef.current;if(ta){const pos=ta.selectionStart;const val=draft.content;set('content',val.slice(0,pos)+'\n- [ ] '+val.slice(pos));requestAnimationFrame(()=>{ta.focus();ta.setSelectionRange(pos+6,pos+6);});}}}>☑ Checklist</button><span>Markdown supported</span></div><label className="notes-input-label">Note content<textarea ref={textRef} value={draft.content} onChange={e=>set('content',e.target.value)} rows={9} placeholder="Write your thoughts, meeting notes, tasks, or customer details…"/></label><div className="notes-editor-grid"><label className="notes-input-label">Category<input value={draft.category} onChange={e=>set('category',e.target.value)} list="notes-categories-list" placeholder="General"/><datalist id="notes-categories-list">{categories.map(cat=><option key={cat} value={cat}/>)}</datalist></label><label className="notes-input-label">Tags <input value={draft.tagsText} onChange={e=>set('tagsText',e.target.value)} placeholder="client, launch, follow-up"/></label><label className="notes-input-label">Reminder <input type="datetime-local" value={draft.reminderAt} onChange={e=>set('reminderAt',e.target.value)}/></label><label className="notes-input-label">Related to <select value={draft.relatedType} onChange={e=>{set('relatedType',e.target.value);set('relatedId','');}}><option value="">Not linked</option><option value="customer">Customer</option><option value="invoice">Invoice</option><option value="quotation">Quotation</option><option value="product">Product</option><option value="project">Project</option></select></label>{draft.relatedType && <label className="notes-input-label">Related record {draft.relatedType !== 'project' && <select value={draft.relatedId} onChange={e=>set('relatedId',e.target.value)}><option value="">Choose {draft.relatedType}</option>{(records[`${draft.relatedType}s`] || []).map(item=><option key={item.id} value={item.id}>{item.name || item.customerName || item.invoiceNumber || item.quotationNumber || item.title || 'Record'}{item.invoiceNumber && ` · ${item.invoiceNumber}`}{item.quotationNumber && ` · ${item.quotationNumber}`}</option>)}</select>}{draft.relatedType === 'project' && <input value={draft.relatedId} onChange={e=>set('relatedId',e.target.value)} placeholder="Project ID or name"/>}</label>}</div><div className="notes-colors"><b>Card colour</b>{colors.map(c=><button type="button" key={c.id} title={c.label} aria-label={c.label} aria-pressed={draft.color===c.id} className={draft.color===c.id?'selected':''} style={{'--note-color':c.value}} onClick={()=>set('color',c.id)} />)}</div><div className="notes-editor-toggles"><label><input type="checkbox" checked={draft.pinned} onChange={e=>set('pinned',e.target.checked)}/> Pin note</label><label><input type="checkbox" checked={draft.favorite} onChange={e=>set('favorite',e.target.checked)}/> Favourite</label><label><input type="checkbox" checked={draft.archived} onChange={e=>set('archived',e.target.checked)}/> Archive</label></div>{error&&<div className="notes-alert">{error}</div>}</div><footer><button className="notes-button notes-button-quiet" onClick={()=>setShowEditor(false)}>Cancel</button><button className="notes-button notes-button-primary" onClick={save} disabled={busy}><Check size={16}/>{busy?'Saving…':'Save note'}</button></footer></section></div>}
  </div>;
}
