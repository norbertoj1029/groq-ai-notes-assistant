import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Note ID is required",
        },
        { status: 400 }
      );
    }

    await prisma.note.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete note:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete note",
      },
      { status: 500 }
    );
  }
}