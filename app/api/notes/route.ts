import { NextRequest, NextResponse } from "next/server";
import { createChunkInputs } from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/documentChunks";

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Failed to fetch notes:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch notes",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const title = body.title?.trim();
    const content = body.content?.trim();

    if (!title || !content) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and content are required",
        },
        { status: 400 }
      );
    }

    const chunks = await createChunkInputs(chunkText(content));

    const note = await prisma.note.create({
      data: {
        title,
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
    console.error("Failed to create note:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create note",
      },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";

// export async function GET() {
//   return NextResponse.json({
//     success: true,
//     message: "Notes API is working",
//   });
// }

// export async function POST() {
//   return NextResponse.json({
//     success: true,
//     message: "POST is working",
//   });
// }
