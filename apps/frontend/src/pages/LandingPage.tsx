import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { motion } from "framer-motion";
import HeroSection from "../components/HeroSection";
import { ProductCard } from "../components/ProductCard";
import { useSaleStatus } from "../hooks/useSaleStatus";
import { MOCK_PRODUCTS } from "../mockData";

const SKU = "IPHONE-17-PRO-MAX-256-BLK";

function LandingPage() {
  const { data: saleData, loading } = useSaleStatus(SKU, 2000);

  return (
    <div className="pb-20 sm:pb-32 lg:pb-40 bg-white">
      <HeroSection saleData={saleData} loading={loading} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- SECTION 01: ACTIVE DEALS --- */}
        <section className="mt-16 sm:mt-20 lg:mt-32 mb-20 sm:mb-28 lg:mb-40">
          <div className="flex flex-col lg:flex-row items-baseline justify-between mb-8 sm:mb-12 lg:mb-16 gap-6 sm:gap-8">
            <div className="relative">
              <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-[0.4em] mb-2 sm:mb-3 block italic">
                Trending Now
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tighter uppercase italic leading-none pr-4 sm:pr-6">
                Active <span className="text-zinc-600">Drops.</span>
              </h2>
            </div>

            <div className="max-w-md">
              <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-4 sm:mb-6">
                Real-time deals on high-demand tech. Once the timer hits zero or stock runs out, the
                price returns to normal.
              </p>
              <Button
                type="button"
                variant="link"
                className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-950 pb-1 italic h-auto p-0 min-h-0"
              >
                Filter Deals
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {/* Main product from backend */}
            {saleData?.snapshot && (
              <ProductCard
                product={{
                  _id: saleData._id ?? "",
                  sku: saleData.sku,
                  name: saleData.snapshot.name,
                  description: saleData.snapshot.description,
                  imageUrl: saleData.snapshot.imageUrl,
                  price: saleData.salePrice ?? 0,
                  totalStock: saleData.totalStock,
                  availableStock: saleData.availableStock ?? 0,
                  startDate: new Date(saleData.startDate),
                  endDate: new Date(saleData.endDate),
                  limit: { perUser: saleData.limitPerUser ?? 1 },
                  currency: "USD",
                  createdAt: new Date(),
                }}
                status={saleData.status}
                remainingStock={saleData.availableStock ?? 0}
              />
            )}

            {/* Mock products */}
            {MOCK_PRODUCTS.map((product) => (
              <ProductCard key={product.sku} product={product} disabled />
            ))}
          </div>
        </section>

        {/* --- SECTION 02: MID-PAGE BANNER --- */}
        <section className="bg-zinc-900 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-16 mb-20 sm:mb-28 lg:mb-40 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-yellow-400/10 rounded-full blur-[80px] sm:blur-[100px]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center relative z-10">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter uppercase italic mb-4 sm:mb-6 pr-0 lg:pr-6">
                Exclusive <br /> Deals Daily.
              </h3>
              <p className="text-zinc-400 text-sm sm:text-base mb-6 sm:mb-8 max-w-sm mx-auto lg:mx-0">
                Join our premium membership for early access to the biggest tech releases and
                member-only pricing.
              </p>
              <Button
                type="button"
                className="w-full sm:w-auto min-h-12 px-6 sm:px-8 py-4 bg-white text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-widest italic hover:bg-yellow-400"
              >
                Join Member Program
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              {[
                { label: "Live Users", val: "12.4k" },
                { label: "Drops Today", val: "08" },
                { label: "Verified Safe", val: "100%" },
                { label: "Global Shipping", val: "Fast" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 sm:p-5 lg:p-6 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-sm"
                >
                  <span className="text-lg sm:text-xl lg:text-2xl font-black italic block mb-0.5 sm:mb-1 tracking-tighter">
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
        <section className="mb-20 sm:mb-28 lg:mb-40">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 tracking-tighter uppercase italic pr-4 sm:pr-6">
              Catalog.
            </h2>
            <a
              href="/"
              className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest italic border-b border-zinc-200 pb-1 w-fit"
            >
              Browse All
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {MOCK_PRODUCTS.map((product) => (
              <motion.div key={product._id} whileHover={{ y: -5 }} className="group cursor-pointer">
                <div className="aspect-[4/5] bg-zinc-50 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden mb-3 sm:mb-4 border border-zinc-100 transition-all group-hover:shadow-xl group-hover:border-zinc-200">
                  <img
                    src={product.imageUrl ?? undefined}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="px-0.5 sm:px-1">
                  <h3 className="text-zinc-900 font-bold text-sm sm:text-base italic tracking-tight mb-0.5 sm:mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- NEWSLETTER --- */}
        <section className="pb-16 sm:pb-20 lg:pb-24">
          <div className="bg-yellow-400 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 shadow-2xl">
            <div className="max-w-lg text-center lg:text-left w-full">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black tracking-tighter uppercase italic mb-4 sm:mb-6 pr-0 lg:pr-6">
                Get Notified.
              </h2>
              <p className="text-black/70 font-bold text-sm sm:text-base lg:text-lg">
                Receive SMS and email alerts for upcoming drops before they go live.
              </p>
            </div>
            <form className="w-full max-w-md flex flex-col gap-3 sm:gap-4">
              <Input
                type="email"
                placeholder="Your Email Address"
                className="w-full bg-white border-none rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-black font-bold focus:ring-4 focus:ring-black/5 h-12 text-base"
              />
              <Button
                type="submit"
                className="w-full min-h-12 bg-black text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest italic hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Subscribe Now
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LandingPage;
