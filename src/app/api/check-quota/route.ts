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

  // Multi-model candidate list for live probe:
  // Prioritizes ultra-fast lite models (<1s response) to avoid 503 high demand
  const probeModels = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3.1-flash-lite",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
  ];

  let lastStatus = 0;
  let lastRawMsg = "";
  let lastLatency = 0;

  for (const modelName of probeModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
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
      lastLatency = latencyMs;
      lastStatus = res.status;

      if (res.ok) {
        return NextResponse.json({
          ok: true,
          status: 200,
          model: modelName,
          latencyMs,
          message: `เชื่อมต่อกับ Google AI สำเร็จ (โมเดล ${modelName})`,
          testedAt: new Date().toLocaleTimeString("th-TH"),
        });
      }

      const errData = await res.json().catch(() => ({}));
      const rawMsg = errData?.error?.message || `HTTP ${res.status}`;
      lastRawMsg = rawMsg;
      const lowerMsg = rawMsg.toLowerCase();

      // If the model is deprecated, not found, or in 503 High Demand, IMMEDIATELY switch to next model!
      const isHighDemand =
        res.status === 503 ||
        lowerMsg.includes("high demand") ||
        lowerMsg.includes("unavailable") ||
        lowerMsg.includes("model_capacity_exhausted");

      if (
        res.status === 404 ||
        isHighDemand ||
        lowerMsg.includes("no longer available") ||
        lowerMsg.includes("not found") ||
        lowerMsg.includes("is not supported")
      ) {
        console.warn(`[check-quota] Model ${modelName} encountered ${isHighDemand ? "503 High Demand" : "404 Not Supported"}. Auto-switching to next candidate model...`);
        lastStatus = res.status;
        continue;
      }

      // If key is outright invalid, no need to retry other models
      const isKeyInvalid =
        res.status === 400 &&
        (lowerMsg.includes("api_key_invalid") || lowerMsg.includes("api key not valid"));

      if (isKeyInvalid) {
        return NextResponse.json({
          ok: false,
          status: 400,
          latencyMs,
          model: modelName,
          isKeyInvalid: true,
          message: "API Key ไม่ถูกต้องหรือถูกเพิกถอน กรุณาตรวจสอบ Key ใน Google AI Studio",
          rawGoogleError: rawMsg,
          testedAt: new Date().toLocaleTimeString("th-TH"),
        });
      }

      // If it's a daily limit or rate limit, record and return immediately
      const isDaily =
        lowerMsg.includes("per day") ||
        lowerMsg.includes("perday") ||
        lowerMsg.includes("daily");

      const isRateLimit =
        res.status === 429 ||
        lowerMsg.includes("resource_exhausted") ||
        lowerMsg.includes("quota") ||
        lowerMsg.includes("rate limit");

      let friendlyMsg = rawMsg;
      if (isDaily) {
        friendlyMsg = "โควตารายวัน (Daily Limit) ของ Google AI เต็มแล้วสำหรับวันนี้ (สร้าง Key ใหม่ฟรีได้ใน Google AI Studio)";
      } else if (isRateLimit) {
        friendlyMsg = "โควตาต่อนาที (15 RPM) เต็มชั่วคราว (กรุณารอประมาณ 1 นาที)";
      }

      return NextResponse.json({
        ok: false,
        status: res.status,
        latencyMs,
        model: modelName,
        isRateLimit,
        isDaily,
        isHighDemand: false,
        isKeyInvalid: false,
        message: friendlyMsg,
        rawGoogleError: rawMsg,
        testedAt: new Date().toLocaleTimeString("th-TH"),
      });
    } catch (modelErr: any) {
      clearTimeout(timeoutId);
      lastRawMsg = modelErr.message || "Request failed";
      continue;
    }
  }

  // If all models failed
  const latencyMs = Date.now() - start;
  return NextResponse.json({
    ok: false,
    status: lastStatus || 500,
    latencyMs,
    message: lastRawMsg || "ไม่สามารถเชื่อมต่อโมเดลใดๆ ของ Google AI ได้",
    rawGoogleError: lastRawMsg,
    testedAt: new Date().toLocaleTimeString("th-TH"),
  });
}
