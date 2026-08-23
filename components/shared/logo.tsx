import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className, markSize = 32 }: { className?: string; markSize?: number }) {
  return (
    <div className={cn("inline-flex items-center justify-center p-1.5 rounded-2xl bg-[#09090b] shadow-md border border-slate-800", className)}>
      <Image
        src="/dayflow-logo.png"
        alt="DayFlow Logo"
        width={140} 
        height={140}
        className="w-[130px] h-auto object-contain"
        style={{ mixBlendMode: 'screen' }}
        priority
      />
    </div>
  );
}
