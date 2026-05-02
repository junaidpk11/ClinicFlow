'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';

// ── Schema types (matches form_definition.schema JSONB) ──────────────────────

type FieldType = 'text' | 'textarea' | 'date' | 'tel' | 'email' | 'range' | 'checkbox';

interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
}

interface PageDef {
  title: string;
  fields: FieldDef[];
}

interface FormSchema {
  pages: PageDef[];
}

interface StartResponse {
  token: string;
  clinicName: string;
  formName: string;
  schema: FormSchema;
}

// ── Dynamic field renderer ────────────────────────────────────────────────────

function DynamicField({ field }: { field: FieldDef }) {
  const base = 'mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400';

  if (field.type === 'textarea') {
    return (
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
        </span>
        <textarea name={field.name} rows={4} required={field.required} className={base} />
      </label>
    );
  }

  if (field.type === 'range') {
    return (
      <label className="block">
        <span className="text-sm font-medium text-slate-700">{field.label}</span>
        <input
          name={field.name}
          type="range"
          min={field.min ?? 0}
          max={field.max ?? 10}
          defaultValue={Math.round(((field.min ?? 0) + (field.max ?? 10)) / 2)}
          className="mt-2 w-full"
        />
      </label>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex gap-3 text-sm text-slate-700">
        <input name={field.name} type="checkbox" required={field.required} className="mt-1 shrink-0" />
        <span>{field.label}</span>
      </label>
    );
  }

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <input name={field.name} type={field.type} required={field.required} className={base} />
    </label>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function IntakePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [info, setInfo] = useState<StartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet<StartResponse>(`/intake/${params.token}`)
      .then(setInfo)
      .catch((err) => setError(err.message));
  }, [params.token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    // Core patient identity fields
    const payload: Record<string, unknown> = {
      firstName: String(formData.get('firstName') ?? ''),
      lastName: String(formData.get('lastName') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      responses: {} as Record<string, unknown>,
    };

    // Collect every schema-defined field into responses{}
    const responses: Record<string, unknown> = {};
    for (const page of (info?.schema.pages ?? [])) {
      for (const field of page.fields) {
        const raw = formData.get(field.name);
        if (field.type === 'checkbox') {
          responses[field.name] = raw === 'on';
        } else {
          responses[field.name] = raw ?? '';
        }
      }
    }
    payload.responses = responses;

    try {
      const result = await apiPost<{ submissionId: string }>(`/intake/${params.token}/submit`, payload);
      router.push(`/submitted?id=${result.submissionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <main className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      </main>
    );
  }

  if (!info) {
    return <main className="p-8 text-slate-600">Loading intake form…</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-slate-500">{info.clinicName}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{info.formName}</h1>
        <p className="mt-2 text-slate-600">Please complete this form before your appointment.</p>

        {/* Fixed patient name fields */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">First name <span className="text-red-500">*</span></span>
            <input name="firstName" type="text" required className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Last name <span className="text-red-500">*</span></span>
            <input name="lastName" type="text" required className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </section>

        {/* Dynamic schema-driven sections */}
        {info.schema.pages.map((page) => (
          <section key={page.title} className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{page.title}</h2>
            <div className="space-y-4">
              {page.fields.map((field) => (
                <DynamicField key={field.name} field={field} />
              ))}
            </div>
          </section>
        ))}

        {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

        <button
          disabled={submitting}
          className="mt-8 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60 hover:bg-slate-700 transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit intake form'}
        </button>
      </form>
    </main>
  );
}
