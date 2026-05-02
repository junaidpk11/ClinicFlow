import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">ClinicFlow</h1>
        <p className="mt-3 text-slate-600">Generic digital intake for any clinic type.</p>
        <div className="mt-8 flex gap-3">
          <Link className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 transition-colors" href="/intake/demo-token-123">
            Demo Intake
          </Link>
          <Link className="rounded-lg border px-4 py-2 hover:bg-slate-50 transition-colors" href="/login">
            Staff Login
          </Link>
        </div>
      </div>
    </main>
  );
}
