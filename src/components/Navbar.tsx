import React from "react";
import { Settings, History } from "lucide-react";

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onOpenHistory }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#fafaf9]/85 dark:bg-[#0c0c0e]/85 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/60 transition-colors">
      <div className="max-w-md mx-auto px-5 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg tracking-tight text-neutral-900 dark:text-neutral-100">
            calCal
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Minimal Action Icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenHistory}
            aria-label="ประวัติการบันทึก"
            title="ประวัติการบันทึก"
            className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition active:scale-95"
          >
            <History className="w-[18px] h-[18px] stroke-[1.8]" />
          </button>

          <button
            onClick={onOpenSettings}
            aria-label="ตั้งค่า"
            title="ตั้งค่า"
            className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition active:scale-95"
          >
            <Settings className="w-[18px] h-[18px] stroke-[1.8]" />
          </button>
        </div>
      </div>
    </header>
  );
};
