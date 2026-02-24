import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col selection:bg-yellow-400/30 bg-[#fafafa] text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-500 shadow-lg shadow-zinc-900/10">
              <span className="text-white font-black text-xl italic tracking-tighter">FD</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-zinc-900 uppercase italic group-hover:text-yellow-700 transition-colors">FlashDrop</span>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            {['Shop All', 'Live Deals', 'Coming Soon'].map((item) => (
              <a key={item} href="#" className="text-[10px] font-bold text-zinc-600 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em] italic">{item}</a>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <button className="h-10 w-10 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-tighter italic">{user?.name}</span>
                  <button onClick={logout} className="text-[9px] text-zinc-600 hover:text-red-600 transition-colors uppercase font-bold tracking-widest">Sign Out</button>
                </div>
                <div className="h-10 w-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-900 font-bold shadow-sm">
                   <span className="text-xs">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-zinc-900 hover:bg-black text-white px-8 py-2.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 shadow-md uppercase tracking-[0.2em] italic"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-zinc-100 py-16 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm italic">FD</span>
              </div>
              <span className="text-lg font-black tracking-tighter text-zinc-900 uppercase italic">FlashDrop</span>
            </div>
            <p className="text-zinc-600 text-xs font-medium max-w-xs uppercase tracking-wider">
              Limited inventory. High demand. Exclusive drops. <br/>© 2024 FlashDrop Inc.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16 lg:gap-24">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-1 italic">Customer Care</span>
              <a href="#" className="text-[10px] text-zinc-600 hover:text-zinc-900 font-bold uppercase tracking-widest">Help Center</a>
              <a href="#" className="text-[10px] text-zinc-600 hover:text-zinc-900 font-bold uppercase tracking-widest">Shipping</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-1 italic">Social</span>
              <a href="#" className="text-[10px] text-zinc-600 hover:text-zinc-900 font-bold uppercase tracking-widest">Instagram</a>
              <a href="#" className="text-[10px] text-zinc-600 hover:text-zinc-900 font-bold uppercase tracking-widest">Twitter</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
};

export default Layout;
