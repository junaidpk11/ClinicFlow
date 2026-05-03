'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';

type FieldType = 'text'|'textarea'|'date'|'tel'|'email'|'number'|
                 'range'|'checkbox'|'radio'|'select'|'checkbox_group'|'signature_consent';

interface FieldDef {
  name: string; label: string; type: FieldType;
  required?: boolean; min?: number; max?: number; options?: string[];
}
interface PageDef   { id: string; title: string; fields: FieldDef[]; }
interface FormSchema { pages: PageDef[]; }
interface StartResponse { token: string; clinicName: string; formName: string; schema: FormSchema; }

// ── Signature canvas ─────────────────────────────────────────────────────────
function SignatureField({ name }: { name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [signed, setSigned] = useState(false);

  function getPos(e: React.MouseEvent|React.TouchEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const src = 'touches' in e ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }
  function start(e: React.MouseEvent|React.TouchEvent) {
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
    setDrawing(true);
  }
  function move(e: React.MouseEvent|React.TouchEvent) {
    if (!drawing) return; e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y); ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
    setSigned(true);
  }
  function end() { setDrawing(false); }
  function clear() {
    const c = canvasRef.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setSigned(false);
  }

  return (
    <div>
      <canvas ref={canvasRef} width={520} height={120} onMouseDown={start} onMouseMove={move}
        onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 cursor-crosshair touch-none" />
      <input type="hidden" name={name} value={signed ? 'signed' : ''} />
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-slate-400">{signed ? '✓ Signature captured' : 'Draw your signature above'}</p>
        <button type="button" onClick={clear} className="text-xs text-slate-500 hover:text-slate-800 underline">Clear</button>
      </div>
    </div>
  );
}

// ── Dynamic field renderer ────────────────────────────────────────────────────
function Field({ field }: { field: FieldDef }) {
  const base = 'mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400';
  const lbl  = <span className="text-sm font-medium text-slate-700">{field.label}{field.required && <span className="text-red-500 ml-1">*</span>}</span>;

  if (field.type === 'textarea')
    return <label className="block">{lbl}<textarea name={field.name} rows={3} required={field.required} className={base} /></label>;

  if (field.type === 'range')
    return (
      <label className="block">{lbl}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-slate-400">{field.min ?? 0}</span>
          <input name={field.name} type="range" min={field.min ?? 0} max={field.max ?? 10}
            defaultValue={field.min ?? 0} className="flex-1" />
          <span className="text-xs text-slate-400">{field.max ?? 10}</span>
        </div>
      </label>
    );

  if (field.type === 'radio')
    return (
      <fieldset className="block">
        <legend className="text-sm font-medium text-slate-700">{field.label}{field.required && <span className="text-red-500 ml-1">*</span>}</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {field.options?.map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="radio" name={field.name} value={opt} required={field.required} className="shrink-0" />{opt}
            </label>
          ))}
        </div>
      </fieldset>
    );

  if (field.type === 'checkbox_group')
    return (
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">{field.label}</legend>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {field.options?.map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" name={`${field.name}[]`} value={opt} className="shrink-0" />{opt}
            </label>
          ))}
        </div>
      </fieldset>
    );

  if (field.type === 'checkbox')
    return (
      <label className="flex gap-3 cursor-pointer">
        <input name={field.name} type="checkbox" required={field.required} className="mt-0.5 shrink-0" />
        <span className="text-sm text-slate-700">{field.label}{field.required && <span className="text-red-500 ml-1">*</span>}</span>
      </label>
    );

  if (field.type === 'signature_consent')
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-4 leading-relaxed">{field.label}</p>
        <SignatureField name={field.name} />
      </div>
    );

  if (field.type === 'select')
    return (
      <label className="block">{lbl}
        <select name={field.name} required={field.required} className={base}>
          <option value="">Select…</option>
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );

  return <label className="block">{lbl}<input name={field.name} type={field.type} required={field.required} min={field.min} max={field.max} className={base} /></label>;
}

// ── Multi-page form ───────────────────────────────────────────────────────────
export default function IntakePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [info, setInfo]             = useState<StartResponse | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [allData, setAllData]       = useState<Record<string, unknown>>({});

  // Fixed patient name fields — always collected on page 0
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');

  useEffect(() => {
    apiGet<StartResponse>(`/intake/${params.token}`)
      .then(setInfo).catch(err => setError(err.message));
  }, [params.token]);

  function collectPage(form: HTMLFormElement, pageFields: FieldDef[]) {
    const fd = new FormData(form);
    const out: Record<string, unknown> = {};
    for (const field of pageFields) {
      if (field.type === 'checkbox') {
        out[field.name] = fd.get(field.name) === 'on';
      } else if (field.type === 'checkbox_group') {
        out[field.name] = fd.getAll(`${field.name}[]`);
      } else {
        out[field.name] = fd.get(field.name) ?? '';
      }
    }
    return out;
  }

  function handleNext(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pages = info!.schema.pages;
    const pageData = collectPage(e.currentTarget, pages[page].fields);
    const merged = { ...allData, ...pageData };
    setAllData(merged);

    if (page < pages.length - 1) { setPage(p => p + 1); return; }

    // Final page — submit
    setSubmitting(true); setError(null);
    const payload = {
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     String(merged.email ?? ''),
      phone:     String(merged.phone ?? ''),
      responses: merged,
    };
    apiPost<{ submissionId: string }>(`/intake/${params.token}/submit`, payload)
      .then(r => router.push(`/submitted?id=${r.submissionId}`))
      .catch(err => setError(err.message))
      .finally(() => setSubmitting(false));
  }

  if (error) return <main className="p-8"><div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div></main>;
  if (!info)  return <main className="p-8 text-slate-500">Loading intake form…</main>;

  const pages    = info.schema.pages;
  const current  = pages[page];
  const isLast   = page === pages.length - 1;
  const progress = Math.round((page / pages.length) * 100);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{info.clinicName} · {info.formName}</span>
            <span>Step {page + 1} of {pages.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex mt-2 gap-1">
            {pages.map((p, i) => (
              <div key={p.id} className={`flex-1 text-center text-xs py-1 rounded ${i === page ? 'bg-slate-900 text-white' : i < page ? 'bg-slate-200 text-slate-600' : 'text-slate-400'}`}>
                {p.title}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleNext} className="rounded-2xl bg-white p-6 shadow-sm sm:p-8 space-y-5">
          <h1 className="text-xl font-bold text-slate-900">{current.title}</h1>

          {/* Fixed name fields — only shown on first page */}
          {page === 0 && (
            <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-100">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">First name <span className="text-red-500">*</span></span>
                <input
                  type="text" required value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Last name <span className="text-red-500">*</span></span>
                <input
                  type="text" required value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </label>
            </div>
          )}

          {/* Schema-driven fields */}
          {current.fields.map(f => <Field key={f.name} field={f} />)}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            {page > 0 && (
              <button type="button" onClick={() => setPage(p => p - 1)}
                className="rounded-xl border px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                ← Back
              </button>
            )}
            <button disabled={submitting}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 transition-colors">
              {isLast ? (submitting ? 'Submitting…' : 'Submit') : 'Next →'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
