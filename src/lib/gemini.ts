import { GoogleGenerativeAI } from "@google/generative-ai";
import { FoodAnalysisResult, MultiFoodAnalysisResponse } from "@/types";

const FOOD_SYSTEM_PROMPT = `
คุณคือนักโภชนาการและผู้เชี่ยวชาญด้านอาหารไทยและอาหารนานาชาติ
หน้าที่ของคุณคือวิเคราะห์รูปภาพอาหารอย่างละเอียด รอบคอบ และประเมินพลังงานตามหลักการโภชนาการ

กฎสำคัญ:
1. **ตรวจจับอาหารทุกจาน/ชาม/แก้วที่ปรากฏในรูป (Multi-dish Detection)**:
   - หากในรูปมีอาหารมากกว่า 1 เมนู (เช่น มีจานหลัก, ชามแกง/ซุป, แก้วเครื่องดื่ม, ขนมหวาน) ให้แยกออกมาเป็นแต่ละรายการใน Array "foods"
   - แต่ละรายการใน foods ต้องระบุชื่อเมนู แคลอรี สารอาหาร และส่วนประกอบแยกกันอย่างชัดเจน
2. **ประเมินระดับความมั่นใจ (Confidence Tag & Reason)**:
   - 'high': เมนูเปิดหน้าเห็นวัตถุดิบชัดเจน กะปริมาณได้แม่นยำ (confidence_reason: "วัตถุดิบเปิดหน้าชัดเจน")
   - 'medium' หรือ 'low': อาหารที่มองไม่เห็นวัตถุดิบข้างใน เช่น ซุปข้น, ต้มกะทิทึบแสง, ซาลาเปา, เกี๊ยว, ขนมสอดไส้, หรือเครื่องแกงที่ซ่อนเนื้อสัตว์ พร้อมระบุเหตุผลใน confidence_reason เช่น "ซุปข้นมองไม่เห็นเนื้อสัตว์ด้านใน แนะนำให้ตรวจทานตัวเลข" หรือ "มองไม่เห็นไส้ซาลาเปาด้านใน"
3. หากเป็นอาหารไทย โปรดคำนึงถึงน้ำมันสำหรับผัด/ทอด เครื่องแกง และน้ำตาลที่ปรุงลงไป เพื่อให้ค่าแคลอรีสมจริง
4. ให้คำแนะนำสุขภาพสั้นๆ 1 ประโยค

สำคัญมาก: ให้ตอบกลับมาเป็น JSON object เท่านั้น โครงสร้างตามนี้:
{
  "scan_type": "food",
  "foods": [
    {
      "food_name": "ชื่ออาหารภาษาไทย",
      "food_name_en": "Food Name in English",
      "estimated_calories": 550,
      "confidence_level": "high",
      "confidence_reason": "วัตถุดิบและขนาดจานชัดเจน",
      "macronutrients": {
        "protein_g": 25,
        "carbs_g": 60,
        "fat_g": 22
      },
      "ingredients_detected": [
        { "name": "ข้าวสวย", "portion": "1 ทัพพี (100g)", "calories": 130 },
        { "name": "อกไก่ผัดกะเพรา", "portion": "100g", "calories": 250 },
        { "name": "ไข่ดาว", "portion": "1 ฟอง (ทอด)", "calories": 150 }
      ],
      "health_tip": "เมนูนี้มีโปรตีนดี แต่มีน้ำมันผัด ควรทานคู่กับผักสดเพิ่มใยอาหาร"
    }
  ],
  "overall_tip": "คำแนะนำภาพรวมสำหรับมื้อนี้"
}
`;

