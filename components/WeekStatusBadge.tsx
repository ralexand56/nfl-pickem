import Badge from "@/components/ui/Badge";
import type { WeekStatus } from "@/lib/weeks";

export default function WeekStatusBadge({
  status,
  className,
}: {
  status: WeekStatus | null;
  className?: string;
}) {
  if (status === "current") {
    return (
      <Badge tone="brand" className={className}>
        This week
      </Badge>
    );
  }
  if (status === "upcoming") {
    return (
      <Badge tone="neutral" className={className}>
        Upcoming
      </Badge>
    );
  }
  if (status === "past") {
    return (
      <Badge tone="neutral" className={className}>
        Final
      </Badge>
    );
  }
  return null;
}
