import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--surface-container-high)]",
        className
      )}
      style={{
        background: "var(--surface-container-high, rgba(120, 119, 198, 0.1))",
      }}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div
      className="border rounded-xl p-5 space-y-3"
      style={{
        background: "var(--surface-container-lowest)",
        borderColor: "var(--outline-variant)",
      }}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="border rounded-xl p-5 space-y-4"
      style={{
        background: "var(--surface-container-lowest)",
        borderColor: "var(--outline-variant)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div
        className="w-full flex items-end justify-between gap-2 pt-8"
        style={{ height }}
      >
        <Skeleton className="w-1/6 h-3/5 rounded-t-md" />
        <Skeleton className="w-1/6 h-4/5 rounded-t-md" />
        <Skeleton className="w-1/6 h-2/5 rounded-t-md" />
        <Skeleton className="w-1/6 h-full rounded-t-md" />
        <Skeleton className="w-1/6 h-3/4 rounded-t-md" />
        <Skeleton className="w-1/6 h-4/6 rounded-t-md" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="border rounded-xl overflow-hidden p-4 space-y-3"
      style={{
        background: "var(--surface-container-lowest)",
        borderColor: "var(--outline-variant)",
      }}
    >
      <div className="flex justify-between pb-2 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="h-4 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`row-${r}`} className="flex justify-between py-2 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`cell-${r}-${c}`} className={`h-4 ${c === 0 ? "w-28" : "w-16"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
