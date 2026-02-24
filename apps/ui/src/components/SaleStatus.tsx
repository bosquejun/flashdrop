import { Badge } from "@/components/ui/badge";
import type { SaleStatus as SaleStatusType } from "../types/legacySchemas";

const statusConfig: Record<
  SaleStatusType,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  upcoming: { label: "Upcoming", variant: "secondary" },
  active: { label: "Live Now", variant: "default" },
  ended: { label: "Ended", variant: "outline" },
};

interface SaleStatusProps {
  status: SaleStatusType;
  remainingStock: number;
  totalStock: number;
}

export function SaleStatus({ status, remainingStock, totalStock }: SaleStatusProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between">
      <Badge variant={config.variant} className="text-sm px-3 py-1">
        {config.label}
      </Badge>
      {status === "active" && (
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="text-2xl font-bold tabular-nums">
            {remainingStock}
            <span className="text-sm text-muted-foreground font-normal">
              {" "}/ {totalStock}
            </span>
          </p>
        </div>
      )}
      {status === "ended" && (
        <p className="text-sm text-muted-foreground">Sold out or time expired</p>
      )}
    </div>
  );
}
