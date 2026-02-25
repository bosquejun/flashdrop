import type { FlashSaleStatus } from "../types/api";

interface SaleBadgeProps {
  status: FlashSaleStatus;
  remainingStock?: number;
}

const labelMap: Record<FlashSaleStatus, string> = {
  upcoming: "Coming Soon",
  active: "Limited Time Deal",
  ended: "Deal Ended",
};

const styleMap: Record<FlashSaleStatus, string> = {
  upcoming: "bg-zinc-100 text-zinc-700 border-zinc-200",
  active: "bg-zinc-900 text-white border-zinc-900 italic",
  ended: "bg-white/95 text-zinc-600 border-zinc-200 backdrop-blur-sm",
};

export function SaleBadge({ status, remainingStock }: SaleBadgeProps) {
  const isSoldOut = status === "active" && remainingStock !== undefined && remainingStock === 0;
  const label = isSoldOut ? "Sold Out" : labelMap[status];
  const styles = isSoldOut ? styleMap.ended : styleMap[status];

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shadow-sm ${styles}`}
      data-status={status}
    >
      {status === "active" && !isSoldOut && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400 animate-pulse"
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}
