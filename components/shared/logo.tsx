import { cn } from "@/lib/utils";

export function LogoMark({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16 2.6 28 9.4v13.2L16 29.4 4 22.6V9.4L16 2.6Z"
        stroke="var(--df-accent)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M12.6 10.9h4.1c2.6 0 4.4 2.1 4.4 5.1s-1.8 5.1-4.4 5.1h-4.1V10.9Z"
        stroke="var(--df-accent)"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, markSize = 24 }: { className?: string; markSize?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={markSize} />
      <span className="font-extrabold tracking-tight" style={{ fontSize: markSize * 0.6 + 6 }}>
        Day<span className="text-primary">Flow</span>
      </span>
    </span>
  );
}
