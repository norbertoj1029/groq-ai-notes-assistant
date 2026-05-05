export default function Footer() {
    return (
      <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm">
          © {new Date().getFullYear()} Groq AI Notes Assistant. Built with Next.js
          and Groq.
        </div>
      </footer>
    );
  }