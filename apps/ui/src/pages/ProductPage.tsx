import type React from "react";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProductFlashSaleInfo } from "../hooks/useProductFlashSaleInfo";
import { useProductStock } from "../hooks/useProductStock";
import { useMyOrderForProduct } from "../hooks/useMyOrderForProduct";
import {
  useCreateOrder,
  getCreateOrderErrorMessage,
} from "../hooks/useCreateOrder";
import { useAuth } from "../hooks/useAuth";
import CountdownTimer from "../components/CountdownTimer";
import SaleBadge from "../components/SaleBadge";
import PriceDisplay from "../components/PriceDisplay";
import LoginModal from "../components/LoginModal";
import { motion, AnimatePresence } from "framer-motion";
import { isApiError } from "../lib/api";

const ProductPage: React.FC = () => {
  const { sku } = useParams<{ sku: string }>();
  const { isAuthenticated } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const {
    data: flashSaleInfo,
    isLoading: productLoading,
    isError: productError,
    error: productErrorObj,
  } = useProductFlashSaleInfo(sku, { refetchInterval: 2000 });

  const { data: stockData } = useProductStock(sku, { refetchInterval: 2000 });
  const { data: myOrder } = useMyOrderForProduct(sku);
  const createOrderMutation = useCreateOrder();

  const hasPurchased = myOrder != null;
  const isPurchasedUI = hasPurchased || !!createOrderMutation.data;

  const product = flashSaleInfo
    ? {
        name: flashSaleInfo.name,
        description: flashSaleInfo.description,
        imageUrl: flashSaleInfo.imageUrl,
        images: flashSaleInfo.imageUrl
          ? [flashSaleInfo.imageUrl]
          : [],
      }
    : null;

  const availableStock =
    stockData?.availableStock ?? flashSaleInfo?.availableStock ?? 0;
  const isSoldOut =
    flashSaleInfo?.status === "active" && availableStock === 0;
  const effectiveStatus: "upcoming" | "active" | "ended" = isSoldOut
    ? "ended"
    : flashSaleInfo?.status ?? "ended";

  const now = Date.now();
  const timeRemaining =
    flashSaleInfo && effectiveStatus !== "ended"
      ? effectiveStatus === "active"
        ? flashSaleInfo.endDate.getTime() - now
        : flashSaleInfo.startDate.getTime() - now
      : null;

  const allImages =
    product?.images && product.images.length > 0
      ? product.images
      : product?.imageUrl
        ? [product.imageUrl]
        : ["https://placehold.co/600x600?text=No+Image"];

  const handlePurchase = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!sku) return;
    if (
      effectiveStatus !== "active" ||
      isSoldOut ||
      availableStock <= 0
    ) {
      return;
    }
    createOrderMutation.mutate({ productSKU: sku, quantity: 1 });
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      allImages.length ? (prev + 1) % allImages.length : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      allImages.length
        ? (prev - 1 + allImages.length) % allImages.length
        : 0
    );
  };

  if (productLoading && !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm font-bold uppercase tracking-widest">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (productError && isApiError(productErrorObj) && productErrorObj.statusCode === 404) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-black mb-4 text-zinc-900">
          Product Not Found
        </h2>
        <Link
          to="/"
          className="text-yellow-600 font-bold hover:underline uppercase tracking-widest text-xs"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  if (productError && !flashSaleInfo) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-black mb-4 text-zinc-900">
          Could not load product
        </h2>
        <p className="text-zinc-600 mb-4">
          {productErrorObj instanceof Error
            ? productErrorObj.message
            : "Something went wrong."}
        </p>
        <Link
          to="/"
          className="text-yellow-600 font-bold hover:underline uppercase tracking-widest text-xs"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  if (!product || !flashSaleInfo) {
    return null;
  }

  const remainingStock = availableStock;
  const price = flashSaleInfo.price;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-20 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-24 items-start">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 order-1">
          <div className="aspect-square bg-zinc-50 border border-zinc-100 rounded-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-lg sm:shadow-xl relative group">
            <AnimatePresence mode="wait">
              <motion.img
                key={allImages[currentImageIndex] ?? currentImageIndex}
                src={allImages[currentImageIndex]}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`w-full h-full object-cover ${effectiveStatus === "ended" || isSoldOut ? "grayscale opacity-60" : ""}`}
              />
            </AnimatePresence>

            {allImages.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none sm:pointer-events-auto">
                <button
                  type="button"
                  onClick={prevImage}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-zinc-900 hover:bg-white transition-all pointer-events-auto touch-manipulation"
                  aria-label="Previous image"
                >
                  <svg
                    aria-hidden
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <title>Previous image</title>
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-zinc-900 hover:bg-white transition-all pointer-events-auto touch-manipulation"
                  aria-label="Next image"
                >
                  <svg
                    aria-hidden
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <title>Next image</title>
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}

            {(effectiveStatus === "ended" || isSoldOut) && (
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] flex items-center justify-center z-30">
                <span className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest shadow-xl rotate-[-2deg]">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-6 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
              {allImages.map((img, i) => (
                <button
                  type="button"
                  key={img}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all snap-start touch-manipulation ${currentImageIndex === i ? "border-yellow-400 ring-2 ring-yellow-400/30" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover"
                    alt={`Thumbnail ${i + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col order-2 min-w-0">
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <SaleBadge
                status={effectiveStatus}
                remainingStock={remainingStock}
              />
              <span className="text-zinc-600 font-bold text-[10px] uppercase tracking-widest">
                SKU: {sku}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-zinc-900 tracking-tighter mb-4 sm:mb-6 italic leading-tight uppercase break-words">
              {product.name}
            </h1>
            <p className="text-zinc-700 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-prose">
              {product.description ??
                "Meticulously crafted using premium materials. This limited edition release is part of our Spring 2024 Collection."}
            </p>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 lg:p-10 mb-8 sm:mb-10 space-y-6 sm:space-y-8 lg:space-y-10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
              <div>
                <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest block mb-2 italic">
                  Current Price
                </span>
                <PriceDisplay
                  original={price}
                  sale={price}
                  showDiscount={false}
                  isLive={effectiveStatus === "active" && !isSoldOut}
                />
              </div>

              {effectiveStatus !== "ended" &&
                !isSoldOut &&
                timeRemaining !== null &&
                timeRemaining > 0 && (
                  <CountdownTimer
                    ms={timeRemaining}
                    label={
                      effectiveStatus === "upcoming" ? "Starts In" : "Ends In"
                    }
                  />
                )}
            </div>

            {effectiveStatus === "active" && !isSoldOut && (
              <div className="bg-yellow-400/10 border border-yellow-400/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-bold flex-shrink-0">
                  !
                </div>
                <div>
                  <p className="text-zinc-900 font-bold text-sm uppercase italic">
                    Limited stock available at this price.
                  </p>
                  <p className="text-zinc-700 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                    Stock: {remainingStock} left • Limit:{" "}
                    {flashSaleInfo.limitPerUser} per customer
                  </p>
                </div>
              </div>
            )}

            {isSoldOut && (
              <div className="bg-zinc-100 border border-zinc-200 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 bg-zinc-400 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                  !
                </div>
                <div>
                  <p className="text-zinc-700 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                    This item is currently sold out. Check back later for
                    restocks.
                  </p>
                </div>
              </div>
            )}

            {createOrderMutation.isPending && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-700 border-t-transparent" />
                </div>
                <div>
                  <p className="text-yellow-900 font-bold text-sm uppercase italic">
                    Processing your purchase...
                  </p>
                  <p className="text-yellow-700 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                    Please wait while we confirm your order
                  </p>
                </div>
              </div>
            )}

            {!createOrderMutation.isPending && createOrderMutation.data && (
              <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-green-50 border border-green-200 text-green-900">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-green-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                    <svg
                      aria-hidden
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>Success</title>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm uppercase italic">
                      Order confirmed!
                    </p>
                    <p className="text-xs mt-2 font-medium">
                      Order ID: {createOrderMutation.data._id}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!createOrderMutation.isPending && createOrderMutation.isError && (
              <div className="bg-red-50 border border-red-200 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-start sm:items-center gap-3 sm:gap-4 text-red-900">
                <div className="h-9 w-9 sm:h-10 sm:w-10 bg-red-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  <svg
                    aria-hidden
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Error</title>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm uppercase italic">
                    {getCreateOrderErrorMessage(createOrderMutation.error)}
                  </p>
                </div>
              </div>
            )}

            {hasPurchased && !createOrderMutation.data && (
              <div className="bg-green-50 border border-green-200 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                  <svg
                    aria-hidden
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Purchased</title>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-900 font-bold text-sm uppercase italic">
                    You've already purchased this item!
                  </p>
                  {myOrder?._id && (
                    <p className="text-green-700 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                      Order ID: {myOrder._id}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {effectiveStatus === "ended" || isSoldOut ? (
                <button
                  type="button"
                  disabled
                  className="w-full min-h-[52px] bg-zinc-200 text-zinc-600 py-5 sm:py-6 rounded-2xl font-bold text-lg uppercase tracking-widest italic cursor-not-allowed"
                >
                  {isSoldOut ? "Sold Out" : "Deal Has Ended"}
                </button>
              ) : isPurchasedUI ? (
                <button
                  type="button"
                  disabled
                  className="w-full min-h-[52px] bg-green-100 text-green-700 py-5 sm:py-6 rounded-2xl font-bold text-lg uppercase tracking-widest italic cursor-not-allowed border border-green-200"
                >
                  Already Purchased ✓
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePurchase}
                    disabled={
                      effectiveStatus === "upcoming" ||
                      createOrderMutation.isPending ||
                      isSoldOut ||
                      hasPurchased ||
                      availableStock <= 0
                    }
                    className={`w-full min-h-[52px] py-5 sm:py-6 rounded-2xl font-black text-lg sm:text-xl uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] italic flex items-center justify-center gap-3 touch-manipulation ${
                      effectiveStatus === "active" &&
                      !createOrderMutation.isPending &&
                      !isSoldOut &&
                      !hasPurchased &&
                      availableStock > 0
                        ? "bg-zinc-900 text-white hover:bg-black shadow-zinc-900/10"
                        : "bg-zinc-100 text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Processing...</span>
                      </>
                    ) : effectiveStatus === "upcoming" ? (
                      "Coming Soon"
                    ) : (
                      "Buy It Now"
                    )}
                  </button>
                  <button
                    type="button"
                    className="w-full min-h-[48px] border border-zinc-200 py-4 rounded-2xl font-bold text-zinc-700 hover:bg-zinc-50 transition-all text-[10px] uppercase tracking-widest italic touch-manipulation"
                  >
                    Add to Wishlist
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Specifications & Details Section - static for MVP */}
          <section
            className="border-t border-zinc-100 pt-8 sm:pt-10 lg:pt-12 mt-8 sm:mt-10 lg:mt-12"
            aria-labelledby="specs-heading"
          >
            <h2
              id="specs-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 tracking-tighter uppercase italic mb-6 sm:mb-8 lg:mb-10"
            >
              Specifications
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-3 sm:mb-4 italic">
                    Display & Design
                  </h3>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 space-y-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100 first:pt-0">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Display
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right sm:max-w-[65%]">
                        6.9" Super Retina XDR OLED
                        <br />
                        ProMotion 120Hz
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Resolution
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        2796 × 1290 pixels
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Finish
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        Titanium (Natural)
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Water Resistance
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        IP68 (6m depth)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-3 sm:mb-4 italic">
                    Performance
                  </h3>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 space-y-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100 first:pt-0">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Chip
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        A19 Pro with 6-core GPU
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Storage
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        256GB / 512GB / 1TB
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        RAM
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        8GB Unified Memory
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Operating System
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        iOS 18
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5 sm:space-y-6">
                <div>
                  <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-3 sm:mb-4 italic">
                    Camera System
                  </h3>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 space-y-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100 first:pt-0">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Main Camera
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right sm:max-w-[65%]">
                        48MP Wide
                        <br />
                        ƒ/1.78 aperture
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Telephoto
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right sm:max-w-[65%]">
                        12MP
                        <br />
                        5x optical zoom
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Ultra Wide
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right sm:max-w-[65%]">
                        12MP
                        <br />
                        120° field of view
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Video Recording
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        4K at 60fps
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-3 sm:mb-4 italic">
                    Battery & Connectivity
                  </h3>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 space-y-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100 first:pt-0">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Battery Life
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        Up to 29 hours video playback
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Charging
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        MagSafe, Qi, USB-C
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5 border-b border-zinc-100">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        5G
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        Sub-6GHz & mmWave
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-3 sm:py-2.5">
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                        Wireless
                      </span>
                      <span className="text-sm text-zinc-900 font-black sm:text-right">
                        Wi‑Fi 6E, Bluetooth 5.4
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-3 sm:mb-4 italic">
                    Box Contents
                  </h3>
                  <div className="bg-gradient-to-br from-yellow-50 to-zinc-50 border border-yellow-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6">
                    <ul className="space-y-2.5 sm:space-y-3">
                      <li className="flex items-center gap-3 min-h-[44px]">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full flex-shrink-0" />
                        <span className="text-sm text-zinc-900 font-bold uppercase tracking-wider break-words">
                          {product.name}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 min-h-[44px]">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full flex-shrink-0" />
                        <span className="text-sm text-zinc-900 font-bold uppercase tracking-wider break-words">
                          USB-C to USB-C Cable (1m)
                        </span>
                      </li>
                      <li className="flex items-center gap-3 min-h-[44px]">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full flex-shrink-0" />
                        <span className="text-sm text-zinc-900 font-bold uppercase tracking-wider break-words">
                          Documentation
                        </span>
                      </li>
                      <li className="flex items-center gap-3 min-h-[44px]">
                        <div className="h-2 w-2 bg-zinc-300 rounded-full flex-shrink-0" />
                        <span className="text-sm text-zinc-600 font-bold uppercase tracking-wider line-through break-words">
                          Power Adapter (sold separately)
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

export default ProductPage;
