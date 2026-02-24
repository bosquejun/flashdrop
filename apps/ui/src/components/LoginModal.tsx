import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    setIsLoading(true);
    try {
      await login(identifier);
      onClose();
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 lg:p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase italic leading-none">Welcome Back.</h2>
                  <p className="text-zinc-600 text-sm mt-2">Sign in to complete your order.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="identifier" className="block text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-2 italic">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your username or email"
                    autoFocus
                    required
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                  <p className="text-[9px] text-zinc-500 mt-1.5 italic">
                    You can use either your username or email address
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !identifier}
                  className="w-full bg-zinc-900 hover:bg-black disabled:bg-zinc-100 disabled:text-zinc-600 text-white font-bold py-5 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg italic"
                >
                  {isLoading ? 'Signing In...' : 'Sign In Now'}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-zinc-50 text-center">
                <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">
                  New here? <button className="text-zinc-900 font-bold hover:underline italic">Create an Account</button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
