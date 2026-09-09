import { NextRequest, NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/gemini";

export const maxDuration = 30; // 30 seconds max duration for Vercel functions
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mimeType, note, scanMode } = body;

    if (!image) {
      return NextResponse.json(
        { error: "กรุณาส่งข้อมูลรูปภาพอาหาร" },
        { status: 400 }
      );
    }

    // Optional user-supplied API key from client header (fallback if server env not set)
    const userApiKey = request.headers.get("x-gemini-api-key") || undefined;

    const result = await analyzeFoodImage(
      image,
      mimeType || "image/jpeg",
      userApiKey,
      note,
      scanMode === "nutrition_label" ? "nutrition_label" : "food"
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/analyze error:", error);
    const errorMessage = error?.message || "เกิดข้อผิดพลาดในการประมวลผลรูปภาพ";
    return NextResponse.json(
      { error: errorMessage },
      { status: error?.message?.includes("MISSING_API_KEY") ? 401 : 500 }
    );
  }
}
