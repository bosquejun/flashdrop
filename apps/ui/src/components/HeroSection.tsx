import React, { useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { SaleStatusResponse } from '../types/legacySchemas';
import CountdownTimer from './CountdownTimer';

interface HeroSectionProps {
  saleData: SaleStatusResponse | null;
  loading: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ saleData, loading }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set((clientX / innerWidth - 0.5) * 2);
    mouseY.set((clientY / innerHeight - 0.5) * 2);
  };

  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [10, -10]), { damping: 40, stiffness: 100 });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-10, 10]), { damping: 40, stiffness: 100 });
  const lightX = useTransform(mouseX, [-1, 1], ['25%', '75%']);
  const lightY = useTransform(mouseY, [-1, 1], ['25%', '75%']);

  if (loading || !saleData?.sale) {
    return (
      <section className="relative min-h-[85vh] flex items-center justify-center py-12 lg:py-20 px-6 lg:px-12 overflow-hidden bg-white">
        <div className="flex items-center gap-3 text-zinc-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </section>
    );
  }

  const sale = saleData.sale;
  const status = saleData.status;
  const remainingStock = saleData.remainingStock;
  const product = sale.snapshot;
  
  // If status is active but stock is 0, treat as sold out
  const isSoldOut = status === 'active' && remainingStock !== undefined && remainingStock === 0;
  const effectiveStatus = isSoldOut ? 'ended' : status;

  // Calculate time remaining
  const now = Date.now();
  const startTime = new Date(sale.startTime).getTime();
  const endTime = new Date(sale.endTime).getTime();
  const timeRemaining = effectiveStatus === 'active' && !isSoldOut
    ? endTime - now
    : effectiveStatus === 'upcoming'
    ? startTime - now
    : null;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const slideUpVariants: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 1.2, ease: [0.19, 1, 0.22, 1] } 
    },
  };

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[85vh] flex items-center justify-center py-12 lg:py-20 px-6 lg:px-12 overflow-hidden bg-white"
    >
      {/* --- BACKGROUND Clean Texture --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          style={{ left: lightX, top: lightY }}
          className="absolute w-[800px] h-[800px] bg-yellow-400/10 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0),rgba(240,240,240,0.5))]" />
        <div className="absolute top-[20%] right-[5%] hidden xl:block">
           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.8em] [writing-mode:vertical-rl] rotate-180">
             EXCLUSIVE ACCESS • SPRING 2024
           </span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
        
        {/* --- LEFT CONTENT BLOCK --- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 flex flex-col items-start"
        >
          <motion.div 
            variants={slideUpVariants}
            className="flex items-center gap-3 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-full mb-8 shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
            <span className="text-zinc-900 text-[10px] font-bold uppercase tracking-widest">
              Limited Edition <span className="text-yellow-700 ml-1">Flash Sale</span>
            </span>
          </motion.div>

          {/* Heading with PR-8 to prevent italic clipping */}
          <motion.h1 
            variants={slideUpVariants}
            className="text-[clamp(3rem,6vw,7rem)] font-black text-zinc-900 leading-[0.95] tracking-tighter uppercase italic mb-8 max-w-full pr-8"
          >
            NEW <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-800 to-yellow-600">
              {product.name}
            </span>
          </motion.h1>

          <motion.div variants={slideUpVariants} className="max-w-lg mb-10 border-l-4 border-yellow-400/30 pl-6">
             <p className="text-zinc-700 text-base md:text-lg leading-relaxed font-medium">
               {product.description}
             </p>
          </motion.div>

          <motion.div 
            variants={slideUpVariants}
            className="flex flex-wrap items-center gap-8 w-full"
          >
            <Link 
              to={`/product/${sale.sku}`}
              className="relative group px-10 py-5 bg-zinc-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:bg-black hover:shadow-2xl active:scale-95 italic shadow-xl"
            >
              Shop the Drop
            </Link>

            {timeRemaining !== null && !isSoldOut && (
              <div className="flex items-center gap-6">
                <CountdownTimer 
                  ms={timeRemaining} 
                  label={effectiveStatus === 'upcoming' ? "Starts In" : "Offer Ends In"} 
                />
              </div>
            )}
            
            {isSoldOut && (
              <div className="px-6 py-3 bg-zinc-100 border border-zinc-200 rounded-xl">
                <span className="text-zinc-700 font-bold text-xs uppercase tracking-widest italic">Sold Out</span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* --- RIGHT VISUAL BLOCK --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1], delay: 0.2 }}
          className="lg:col-span-5 relative flex justify-center lg:justify-end"
        >
          <motion.div
            style={{ rotateX, rotateY }}
            className="relative z-10 w-full max-w-[480px] perspective-1000"
          >
            <div className="relative group p-2 bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-zinc-100 overflow-hidden">
              <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-[#fafafa]">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/40 pointer-events-none" />
                <div className="absolute bottom-6 inset-x-6 p-5 bg-white/90 backdrop-blur-xl border border-zinc-100 rounded-2xl shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest mb-0.5">Featured Item</p>
                      <h4 className="text-zinc-900 font-bold text-base uppercase tracking-tight italic">{product.name}</h4>
                    </div>
                    <div className="h-10 w-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
