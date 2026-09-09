/**
 * Gemini API Rate Limit (RPM) Diagnostic Tool
 * -------------------------------------------
 * Tests Google Gemini Free Tier 15 RPM quota limit in real-time.
 * 
 * Usage:
 *   node scripts/test-rpm.mjs <YOUR_GEMINI_API_KEY>
 *   or:
 *   $env:GEMINI_API_KEY="AIzaSy..."; node scripts/test-rpm.mjs
 */

const apiKey = process.argv[2] || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("\n❌ Error: ไม่พบ Gemini API Key");
  console.error("วิธีรัน: node scripts/test-rpm.mjs <YOUR_API_KEY>\n");
  process.exit(1);
}

const maskedKey = apiKey.slice(0, 6) + "••••" + apiKey.slice(-4);
console.log(`\n🔍 เริ่มทดสอบขีดจำกัด Gemini API (RPM Test)`);
console.log(`🔑 Key: ${maskedKey}`);
console.log(`🎯 โมเดล: gemini-3.6-flash (Google Free Tier 15 RPM)`);
console.log(`⏱️  กลไก: ส่งคำขอสั้นๆ ต่อเนื่อง 18 ครั้ง เพื่อดูจุดที่ Google ตัดรอบ 429\n`);
console.log("─".repeat(65));

async function sendTestRequest(index) {
  const start = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text: "ping" }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 2,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    const timeStr = new Date().toLocaleTimeString();

    if (res.ok) {
      console.log(`[${timeStr}] ครั้งที่ #${String(index).padStart(2, "0")} 🟢 HTTP ${res.status} OK (${elapsed}s)`);
      return { success: true, status: res.status };
    } else {
      const data = await res.json().catch(() => ({}));
      const reason = data?.error?.status || res.statusText;
      const message = data?.error?.message || "";
      console.log(`[${timeStr}] ครั้งที่ #${String(index).padStart(2, "0")} 🔴 HTTP ${res.status} [${reason}] (${elapsed}s)`);
      if (message) {
        console.log(`    ↳ ข้อความจาก Google: ${message.slice(0, 100)}...`);
      }
      return { success: false, status: res.status, reason, message };
    }
  } catch (err) {
    console.log(`ครั้งที่ #${index} ⚠️ Network Error: ${err.message}`);
    return { success: false, status: 0, reason: err.message };
  }
}

async function run() {
  let okCount = 0;
  let rateLimitHitAt = null;

  for (let i = 1; i <= 18; i++) {
    const res = await sendTestRequest(i);
    if (res.success) {
      okCount++;
    } else if (res.status === 429 && !rateLimitHitAt) {
      rateLimitHitAt = i;
    }

    // เว้นจังหวะสั้นๆ 200ms เสมือนการกดยิงเร็ว
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("─".repeat(65));
  console.log(`\n📊 สรุปผลการทดสอบ:`);
  console.log(`- สำเร็จ (200 OK): ${okCount} ครั้ง`);
  if (rateLimitHitAt) {
    console.log(`- ชนขีดจำกัด 429 RESOURCE_EXHAUSTED ที่ครั้งที่: #${rateLimitHitAt}`);
    console.log(`💡 ผลลัพธ์: Google บล็อกคำขอทันทีเมื่อเกินขีดจำกัด RPM ในรอบ 60 วินาที!`);
  } else {
    console.log(`- ผ่านทั้ง 18 ครั้ง (อาจเป็น Paid Tier หรือ Google ให้โควตา burst ชั่วคราว)`);
  }
  console.log("");
}

run();
