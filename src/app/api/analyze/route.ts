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
    let errorMessage = error?.message || "เกิดข้อผิดพลาดในการประมวลผลรูปภาพ";
    if (
      errorMessage.includes("GoogleGenerativeAI Error") ||
      errorMessage.includes("generativelanguage.googleapis.com")
    ) {
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        errorMessage = "ไม่พบโมเดล AI ที่ร้องขอ หรือโมเดลกำลังปรับปรุง กรุณาลองใหม่อีกครั้ง";
      } else if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "โควตา Gemini API หมดชั่วคราว กรุณารอสักครู่แล้วลองใหม่ หรือใส่ API Key ในหน้าตั้งค่า";
      } else if (errorMessage.includes("API_KEY_INVALID")) {
        errorMessage = "Gemini API Key ไม่ถูกต้อง กรุณาตรวจสอบ Key ในหน้าตั้งค่า";
      } else {
        errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google AI กรุณาลองใหม่อีกครั้ง";
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: error?.message?.includes("MISSING_API_KEY") ? 401 : 500 }
    );
  }
}
