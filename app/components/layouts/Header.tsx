import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold">
          Groq AI Notes
        </Link>

        <nav className="flex items-center gap-6 text-sm text-slate-300">
          <Link href="/notes" className="hover:text-white">
            Notes
          </Link>
          <Link href="/ask" className="hover:text-white">
            Ask AI
          </Link>
        </nav>
      </div>
    </header>
  );
}