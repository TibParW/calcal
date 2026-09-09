import React, { useRef, useState } from "react";
import { Camera, FileText, Image as ImageIcon, Plus } from "lucide-react";

interface CameraActionProps {
  onImageSelected: (file: File, scanMode: "food" | "nutrition_label") => void;
  onOpenManualEntry: () => void;
  disabled?: boolean;
}

export const CameraAction: React.FC<CameraActionProps> = ({
  onImageSelected,
  onOpenManualEntry,
  disabled = false,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const labelCameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pendingScanMode, setPendingScanMode] = useState<"food" | "nutrition_label">("food");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "food" | "nutrition_label"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file, mode);
    }
    e.target.value = "";
  };

  const handleGalleryClick = () => {
    setPendingScanMode("food");
    galleryInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileChange(e, "food")}
        disabled={disabled}
      />
      <input
        ref={labelCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileChange(e, "nutrition_label")}
        disabled={disabled}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, pendingScanMode)}
        disabled={disabled}
      />

      {/* Primary Scan Buttons (Food & Nutrition Label) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Food & Multi-dish camera */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="bg-neutral-900 hover:bg-black text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-950 font-medium py-3.5 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition active:scale-[0.98] disabled:opacity-40 shadow-sm"
        >
          <Camera className="w-5 h-5 stroke-[2]" />
          <span className="text-xs font-semibold tracking-tight">สแกนอาหาร</span>
          <span className="text-[10px] opacity-70">จานเดียวหรือหลายจาน</span>
        </button>

        {/* Nutrition Facts Label camera */}
        <button
          onClick={() => labelCameraInputRef.current?.click()}
          disabled={disabled}
          className="bg-white dark:bg-[#141417] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 font-medium py-3.5 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition active:scale-[0.98] disabled:opacity-40 border border-neutral-200/70 dark:border-neutral-800/70 shadow-sm"
        >
          <FileText className="w-5 h-5 stroke-[2] text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold tracking-tight">สแกนฉลากหลังซอง</span>
          <span className="text-[10px] text-neutral-400">ตารางโภชนาการ 100%</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleGalleryClick}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 font-medium text-xs transition active:scale-95 disabled:opacity-40"
        >
          <ImageIcon className="w-3.5 h-3.5 stroke-[2] text-neutral-400" />
          <span>เลือกจากอัลบั้ม</span>
        </button>

        <button
          onClick={onOpenManualEntry}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 font-medium text-xs transition active:scale-95 disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2] text-neutral-400" />
          <span>บันทึกเอง</span>
        </button>
      </div>
    </div>
  );
};
