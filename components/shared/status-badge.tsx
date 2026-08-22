import { cn } from "@/lib/utils";

export type Status =
  | "present"
  | "absent"
  | "half-day"
  | "leave"
  | "pending"
  | "approved"
  | "rejected";

const STATUS_STYLES: Record<Status, string> = {
  present: "bg-success-soft text-success",
  approved: "bg-success-soft text-success",
  absent: "bg-danger-soft text-danger",
  rejected: "bg-danger-soft text-danger",
  "half-day": "bg-warning-soft text-warning",
  pending: "bg-warning-soft text-warning",
  leave: "bg-secondary text-muted-foreground",
};

const STATUS_LABELS: Record<Status, string> = {
  present: "Present",
  approved: "Approved",
  absent: "Absent",
  rejected: "Rejected",
  "half-day": "Half-day",
  pending: "Pending",
  leave: "Leave",
};

export function StatusBadge({
  status,
  className,
  children,
}: {
  status: Status;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[2px] px-2.5 text-[11px] font-bold uppercase tracking-wide",
        STATUS_STYLES[status],
        className,
      )}
    >
      {children ?? STATUS_LABELS[status]}
    </span>
  );
}