const NUTRITION_LABEL_SYSTEM_PROMPT = `
คุณคือผู้เชี่ยวชาญด้านฉลากโภชนาการ (Nutrition Information / Nutrition Facts Label OCR)
หน้าที่ของคุณคืออ่านข้อมูลตัวเลขจากตาราง "ข้อมูลโภชนาการ" ที่พิมพ์อยู่บนบรรจุภัณฑ์สินค้าที่ส่งมาอย่างแม่นยำ 100%

กฎการอ่าน:
1. ระบุชื่อสินค้า/ผลิตภัณฑ์ภาษาไทย (หากมี) หรือภาษาอังกฤษ
2. อ่านค่า "พลังงานทั้งหมด" (Total Energy / Calories ในหน่วย kcal)
   - หากมีระบุต่อหนึ่งหน่วยบริโภค (Per Serving) และจำนวนหน่วยบริโภคต่อซอง ให้คำนวณพลังงานต่อ 1 หน่วยบริโภคเป็นหลัก
3. อ่านสารอาหารหลัก: โปรตีน (Protein), คาร์โบไฮเดรต (Total Carbohydrate), ไขมันทั้งหมด (Total Fat) ในหน่วยกรัม
4. บันทึกข้อมูล น้ำตาล (Sugar) และ โซเดียม (Sodium) ลงใน ingredients_detected
5. ตั้งค่า confidence_level เป็น 'high' และ confidence_reason เป็น "อ่านค่าจากตารางฉลากโภชนาการบนบรรจุภัณฑ์โดยตรง"

ตอบกลับเป็น JSON object เท่านั้น โครงสร้างตามนี้:
{
  "scan_type": "nutrition_label",
  "foods": [
    {
      "food_name": "ชื่อผลิตภัณฑ์บนซอง",
      "food_name_en": "Product Name",
      "estimated_calories": 240,
      "confidence_level": "high",
      "confidence_reason": "อ่านค่าจากตารางฉลากโภชนาการบนบรรจุภัณฑ์โดยตรง",
      "macronutrients": {
        "protein_g": 4,
        "carbs_g": 32,
        "fat_g": 11
      },
      "ingredients_detected": [
        { "name": "หนึ่งหน่วยบริโภค", "portion": "1 ซอง (50g)", "calories": 240 },
        { "name": "น้ำตาล", "portion": "8g", "calories": 32 },
        { "name": "โซเดียม", "portion": "350mg", "calories": 0 }
      ],
      "health_tip": "ระวังปริมาณโซเดียมและน้ำตาลต่อวัน"
    }
  ],
  "overall_tip": "อ่านค่าจากฉลากโภชนาการเรียบร้อยแล้ว"
}
`;

// In-memory cache for available Gemini models per API key
const modelsCache = new Map<string, { models: string[]; expires: number }>();

const STATIC_CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash-lite",
  "gemini-2.5-pro",
].filter(Boolean) as string[];

async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  const cached = modelsCache.get(apiKey);
  const now = Date.now();
  if (cached && cached.expires > now) {
    return cached.models;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const reason = errData?.error?.details?.[0]?.reason || errData?.error?.status || "";
      const message = errData?.error?.message || "";

      if (
        reason === "API_KEY_INVALID" ||
        message.includes("API key not valid") ||
        res.status === 400
      ) {
        throw new Error("API_KEY_INVALID: Gemini API Key ไม่ถูกต้องหรือถูกเพิกถอน กรุณาตรวจสอบ Key ใน Google AI Studio");
      }
      return STATIC_CANDIDATE_MODELS;
    }

    const data = await res.json();
    if (Array.isArray(data.models) && data.models.length > 0) {
      const validModels: string[] = data.models
        .filter(
          (m: any) =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes("generateContent")
        )
        .map((m: any) => (m.name || "").replace(/^models\//, ""))
        .filter(Boolean);

      const flashModels = validModels.filter(
        (name: string) =>
          name.includes("flash") &&
          !name.includes("omni") &&
          !name.includes("tts") &&
          !name.includes("audio")
      );
      const otherModels = validModels.filter((name: string) => !name.includes("flash"));

      // Reliable priority order with real Gemini production models
      const priority = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-flash-latest",
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
      ];
      flashModels.sort((a, b) => {
        const idxA = priority.indexOf(a);
        const idxB = priority.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return b.localeCompare(a, undefined, { numeric: true });
      });

      const sorted = [...flashModels, ...otherModels];
      if (sorted.length > 0) {
        modelsCache.set(apiKey, { models: sorted, expires: now + 10 * 60 * 1000 });
        return sorted;
      }
    }
  } catch (fetchErr: any) {
    if (fetchErr.message?.startsWith("API_KEY_INVALID")) {
      throw fetchErr;
    }
    console.warn("[Gemini API] Failed to fetch live models list, falling back to static list:", fetchErr?.message || fetchErr);
  }

  return STATIC_CANDIDATE_MODELS;
}

