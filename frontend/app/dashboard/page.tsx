'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, clearToken, getClinicName } from '@/lib/api';

interface Submission {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  submittedAt: string;
  responses: Record<string, unknown>;
}

interface Stats { totalSubmissions: number; }

export default function DashboardPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const clinicName = typeof window !== 'undefined' ? getClinicName() : null;

  const load = useCallback((q?: string) => {
    const url = q ? `/dashboard/submissions?q=${encodeURIComponent(q)}` : '/dashboard/submissions';
    return apiGet<Submission[]>(url)
      .then(setSubmissions)
      .catch((err) => {
        if (err.message === 'Unauthorized') router.push('/login');
        else setError(err.message);
      });
  }, [router]);

  useEffect(() => {
    Promise.all([
      load(),
      apiGet<Stats>('/dashboard/stats').then(setStats).catch(() => null),
    ]).finally(() => setLoading(false));
  }, [load]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    await load(query || undefined);
    setSearching(false);
  }

  function handleLogout() { clearToken(); router.push('/login'); }

  if (loading) return <main className="p-8 text-slate-500">Loading…</main>;
  if (error) return <main className="p-8"><div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div></main>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{clinicName ?? 'Clinic'} Dashboard</h1>
            <p className="mt-1 text-slate-500">Patient intake submissions — your clinic only.</p>
          </div>
          <button onClick={handleLogout}
            className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Sign out
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total submissions</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{stats.totalSubmissions}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Shown below</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{submissions.length}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by patient name…"
            className="flex-1 rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white" />
          <button type="submit" disabled={searching}
            className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 transition-colors">
            {searching ? 'Searching…' : 'Search'}
          </button>
          {query && (
            <button type="button" onClick={() => { setQuery(''); load(); }}
              className="rounded-xl border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Clear
            </button>
          )}
        </form>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-4 font-medium">Patient</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Submitted</th>
                <th className="p-4 font-medium">Chief complaint</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">{s.patientName}</td>
                  <td className="p-4 text-slate-600">
                    <div>{s.patientEmail || '—'}</div>
                    <div className="text-xs text-slate-400">{s.patientPhone || ''}</div>
                  </td>
                  <td className="p-4 text-slate-500 whitespace-nowrap text-xs">
                    {new Date(s.submittedAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-slate-700 max-w-xs truncate">
                    {String(s.responses.chiefComplaint || s.responses.primaryComplaint || '—')}
                  </td>
                  <td className="p-4">
                    <button onClick={() => router.push(`/dashboard/submissions/${s.id}`)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                      View →
                    </button>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr><td className="p-8 text-slate-400 text-center" colSpan={5}>No submissions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
