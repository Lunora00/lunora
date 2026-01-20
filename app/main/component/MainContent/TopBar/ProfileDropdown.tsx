"use client";
import React from "react";
import { Settings, LogOut, Crown, Sparkles } from "lucide-react";
import Image from "next/image";
import { useAuth } from "../../../../hooks/useAuth";
import { useSubscription } from "@/app/hooks/useSubscription";


interface ProfileDropdownProps {
  isOpen: boolean;
  toggleOpen: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  currentMascot: { image: string; label: string };
  isPro: boolean;
  usedSessions: number;
  limit: number;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onUpgradeClick: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  toggleOpen,
  dropdownRef,
  onSignOut,
  currentMascot,
  usedSessions,
  limit,
  onOpenSettings,
  onUpgradeClick,
}) => {



  const { session, status } = useAuth();
  const { isPro, plan, dodoCustomerId } = useSubscription();
  

if (status === "loading") return null;
  return (
    <div
      ref={dropdownRef}
      className="relative pointer-events-auto z-50"
    >
      {/* AVATAR BUTTON */}
      <button
        onClick={toggleOpen}
        className="
          w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full
          cursor-pointer
          bg-white/10 border border-white/20
          hover:border-white/40
          hover:bg-white/15
          transition-all duration-200
          flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-white/30
        "
      >
       <div className="relative w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 transition-transform duration-200 hover:scale-105">
  <Image
    src={currentMascot.image}
    alt="Profile"
    fill
    className="object-contain"
  />
</div>

      </button>

      {/* DROPDOWN */}
      {isOpen && (
        <div
          className="
            absolute right-0 top-[49px] sm:top-[48px] md:top-[52px] lg:top-[60px]
            w-[calc(100vw-2rem)] max-w-[280px] sm:max-w-[300px] md:max-w-[320px] lg:w-80
            bg-[#141414]
            border border-white/10
            rounded-xl sm:rounded-xl md:rounded-2xl
            shadow-[0_20px_60px_rgba(0,0,0,0.6)]
            overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          {/* USER INFO */}
          <div className="p-3.5 sm:p-4 md:p-5 lg:p-6 border-b border-white/5">
            <div className="flex items-center gap-2.5 sm:gap-3 md:gap-3.5 lg:gap-4">
              <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12">
  <Image
    src={currentMascot.image}
    alt="Profile"
    fill
    className="object-contain"
  />
</div>

              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm sm:text-base md:text-base lg:text-lg truncate">
                  {session?.user?.name || "Learner"}
                </h3>
                <p className="text-white/40 text-[11px] sm:text-xs md:text-xs lg:text-sm truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>

            {/* PLAN */}
            <div className="mt-2.5 sm:mt-3 md:mt-3.5 lg:mt-4 p-2 sm:p-2.5 md:p-2.5 lg:p-3 rounded-lg sm:rounded-lg md:rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <span className="text-white/40 text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs uppercase tracking-wider">
                  Current Plan
                </span>
                {isPro ? (
                  <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-amber-300" />
                ) : (
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-white/40" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-xs sm:text-sm md:text-sm lg:text-base">
                  {isPro ? "Pro" : "Starter"}
                </span>

                {!isPro && (
                  <button
                    onClick={onUpgradeClick}
                    className="
                      text-amber-300 text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs cursor-pointer font-bold uppercase
                      hover:text-amber-200 transition
                    "
                  >
                    Upgrade
                  </button>
                )}
              </div>

              {!isPro && (
                <div className="mt-1 sm:mt-1.5 md:mt-1.5 lg:mt-2 text-white/40 text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs">
                  Session balance: {usedSessions}/{limit}
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="p-1 sm:p-1.5 md:p-1.5 lg:p-2">
            <button
              onClick={onOpenSettings}
              className="
                w-full flex items-center gap-2 sm:gap-2.5 md:gap-2.5 lg:gap-3
                px-2.5 sm:px-3 md:px-3.5 lg:px-4 py-2 sm:py-2.5 md:py-2.5 lg:py-3 rounded-lg cursor-pointer
                text-white/80 hover:text-white
                hover:bg-white/5
                transition-colors
              "
            >
              <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-white/60" />
              <span className="text-xs sm:text-sm md:text-sm lg:text-base">Account Settings</span>
            </button>

            {isPro && (
              <button
                onClick={() => {
                  if (dodoCustomerId) {
                    window.location.href = `/api/portal?customer_id=${dodoCustomerId}`;
                  }
                }}
                className="
                  w-full flex cursor-pointer items-center gap-2 sm:gap-2.5 md:gap-2.5 lg:gap-3
                  px-2.5 sm:px-3 md:px-3.5 lg:px-4 py-2 sm:py-2.5 md:py-2.5 lg:py-3 rounded-lg
                  text-white/80 hover:text-white
                  hover:bg-white/5
                  transition-colors
                "
              >
                <Crown className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-amber-300/70" />
                <span className="text-xs sm:text-sm md:text-sm lg:text-base">Manage Subscription</span>
              </button>
            )}
          </div>

          {/* SIGN OUT */}
          <div className="p-1 sm:p-1.5 md:p-1.5 lg:p-2 border-t border-white/5">
            <button
              onClick={onSignOut}
              className="
                w-full flex cursor-pointer items-center gap-2 sm:gap-2.5 md:gap-2.5 lg:gap-3
                px-2.5 sm:px-3 md:px-3.5 lg:px-4 py-2 sm:py-2.5 md:py-2.5 lg:py-3 rounded-lg
                text-red-400/80
                hover:bg-red-500/10
                hover:text-red-400
                transition-colors
              "
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-red-400/60" />
              <span className="text-xs sm:text-sm md:text-sm lg:text-base">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};