export async function analyzeFoodImage(
  base64Data: string,
  mimeType: string = "image/jpeg",
  userApiKey?: string,
  userNote?: string,
  scanMode: "food" | "nutrition_label" = "food"
): Promise<MultiFoodAnalysisResponse> {
  const apiKey = (userApiKey || process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error(
      "MISSING_API_KEY: ไม่พบ Gemini API Key ในระบบ กรุณากรอก API Key ในหน้าต่างตั้งค่าเพื่อเริ่มใช้งาน"
    );
  }

  // Clean base64 string: remove header, strip all whitespace/newlines
  const cleanBase64 = (base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data).trim().replace(/\s+/g, "");

  const candidateModels = await getAvailableGeminiModels(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);

  const systemInstruction =
    scanMode === "nutrition_label"
      ? NUTRITION_LABEL_SYSTEM_PROMPT
      : FOOD_SYSTEM_PROMPT;

  let prompt =
    scanMode === "nutrition_label"
      ? "อ่านค่าตัวเลขและสารอาหารจากตารางข้อมูลโภชนาการในภาพนี้อย่างแม่นยำ และตอบเป็น JSON ตามโครงสร้างที่กำหนด"
      : "วิเคราะห์อาหารทุกเมนูในรูปภาพนี้อย่างละเอียด และตอบเป็น JSON ตามโครงสร้างที่กำหนด";

  if (userNote && userNote.trim()) {
    prompt += `\n\nหมายเหตุเพิ่มเติมจากผู้ใช้: "${userNote.trim()}" (โปรดนำข้อมูลนี้ไปปรับการคำนวณแคลอรี เช่น หวานน้อย, ไม่ใส่น้ำมัน, ไม่เอาหนัง, ข้าวครึ่งเดียว หรือระบุชื่อไส้/เนื้อสัตว์)`;
  }

  const imagePart = {
    inlineData: {
      data: cleanBase64,
      mimeType: mimeType || "image/jpeg",
    },
  };

  try {
    let rawText = "";
    let lastError: any = null;

    // Try up to top 3 candidate models to stay well within execution limits while providing reliable failover
    const modelsToTry = candidateModels.slice(0, 3);

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 1.0,
            maxOutputTokens: 2048,
          },
        });

        const result = await model.generateContent([
          prompt,
          imagePart,
        ]);

        const response = await result.response;
        rawText = response.text();
        if (rawText && rawText.trim().length > 0) {
          break; // Successfully got response
        }
      } catch (err: any) {
        console.warn(`[Gemini API] Candidate model "${modelName}" failed:`, err?.message || err);
        lastError = err;

        const msg = err?.message || "";
        // If 404 (model retired/not found) or unsupported method, try next candidate
        if (
          msg.includes("404") ||
          msg.includes("not found") ||
          msg.includes("not supported") ||
          err?.status === 404
        ) {
          continue;
        }

        // If invalid API key, throw immediate user-friendly error
        if (
          msg.includes("API_KEY_INVALID") ||
          msg.includes("API key not valid") ||
          msg.includes("API_KEY_EXPIRED") ||
          err?.status === 400
        ) {
          throw new Error("API_KEY_INVALID: Gemini API Key ไม่ถูกต้องหรือหมดอายุ กรุณาตรวจสอบ API Key ในหน้าตั้งค่า");
        }

        // If quota exceeded (429), try next candidate without delay
        if (
          msg.includes("QUOTA_EXCEEDED") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          err?.status === 429
        ) {
          console.warn(`[Gemini API] Quota limit hit on "${modelName}", trying alternate candidate model...`);
          continue;
        }

        // If high demand (503 / UNAVAILABLE / overloaded), try next candidate model immediately
        if (
          msg.includes("high demand") ||
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("overloaded") ||
          err?.status === 503
        ) {
          console.warn(`[Gemini API] Model "${modelName}" is experiencing high demand (503), switching to backup model...`);
          continue;
        }
      }
    }

  if (!rawText) {
    console.error("All Gemini candidate models failed. Last error:", lastError);
    if (
      lastError?.message?.includes("404") ||
      lastError?.message?.includes("not found")
    ) {
      throw new Error(
        "ไม่สามารถเชื่อมต่อกับโมเดลวิเคราะห์ภาพได้ในขณะนี้ กรุณากดปุ่ม 'ลองใหม่อีกครั้ง' หรือตรวจสอบสัญญาณอินเทอร์เน็ต"
      );
    }
    if (
      lastError?.message?.includes("QUOTA_EXCEEDED") ||
      lastError?.message?.includes("RESOURCE_EXHAUSTED") ||
      lastError?.status === 429
    ) {
      if (userApiKey) {
        throw new Error(
          "โควตาการเรียกใช้งานของ Google AI เต็มชั่วคราว (Google จำกัดจำนวนครั้งต่อนาทีบน Free Tier) กรุณารอประมาณ 1 นาทีแล้วกด 'ลองใหม่อีกครั้ง' ครับ"
        );
      } else {
        throw new Error(
          "โควตาส่วนกลางเต็มชั่วคราว กรุณารอสักครู่แล้วลองใหม่ หรือใส่ Gemini API Key ส่วนตัวในหน้าตั้งค่า"
        );
      }
    }
    if (
      lastError?.message?.includes("high demand") ||
      lastError?.message?.includes("503") ||
      lastError?.message?.includes("UNAVAILABLE") ||
      lastError?.status === 503
    ) {
      throw new Error(
        "เซิร์ฟเวอร์ Google AI กำลังมีผู้ใช้งานหนาแน่นชั่วคราว (High Demand) กรุณารอสักครู่แล้วกดปุ่ม 'ลองใหม่อีกครั้ง' ครับ"
      );
    }
    throw lastError || new Error("เกิดข้อผิดพลาดในการประมวลผลรูปภาพอาหารด้วย AI กรุณาลองใหม่อีกครั้ง");
  }

  const text = rawText;

    // Clean potential markdown wrap if any (e.g. ```json ... ```)
    let cleanJson = text.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "").trim();
    }

    // Extract outer { ... } block to safely bypass any thinking thoughts or commentary
    const firstBrace = cleanJson.indexOf("{");
    const lastBrace = cleanJson.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON:", text, parseErr);
      throw new Error(
        "ไม่สามารถระบุอาหารในภาพได้ชัดเจน กรุณาลองถ่ายใหม่อีกครั้ง หรือบันทึกด้วยตนเอง"
      );
    }

    // Normalize output: handle array foods, dishes, or single food fallback
    let rawFoodsList: any[] = [];
    if (Array.isArray(parsed.foods) && parsed.foods.length > 0) {
      rawFoodsList = parsed.foods;
    } else if (Array.isArray(parsed.dishes) && parsed.dishes.length > 0) {
      rawFoodsList = parsed.dishes;
    } else if (parsed.food_name && typeof parsed.food_name === "string" && parsed.food_name.trim().length > 0) {
      rawFoodsList = [parsed];
    } else {
      throw new Error(
        "ไม่สามารถระบุอาหารในภาพได้ชัดเจน กรุณาลองถ่ายใหม่อีกครั้ง หรือบันทึกด้วยตนเอง"
      );
    }

    // Filter out empty or unidentifiable items
    rawFoodsList = rawFoodsList.filter(
      (item) => item && (item.food_name || item.food_name_en)
    );

    if (rawFoodsList.length === 0) {
      throw new Error(
        "ไม่สามารถระบุอาหารในภาพได้ชัดเจน กรุณาลองถ่ายใหม่อีกครั้ง หรือบันทึกด้วยตนเอง"
      );
    }

    const normalizedFoods: FoodAnalysisResult[] = rawFoodsList.map((item, idx) => {
      const confidence = (item.confidence_level || "medium").toLowerCase();
      const validConfidence =
        confidence === "high" || confidence === "low" ? confidence : "medium";

      return {
        id: "ai_item_" + idx + "_" + Date.now().toString(36),
        food_name: item.food_name || "อาหารไม่ระบุชื่อ",
        food_name_en: item.food_name_en || "",
        estimated_calories: Math.max(0, Number(item.estimated_calories) || 0),
        confidence_level: validConfidence as 'high' | 'medium' | 'low',
        confidence_reason:
          item.confidence_reason ||
          (validConfidence === "high"
            ? "ตรวจพบวัตถุดิบชัดเจน"
            : "มองไม่เห็นวัตถุดิบข้างใน แนะนำให้ตรวจสอบตัวเลข"),
        macronutrients: {
          protein_g: Math.max(0, Number(item.macronutrients?.protein_g) || 0),
          carbs_g: Math.max(0, Number(item.macronutrients?.carbs_g) || 0),
          fat_g: Math.max(0, Number(item.macronutrients?.fat_g) || 0),
        },
        ingredients_detected: Array.isArray(item.ingredients_detected)
          ? item.ingredients_detected
          : [],
        health_tip: item.health_tip || "ทานอาหารให้สมดุลและครบ 5 หมู่เพื่อสุขภาพที่ดีครับ",
        portion_multiplier: 1.0,
        portion_label: "ปกติ (x1.0)",
      };
    });

    return {
      scan_type: scanMode,
      foods: normalizedFoods,
      overall_tip: parsed.overall_tip || undefined,
    };
  } catch (error: any) {
    console.error("Gemini API Analysis Error:", error);
    if (error.message?.includes("API_KEY_INVALID") || error.status === 400) {
      throw new Error("Gemini API Key ไม่ถูกต้อง กรุณาตรวจสอบ Key ของคุณในหน้าตั้งค่า");
    }
    if (error.message?.includes("QUOTA_EXCEEDED") || error.status === 429) {
      throw new Error("โควตา Gemini API หมดชั่วคราว กรุณารอสักครู่แล้วลองใหม่");
    }
    throw error;
  }
}

