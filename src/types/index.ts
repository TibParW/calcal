export interface Macronutrients {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DetectedIngredient {
  name: string;
  portion: string;
  calories: number;
}

export interface FoodAnalysisResult {
  id?: string;
  food_name: string;
  food_name_en?: string;
  estimated_calories: number;
  confidence_level: 'high' | 'medium' | 'low';
  confidence_reason?: string;
  macronutrients: Macronutrients;
  ingredients_detected: DetectedIngredient[];
  health_tip?: string;
  portion_multiplier?: number;
  portion_label?: string;
  raw_image_preview?: string;
}

export interface MultiFoodAnalysisResponse {
  scan_type: 'food' | 'nutrition_label';
  foods: FoodAnalysisResult[];
  overall_tip?: string;
}

export interface FoodLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  food_name: string;
  food_name_en?: string;
  calories: number;
  macronutrients: Macronutrients;
  portion_multiplier: number; // 0.8, 1.0, 1.3 etc.
  portion_label?: string; // จานเล็ก, ปกติ, พิเศษ
  ingredients?: DetectedIngredient[];
  health_tip?: string;
  confidence_level?: 'high' | 'medium' | 'low';
  confidence_reason?: string;
  user_note?: string; // e.g. "ไม่ใส่น้ำมัน", "หวานน้อย"
  thumbnail?: string; // Compressed base64 string
  createdAt: number;
}

export interface UserSettings {
  daily_goal: number; // e.g. 2000 kcal
  protein_goal_g?: number; // e.g. 100g
  carbs_goal_g?: number; // e.g. 250g
  fat_goal_g?: number; // e.g. 65g
  gemini_api_key?: string; // Optional user-provided key for local/custom deployment
  storage_mode?: 'ultra_light' | 'micro_thumbnail'; // ultra_light = no image stored (~200B/meal), micro_thumbnail = 80px tiny image (~3KB)
  auto_prune_days?: number; // Prune images older than N days (default 30)
  language?: 'th' | 'en'; // App language preference
}

export interface StorageUsageInfo {
  totalBytes: number;
  totalKb: number;
  totalMeals: number;
  totalDays: number;
  thumbnailCount: number;
  thumbnailBytes: number;
}

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  itemsCount: number;
}

export interface ApiQuotaUsage {
  requestsThisMinute: number; // in the last 60s sliding window
  rpmLimit: number; // 15 RPM
  requestsToday: number; // since 00:00 local time
  rpdLimit: number; // 1500 RPD
  cooldownUntil: number | null; // epoch ms if 429 encountered
}
