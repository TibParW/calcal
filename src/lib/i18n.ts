export type Language = "th" | "en";

export const translations = {
  th: {
    // Brand
    brand_name: "calCal",
    tagline: "calCal • จำในเครื่อง ตัดรอบ 00:00 น.",
    
    // Navbar
    nav_history: "ประวัติการบันทึก",
    nav_settings: "ตั้งค่าเป้าหมาย & ระบบ",

    // Date
    date_today: "วันนี้",
    date_yesterday: "เมื่อวานนี้",
    date_tomorrow: "พรุ่งนี้",
    date_prev: "วันก่อนหน้า",
    date_next: "วันถัดไป",
    date_today_btn: "วันนี้",

    // Calorie Ring
    ring_remaining: "เหลืออีก",
    ring_consumed: "กินไปแล้ว",
    ring_goal: "เป้าหมาย",
    ring_over: "เกินเป้าหมาย",
    ring_kcal: "kcal",

    // Macros
    macro_protein: "โปรตีน",
    macro_carbs: "คาร์บ",
    macro_fat: "ไขมัน",
    macro_g: "g",

    // Camera Action
    cam_scan_food: "สแกนอาหาร",
    cam_scan_food_sub: "จานเดียว หรือ หลายจานพร้อมกัน",
    cam_scan_label: "สแกนฉลากหลังซอง",
    cam_scan_label_sub: "ตารางโภชนาการ แม่นยำ 100%",
    cam_gallery: "เลือกรูปภาพ",
    cam_manual: "จดบันทึกเอง",

    // Food List
    list_empty_title: "ยังไม่มีรายการอาหารวันนี้",
    list_empty_sub: "แตะปุ่มสแกนอาหารด้านบน เพื่อให้ AI ช่วยคำนวณแคลอรี",
    list_portion_label: "ขนาด",
    list_delete_confirm: "ต้องการลบรายการนี้ใช่หรือไม่?",

    // Analysis Modal
    modal_title_food: "ผลวิเคราะห์มื้ออาหาร",
    modal_title_label: "ผลสแกนฉลากโภชนาการ",
    modal_analyzing: "AI กำลังวิเคราะห์รูปภาพ...",
    modal_analyzing_sub: "กำลังระบุเมนูอาหารและคำนวณสารอาหารอย่างละเอียด",
    modal_detected_count: "ตรวจพบ",
    modal_detected_unit: "รายการ",
    modal_detected_tip: "สามารถเลือกเฉพาะจานที่ทาน และปรับขนาดสัดส่วนได้",
    modal_portion_small: "จานเล็ก (0.8x)",
    modal_portion_normal: "ปกติ (1.0x)",
    modal_portion_large: "พิเศษ (1.3x)",
    modal_confidence_high: "ความมั่นใจสูง",
    modal_confidence_medium: "ความมั่นใจปานกลาง",
    modal_confidence_low: "ความมั่นใจต่ำ",
    modal_ingredients: "วัตถุดิบที่ตรวจพบ:",
    modal_health_tip: "คำแนะนำสุขภาพ:",
    modal_quick_notes_title: "หมายเหตุถึง AI (ปรับลดแคลอรี):",
    modal_note_placeholder: "เช่น ไม่ใส่กระเทียมเจียว, ไร้มัน, หวาน 25%...",
    modal_recalculate: "ส่งให้ AI คำนวณใหม่",
    modal_recalculating: "กำลังคำนวณใหม่...",
    modal_save_btn: "บันทึก {count} รายการ ({cals} kcal)",
    modal_save_disabled: "กรุณาเลือกอย่างน้อย 1 รายการ",
    modal_retry: "ลองใหม่อีกครั้ง",
    modal_api_key_prompt: "กรอก Gemini API Key ส่วนตัวเพื่อใช้งานต่อ",
    modal_api_key_btn: "บันทึก Key",

    // Quick Tags
    tag_no_oil: "ไม่ใส่น้ำมัน",
    tag_no_skin: "ไม่เอาหนัง",
    tag_less_sweet: "หวานน้อย",
    tag_less_rice: "ข้าวน้อย",
    tag_water_egg: "ไข่ดาวน้ำ",
    tag_no_garlic: "ไม่ใส่กระเทียมเจียว",

    // Manual Entry Modal
    manual_title: "จดบันทึกอาหารเอง",
    manual_name: "ชื่ออาหาร / เมนู",
    manual_name_placeholder: "เช่น ข้าวกะเพราอกไก่ไข่ดาว",
    manual_calories: "พลังงานรวม (kcal)",
    manual_time: "เวลาที่ทาน",
    manual_macros_title: "สารอาหารหลัก (ไม่บังคับ)",
    manual_calculate: "คำนวณ",
    manual_calculating: "กำลังคิด...",
    manual_calc_tooltip: "ให้ AI คำนวณแคลอรีและสารอาหารจากชื่อเมนูอัตโนมัติ",
    manual_portion_hint: "ประมาณจาก: {portion}",
    manual_save: "บันทึกมื้ออาหาร",
    manual_cancel: "ยกเลิก",

    // Settings Modal
    settings_title: "ตั้งค่าเป้าหมาย & ระบบ",
    settings_daily_goal: "เป้าหมายแคลอรีต่อวัน (kcal)",
    settings_macros_title: "สัดส่วนสารอาหารเป้าหมาย (กรัม)",
    settings_bmr_btn: "คำนวณเป้าหมายส่วนบุคคล (BMR / TDEE)",
    settings_storage_title: "การจัดเก็บในเครื่อง (Privacy-First)",
    settings_storage_ultra: "โหมดเบาพิเศษ (ไม่เก็บรูป)",
    settings_storage_ultra_desc: "เก็บเฉพาะตัวเลขและข้อมูล ~0.2 KB/มื้อ (แนะนำ)",
    settings_storage_thumb: "โหมดเก็บรูปจิ๋ว",
    settings_storage_thumb_desc: "ย่อรูปเหลือ 80x80 px ~2-3 KB/มื้อ",
    settings_storage_used: "พื้นที่ใช้งานในเครื่อง:",
    settings_strip_btn: "ลบเฉพาะรูปภาพเพื่อคืนพื้นที่",
    settings_strip_confirm: "ต้องการลบเฉพาะไฟล์รูปภาพเพื่อประหยัดพื้นที่ใช่หรือไม่? (ประวัติและตัวเลขยังคงอยู่ครบ 100%)",
    settings_api_key_title: "Gemini API Key ส่วนตัว (ไม่จำเป็นต้องใส่)",
    settings_api_key_desc: "บันทึกไว้ในเครื่องของคุณเท่านั้น เผื่อกรณีโควตารวมหมด",
    settings_api_key_link: "ขอรับ API Key ฟรีที่ Google AI Studio",
    quota_title: "สถานะและโควตา API (Google Free Tier)",
    quota_rpm_label: "ความถี่ต่อนาที (RPM)",
    quota_rpm_remaining: "เหลืออีก {n} ครั้งในนาทีนี้",
    quota_rpm_limit_warn: "ใกล้ชนเพดานต่อนาที",
    quota_daily_label: "การใช้งานประจำวัน (ตัดรอบ 00:00 น.)",
    quota_daily_count: "สแกนไปแล้ว {n} / {max} ครั้งวันนี้",
    quota_status_ready: "พร้อมใช้งาน",
    quota_status_cooldown: "กำลังพักรอบ ({sec}s)",
    quota_cooldown_msg: "กำลังรีเซ็ตโควตากับ Google... รออีก {sec} วินาที",
    quota_retry_in: "ลองใหม่อีกครั้ง ({sec}s)",
    settings_backup_title: "สำรอง & นำเข้าข้อมูล",
    settings_export_btn: "ส่งออกข้อมูลสำรอง (JSON)",
    settings_import_btn: "นำเข้าข้อมูลสำรอง (JSON)",
    settings_clear_btn: "ล้างข้อมูลและประวัติทั้งหมดในเครื่อง",
    settings_clear_confirm_prompt: "ยืนยันล้างข้อมูลทั้งหมด?",
    settings_clear_action: "ล้าง",
    settings_cancel_action: "ยกเลิก",
    settings_clear_confirm: "คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทั้งหมด? ข้อมูลทั้งหมดจะหายไปอย่างถาวร",
    settings_save_btn: "บันทึกการตั้งค่า",
    settings_lang_title: "ภาษาของระบบ",
    theme_title: "โหมดการแสดงผล",
    theme_light: "สว่าง",
    theme_dark: "มืด",
    theme_toggle: "สลับโหมดมืด/สว่าง",

    // TDEE Modal
    tdee_title: "คำนวณเป้าหมายส่วนบุคคล",
    tdee_subtitle: "สูตรมาตรฐาน Mifflin-St Jeor คำนวณพลังงานที่เหมาะสมกับร่างกายคุณ",
    tdee_gender: "เพศ",
    tdee_male: "ชาย",
    tdee_female: "หญิง",
    tdee_age: "อายุ (ปี)",
    tdee_weight: "น้ำหนัก (กก.)",
    tdee_height: "ส่วนสูง (ซม.)",
    tdee_activity: "ระดับกิจกรรมประจำวัน",
    tdee_act_sedentary: "นั่งทำงานเป็นหลัก ไม่ออกกำลังกาย",
    tdee_act_light: "ออกกำลังกายเบาๆ 1-3 วัน/สัปดาห์",
    tdee_act_moderate: "ออกกำลังกายปานกลาง 3-5 วัน/สัปดาห์",
    tdee_act_active: "ออกกำลังกายหนัก 6-7 วัน/สัปดาห์",
    tdee_act_very_active: "นักกีฬา / ทำงานใช้แรงงานหนัก",
    tdee_goal: "เป้าหมายสุขภาพ",
    tdee_goal_loss: "ลดไขมัน (-500 kcal/วัน)",
    tdee_goal_maintain: "รักษาน้ำหนัก (คงที่)",
    tdee_goal_gain: "เพิ่มกล้ามเนื้อ (+300 kcal/วัน)",
    tdee_results: "ผลการคำนวณ",
    tdee_bmr_label: "BMR (พลังงานเผาผลาญขณะพัก)",
    tdee_tdee_label: "TDEE (พลังงานเผาผลาญรวมต่อวัน)",
    tdee_target_label: "เป้าหมายแคลอรีที่แนะนำ",
    tdee_apply_btn: "ใช้เป้าหมายนี้ทันที",

    // History Modal
    hist_title: "ประวัติการกิน & สถิติ",
    hist_chart_title: "สรุป 7 วันย้อนหลัง",
    hist_avg_label: "เฉลี่ยต่อวัน",
    hist_days_met: "คุมได้ตามเป้า",
    hist_days_unit: "วัน",
    hist_tap_tip: "แตะที่แท่งเพื่อดูมื้ออาหารของวันนั้น",
    hist_logs_title: "ประวัติบันทึกย้อนหลัง",
    hist_export_csv: "ดาวน์โหลดตาราง Excel (CSV)",
    hist_export_json: "สำรองข้อมูล (JSON)",
    hist_empty: "ยังไม่มีประวัติการบันทึก",
    hist_total: "รวม",
    hist_meals: "มื้อ",
  },
  en: {
    // Brand
    brand_name: "calCal",
    tagline: "calCal • Stored locally • Resets at 00:00",
    
    // Navbar
    nav_history: "History & Stats",
    nav_settings: "Settings & Goals",

    // Date
    date_today: "Today",
    date_yesterday: "Yesterday",
    date_tomorrow: "Tomorrow",
    date_prev: "Previous Day",
    date_next: "Next Day",
    date_today_btn: "Today",

    // Calorie Ring
    ring_remaining: "Remaining",
    ring_consumed: "Consumed",
    ring_goal: "Goal",
    ring_over: "Over Goal",
    ring_kcal: "kcal",

    // Macros
    macro_protein: "Protein",
    macro_carbs: "Carbs",
    macro_fat: "Fat",
    macro_g: "g",

    // Camera Action
    cam_scan_food: "Scan Food",
    cam_scan_food_sub: "Single or multiple dishes at once",
    cam_scan_label: "Scan Nutrition Label",
    cam_scan_label_sub: "Nutrition facts table 100% exact",
    cam_gallery: "Gallery",
    cam_manual: "Manual Log",

    // Food List
    list_empty_title: "No meals logged today",
    list_empty_sub: "Tap scan food above to let AI analyze calories",
    list_portion_label: "Portion",
    list_delete_confirm: "Are you sure you want to delete this meal?",

    // Analysis Modal
    modal_title_food: "Meal Analysis Result",
    modal_title_label: "Nutrition Label Result",
    modal_analyzing: "AI is analyzing image...",
    modal_analyzing_sub: "Detecting dishes and calculating exact nutrients",
    modal_detected_count: "Detected",
    modal_detected_unit: "items",
    modal_detected_tip: "Select which dishes to log and adjust portions",
    modal_portion_small: "Small (0.8x)",
    modal_portion_normal: "Regular (1.0x)",
    modal_portion_large: "Large (1.3x)",
    modal_confidence_high: "High Confidence",
    modal_confidence_medium: "Medium Confidence",
    modal_confidence_low: "Low Confidence",
    modal_ingredients: "Detected Ingredients:",
    modal_health_tip: "Health Tip:",
    modal_quick_notes_title: "Notes for AI (adjust calories):",
    modal_note_placeholder: "e.g. No garlic oil, lean chicken, 25% sugar...",
    modal_recalculate: "Re-analyze with AI",
    modal_recalculating: "Re-calculating...",
    modal_save_btn: "Save {count} items ({cals} kcal)",
    modal_save_disabled: "Please select at least 1 item",
    modal_retry: "Try Again",
    modal_api_key_prompt: "Enter your personal Gemini API Key to continue",
    modal_api_key_btn: "Save Key",

    // Quick Tags
    tag_no_oil: "No Oil",
    tag_no_skin: "No Skin",
    tag_less_sweet: "Less Sweet",
    tag_less_rice: "Less Rice",
    tag_water_egg: "Poached Egg",
    tag_no_garlic: "No Fried Garlic",

    // Manual Entry Modal
    manual_title: "Manual Meal Entry",
    manual_name: "Food / Meal Name",
    manual_name_placeholder: "e.g. Grilled Chicken Salad",
    manual_calories: "Total Calories (kcal)",
    manual_time: "Time",
    manual_macros_title: "Macronutrients (Optional)",
    manual_calculate: "Calculate",
    manual_calculating: "Thinking...",
    manual_calc_tooltip: "Auto-calculate calories and macros from meal name with AI",
    manual_portion_hint: "Estimated from: {portion}",
    manual_save: "Save Meal",
    manual_cancel: "Cancel",

    // Settings Modal
    settings_title: "Settings & Goals",
    settings_daily_goal: "Daily Calorie Target (kcal)",
    settings_macros_title: "Target Macronutrients (grams)",
    settings_bmr_btn: "Calculate Personal Goals (BMR / TDEE)",
    settings_storage_title: "Local Storage (Privacy-First)",
    settings_storage_ultra: "Ultra-Light (No images)",
    settings_storage_ultra_desc: "Saves only numbers and text ~0.2 KB/meal (Recommended)",
    settings_storage_thumb: "Micro-Thumbnail Mode",
    settings_storage_thumb_desc: "Compresses image to 80x80 px ~2-3 KB/meal",
    settings_storage_used: "Storage used on device:",
    settings_strip_btn: "Clear images to free up space",
    settings_strip_confirm: "Clear all thumbnail images to save space? (History and numbers will remain 100% intact)",
    settings_api_key_title: "Personal Gemini API Key (Optional)",
    settings_api_key_desc: "Saved only on your device in case shared quota is exhausted",
    settings_api_key_link: "Get free API Key at Google AI Studio",
    quota_title: "API Quota & Rate Limit (Google Free Tier)",
    quota_rpm_label: "Requests Per Minute (RPM)",
    quota_rpm_remaining: "{n} remaining this minute",
    quota_rpm_limit_warn: "Near per-minute rate limit",
    quota_daily_label: "Daily Scans (Resets at 00:00)",
    quota_daily_count: "Used {n} / {max} scans today",
    quota_status_ready: "Ready",
    quota_status_cooldown: "Cooldown ({sec}s)",
    quota_cooldown_msg: "Resetting quota with Google... {sec}s remaining",
    quota_retry_in: "Retry ({sec}s)",
    settings_backup_title: "Backup & Import Data",
    settings_export_btn: "Export Backup (JSON)",
    settings_import_btn: "Import Backup (JSON)",
    settings_clear_btn: "Clear all local data and history",
    settings_clear_confirm_prompt: "Confirm clear all data?",
    settings_clear_action: "Clear",
    settings_cancel_action: "Cancel",
    settings_clear_confirm: "Are you sure you want to delete all data? This cannot be undone.",
    settings_save_btn: "Save Settings",
    settings_lang_title: "Language",
    theme_title: "Appearance",
    theme_light: "Light",
    theme_dark: "Dark",
    theme_toggle: "Toggle dark/light mode",

    // TDEE Modal
    tdee_title: "Personal Goal Calculator",
    tdee_subtitle: "Standard Mifflin-St Jeor formula to determine your body's optimal caloric intake",
    tdee_gender: "Gender",
    tdee_male: "Male",
    tdee_female: "Female",
    tdee_age: "Age (years)",
    tdee_weight: "Weight (kg)",
    tdee_height: "Height (cm)",
    tdee_activity: "Daily Activity Level",
    tdee_act_sedentary: "Sedentary (Little or no exercise)",
    tdee_act_light: "Light (Exercise 1-3 days/week)",
    tdee_act_moderate: "Moderate (Exercise 3-5 days/week)",
    tdee_act_active: "Active (Exercise 6-7 days/week)",
    tdee_act_very_active: "Very Active (Physical job or 2x training)",
    tdee_goal: "Health Goal",
    tdee_goal_loss: "Fat Loss (-500 kcal/day)",
    tdee_goal_maintain: "Maintain Weight",
    tdee_goal_gain: "Muscle Gain (+300 kcal/day)",
    tdee_results: "Results",
    tdee_bmr_label: "BMR (Basal Metabolic Rate)",
    tdee_tdee_label: "TDEE (Total Daily Energy Expenditure)",
    tdee_target_label: "Recommended Daily Target",
    tdee_apply_btn: "Apply This Target",

    // History Modal
    hist_title: "History & Statistics",
    hist_chart_title: "Past 7 Days Overview",
    hist_avg_label: "Daily Average",
    hist_days_met: "Target Met",
    hist_days_unit: "days",
    hist_tap_tip: "Tap a bar to view meals for that day",
    hist_logs_title: "Past Logged Days",
    hist_export_csv: "Download Excel (CSV)",
    hist_export_json: "Backup (JSON)",
    hist_empty: "No logged history yet",
    hist_total: "Total",
    hist_meals: "meals",
  },
};

export type TranslationKey = keyof typeof translations.th;

/**
 * Localized date formatter for Thai & English
 */
export function formatLocalizedDate(dateStr: string, lang: Language): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  if (dateStr === todayStr) {
    return lang === "th" ? "วันนี้" : "Today";
  } else if (dateStr === yesterdayStr) {
    return lang === "th" ? "เมื่อวานนี้" : "Yesterday";
  } else if (dateStr === tomorrowStr) {
    return lang === "th" ? "พรุ่งนี้" : "Tomorrow";
  }

  if (lang === "th") {
    const thaiMonths = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    return `${day} ${thaiMonths[month - 1]} ${year + 543}`;
  } else {
    const enMonths = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${day} ${enMonths[month - 1]} ${year}`;
  }
}
