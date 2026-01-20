"use client";
import React from "react";
import { Plus, Crown } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyUrl: string;
  yearlyUrl: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose, 
  monthlyUrl, 
  yearlyUrl 
}) => {
  if (!isOpen) return null;

  return (
    <div className="
  fixed inset-0 z-[100]
  bg-slate-950/90 backdrop-blur-md
  overflow-y-auto
  overscroll-contain
  p-3 sm:p-4 md:p-6
  animate-in fade-in duration-300
">

      <button
        onClick={onClose}
        className="absolute cursor-pointer top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 text-white/40 hover:text-white transition-colors"
      >
        <Plus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rotate-45" />
      </button>

  <div className="min-h-full flex items-start sm:items-center justify-center">
    <div className="max-w-5xl w-full flex flex-col items-center">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 md:mb-4 tracking-tight px-2">
            Choose Your Journey
          </h2>
          <p className="text-cyan-100/60 text-sm sm:text-base md:text-lg px-4">
            Unlock the full power of Lunora with unlimited cosmic sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-full">
          {/* Monthly Card */}
          <div className="relative group bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col transition-all hover:border-white/20">
            <div className="mb-6 sm:mb-7 md:mb-8">
              <h3 className="text-lg sm:text-xl font-bold text-white/90 mb-1.5 sm:mb-2">Monthly Voyager</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white">$8</span>
                <span className="text-white/40 text-base sm:text-lg">/ month</span>
              </div>
            </div>
            <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 md:mb-10 flex-grow text-white/70 text-sm sm:text-base">
              <li className="flex items-center">
                <div className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-2.5 sm:mr-3 flex-shrink-0" />
                <span>Unlimited Sessions</span>
              </li>
              <li className="flex items-center">
                <div className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-2.5 sm:mr-3 flex-shrink-0" />
                <span>Priority Support</span>
              </li>
            </ul>
          <button
  onClick={() => (window.location.href = monthlyUrl)}
  className="w-full py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold  bg-white/10 text-white hover:bg-white hover:text-slate-900 cursor-pointer active:scale-95 transition-transform"
>
  Start Monthly
</button>

          </div>

          {/* Yearly Card */}
          <div className="relative group border-2 border-amber-300/50 bg-gradient-to-b from-amber-200/20 to-transparent rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col transition-all hover:scale-[1.02]">
            <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-amber-300 text-slate-900 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg whitespace-nowrap">
              Best Value • Save 50%
            </div>
            <div className="mb-6 sm:mb-7 md:mb-8">
              <h3 className="text-lg sm:text-xl font-bold text-amber-200 mb-1.5 sm:mb-2 flex items-center gap-2">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5" /> Cosmic Yearly
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white">$4</span>
                <span className="text-white/40 text-base sm:text-lg">/ month</span>
              </div>
            </div>
            <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 md:mb-10 flex-grow text-white/90 text-sm sm:text-base">
              <li className="flex items-center">
                <div className="inline-block w-1.5 h-1.5 rounded-full bg-amber-300 mr-2.5 sm:mr-3 shadow-[0_0_5px_#fcd34d] flex-shrink-0" />
                <span>Unlimited Everything</span>
              </li>
              <li className="flex items-center">
                <div className="inline-block w-1.5 h-1.5 rounded-full bg-amber-300 mr-2.5 sm:mr-3 shadow-[0_0_5px_#fcd34d] flex-shrink-0" />
                <span>Legacy Member Badge</span>
              </li>
            </ul>
      <button
  onClick={() => (window.location.href = yearlyUrl)}
  className="w-full py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold  bg-amber-300 text-slate-900 hover:bg-white cursor-pointer active:scale-95 transition-transform"
>
  Upgrade to Yearly
</button>

          </div>
        </div>
      </div>
    </div>
    </div>
  );
};