export interface TextNutritionEstimate {
  food_name: string;
  food_name_en?: string;
  calories: number;
  macronutrients: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  portion_description: string;
  source: "offline" | "ai";
}

// Built-in offline quick-reference dictionary for instant offline response
const QUICK_OFFLINE_NUTRITION: Record<string, TextNutritionEstimate> = {
  "กล้วย": {
    food_name: "กล้วย",
    food_name_en: "Banana",
    calories: 105,
    macronutrients: { protein_g: 1.3, carbs_g: 27, fat_g: 0.3 },
    portion_description: "1 ผลกลาง (~118g)",
    source: "offline",
  },
  "กล้วยหอม": {
    food_name: "กล้วยหอม",
    food_name_en: "Cavendish Banana",
    calories: 120,
    macronutrients: { protein_g: 1.5, carbs_g: 31, fat_g: 0.4 },
    portion_description: "1 ผลใหญ่ (~135g)",
    source: "offline",
  },
  "กล้วยน้ำว้า": {
    food_name: "กล้วยน้ำว้า",
    food_name_en: "Cultivated Banana",
    calories: 60,
    macronutrients: { protein_g: 0.8, carbs_g: 15, fat_g: 0.2 },
    portion_description: "1 ผล (~50g)",
    source: "offline",
  },
  "ไข่ต้ม": {
    food_name: "ไข่ต้ม",
    food_name_en: "Boiled Egg",
    calories: 75,
    macronutrients: { protein_g: 6.3, carbs_g: 0.6, fat_g: 5.3 },
    portion_description: "1 ฟอง (~50g)",
    source: "offline",
  },
  "ไข่ต้ม 2 ฟอง": {
    food_name: "ไข่ต้ม 2 ฟอง",
    food_name_en: "2 Boiled Eggs",
    calories: 150,
    macronutrients: { protein_g: 12.6, carbs_g: 1.2, fat_g: 10.6 },
    portion_description: "2 ฟอง (~100g)",
    source: "offline",
  },
  "ไข่ดาว": {
    food_name: "ไข่ดาว",
    food_name_en: "Fried Egg",
    calories: 120,
    macronutrients: { protein_g: 6.3, carbs_g: 0.5, fat_g: 10.5 },
    portion_description: "1 ฟอง ทอดน้ำมัน",
    source: "offline",
  },
  "ไข่เจียว": {
    food_name: "ไข่เจียว",
    food_name_en: "Thai Omelet",
    calories: 250,
    macronutrients: { protein_g: 12, carbs_g: 2, fat_g: 22 },
    portion_description: "1 จาน (ไข่ 2 ฟอง)",
    source: "offline",
  },
  "ข้าวสวย": {
    food_name: "ข้าวสวย",
    food_name_en: "Steamed White Rice",
    calories: 150,
    macronutrients: { protein_g: 3, carbs_g: 33, fat_g: 0.5 },
    portion_description: "1 ทัพพี (~100g)",
    source: "offline",
  },
  "ข้าวกล้อง": {
    food_name: "ข้าวกล้อง",
    food_name_en: "Brown Rice",
    calories: 140,
    macronutrients: { protein_g: 3.2, carbs_g: 30, fat_g: 1.2 },
    portion_description: "1 ทัพพี (~100g)",
    source: "offline",
  },
  "ข้าวเหนียว": {
    food_name: "ข้าวเหนียว",
    food_name_en: "Sticky Rice",
    calories: 160,
    macronutrients: { protein_g: 3, carbs_g: 36, fat_g: 0.5 },
    portion_description: "1 ห่อเล็ก (~100g)",
    source: "offline",
  },
  "อกไก่": {
    food_name: "อกไก่ต้ม",
    food_name_en: "Boiled Chicken Breast",
    calories: 165,
    macronutrients: { protein_g: 31, carbs_g: 0, fat_g: 3.6 },
    portion_description: "อกไก่สุก 100g",
    source: "offline",
  },
  "อกไก่ย่าง": {
    food_name: "อกไก่ย่าง",
    food_name_en: "Grilled Chicken Breast",
    calories: 180,
    macronutrients: { protein_g: 30, carbs_g: 1, fat_g: 5 },
    portion_description: "อกไก่ย่าง 1 ชิ้น (~120g)",
    source: "offline",
  },
  "ไก่ย่าง": {
    food_name: "ไก่ย่าง",
    food_name_en: "Grilled Chicken",
    calories: 220,
    macronutrients: { protein_g: 28, carbs_g: 2, fat_g: 11 },
    portion_description: "1 ชิ้นน่อง/สะโพก (~150g)",
    source: "offline",
  },
  "ลิ้นวัวน้ำตก": {
    food_name: "ลิ้นวัวน้ำตก",
    food_name_en: "Spicy Grilled Beef Tongue Salad (Nam Tok)",
    calories: 220,
    macronutrients: { protein_g: 20, carbs_g: 5, fat_g: 13 },
    portion_description: "1 จาน (~150g)",
    source: "offline",
  },
  "ลิ้นวัว": {
    food_name: "ลิ้นวัวย่าง",
    food_name_en: "Grilled Beef Tongue",
    calories: 220,
    macronutrients: { protein_g: 19, carbs_g: 1, fat_g: 15 },
    portion_description: "1 จาน (~120g)",
    source: "offline",
  },
  "น้ำตกเนื้อ": {
    food_name: "น้ำตกเนื้อ",
    food_name_en: "Spicy Grilled Beef Salad",
    calories: 210,
    macronutrients: { protein_g: 22, carbs_g: 4, fat_g: 12 },
    portion_description: "1 จาน (~150g)",
    source: "offline",
  },
  "น้ำตกหมู": {
    food_name: "น้ำตกหมู",
    food_name_en: "Spicy Grilled Pork Salad",
    calories: 230,
    macronutrients: { protein_g: 18, carbs_g: 4, fat_g: 16 },
    portion_description: "1 จาน (~150g)",
    source: "offline",
  },
  "น้ำตก": {
    food_name: "น้ำตกหมู/เนื้อ",
    food_name_en: "Spicy Grilled Meat Salad",
    calories: 220,
    macronutrients: { protein_g: 20, carbs_g: 4, fat_g: 14 },
    portion_description: "1 จาน (~150g)",
    source: "offline",
  },
  "ลาบหมู": {
    food_name: "ลาบหมู",
    food_name_en: "Spicy Minced Pork Salad (Larb)",
    calories: 180,
    macronutrients: { protein_g: 22, carbs_g: 5, fat_g: 8 },
    portion_description: "1 จาน (~150g)",
    source: "offline",
  },
  "ลาบ": {
    food_name: "ลาบหมู",
    food_name_en: "Spicy Minced Meat Salad (Larb)",
    calories: 180,
    macronutrients: { protein_g: 22, carbs_g: 5, fat_g: 8 },
    portion_description: "1 จาน (~150g)",
    source: "offline",
  },
  "คอหมูย่าง": {
    food_name: "คอหมูย่าง",
    food_name_en: "Grilled Pork Neck",
    calories: 280,
    macronutrients: { protein_g: 18, carbs_g: 2, fat_g: 22 },
    portion_description: "1 จาน (~120g)",
    source: "offline",
  },
  "หมูปิ้ง": {
    food_name: "หมูปิ้ง",
    food_name_en: "Grilled Pork Skewer",
    calories: 130,
    macronutrients: { protein_g: 8, carbs_g: 4, fat_g: 9 },
    portion_description: "1 ไม้ (~40g)",
    source: "offline",
  },
  "ส้มตำไทย": {
    food_name: "ส้มตำไทย",
    food_name_en: "Som Tum Thai (Papaya Salad)",
    calories: 120,
    macronutrients: { protein_g: 3, carbs_g: 25, fat_g: 1 },
    portion_description: "1 จาน (~150g)",
    source: "offline",
  },
  "ส้มตำปูปลาร้า": {
    food_name: "ส้มตำปูปลาร้า",
    food_name_en: "Som Tum Poo Plara",
    calories: 80,
    macronutrients: { protein_g: 4, carbs_g: 15, fat_g: 1 },
    portion_description: "1 จาน (~150g)",
    source: "offline",
  },
  "ส้มตำ": {
    food_name: "ส้มตำ",
    food_name_en: "Papaya Salad (Som Tum)",
    calories: 110,
    macronutrients: { protein_g: 3, carbs_g: 22, fat_g: 1 },
    portion_description: "1 จาน (~150g)",
    source: "offline",
  },
  "แอปเปิ้ล": {
    food_name: "แอปเปิ้ล",
    food_name_en: "Apple",
    calories: 80,
    macronutrients: { protein_g: 0.5, carbs_g: 21, fat_g: 0.3 },
    portion_description: "1 ผลกลาง (~150g)",
    source: "offline",
  },
  "กาแฟดำ": {
    food_name: "กาแฟดำ / อเมริกาโน่ไม่หวาน",
    food_name_en: "Black Coffee / Americano",
    calories: 5,
    macronutrients: { protein_g: 0.3, carbs_g: 0.5, fat_g: 0 },
    portion_description: "1 แก้ว (ไม่ใส่น้ำตาล/นม)",
    source: "offline",
  },
  "อเมริกาโน่เย็น": {
    food_name: "อเมริกาโน่เย็นไม่หวาน",
    food_name_en: "Iced Americano (No Sugar)",
    calories: 5,
    macronutrients: { protein_g: 0.3, carbs_g: 0.5, fat_g: 0 },
    portion_description: "1 แก้ว (16 oz)",
    source: "offline",
  },
  "ข้าวกะเพราไก่": {
    food_name: "ข้าวกะเพราไก่",
    food_name_en: "Basil Chicken with Rice",
    calories: 550,
    macronutrients: { protein_g: 26, carbs_g: 65, fat_g: 20 },
    portion_description: "1 จานธรรมดา",
    source: "offline",
  },
  "ข้าวกะเพราหมูสับ": {
    food_name: "ข้าวกะเพราหมูสับ",
    food_name_en: "Basil Minced Pork with Rice",
    calories: 580,
    macronutrients: { protein_g: 24, carbs_g: 65, fat_g: 24 },
    portion_description: "1 จานธรรมดา",
    source: "offline",
  },
  "กะเพราหมูสับ": {
    food_name: "กะเพราหมูสับ",
    food_name_en: "Basil Minced Pork with Rice",
    calories: 580,
    macronutrients: { protein_g: 24, carbs_g: 65, fat_g: 24 },
    portion_description: "1 จานธรรมดา",
    source: "offline",
  },
  "ข้าวมันไก่": {
    food_name: "ข้าวมันไก่",
    food_name_en: "Hainanese Chicken Rice",
    calories: 580,
    macronutrients: { protein_g: 24, carbs_g: 68, fat_g: 23 },
    portion_description: "1 จานธรรมดา",
    source: "offline",
  },
  "ข้าวขาหมู": {
    food_name: "ข้าวขาหมู",
    food_name_en: "Stewed Pork Leg with Rice",
    calories: 650,
    macronutrients: { protein_g: 22, carbs_g: 65, fat_g: 32 },
    portion_description: "1 จานธรรมดา",
    source: "offline",
  },
  "ข้าวผัด": {
    food_name: "ข้าวผัดหมู/ไก่",
    food_name_en: "Fried Rice",
    calories: 550,
    macronutrients: { protein_g: 18, carbs_g: 72, fat_g: 20 },
    portion_description: "1 จานธรรมดา",
    source: "offline",
  },
  "ผัดไทย": {
    food_name: "ผัดไทยกุ้งสด",
    food_name_en: "Pad Thai",
    calories: 550,
    macronutrients: { protein_g: 18, carbs_g: 70, fat_g: 22 },
    portion_description: "1 จานธรรมดา",
    source: "offline",
  },
  "ผัดซีอิ๊ว": {
    food_name: "ผัดซีอิ๊วหมู",
    food_name_en: "Pad See Ew",
    calories: 580,
    macronutrients: { protein_g: 20, carbs_g: 65, fat_g: 26 },
    portion_description: "1 จานธรรมดา",
    source: "offline",
  },
  "ก๋วยเตี๋ยวเรือ": {
    food_name: "ก๋วยเตี๋ยวเรือหมู/เนื้อ",
    food_name_en: "Boat Noodles",
    calories: 350,
    macronutrients: { protein_g: 18, carbs_g: 45, fat_g: 10 },
    portion_description: "1 ชามปกติ",
    source: "offline",
  },
  "สุกี้แห้ง": {
    food_name: "สุกี้แห้งไก่/หมู",
    food_name_en: "Dry Suki",
    calories: 380,
    macronutrients: { protein_g: 22, carbs_g: 35, fat_g: 16 },
    portion_description: "1 จานปกติ",
    source: "offline",
  },
  "สุกี้น้ำ": {
    food_name: "สุกี้น้ำไก่/หมู",
    food_name_en: "Soup Suki",
    calories: 320,
    macronutrients: { protein_g: 20, carbs_g: 30, fat_g: 12 },
    portion_description: "1 ชามปกติ",
    source: "offline",
  },
  "ต้มยำกุ้ง": {
    food_name: "ต้มยำกุ้ง",
    food_name_en: "Tom Yum Goong",
    calories: 150,
    macronutrients: { protein_g: 18, carbs_g: 6, fat_g: 5 },
    portion_description: "1 ถ้วยแกง",
    source: "offline",
  },
  "แกงเขียวหวาน": {
    food_name: "แกงเขียวหวานไก่",
    food_name_en: "Green Curry Chicken",
    calories: 320,
    macronutrients: { protein_g: 14, carbs_g: 8, fat_g: 26 },
    portion_description: "1 ถ้วยแกง",
    source: "offline",
  },
  "นมจืด": {
    food_name: "นมสดรสจืด",
    food_name_en: "Plain Milk",
    calories: 130,
    macronutrients: { protein_g: 8, carbs_g: 12, fat_g: 5 },
    portion_description: "1 กล่อง (200ml)",
    source: "offline",
  },
  "เวย์โปรตีน": {
    food_name: "เวย์โปรตีน",
    food_name_en: "Whey Protein",
    calories: 120,
    macronutrients: { protein_g: 25, carbs_g: 2, fat_g: 1.5 },
    portion_description: "1 สกู๊ป (~30g)",
    source: "offline",
  },
};

