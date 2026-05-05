'use client';

import { useState } from 'react';

type Source = {
  id?: string;
  chunkId?: string;
  chunkIndex?: number;
  title?: string;
  content?: string;
  score?: number;
};

export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAsk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    setLoading(true);
    setError('');
    setAnswer('');
    setSources([]);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to ask question.');
      }

      setAnswer(data.answer || '');
      setSources(data.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Ask Your Notes
        </h1>

        <p className="mb-8 text-gray-600">
          Ask a question based on your uploaded or saved notes.
        </p>

        <form onSubmit={handleAsk} className="mb-6 space-y-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Example: What are the main points from my notes?"
            className="min-h-32 w-full rounded-lg border border-gray-300 bg-white p-4 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </form>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {answer && (
          <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              Answer
            </h2>

            <p className="whitespace-pre-wrap text-gray-800">{answer}</p>
          </section>
        )}

        {sources.length > 0 && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              Sources
            </h2>

            <div className="space-y-4">
              {sources.map((source, index) => (
                <div
                  key={source.chunkId || source.id || index}
                  className="rounded-md border border-gray-200 p-4"
                >
                  {source.title && (
                    <h3 className="mb-2 font-medium text-gray-900">
                      {source.title}
                    </h3>
                  )}

                  {typeof source.chunkIndex === 'number' && (
                    <p className="mb-2 text-xs text-gray-500">
                      Chunk {source.chunkIndex + 1}
                    </p>
                  )}

                  {source.content && (
                    <p className="text-sm text-gray-700">
                      {source.content}
                    </p>
                  )}

                  {typeof source.score === 'number' && (
                    <p className="mt-2 text-xs text-gray-500">
                      Score: {source.score.toFixed(4)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
