import React from 'react';
import { formatPrice, getDiscountPercentage } from '../utils/format';

interface PriceDisplayProps {
  original: number;
  sale: number;
  showDiscount?: boolean;
  isLive?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ original, sale, showDiscount = true, isLive = false }) => {
  const discount = getDiscountPercentage(original, sale);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-black italic tracking-tighter text-zinc-900">
          {formatPrice(sale)}
        </span>
        <span className="text-zinc-500 line-through text-sm font-bold italic tracking-tighter">
          {formatPrice(original)}
        </span>
      </div>
      {showDiscount && isLive && (
        <span className="text-yellow-800 text-[9px] font-bold uppercase tracking-widest italic bg-yellow-100 border border-yellow-300 px-2 py-1 rounded-md w-fit">
          Offer: {discount}% Discount Applied
        </span>
      )}
    </div>
  );
};

export default PriceDisplay;
