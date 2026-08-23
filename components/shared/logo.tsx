import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className, markSize = 32 }: { className?: string; markSize?: number }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="DayFlow Logo"
        width={markSize * 4} 
        height={markSize * 4}
        className="w-auto h-auto max-h-12 object-contain"
        priority
      />
    </div>
  );
}
