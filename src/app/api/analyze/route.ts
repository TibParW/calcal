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
    const rawKey = request.headers.get("x-gemini-api-key");
    const userApiKey = rawKey && rawKey.trim().length > 0 ? rawKey.trim() : undefined;

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
        errorMessage = "ไม่สามารถเชื่อมต่อกับโมเดลวิเคราะห์ภาพได้ในขณะนี้ กรุณากดปุ่มลองใหม่อีกครั้ง";
      } else if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "โควตา Gemini API เต็มชั่วคราว กรุณารอสักครู่แล้วลองใหม่ หรือใส่ API Key ส่วนตัวในหน้าตั้งค่า";
      } else if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("API key not valid")) {
        errorMessage = "API_KEY_INVALID: Gemini API Key ไม่ถูกต้อง กรุณาตรวจสอบ Key ในหน้าตั้งค่า";
      } else {
        errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google AI กรุณาลองใหม่อีกครั้ง";
      }
    }

    const isKeyError =
      errorMessage.includes("MISSING_API_KEY") ||
      errorMessage.includes("API_KEY_INVALID");

    return NextResponse.json(
      { error: errorMessage },
      { status: isKeyError ? 401 : 500 }
    );
  }
}
