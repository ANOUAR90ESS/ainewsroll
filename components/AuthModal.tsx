import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { signIn, signUp } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  // Focus the email field when the modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => emailInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        alert("Registration successful! You may need to verify your email depending on Supabase settings.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Focus the email field when the modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => emailInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-desc"
        tabIndex={-1}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        <button 
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          title="Close"
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
             <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                {isLogin ? <LogIn className="w-6 h-6 text-indigo-500" /> : <UserPlus className="w-6 h-6 text-purple-500" />}
             </div>
             <h2 id="auth-modal-title" className="text-2xl font-bold text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
             <p id="auth-modal-desc" className="text-zinc-400 text-sm mt-1">
               {isLogin ? 'Enter your credentials to access your account' : 'Sign up to start creating with Nexus AI'}
             </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
               <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  ref={emailInputRef}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-2.5 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${
                isLogin 
                  ? 'bg-indigo-600 hover:bg-indigo-500' 
                  : 'bg-purple-600 hover:bg-purple-500'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className={`ml-1 font-semibold hover:underline ${isLogin ? 'text-indigo-400' : 'text-purple-400'}`}
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;