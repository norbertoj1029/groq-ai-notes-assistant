import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
          Groq AI Notes Assistant
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Ask questions about your notes using AI
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Create notes, search them, and ask Groq AI to answer questions using
          only your saved notes as context.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/notes"
            className="rounded-xl bg-white px-6 py-3 font-medium text-slate-950 transition hover:bg-slate-200"
          >
            Manage Notes
          </Link>

          <Link
            href="/ask"
            className="rounded-xl border border-slate-700 px-6 py-3 font-medium text-white transition hover:bg-slate-900"
          >
            Ask AI
          </Link>
        </div>
      </section>
    </main>
  );
}