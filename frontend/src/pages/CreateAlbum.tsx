import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Field } from '../components/Field';
import { useAsync } from '../hooks/useAsync';
import { request } from '../services/api';
import { albumService } from '../services/album.service';
import type { Album } from '../types/album';

type Category = { id: string; name: string };
type DraftSlot = { id?: string; prompt: string };
type DraftPage = { id?: string; title: string; slots: DraftSlot[] };

function blankPage(index: number): DraftPage {
  return { title: `Página ${index}`, slots: [{ prompt: '' }] };
}

export function CreateAlbum() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [album, setAlbum] = useState<Album>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [status, setStatus] = useState('ACTIVE');
  const [pages, setPages] = useState<DraftPage[]>([blankPage(1)]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useAsync(async () => {
    return (await request<{ categories: Category[] }>('/categories')).categories;
  }, []);

  useEffect(() => {
    if (!id) return;
    void albumService.getById(id).then((loaded) => {
      setAlbum(loaded);
      setTitle(loaded.title);
      setDescription(loaded.description ?? '');
      setCategoryId(loaded.category.id);
      setPrivacy(loaded.privacy);
      setStatus(loaded.status);
      setPages((loaded.pages ?? []).map((page) => ({
        id: page.id,
        title: page.title || `Página ${page.pageNumber}`,
        slots: page.photoSlots.map((slot) => ({ id: slot.id, prompt: slot.prompt })),
      })));
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el álbum.'));
  }, [id]);

  function updatePage(index: number, update: Partial<DraftPage>) {
    setPages((items) => items.map((page, pageIndex) => pageIndex === index ? { ...page, ...update } : page));
  }
  function updateSlot(pageIndex: number, slotIndex: number, prompt: string) {
    setPages((items) => items.map((page, index) => index === pageIndex
      ? { ...page, slots: page.slots.map((slot, itemIndex) => itemIndex === slotIndex ? { ...slot, prompt } : slot) }
      : page));
  }
  function movePage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    setPages((items) => {
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function moveSlot(pageIndex: number, slotIndex: number, direction: -1 | 1) {
    const target = slotIndex + direction;
    setPages((items) => items.map((page, index) => {
      if (index !== pageIndex || target < 0 || target >= page.slots.length) return page;
      const slots = [...page.slots];
      [slots[slotIndex], slots[target]] = [slots[target], slots[slotIndex]];
      return { ...page, slots };
    }));
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const structure = {
        pages: pages.map((page) => ({
          ...(page.id ? { id: page.id } : {}),
          title: page.title.trim(),
          slots: page.slots.map((slot) => ({ ...(slot.id ? { id: slot.id } : {}), prompt: slot.prompt.trim() })),
        })),
      };
      if (editing && id) {
        await albumService.update(id, { title: title.trim(), description: description.trim() || null, categoryId, privacy, status, structure });
        navigate(`/albums/${id}`);
      } else {
        const response = await request<{ album: { id: string } }>('/albums', {
          method: 'POST',
          body: JSON.stringify({ title: title.trim(), description: description.trim() || null, categoryId, privacy, status, structure }),
        });
        navigate(`/albums/${response.album.id}`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el álbum.');
    } finally {
      setSaving(false);
    }
  }

  if (editing && !album && !error) return <section className="state-message">Cargando álbum...</section>;
  return <section className="form-page"><form className="form-card album-editor" onSubmit={(event) => void submit(event)}>
    <h1>{editing ? 'Editar álbum' : 'Crear álbum'}</h1>
    <Field label="Título" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
    <label className="field"><span>Descripción</span><textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
    <label className="field"><span>Categoría</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required disabled={categoriesLoading}><option value="">Selecciona una categoría</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <label className="field"><span>Privacidad</span><select value={privacy} onChange={(event) => setPrivacy(event.target.value)}><option value="PUBLIC">Público</option><option value="PRIVATE">Privado</option><option value="GROUP">Grupo</option></select></label>
    <label className="field"><span>Estado</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></select></label>
    {categoriesError && <p className="error">{categoriesError}</p>}
    <div className="editor-heading"><h2>Páginas y consignas</h2><button className="button small" type="button" onClick={() => setPages((items) => [...items, blankPage(items.length + 1)])}>+ Agregar página</button></div>
    {pages.map((page, pageIndex) => <fieldset className="page-editor" key={page.id ?? `new-${pageIndex}`}><legend>Página {pageIndex + 1}</legend><div className="editor-row"><Field label="Título de página" value={page.title} onChange={(event) => updatePage(pageIndex, { title: event.target.value })} required /><div className="editor-buttons"><button type="button" className="button secondary small" disabled={!pageIndex} onClick={() => movePage(pageIndex, -1)}>↑</button><button type="button" className="button secondary small" disabled={pageIndex === pages.length - 1} onClick={() => movePage(pageIndex, 1)}>↓</button><button type="button" className="button danger small" disabled={pages.length === 1} onClick={() => setPages((items) => items.filter((_, index) => index !== pageIndex))}>Eliminar página</button></div></div><div className="slot-editor">{page.slots.map((slot, slotIndex) => <div className="editor-row" key={slot.id ?? `new-slot-${slotIndex}`}><Field label={`Consigna ${slotIndex + 1}`} value={slot.prompt} onChange={(event) => updateSlot(pageIndex, slotIndex, event.target.value)} required /><div className="editor-buttons"><button type="button" className="button secondary small" disabled={!slotIndex} onClick={() => moveSlot(pageIndex, slotIndex, -1)}>↑</button><button type="button" className="button secondary small" disabled={slotIndex === page.slots.length - 1} onClick={() => moveSlot(pageIndex, slotIndex, 1)}>↓</button><button type="button" className="button danger small" disabled={page.slots.length === 1} onClick={() => updatePage(pageIndex, { slots: page.slots.filter((_, index) => index !== slotIndex) })}>Eliminar</button></div></div>)}</div><button className="button secondary small" type="button" onClick={() => updatePage(pageIndex, { slots: [...page.slots, { prompt: '' }] })}>+ Agregar consigna</button></fieldset>)}
    {error && <p className="error">{error}</p>}<button className="button" type="submit" disabled={saving || categoriesLoading || !categoryId}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear álbum'}</button>
  </form></section>;
}
