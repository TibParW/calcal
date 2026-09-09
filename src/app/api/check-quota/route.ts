import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 10;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const start = Date.now();
  let userApiKey: string | undefined = undefined;

  const rawKey = request.headers.get("x-gemini-api-key");
  if (rawKey && rawKey.trim().length > 0) {
    userApiKey = rawKey.trim();
  }

  const apiKey = (userApiKey || process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        status: 401,
        isMissingKey: true,
        message: "ยังไม่ได้ระบุ Gemini API Key ในระบบ",
      },
      { status: 200 }
    );
  }

  // Probe using a real 1-token ping to gemini-2.5-flash
  // This verifies the ACTUAL generateContent rate limit and quota state on Google's servers
  const probeModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${probeModels[0]}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    if (res.ok) {
      return NextResponse.json({
        ok: true,
        status: 200,
        model: probeModels[0],
        latencyMs,
        message: "เชื่อมต่อกับ Google AI สำเร็จ คีย์พร้อมใช้งาน",
        testedAt: new Date().toLocaleTimeString("th-TH"),
      });
    }

    const errData = await res.json().catch(() => ({}));
    const rawMsg = errData?.error?.message || `HTTP ${res.status}`;
    const status = res.status;
    const lowerMsg = rawMsg.toLowerCase();

    const isDaily =
      lowerMsg.includes("per day") ||
      lowerMsg.includes("perday") ||
      lowerMsg.includes("daily");

    const isRateLimit =
      status === 429 ||
      lowerMsg.includes("resource_exhausted") ||
      lowerMsg.includes("quota") ||
      lowerMsg.includes("rate limit");

    const isHighDemand =
      status === 503 ||
      lowerMsg.includes("high demand") ||
      lowerMsg.includes("unavailable");

    const isKeyInvalid =
      status === 400 &&
      (lowerMsg.includes("api_key_invalid") || lowerMsg.includes("api key not valid"));

    let friendlyMsg = rawMsg;
    if (isDaily) {
      friendlyMsg = "โควตารายวัน (Daily Limit) ของ Google AI เต็มแล้วสำหรับวันนี้ (สร้าง Key ใหม่ฟรีได้ใน Google AI Studio)";
    } else if (isRateLimit) {
      friendlyMsg = "โควตาต่อนาที (15 RPM) เต็มชั่วคราว (กรุณารอประมาณ 1 นาที)";
    } else if (isHighDemand) {
      friendlyMsg = "เซิร์ฟเวอร์ Google กำลังมีผู้ใช้งานหนาแน่นชั่วคราว (503 High Demand)";
    } else if (isKeyInvalid) {
      friendlyMsg = "API Key ไม่ถูกต้องหรือถูกเพิกถอน กรุณาตรวจสอบ Key ใน Google AI Studio";
    }

    return NextResponse.json({
      ok: false,
      status,
      latencyMs,
      model: probeModels[0],
      isRateLimit,
      isDaily,
      isHighDemand,
      isKeyInvalid,
      message: friendlyMsg,
      rawGoogleError: rawMsg,
      testedAt: new Date().toLocaleTimeString("th-TH"),
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      ok: false,
      status: 0,
      latencyMs,
      message:
        err.name === "AbortError"
          ? "การเชื่อมต่อไปยัง Google AI ใช้เวลานานเกิน 6 วินาที (Timeout)"
          : `ไม่สามารถติดต่อเซิร์ฟเวอร์ Google ได้: ${err.message}`,
      testedAt: new Date().toLocaleTimeString("th-TH"),
    });
  }
}
