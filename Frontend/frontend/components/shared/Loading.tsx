"use client";

interface Props {
  message?: string;
  fullPage?: boolean;
}

export default function Loading({ message = "Synchronizing Intelligence...", fullPage = false }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 transition-all duration-500 animate-in fade-in zoom-in-95 ${fullPage ? "fixed inset-0 bg-white/80 backdrop-blur-md z-50" : "w-full"}`}>
      <div className="relative mb-6">
        {/* Outer Ring */}
        <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
        {/* Inner Pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-indigo-600/10 animate-pulse flex items-center justify-center">
             <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.6)]"></div>
          </div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1 animate-pulse">
           Agent Protocol Active
        </div>
        <div className="text-sm font-bold text-slate-600 tracking-tight">
          {message}
        </div>
      </div>
    </div>
  );
}
