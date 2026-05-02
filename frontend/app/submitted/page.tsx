import Link from 'next/link';

export default function SubmittedPage({ searchParams }: { searchParams: { id?: string } }) {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Form submitted</h1>
        <p className="mt-3 text-slate-600">Thank you. Your intake form has been sent to the clinic.</p>
        {searchParams.id && <p className="mt-4 text-xs text-slate-400">Submission ID: {searchParams.id}</p>}
        <Link href="/" className="mt-8 inline-block rounded-lg border px-4 py-2">Back home</Link>
      </div>
    </main>
  );
}