// Smart offline quantity parser: extracts numbers like "กล้วย 4", "กล้วย 2 ลูก", "ไข่ต้ม 3 ฟอง"
function tryOfflineNutritionWithQuantity(rawQuery: string): TextNutritionEstimate | null {
  const clean = rawQuery.trim().toLowerCase();

  // 1. Direct match
  for (const [key, val] of Object.entries(QUICK_OFFLINE_NUTRITION)) {
    const cleanKey = key.toLowerCase();
    if (clean === cleanKey || clean === cleanKey.replace(/\s+/g, "")) {
      return val;
    }
  }

  // 2. Extract quantity (e.g. "กล้วย 4", "กล้วย 4 ลูก", "4 กล้วย", "ไข่ต้ม 3 ฟอง")
  const numMatch = clean.match(/\d+(?:\.\d+)?/);
  if (numMatch) {
    const qty = parseFloat(numMatch[0]);
    if (qty > 0 && qty <= 100) {
      // Remove numbers and common Thai unit words to find the base food
      const baseWord = clean
        .replace(/\d+(?:\.\d+)?/g, "")
        .replace(/(ลูก|ผล|ฟอง|ชิ้น|จาน|ทัพพี|แก้ว|ไม้|ถ้วย|ก้อน|ซอง|อัน)/g, "")
        .trim();

      if (baseWord.length >= 2) {
        for (const [key, val] of Object.entries(QUICK_OFFLINE_NUTRITION)) {
          const cleanKey = key.toLowerCase();
          if (
            baseWord === cleanKey ||
            cleanKey.replace(/\s+/g, "") === baseWord.replace(/\s+/g, "")
          ) {
            // Determine unit label
            const unit = val.portion_description.match(/(ลูก|ผล|ฟอง|ชิ้น|จาน|ทัพพี|แก้ว|ไม้|ถ้วย|ก้อน|ซอง|อัน)/)?.[0] || "ชิ้น";
            return {
              food_name: `${val.food_name} ${qty} ${unit}`,
              food_name_en: val.food_name_en ? `${qty} ${val.food_name_en}` : "",
              calories: Math.round(val.calories * qty),
              macronutrients: {
                protein_g: Number((val.macronutrients.protein_g * qty).toFixed(1)),
                carbs_g: Number((val.macronutrients.carbs_g * qty).toFixed(1)),
                fat_g: Number((val.macronutrients.fat_g * qty).toFixed(1)),
              },
              portion_description: `${qty} ${unit}`,
              source: "offline",
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Estimates calories and macronutrients from food name text using Gemini AI (with offline fallback).
 */
export async function estimateNutritionFromText(
  foodText: string,
  userApiKey?: string
): Promise<TextNutritionEstimate> {
  const query = foodText.trim();
  if (!query) {
    throw new Error("กรุณาระบุชื่ออาหาร");
  }

  // 1. Instant offline check with smart quantity detection (0.001s, 0 network, 0 quota)
  const offlineMatch = tryOfflineNutritionWithQuantity(query);
  if (offlineMatch) {
    return offlineMatch;
  }

  // 2. Call server-side /api/estimate with 8s timeout (gives sufficient headroom for multi-model cascade)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (userApiKey && userApiKey.trim()) {
      headers["x-gemini-api-key"] = userApiKey.trim();
    }

    const res = await fetch("/api/estimate", {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({ query }),
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data.error || `HTTP ${res.status}`;
      throw new Error(errMsg);
    }

    return {
      food_name: data.food_name || query,
      food_name_en: data.food_name_en || "",
      calories: data.calories || 0,
      macronutrients: data.macronutrients || { protein_g: 0, carbs_g: 0, fat_g: 0 },
      portion_description: data.portion_description || "ขนาด 1 ที่ปกติ",
      source: "ai",
    };
  } catch (apiErr: any) {
    clearTimeout(timeoutId);

    if (apiErr.name === "AbortError" || apiErr.message?.includes("aborted")) {
      throw new Error("การคำนวณใช้เวลานานเกินไป กรุณากรอกด้วยตนเอง หรือลองใหม่อีกครั้ง");
    }

    throw apiErr;
  }
}

