'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, clearToken } from '@/lib/api';

interface Submission {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  submittedAt: string;
  responses: Record<string, unknown>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Submission[]>('/dashboard/submissions')
      .then(setSubmissions)
      .catch((err) => {
        if (err.message === 'Unauthorized') {
          router.push('/login');
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  if (loading) return <main className="p-8 text-slate-600">Loading…</main>;

  if (error) {
    return (
      <main className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clinic Dashboard</h1>
            <p className="mt-1 text-slate-500">Latest intake submissions — your clinic only.</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Patient</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Primary complaint</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-medium">{s.patientName}</td>
                  <td className="p-3 text-slate-600">
                    <div>{s.patientEmail || '—'}</div>
                    <div>{s.patientPhone || '—'}</div>
                  </td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    {new Date(s.submittedAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-slate-700">
                    {String(s.responses.primaryComplaint || '—')}
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={4}>No submissions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
