import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 10;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let userApiKey: string | undefined = undefined;
    const rawKey = request.headers.get("x-gemini-api-key");
    if (rawKey && rawKey.trim().length > 0) {
      userApiKey = rawKey.trim();
    }

    const apiKey = (userApiKey || process.env.GEMINI_API_KEY || "").trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "MISSING_API_KEY: ไม่พบ Gemini API Key ในระบบ กรุณาระบุ API Key ในหน้าต่างตั้งค่า",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const query = (body?.query || "").trim();

    if (!query) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่ออาหารหรือเมนู" },
        { status: 400 }
      );
    }

    const prompt = `คุณคือผู้เชี่ยวชาญด้านโภชนาการอาหาร หน้าที่ของคุณคือประมาณค่าพลังงานรวม (kcal) และสารอาหารหลัก (โปรตีน, คาร์บ, ไขมัน ในหน่วยกรัม) ของอาหารที่ระบุต่อไปนี้:
"${query}"

ข้อกำหนดสำคัญ:
1. ตรวจสอบก่อนว่าข้อความนี้คือ "อาหาร/เครื่องดื่มที่มนุษย์บริโภคได้" หรือไม่
2. หากข้อความ "ไม่ใช่ชื่ออาหาร", "เป็นสิ่งของทั่วไป", หรือ "เป็นตัวอักษรพิมพ์มั่ว" (เช่น asdf, กกกก, โต๊ะ, เก้าอี้, 12345) ให้ตอบกลับรูปแบบนี้ทันที:
{
  "is_food": false,
  "error_message": "ไม่พบว่าเป็นชื่ออาหาร กรุณาระบุชื่อเมนูอาหารใหม่อีกครั้ง"
}
3. อาหารผสมหรือเซ็ตอาหาร (Combo Meals / Multi-item):
   - หากผู้ใช้ระบุอาหารหลายอย่างในจานเดียวกันหรือทานคู่กัน เช่น "ไข่ดาว กระเพราหมู", "ข้าวกะเพราหมูสับ ไข่ดาว", "ข้าวผัดหมู + ไข่ต้ม", "สเต็กหมู เฟรนช์ฟรายส์ สลัด"
   - ให้ "คำนวณพลังงาน (แคลอรี) และสารอาหารรวมของทุกอย่างเข้าด้วยกันทั้งหมด" อย่างถูกต้องตามจริง ห้ามเลือกคำนวณแค่อย่างใดอย่างหนึ่งเด็ดขาด (เช่น "ไข่ดาว กระเพราหมู" ต้องรวมทั้งข้าวกะเพราหมู ~550-600 kcal + ไข่ดาว ~120-150 kcal = ~670-750 kcal)
   - ระบุ portion_description ให้ชัดเจนว่ารวมอะไรบ้าง เช่น "ข้าวกะเพราหมู 1 จาน + ไข่ดาว 1 ฟอง"
4. หากเป็นอาหารหรือเครื่องดื่มเดี่ยว ให้คำนวณจากขนาดบริโภคมาตรฐาน 1 ที่ (Single Standard Serving) หรือตามจำนวนที่ระบุ
5. ปัดตัวเลขแคลอรีเป็นจำนวนเต็ม และสารอาหารเป็นทศนิยม 1 ตำแหน่ง
6. ตอบกลับเป็น JSON object เท่านั้นตามโครงสร้างนี้:
{
  "is_food": true,
  "food_name": "${query}",
  "food_name_en": "Food Name English",
  "calories": 720,
  "macronutrients": {
    "protein_g": 26.5,
    "carbs_g": 72,
    "fat_g": 36
  },
  "portion_description": "ข้าวกะเพราหมู 1 จาน + ไข่ดาว 1 ฟอง"
}`;

    // Multi-Model Cascade for Text Estimation:
    // 1. gemini-3.6-flash (Latest Official Production)
    // 2. gemini-2.0-flash (High Throughput / Failover)
    // 3. gemini-1.5-flash (Mature Stable Fallback)
    const fastModels = [
      "gemini-3.6-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash",
      "gemini-2.0-flash-lite",
    ];

    let lastError: any = null;

    for (const modelName of fastModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 1.0,
              maxOutputTokens: 1024,
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}`;
          throw new Error(errMsg);
        }

        const data = await res.json();
        let text = "";
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.text && !part.thought) {
            text += part.text;
          }
        }
        if (!text.trim()) {
          for (const part of parts) {
            if (part.text) {
              text += part.text;
            }
          }
        }
        text = text.trim();

        if (text.startsWith("```")) {
          text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "").trim();
        }

        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          text = text.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(text);

        if (parsed.is_food === false) {
          return NextResponse.json(
            {
              error:
                parsed.error_message ||
                "ไม่พบว่าเป็นชื่ออาหาร กรุณาระบุชื่อเมนูอาหารใหม่อีกครั้ง",
            },
            { status: 422 }
          );
        }

        const parseNum = (val: any): number => {
          if (typeof val === "number") return isNaN(val) ? 0 : val;
          if (typeof val === "string") {
            const match = val.match(/[\d.]+/);
            return match ? parseFloat(match[0]) : 0;
          }
          return 0;
        };

        const cals = parseNum(parsed.calories || parsed.estimated_calories);
        const p = parseNum(parsed.macronutrients?.protein_g);
        const c = parseNum(parsed.macronutrients?.carbs_g);
        const f = parseNum(parsed.macronutrients?.fat_g);

        return NextResponse.json({
          food_name: parsed.food_name || query,
          food_name_en: parsed.food_name_en || "",
          calories: Math.max(0, Math.round(cals)),
          macronutrients: {
            protein_g: Math.max(0, Number(p.toFixed(1))),
            carbs_g: Math.max(0, Number(c.toFixed(1))),
            fat_g: Math.max(0, Number(f.toFixed(1))),
          },
          portion_description: parsed.portion_description || "ขนาด 1 ที่ปกติ",
          source: "ai",
        });
      } catch (modelErr: any) {
        clearTimeout(timeoutId);
        lastError = modelErr;
        // Continue immediately to next fallback model
        continue;
      }
    }

    const errMsg = lastError?.message || "ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้";
    const isRateLimit =
      errMsg.includes("429") ||
      errMsg.includes("RESOURCE_EXHAUSTED") ||
      errMsg.includes("quota");

    return NextResponse.json(
      {
        error: isRateLimit
          ? "โควตา API เต็มชั่วคราว กรุณารอ 1 นาทีแล้วลองใหม่อีกครั้ง"
          : errMsg,
        isRateLimit,
      },
      { status: isRateLimit ? 429 : 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "เกิดข้อผิดพลาดในการประมวลผล" },
      { status: 500 }
    );
  }
}
