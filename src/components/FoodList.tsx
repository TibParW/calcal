import React, { useState } from "react";
import { FoodLogItem } from "@/types";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface FoodListProps {
  items: FoodLogItem[];
  onDeleteItem: (id: string) => void;
  selectedDate: string;
}

export const FoodList: React.FC<FoodListProps> = ({
  items,
  onDeleteItem,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (items.length === 0) {
    return (
      <div className="py-12 text-center flex flex-col items-center justify-center">
        <p className="text-sm font-medium text-neutral-400 dark:text-neutral-500">
          ยังไม่มีรายการอาหาร
        </p>
        <span className="text-xs text-neutral-400/80 mt-0.5">
          แตะถ่ายรูปด้านบนเพื่อเริ่มบันทึก
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
          มื้ออาหาร ({items.length})
        </span>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
          รวม {items.reduce((sum, item) => sum + item.calories, 0).toLocaleString()} kcal
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          const isConfirmingDelete = itemToDelete === item.id;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-[#141417] rounded-2xl p-3.5 border border-neutral-200/60 dark:border-neutral-800/60 transition-all flex flex-col"
            >
              <div className="flex items-center gap-3">
                {/* Micro Thumbnail if exists */}
                {item.thumbnail && (
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                    <img
                      src={item.thumbnail}
                      alt={item.food_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {item.food_name}
                    </h4>

                    {/* Calories */}
                    <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {item.calories} <span className="text-[11px] font-normal text-neutral-400">kcal</span>
                    </span>
                  </div>

                  {/* Subtext: Time, Portion, and Macros */}
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                    <span>{item.time}</span>
                    {item.portion_label && (
                      <>
                        <span>•</span>
                        <span>{item.portion_label}</span>
                      </>
                    )}
                    {item.macronutrients && (
                      <>
                        <span>•</span>
                        <span>
                          P {item.macronutrients.protein_g} · C {item.macronutrients.carbs_g} · F {item.macronutrients.fat_g}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Optional user note */}
                  {item.user_note && (
                    <div className="mt-1">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md font-medium">
                        {item.user_note}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onDeleteItem(item.id);
                          setItemToDelete(null);
                        }}
                        className="px-2 py-0.5 text-[11px] font-medium bg-rose-500 text-white rounded-lg transition"
                      >
                        ลบ
                      </button>
                      <button
                        onClick={() => setItemToDelete(null)}
                        className="px-2 py-0.5 text-[11px] font-medium text-neutral-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setItemToDelete(item.id)}
                      aria-label="ลบรายการ"
                      className="p-1.5 text-neutral-300 hover:text-rose-500 dark:text-neutral-600 dark:hover:text-rose-400 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {(item.ingredients?.length || item.health_tip) && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-1 text-neutral-300 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-300 transition"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 text-xs space-y-2">
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="space-y-1">
                      {item.ingredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-[11px]"
                        >
                          <span>{ing.name} ({ing.portion})</span>
                          <span className="text-neutral-400">~{ing.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.health_tip && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                      💡 {item.health_tip}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
