/**
 * BMR & TDEE Calculations using Mifflin-St Jeor Equation
 */

export interface UserBodyProfile {
  gender: "male" | "female";
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: "sedentary" | "light" | "moderate" | "heavy";
  goal: "lose" | "maintain" | "gain";
}

export interface TdeeCalculationResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
}

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // นั่งทำงานโต๊ะ ไม่ค่อยได้ออกกำลังกาย
  light: 1.375, // ออกกำลังกายเบา 1-3 วัน/สัปดาห์
  moderate: 1.55, // ออกกำลังกายปานกลาง 3-5 วัน/สัปดาห์
  heavy: 1.725, // ออกกำลังกายหนัก 6-7 วัน/สัปดาห์
};

export function calculateTdee(profile: UserBodyProfile): TdeeCalculationResult {
  const { gender, age, weightKg, heightCm, activityLevel, goal } = profile;

  // Mifflin-St Jeor Formula
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  bmr = Math.round(bmr);

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  const tdee = Math.round(bmr * multiplier);

  // Caloric adjustment based on goal
  let targetCalories = tdee;
  if (goal === "lose") {
    targetCalories = Math.max(bmr, tdee - 500); // Deficit 500 kcal, not below BMR for metabolic health
  } else if (goal === "gain") {
    targetCalories = tdee + 300; // Lean surplus
  }

  // Recommended Macros Split
  // Protein: ~1.8g per kg bodyweight (standard fitness recommendation)
  const targetProteinG = Math.round(weightKg * 1.8);
  const proteinCalories = targetProteinG * 4;

  // Fat: 25% of total calories
  const fatCalories = targetCalories * 0.25;
  const targetFatG = Math.round(fatCalories / 9);

  // Carbs: Remaining calories
  const remainingCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
  const targetCarbsG = Math.round(remainingCalories / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    targetProteinG,
    targetCarbsG,
    targetFatG,
  };
}
