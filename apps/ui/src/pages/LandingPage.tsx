import { motion } from "framer-motion";
import type React from "react";
import HeroSection from "../components/HeroSection";
import ProductCard from "../components/ProductCard";
import { useSaleStatus } from "../hooks/useSaleStatus";
import { MOCK_PRODUCTS } from "../mockData";

const SKU = "IPHONE-17-PRO-MAX-256-BLK"; // Main product SKU from backend

const LandingPage: React.FC = () => {
  const { data: saleData, loading } = useSaleStatus(SKU, 2000);

  return (
    <div className="pb-40 bg-white">
      {/* --- HERO --- */}
      <HeroSection saleData={saleData} loading={loading} />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        {/* --- SECTION 01: ACTIVE DEALS --- */}
        <section className="mt-24 lg:mt-32 mb-32 lg:mb-40">
          <div className="flex flex-col lg:flex-row items-baseline justify-between mb-12 lg:mb-16 gap-8">
            <div className="relative">
              <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-[0.4em] mb-3 block italic">
                Trending Now
              </span>
              <h2 className="text-5xl lg:text-6xl font-black text-zinc-900 tracking-tighter uppercase italic leading-none pr-6">
                Active <span className="text-zinc-600">Drops.</span>
              </h2>
            </div>

            <div className="max-w-md">
              <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-6">
                Real-time deals on high-demand tech. Once the timer hits zero or stock runs out, the
                price returns to normal.
              </p>
              <button type="button" className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-950 pb-1 italic">
                Filter Deals
              </button>
            </div>
          </div>

          {/* More balanced 3-column grid for standard card sizes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* Main product from backend */}
            {saleData?.sale && (
              <ProductCard
                product={{
                  id: saleData.sale._id ?? saleData.sale.sku,
                  sku: saleData.sale.sku,
                  name: saleData.sale.snapshot.name,
                  description: saleData.sale.snapshot.description,
                  imageUrl: saleData.sale.snapshot.imageUrl,
                  originalPrice: saleData.sale.originalPrice ?? saleData.sale.salePrice,
                  salePrice: saleData.sale.salePrice,
                  totalStock: saleData.sale.totalStock,
                }}
                status={saleData.status}
                remainingStock={saleData.remainingStock ?? 0}
              />
            )}

            {/* Mock products */}
            {MOCK_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* --- SECTION 02: MID-PAGE BANNER --- */}
        <section className="bg-zinc-900 rounded-[2.5rem] p-8 lg:p-16 mb-32 lg:mb-40 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-[100px]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
            <div>
              <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic mb-6 pr-6">
                Exclusive <br /> Deals Daily.
              </h3>
              <p className="text-zinc-400 text-base mb-8 max-w-sm">
                Join our premium membership for early access to the biggest tech releases and
                member-only pricing.
              </p>
              <button type="button" className="px-8 py-4 bg-white text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-widest italic hover:bg-yellow-400 transition-colors">
                Join Member Program
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              {[
                { label: "Live Users", val: "12.4k" },
                { label: "Drops Today", val: "08" },
                { label: "Verified Safe", val: "100%" },
                { label: "Global Shipping", val: "Fast" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-5 lg:p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"
                >
                  <span className="text-xl lg:text-2xl font-black italic block mb-1 tracking-tighter">
                    {stat.val}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 03: REGULAR SHOP --- */}
        <section className="mb-32 lg:mb-40">
          <div className="flex items-end justify-between mb-12 lg:mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 tracking-tighter uppercase italic pr-6">
              Catalog.
            </h2>
            <a
              href="/"
              className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest italic border-b border-zinc-200 pb-1"
            >
              Browse All
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {MOCK_PRODUCTS.map((product) => (
              <motion.div key={product.id} whileHover={{ y: -5 }} className="group cursor-pointer">
                <div className="aspect-[4/5] bg-zinc-50 rounded-2xl lg:rounded-3xl overflow-hidden mb-4 border border-zinc-100 transition-all group-hover:shadow-xl group-hover:border-zinc-200">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="px-1">
                  <h3 className="text-zinc-900 font-bold text-base italic tracking-tight mb-1">
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600 font-bold text-sm">
                      {formatPrice(product.salePrice)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- NEWSLETTER --- */}
        <section className="pb-24">
          <div className="bg-yellow-400 rounded-[2.5rem] p-8 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl">
            <div className="max-w-lg text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase italic mb-6 pr-6">
                Get Notified.
              </h2>
              <p className="text-black/70 font-bold text-base lg:text-lg">
                Receive SMS and email alerts for upcoming drops before they go live.
              </p>
            </div>
            <form className="w-full max-w-md flex flex-col gap-4">
              <input
                type="email"
                placeholder="Your Email Address"
                className="w-full bg-white border-none rounded-xl px-6 py-4 text-black font-bold focus:ring-4 focus:ring-black/5"
              />
              <button type="submit" className="bg-black text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest italic hover:scale-[1.02] transition-transform">
                Subscribe Now
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

function formatPrice(amount: number) {
  // Prices are stored in the smallest currency unit (e.g. cents).
  const majorUnits = amount / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(majorUnits);
}

export default LandingPage;
