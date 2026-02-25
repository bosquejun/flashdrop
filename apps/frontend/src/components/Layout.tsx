import { Button } from "@repo/ui/components/button";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoginModal } from "./LoginModal";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col selection:bg-yellow-400/30 bg-[#fafafa] text-zinc-900">
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-zinc-100 supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 sm:h-20 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 group min-h-[44px] min-w-0 shrink-0"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 bg-zinc-900 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-500 shadow-lg shadow-zinc-900/10 shrink-0">
              <span className="text-white font-black text-lg sm:text-xl italic tracking-tighter">
                FD
              </span>
            </div>
            <span className="text-base sm:text-xl font-black tracking-tighter text-zinc-900 uppercase italic group-hover:text-yellow-700 transition-colors truncate">
              FlashDrop
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 lg:gap-10" aria-label="Main">
            {["Shop All", "Live Deals", "Coming Soon"].map((item) => (
              <a
                key={item}
                href="/"
                className="text-[10px] font-bold text-zinc-600 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em] italic"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full size-10 sm:size-9"
              aria-label="Search"
            >
              <Search className="size-5" />
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-tighter italic truncate w-16">
                    {user}
                  </span>
                  <Button
                    variant="link"
                    onClick={logout}
                    className="text-[9px] text-zinc-600 hover:text-red-600 uppercase font-bold tracking-widest h-auto p-0"
                  >
                    Sign Out
                  </Button>
                </div>
                <div
                  className="h-9 w-9 sm:h-10 sm:w-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-900 font-bold shadow-sm shrink-0"
                  aria-hidden
                >
                  <span className="text-xs">{user?.charAt(0).toUpperCase() ?? "?"}</span>
                </div>
              </div>
            ) : (
              <LoginModal />
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-white border-t border-zinc-100 py-10 px-4 sm:py-16 sm:px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-10 sm:gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-black text-sm italic">FD</span>
              </div>
              <span className="text-lg font-black tracking-tighter text-zinc-900 uppercase italic">
                FlashDrop
              </span>
            </div>
            <p className="text-zinc-600 text-xs font-medium max-w-xs uppercase tracking-wider leading-relaxed">
              Limited inventory. High demand. Exclusive drops.
              <br />© 2024 FlashDrop Inc.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 sm:gap-16 lg:gap-24">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-1 italic">
                Customer Care
              </span>
              <a
                href="/"
                className="text-[10px] text-zinc-600 hover:text-zinc-900 font-bold uppercase tracking-widest py-1.5 min-h-[44px] flex items-center"
              >
                Help Center
              </a>
              <a
                href="/"
                className="text-[10px] text-zinc-600 hover:text-zinc-900 font-bold uppercase tracking-widest py-1.5 min-h-[44px] flex items-center"
              >
                Shipping
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-1 italic">
                Social
              </span>
              <a
                href="/"
                className="text-[10px] text-zinc-600 hover:text-zinc-900 font-bold uppercase tracking-widest py-1.5 min-h-[44px] flex items-center"
              >
                Instagram
              </a>
              <a
                href="/"
                className="text-[10px] text-zinc-600 hover:text-zinc-900 font-bold uppercase tracking-widest py-1.5 min-h-[44px] flex items-center"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
