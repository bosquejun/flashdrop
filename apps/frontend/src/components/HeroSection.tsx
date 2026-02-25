import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import type React from "react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import type { LandingSaleData } from "../types/api";
import CountdownTimer from "./CountdownTimer";

interface HeroSectionProps {
  saleData: LandingSaleData | null;
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

  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [10, -10]), {
    damping: 40,
    stiffness: 100,
  });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-10, 10]), {
    damping: 40,
    stiffness: 100,
  });
  const lightX = useTransform(mouseX, [-1, 1], ["25%", "75%"]);
  const lightY = useTransform(mouseY, [-1, 1], ["25%", "75%"]);

  if (loading || !saleData?.snapshot) {
    return (
      <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[85vh] flex items-center justify-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-12 overflow-hidden bg-white">
        <div className="flex items-center gap-3 text-zinc-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </section>
    );
  }

  const status = saleData.status;
  const remainingStock = saleData.availableStock;
  const product = saleData.snapshot;

  // If status is active but stock is 0, treat as sold out
  const isSoldOut = status === "active" && remainingStock !== undefined && remainingStock === 0;
  const effectiveStatus = isSoldOut ? "ended" : status;

  // Calculate time remaining (SaleStatusResponse uses startDate/endDate)
  const now = Date.now();
  const startTime = new Date(saleData.startDate).getTime();
  const endTime = new Date(saleData.endDate).getTime();
  const timeRemaining =
    effectiveStatus === "active" && !isSoldOut
      ? endTime - now
      : effectiveStatus === "upcoming"
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
      transition: { duration: 1.2, ease: [0.19, 1, 0.22, 1] },
    },
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[85vh] flex items-center justify-center py-8 sm:py-12 lg:py-20 px-4 sm:px-6 lg:px-12 overflow-hidden bg-white"
    >
      {/* Background: soft glow + gradient mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          style={{ left: lightX, top: lightY }}
          className="absolute w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-yellow-400/12 rounded-full blur-[120px] sm:blur-[140px] -translate-x-1/2 -translate-y-1/2"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(253,224,71,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.6),rgba(250,250,250,0.3))]" />
        <div className="absolute top-[18%] right-[4%] hidden xl:block">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.7em] [writing-mode:vertical-rl] rotate-180">
            EXCLUSIVE ACCESS • SPRING 2024
          </span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-16 items-center relative z-10">
        {/* Left: copy */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 flex flex-col items-start order-2 lg:order-1 text-center lg:text-left"
        >
          <motion.div
            variants={slideUpVariants}
            className="inline-flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-zinc-50/80 border border-zinc-100 rounded-full mb-6 sm:mb-8 shadow-sm backdrop-blur-sm"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-zinc-900 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
              Limited Edition <span className="text-amber-700">Flash Sale</span>
            </span>
          </motion.div>

          <motion.h1
            variants={slideUpVariants}
            className="text-[clamp(2.25rem,5.5vw,6.5rem)] sm:text-[clamp(2.75rem,6vw,7rem)] font-black text-zinc-900 leading-[0.96] tracking-tighter uppercase italic mb-6 sm:mb-8 max-w-full pr-0 lg:pr-8"
          >
            NEW <br />
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-amber-600">
              {product.name}
            </span>
          </motion.h1>

          <motion.div
            variants={slideUpVariants}
            className="max-w-lg mx-auto lg:mx-0 mb-8 sm:mb-10 border-l-0 lg:border-l-4 border-amber-400/40 pl-0 lg:pl-6"
          >
            <p className="text-zinc-600 sm:text-zinc-700 text-sm sm:text-base md:text-lg leading-relaxed font-medium">
              {product.description}
            </p>
          </motion.div>

          <motion.div
            variants={slideUpVariants}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-5 sm:gap-8 w-full"
          >
            <Link
              to={`/product/${saleData.sku}`}
              className="group/btn relative overflow-hidden min-h-[52px] inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 bg-zinc-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:bg-black hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] active:scale-[0.98] italic shadow-xl touch-manipulation"
            >
              <span className="relative z-10">Shop the Drop</span>
              <span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none"
                aria-hidden
              />
            </Link>

            {timeRemaining !== null && !isSoldOut && (
              <div className="flex items-center justify-center lg:justify-start">
                <CountdownTimer
                  ms={timeRemaining}
                  label={effectiveStatus === "upcoming" ? "Starts In" : "Offer Ends In"}
                />
              </div>
            )}

            {isSoldOut && (
              <div className="px-5 sm:px-6 py-3 bg-zinc-100 border border-zinc-200 rounded-xl">
                <span className="text-zinc-700 font-bold text-xs uppercase tracking-widest italic">
                  Sold Out
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Right: product visual */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1], delay: 0.15 }}
          className="lg:col-span-5 relative flex justify-center lg:justify-end order-1 lg:order-2"
        >
          <motion.div
            style={{ rotateX, rotateY }}
            className="hero-card-3d relative z-10 w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[440px] perspective-1000"
          >
            <Link
              to={`/product/${saleData.sku}`}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-4 rounded-[2.5rem]"
            >
              <div className="relative p-1.5 sm:p-2 bg-white rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)] sm:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-zinc-100 overflow-hidden">
                <div className="relative aspect-[4/5] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-zinc-50">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/30 pointer-events-none" />
                  {/* Card overlay: visible on hover (desktop) and on focus (keyboard/mobile) */}
                  <div className="absolute bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-6 p-4 sm:p-5 bg-white/95 backdrop-blur-xl border border-zinc-100/80 rounded-xl sm:rounded-2xl shadow-lg translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 sm:translate-y-4 transition-all duration-400">
                    <div className="flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <p className="text-zinc-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5">
                          Featured
                        </p>
                        <p className="text-zinc-900 font-bold text-sm sm:text-base uppercase tracking-tight italic truncate">
                          {product.name}
                        </p>
                      </div>
                      <span
                        className="h-9 w-9 sm:h-10 sm:w-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                        aria-hidden
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          aria-hidden
                        >
                          <title>View product</title>
                          <path d="M7 17 17 7" />
                          <path d="M7 7h10v10" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        @media (hover: none) {
          .hero-card-3d { transform: none !important; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
