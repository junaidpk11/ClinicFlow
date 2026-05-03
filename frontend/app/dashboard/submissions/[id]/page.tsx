'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';

interface FieldDef  { name: string; label: string; type: string; }
interface PageDef   { id: string; title: string; fields: FieldDef[]; }
interface Detail {
  id: string;
  patientFirstName: string;
  patientLastName: string;
  patientEmail?: string;
  patientPhone?: string;
  submittedAt: string;
  formName: string;
  clinicName: string;
  clinicType: string;
  formPages: PageDef[];
  responses: Record<string, unknown>;
}

function AnswerValue({ value, type }: { value: unknown; type: string }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400 italic">Not answered</span>;
  }
  if (type === 'checkbox') {
    return <span className={value ? 'text-green-700 font-medium' : 'text-slate-500'}>{value ? 'Yes' : 'No'}</span>;
  }
  if (type === 'range') {
    const num = Number(value);
    const color = num >= 7 ? 'text-red-600' : num >= 4 ? 'text-amber-600' : 'text-green-600';
    return (
      <span className={`font-bold text-lg ${color}`}>{num}
        <span className="text-xs font-normal text-slate-400 ml-1">/ 10</span>
      </span>
    );
  }
  if (type === 'checkbox_group' && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).map(v => (
          <span key={v} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{v}</span>
        ))}
      </div>
    );
  }
  if (type === 'textarea') {
    return <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{String(value)}</p>;
  }
  return <span className="text-slate-700">{String(value)}</span>;
}

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    apiGet<Detail>(`/dashboard/submissions/${params.id}`)
      .then(setDetail)
      .catch(err => {
        if (err.message === 'Unauthorized') router.push('/login');
        else setError(err.message);
      });
  }, [params.id, router]);

  if (error) return <main className="p-8"><div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div></main>;
  if (!detail) return <main className="p-8 text-slate-500">Loading…</main>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Back + header */}
        <div>
          <button onClick={() => router.push('/dashboard')}
            className="text-sm text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1">
            ← Back to dashboard
          </button>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{detail.clinicName} · {detail.formName}</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  {detail.patientFirstName} {detail.patientLastName}
                </h1>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                  {detail.patientEmail && <span>✉ {detail.patientEmail}</span>}
                  {detail.patientPhone && <span>☎ {detail.patientPhone}</span>}
                  <span>Submitted {new Date(detail.submittedAt).toLocaleString()}</span>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 capitalize">
                {detail.clinicType}
              </span>
            </div>
          </div>
        </div>

        {/* Schema-driven pages — labels come from form_definition, answers from responses */}
        {detail.formPages?.map(page => (
          <div key={page.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 pb-3 border-b">{page.title}</h2>
            <dl className="space-y-4">
              {page.fields.map(field => {
                const answer = detail.responses[field.name];
                return (
                  <div key={field.name} className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-slate-500 col-span-1 pt-0.5">{field.label}</dt>
                    <dd className="col-span-2">
                      <AnswerValue value={answer} type={field.type} />
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}

        {/* Any responses not covered by the current schema (schema drift protection) */}
        {(() => {
          const schemaFields = new Set(detail.formPages?.flatMap(p => p.fields.map(f => f.name)) ?? []);
          const extras = Object.entries(detail.responses).filter(([k]) => !schemaFields.has(k));
          if (extras.length === 0) return null;
          return (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6">
              <h2 className="text-sm font-semibold text-amber-800 mb-3">Additional responses</h2>
              <dl className="space-y-2">
                {extras.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-3 gap-4">
                    <dt className="text-xs font-mono text-amber-700">{k}</dt>
                    <dd className="col-span-2 text-sm text-amber-900">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
