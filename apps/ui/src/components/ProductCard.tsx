import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SaleBadge from './SaleBadge';
import PriceDisplay from './PriceDisplay';
import type { SaleStatus } from '../types/legacySchemas';

interface ProductCardProps {
  product: {
    id?: string;
    sku: string;
    name: string;
    description: string;
    imageUrl: string;
    originalPrice: number;
    salePrice: number;
    totalStock?: number;
  };
  status?: SaleStatus;
  remainingStock?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, status = 'ended', remainingStock }) => {
  // If status is active but stock is 0, treat as sold out
  const isSoldOut = status === 'active' && remainingStock !== undefined && remainingStock === 0;
  const effectiveStatus: SaleStatus = isSoldOut ? 'ended' : status;
  
  // Calculate stock percentage if we have stock data
  const stockPercent = remainingStock !== undefined && product.totalStock 
    ? Math.max(0, Math.min(100, (remainingStock / product.totalStock) * 100))
    : 60; // Fallback to mock percentage

  return (
    <motion.div
      whileHover={isSoldOut ? {} : { y: -8 }}
      className={`group relative bg-white border border-zinc-100 rounded-[2rem] overflow-hidden flex flex-col h-full transition-all duration-500 ${isSoldOut ? '' : 'hover:shadow-xl'}`}
    >
      <Link to={`/product/${product.sku}`} className="absolute inset-0 z-10" />
      
      {/* Visual Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-50">
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 ${isSoldOut ? 'grayscale opacity-60' : 'group-hover:scale-105'}`}
        />
        
        {isSoldOut && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] flex items-center justify-center z-30">
            <span className="bg-zinc-900 text-white px-6 py-2 rounded-xl font-bold uppercase tracking-widest shadow-xl rotate-[-2deg] text-xs">Sold Out</span>
          </div>
        )}
        
        <div className="absolute top-4 left-4 z-20">
          <SaleBadge status={effectiveStatus} remainingStock={remainingStock} />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 lg:p-7 flex flex-col flex-grow">
        <div className="mb-6">
          <h3 className="text-zinc-900 font-black text-xl leading-tight italic tracking-tighter uppercase mb-2 group-hover:text-yellow-600 transition-colors pr-4">
            {product.name}
          </h3>
          <p className="text-zinc-600 text-[10px] font-bold leading-relaxed uppercase tracking-wide line-clamp-2 italic">
            {product.description}
          </p>
        </div>

        <div className="mt-auto space-y-6">
          <div className="flex items-end justify-between">
            <PriceDisplay 
              original={product.originalPrice} 
              sale={product.salePrice} 
              isLive={effectiveStatus === 'active' && !isSoldOut}
            />
            
            <div className="flex flex-col items-end">
               <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-1 italic">Stock</span>
               <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${stockPercent}%` }}
                    className={`h-full ${effectiveStatus === 'active' && !isSoldOut ? 'bg-yellow-400' : 'bg-zinc-200'}`}
                  />
               </div>
               <span className="text-[8px] font-bold text-zinc-900 italic mt-1 uppercase">
                 {isSoldOut ? 'Out of Stock' : remainingStock !== undefined ? `${remainingStock} Left` : 'In Stock'}
               </span>
            </div>
          </div>
          
          <div className="pt-5 border-t border-zinc-50 flex items-center justify-between">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest italic">SKU: {product.sku}</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest italic transition-all ${effectiveStatus === 'active' && !isSoldOut ? 'text-yellow-700' : 'text-zinc-600'}`}>
              {effectiveStatus === 'active' && !isSoldOut ? 'Shop →' : 'View →'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
