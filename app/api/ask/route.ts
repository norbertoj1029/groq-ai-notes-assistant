import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { DocumentChunk, Note } from "@prisma/client";
import {
  cosineSimilarity,
  createEmbeddings,
  parseEmbedding,
} from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

type SearchCandidate = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  embedding?: number[] | null;
  chunkId?: string;
  chunkIndex?: number;
};

type ScoredCandidate = SearchCandidate & {
  score: number;
};

type ChunkWithNote = DocumentChunk & {
  note: Note;
};

type NoteWithChunkMarkers = Note & {
  chunks: Pick<DocumentChunk, "id">[];
};

function searchCandidates(
  question: string,
  candidates: SearchCandidate[],
  questionEmbedding: number[] | null,
  limit = 8
): ScoredCandidate[] {
  const terms = question
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2);

  return candidates
    .map((candidate) => {
      const text = `${candidate.title} ${candidate.content}`.toLowerCase();

      const keywordScore = terms.reduce((total, term) => {
        const matches = text.match(new RegExp(`\\b${term}\\b`, "g"));
        return total + (matches ? matches.length : 0);
      }, 0);

      const semanticScore =
        questionEmbedding && candidate.embedding
          ? cosineSimilarity(questionEmbedding, candidate.embedding)
          : 0;
      const score =
        semanticScore > 0
          ? semanticScore + Math.min(keywordScore, 5) * 0.02
          : keywordScore;

      return {
        ...candidate,
        score,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function chunkToCandidate(chunk: ChunkWithNote): SearchCandidate {
  return {
    id: chunk.note.id,
    title: chunk.note.title,
    content: chunk.content,
    createdAt: chunk.note.createdAt,
    embedding: parseEmbedding(chunk.embedding),
    chunkId: chunk.id,
    chunkIndex: chunk.chunkIndex,
  };
}

function noteToCandidate(note: Note): SearchCandidate {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt,
  };
}

async function createQuestionEmbedding(question: string) {
  try {
    const [embedding] = await createEmbeddings([question]);
    return embedding || null;
  } catch (error) {
    console.error("Question embedding failed:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: "Question is required",
        },
        { status: 400 }
      );
    }

    const notes: NoteWithChunkMarkers[] = await prisma.note.findMany({
      include: {
        chunks: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (notes.length === 0) {
      return NextResponse.json({
        success: true,
        answer: "You do not have any notes yet. Please create notes first.",
        sources: [],
      });
    }

    const documentChunks = await prisma.documentChunk.findMany({
      include: {
        note: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const candidates = [
      ...documentChunks.map(chunkToCandidate),
      ...notes
        .filter((note) => note.chunks.length === 0)
        .map((note) => noteToCandidate(note)),
    ];

    const hasStoredEmbeddings = candidates.some((candidate) => candidate.embedding);
    const questionEmbedding = hasStoredEmbeddings
      ? await createQuestionEmbedding(question)
      : null;
    const matchedSources = searchCandidates(
      question,
      candidates,
      questionEmbedding
    );

    if (matchedSources.length === 0) {
      return NextResponse.json({
        success: true,
        answer: "I could not find relevant information in your notes.",
        sources: [],
      });
    }

    const notesContext = matchedSources
      .map((source, index) => {
        return `Source ${index + 1}
Title: ${source.title}
Chunk: ${
          typeof source.chunkIndex === "number"
            ? source.chunkIndex + 1
            : "Full note"
        }
Created At: ${source.createdAt}

Content:
${source.content}`;
      })
      .join("\n\n---\n\n");

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant",
      messages: [
        {
            role: "system",
            content: `
                You are an AI notes assistant.

                Rules:
                - Answer using only the provided notes.
                - If the answer is not in the notes, say you could not find it.
                - Be concise and helpful.
                - Include source note titles at the end.
            `,
        },
        {
            role: "user",
            content: `
                Notes:
                    ${notesContext}

                Question:
                    ${question}
                `,
        },
      ],
      temperature: 0.2,
    });

    const answer =
      completion.choices[0]?.message?.content ||
      "I could not generate an answer.";

    return NextResponse.json({
      success: true,
      answer,
      sources: matchedSources.map((source) => ({
        id: source.id,
        title: source.title,
        content: source.content,
        createdAt: source.createdAt,
        chunkId: source.chunkId,
        chunkIndex: source.chunkIndex,
        score: source.score,
      })),
    });
  } catch (error) {
    console.error("Ask AI failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ask AI failed",
      },
      { status: 500 }
    );
  }
}
