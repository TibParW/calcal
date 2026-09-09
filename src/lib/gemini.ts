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
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
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

      // Sort with priority for stable standard flash versions first
      const priority = [
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash",
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-2.5-flash-lite",
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

  // Clean base64 string if it contains data URL prefix
  const cleanBase64 = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;

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

    for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.15,
        },
      });

      const result = await model.generateContent([
        systemInstruction,
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

      // If quota exceeded (429), pause briefly and try next candidate model
      if (
        msg.includes("QUOTA_EXCEEDED") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        err?.status === 429
      ) {
        console.warn(`[Gemini API] Quota limit hit on "${modelName}", trying next candidate model in 1.2s...`);
        await new Promise((resolve) => setTimeout(resolve, 1200));
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
    throw lastError || new Error("เกิดข้อผิดพลาดในการประมวลผลรูปภาพอาหารด้วย AI กรุณาลองใหม่อีกครั้ง");
  }

  const text = rawText;

    // Clean potential markdown wrap if any (e.g. ```json ... ```)
    let cleanJson = text.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "").trim();
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
}

// Built-in offline quick-reference dictionary for instant offline response
const QUICK_OFFLINE_NUTRITION: Record<string, TextNutritionEstimate> = {
  "กล้วย": {
    food_name: "กล้วย",
    food_name_en: "Banana",
    calories: 105,
    macronutrients: { protein_g: 1.3, carbs_g: 27, fat_g: 0.3 },
    portion_description: "1 ผลกลาง (~118g)",
  },
  "กล้วยหอม": {
    food_name: "กล้วยหอม",
    food_name_en: "Cavendish Banana",
    calories: 120,
    macronutrients: { protein_g: 1.5, carbs_g: 31, fat_g: 0.4 },
    portion_description: "1 ผลใหญ่ (~135g)",
  },
  "กล้วยน้ำว้า": {
    food_name: "กล้วยน้ำว้า",
    food_name_en: "Cultivated Banana",
    calories: 60,
    macronutrients: { protein_g: 0.8, carbs_g: 15, fat_g: 0.2 },
    portion_description: "1 ผล (~50g)",
  },
  "ไข่ต้ม": {
    food_name: "ไข่ต้ม",
    food_name_en: "Boiled Egg",
    calories: 75,
    macronutrients: { protein_g: 6.3, carbs_g: 0.6, fat_g: 5.3 },
    portion_description: "1 ฟอง (~50g)",
  },
  "ไข่ต้ม 2 ฟอง": {
    food_name: "ไข่ต้ม 2 ฟอง",
    food_name_en: "2 Boiled Eggs",
    calories: 150,
    macronutrients: { protein_g: 12.6, carbs_g: 1.2, fat_g: 10.6 },
    portion_description: "2 ฟอง (~100g)",
  },
  "ไข่ดาว": {
    food_name: "ไข่ดาว",
    food_name_en: "Fried Egg",
    calories: 120,
    macronutrients: { protein_g: 6.3, carbs_g: 0.5, fat_g: 10.5 },
    portion_description: "1 ฟอง ทอดน้ำมัน",
  },
  "ข้าวสวย": {
    food_name: "ข้าวสวย",
    food_name_en: "Steamed White Rice",
    calories: 150,
    macronutrients: { protein_g: 3, carbs_g: 33, fat_g: 0.5 },
    portion_description: "1 ทัพพี (~100g)",
  },
  "ข้าวกล้อง": {
    food_name: "ข้าวกล้อง",
    food_name_en: "Brown Rice",
    calories: 140,
    macronutrients: { protein_g: 3.2, carbs_g: 30, fat_g: 1.2 },
    portion_description: "1 ทัพพี (~100g)",
  },
  "อกไก่": {
    food_name: "อกไก่ต้ม",
    food_name_en: "Boiled Chicken Breast",
    calories: 165,
    macronutrients: { protein_g: 31, carbs_g: 0, fat_g: 3.6 },
    portion_description: "อกไก่สุก 100g",
  },
  "อกไก่ย่าง": {
    food_name: "อกไก่ย่าง",
    food_name_en: "Grilled Chicken Breast",
    calories: 180,
    macronutrients: { protein_g: 30, carbs_g: 1, fat_g: 5 },
    portion_description: "อกไก่ย่าง 1 ชิ้น (~120g)",
  },
  "แอปเปิ้ล": {
    food_name: "แอปเปิ้ล",
    food_name_en: "Apple",
    calories: 80,
    macronutrients: { protein_g: 0.5, carbs_g: 21, fat_g: 0.3 },
    portion_description: "1 ผลกลาง (~150g)",
  },
  "กาแฟดำ": {
    food_name: "กาแฟดำ / อเมริกาโน่ไม่หวาน",
    food_name_en: "Black Coffee / Americano",
    calories: 5,
    macronutrients: { protein_g: 0.3, carbs_g: 0.5, fat_g: 0 },
    portion_description: "1 แก้ว (ไม่ใส่น้ำตาล/นม)",
  },
  "อเมริกาโน่เย็น": {
    food_name: "อเมริกาโน่เย็นไม่หวาน",
    food_name_en: "Iced Americano (No Sugar)",
    calories: 5,
    macronutrients: { protein_g: 0.3, carbs_g: 0.5, fat_g: 0 },
    portion_description: "1 แก้ว (16 oz)",
  },
  "ข้าวกะเพราไก่": {
    food_name: "ข้าวกะเพราไก่",
    food_name_en: "Basil Chicken with Rice",
    calories: 550,
    macronutrients: { protein_g: 26, carbs_g: 65, fat_g: 20 },
    portion_description: "1 จานธรรมดา",
  },
  "ข้าวมันไก่": {
    food_name: "ข้าวมันไก่",
    food_name_en: "Hainanese Chicken Rice",
    calories: 580,
    macronutrients: { protein_g: 24, carbs_g: 68, fat_g: 23 },
    portion_description: "1 จานธรรมดา",
  },
};

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

  // Check direct offline match first for ultra-fast response
  const lowerQuery = query.toLowerCase();
  for (const [key, val] of Object.entries(QUICK_OFFLINE_NUTRITION)) {
    if (lowerQuery === key.toLowerCase() || lowerQuery === key.toLowerCase().replace(/\s+/g, "")) {
      return val;
    }
  }

  const apiKey = (userApiKey || process.env.GEMINI_API_KEY || "").trim();

  // If no API key is available, check fuzzy match in offline dictionary
  if (!apiKey) {
    for (const [key, val] of Object.entries(QUICK_OFFLINE_NUTRITION)) {
      if (lowerQuery.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerQuery)) {
        return val;
      }
    }
    throw new Error(
      "MISSING_API_KEY: ไม่พบ Gemini API Key ในระบบเพื่อคำนวณอาหารนอกตาราง กรุณากรอก API Key ในหน้าต่างตั้งค่า"
    );
  }

  const candidateModels = await getAvailableGeminiModels(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `คุณคือผู้เชี่ยวชาญด้านโภชนาการอาหาร หน้าที่ของคุณคือประมาณค่าพลังงานรวม (kcal) และสารอาหารหลัก (โปรตีน, คาร์บ, ไขมัน ในหน่วยกรัม) ของอาหารที่ระบุต่อไปนี้:
"${query}"

ข้อกำหนด:
1. ตรวจสอบก่อนว่าข้อความนี้คือ "อาหาร/เครื่องดื่มที่มนุษย์บริโภคได้" หรือไม่
2. หากข้อความ "ไม่ใช่ชื่ออาหาร", "เป็นสิ่งของทั่วไป", หรือ "เป็นตัวอักษรพิมพ์มั่ว" (เช่น asdf, กกกก, โต๊ะ, เก้าอี้, 12345) ให้ตอบกลับรูปแบบนี้ทันที:
{
  "is_food": false,
  "error_message": "ไม่พบว่าเป็นชื่ออาหาร กรุณาระบุชื่อเมนูอาหารใหม่อีกครั้ง"
}
3. หากเป็นอาหารหรือเครื่องดื่ม ให้คำนวณจากขนาดบริโภคมาตรฐาน 1 ที่ (Single Standard Serving)
4. ปัดตัวเลขแคลอรีและสารอาหารเป็นจำนวนเต็มหรือทศนิยม 1 ตำแหน่ง
5. ตอบกลับเป็น JSON object เท่านั้นตามโครงสร้างนี้:
{
  "is_food": true,
  "food_name": "${query}",
  "food_name_en": "Food Name English",
  "calories": 120,
  "macronutrients": {
    "protein_g": 1.3,
    "carbs_g": 27,
    "fat_g": 0.3
  },
  "portion_description": "ขนาด 1 ที่ (~120g)"
}`;

  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Clean JSON formatting if markdown wraps it
      if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const parsed = JSON.parse(text);

      if (parsed.is_food === false) {
        throw new Error(parsed.error_message || "ไม่พบว่าเป็นชื่ออาหาร กรุณาระบุชื่อเมนูอาหารใหม่อีกครั้ง");
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

      return {
        food_name: parsed.food_name || query,
        food_name_en: parsed.food_name_en || "",
        calories: Math.max(0, Math.round(cals)),
        macronutrients: {
          protein_g: Math.max(0, Number(p.toFixed(1))),
          carbs_g: Math.max(0, Number(c.toFixed(1))),
          fat_g: Math.max(0, Number(f.toFixed(1))),
        },
        portion_description: parsed.portion_description || "ขนาด 1 ที่ปกติ",
      };
    } catch (err: any) {
      console.warn(`[gemini-text] Model ${modelName} failed, attempting next model:`, err.message);
      lastError = err;
      continue;
    }
  }

  // Fallback to fuzzy offline match if AI models were busy or rate-limited
  for (const [key, val] of Object.entries(QUICK_OFFLINE_NUTRITION)) {
    if (lowerQuery.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerQuery)) {
      return val;
    }
  }

  throw lastError || new Error("ไม่สามารถประเมินแคลอรีได้ในขณะนี้ กรุณากรอกด้วยตนเอง");
}

