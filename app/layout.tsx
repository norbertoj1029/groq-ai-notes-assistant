import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/layouts/Header";
import Footer from "./components/layouts/Footer";

export const metadata: Metadata = {
  title: "Groq AI Notes Assistant",
  description: "Ask AI questions about your saved notes using Groq.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <div className="flex min-h-screen flex-col">
          <Header />

          <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>

          <Footer />
        </div>
      </body>
    </html>
  );
}