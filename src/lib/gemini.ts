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

export async function analyzeFoodImage(
  base64Data: string,
  mimeType: string = "image/jpeg",
  userApiKey?: string,
  userNote?: string,
  scanMode: "food" | "nutrition_label" = "food"
): Promise<MultiFoodAnalysisResponse> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "MISSING_API_KEY: ไม่พบ Gemini API Key กรุณาตั้งค่า GEMINI_API_KEY ในไฟล์ .env หรือกรอกในเมนูตั้งค่าของหน้าเว็บ"
    );
  }

  // Clean base64 string if it contains data URL prefix
  const cleanBase64 = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.15,
    },
  });

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
    const result = await model.generateContent([
      systemInstruction,
      prompt,
      imagePart,
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("AI ไม่ได้ส่งผลลัพธ์กลับมา กรุณาลองใหม่อีกครั้ง");
    }

    const parsed = JSON.parse(text);

    // Normalize output: handle array foods or single food fallback
    let rawFoodsList: any[] = [];
    if (Array.isArray(parsed.foods) && parsed.foods.length > 0) {
      rawFoodsList = parsed.foods;
    } else if (parsed.food_name) {
      rawFoodsList = [parsed];
    } else {
      throw new Error("ไม่สามารถระบุรายการอาหารในรูปภาพได้ กรุณาลองถ่ายใหม่อีกครั้ง");
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
