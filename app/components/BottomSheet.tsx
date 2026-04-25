"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Sheet Content */}
      <div 
        ref={sheetRef}
        className="relative bg-[var(--surface)] w-full rounded-t-2xl border-t border-[var(--border)] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] flex flex-col"
      >
        {/* Handle bar */}
        <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1.5 bg-[var(--border)] rounded-full"></div>
        </div>

        {title && (
          <div className="flex items-center justify-between px-6 pb-4 pt-2 border-b border-[var(--border)] shrink-0">
            <h2 className="text-xl font-playfair font-bold text-[var(--foreground)]">{title}</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[var(--border)] rounded-full transition-colors text-[var(--muted)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
        
        <div className="p-6 pb-10 overflow-y-auto" style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 0px))" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
