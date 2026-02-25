import type { Product } from "@repo/schema";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { SaleStatus } from "../types/api";
import PriceDisplay from "./PriceDisplay";
import { SaleBadge } from "./SaleBadge";

interface ProductCardProps {
  product: Product;
  status?: SaleStatus;
  remainingStock?: number;
  disabled?: boolean;
}

export function ProductCard({
  product,
  status = "ended",
  remainingStock,
  disabled = false,
}: ProductCardProps) {
  // If status is active but stock is 0, treat as sold out
  const isSoldOut = status === "active" && remainingStock !== undefined && remainingStock === 0;
  const effectiveStatus: SaleStatus = isSoldOut ? "ended" : status;

  // Calculate stock percentage if we have stock data
  const stockPercent =
    remainingStock !== undefined && product.totalStock
      ? Math.max(0, Math.min(100, (remainingStock / product.totalStock) * 100))
      : 60; // Fallback to mock percentage

  return (
    <motion.div
      whileHover={isSoldOut ? {} : { y: -6 }}
      whileTap={isSoldOut ? {} : { scale: 0.99 }}
      className={`group relative bg-white border border-zinc-100 rounded-xl sm:rounded-[2rem] overflow-hidden flex flex-col h-full transition-all duration-500 ${isSoldOut ? "" : "hover:shadow-xl active:shadow-lg"}`}
    >
      {!isSoldOut && !disabled && (
        <Link
          to={`/product/${product.sku}`}
          className="absolute inset-0 z-10"
          aria-label={`View ${product.name}`}
        />
      )}

      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-50">
        <img
          src={product.imageUrl ?? undefined}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 ${isSoldOut ? "grayscale opacity-60" : "group-hover:scale-105"}`}
        />
        {isSoldOut && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
            <span className="rounded-xl bg-zinc-900 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl sm:px-6 sm:py-2.5 sm:text-xs [-ms-transform:rotate(-2deg)] [transform:rotate(-2deg)]">
              Sold Out
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
          <SaleBadge status={effectiveStatus} remainingStock={remainingStock} />
        </div>
      </div>

      <div className="p-4 sm:p-5 lg:p-7 flex flex-col flex-grow">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-zinc-900 font-black text-base sm:text-xl leading-tight italic tracking-tighter uppercase mb-1.5 sm:mb-2 group-hover:text-yellow-600 transition-colors pr-2 sm:pr-4 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-zinc-600 text-[10px] font-bold leading-relaxed uppercase tracking-wide line-clamp-2 italic">
            {product.description}
          </p>
        </div>

        <div className="mt-auto space-y-4 sm:space-y-6">
          <div className="flex items-end justify-between gap-2">
            <PriceDisplay
              original={product.price}
              sale={product.price}
              isLive={effectiveStatus === "active" && !isSoldOut}
            />
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-0.5 italic">
                Stock
              </span>
              <div className="w-12 sm:w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${stockPercent}%` }}
                  className={`h-full ${effectiveStatus === "active" && !isSoldOut ? "bg-yellow-400" : "bg-zinc-200"}`}
                />
              </div>
              <span className="text-[8px] font-bold text-zinc-900 italic mt-0.5 uppercase">
                {isSoldOut ? "Out" : remainingStock !== undefined ? `${remainingStock}` : "—"}
              </span>
            </div>
          </div>

          <div className="pt-4 sm:pt-5 border-t border-zinc-50 flex items-center justify-between gap-2">
            <span className="text-[8px] sm:text-[9px] font-bold text-zinc-600 uppercase tracking-widest italic truncate">
              SKU: {product.sku}
            </span>
            <span
              className={`text-[9px] font-bold uppercase tracking-widest italic transition-all shrink-0 ${effectiveStatus === "active" && !isSoldOut ? "text-yellow-700" : "text-zinc-600"}`}
            >
              {effectiveStatus === "active" && !isSoldOut ? "Shop →" : "View →"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
