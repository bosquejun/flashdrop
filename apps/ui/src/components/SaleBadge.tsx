import type React from "react";
import type { FlashSaleStatus } from "../lib/flashSale";

interface SaleBadgeProps {
  status: FlashSaleStatus;
  remainingStock?: number;
}

const SaleBadge: React.FC<SaleBadgeProps> = ({ status, remainingStock }) => {
  // If status is active but stock is 0, treat as sold out
  const isSoldOut = status === 'active' && remainingStock !== undefined && remainingStock === 0;
  
  const styles = {
    upcoming: "bg-blue-50 text-blue-500 border-blue-100",
    active: isSoldOut ? "bg-zinc-50 text-zinc-600 border-zinc-200" : "bg-zinc-900 text-white border-zinc-900 font-black italic",
    ended: "bg-zinc-50 text-zinc-600 border-zinc-200",
  };

  const labels = {
    upcoming: "Coming Soon",
    active: isSoldOut ? "Sold Out" : "Limited Time Deal",
    ended: "Deal Ended",
  };

  return (
    <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${styles[status]} shadow-sm`}>
      {status === "active" && !isSoldOut && (
        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
      )}
      {labels[status]}
    </div>
  );
};

export default SaleBadge;
