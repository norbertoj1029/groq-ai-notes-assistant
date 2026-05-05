import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { chunkText } from "@/lib/documentChunks";
import { createChunkInputs } from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 1024 * 1024 * 10;
const PDF_WORKER_SRC = pathToFileURL(
  join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
).toString();

const SUPPORTED_TYPES = new Set([
  "application/json",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/markdown",
  "text/plain",
]);

const SUPPORTED_EXTENSIONS = new Set([
  ".csv",
  ".docx",
  ".json",
  ".md",
  ".markdown",
  ".pdf",
  ".txt",
]);

function getFileExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot === -1 ? "" : fileName.slice(lastDot).toLowerCase();
}

function getNoteTitle(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  const baseName = lastDot === -1 ? fileName : fileName.slice(0, lastDot);
  return baseName.replace(/[-_]+/g, " ").trim() || "Uploaded document";
}

function isSupportedFile(file: File) {
  const extension = getFileExtension(file.name);
  return SUPPORTED_TYPES.has(file.type) || SUPPORTED_EXTENSIONS.has(extension);
}

async function extractPdfText(file: File) {
  PDFParse.setWorker(PDF_WORKER_SRC);

  const data = new Uint8Array(await file.arrayBuffer());
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractDocumentText(file: File) {
  const extension = getFileExtension(file.name);

  if (extension === ".pdf" || file.type === "application/pdf") {
    return extractPdfText(file);
  }

  if (
    extension === ".docx" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxText(file);
  }

  return file.text();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Document file is required",
        },
        { status: 400 }
      );
    }

    if (!isSupportedFile(file)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only TXT, Markdown, CSV, JSON, PDF, and DOCX files are supported",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "File must be 10 MB or smaller",
        },
        { status: 400 }
      );
    }

    const content = (await extractDocumentText(file)).trim();

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "The uploaded document does not contain readable text",
        },
        { status: 400 }
      );
    }

    const chunks = await createChunkInputs(chunkText(content));

    const note = await prisma.note.create({
      data: {
        title: getNoteTitle(file.name),
        content,
        chunks: {
          create: chunks,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        note,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Document upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Document upload failed",
      },
      { status: 500 }
    );
  }
}
