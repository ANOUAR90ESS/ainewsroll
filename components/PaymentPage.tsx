import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, Shield, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentPageProps {
  plan: string;
  onBack: () => void;
  onComplete: () => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ plan, onBack, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const price = plan === 'Pro' ? 19 : 49;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto p-6 min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-zinc-400">
            Thank you for subscribing to the <span className="text-white font-bold">{plan} Plan</span>.
            Your account has been upgraded.
            </p>
        </div>
        <button
          onClick={onComplete}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-900/20"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-300">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Plans
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Checkout</h2>
            <p className="text-zinc-400 text-sm">Complete your purchase securely.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Name on Card</label>
              <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-all" placeholder="John Doe" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Card Number</label>
              <div className="relative">
                <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 pl-10 text-white focus:border-indigo-500 outline-none transition-all" placeholder="0000 0000 0000 0000" />
                <CreditCard className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Expiry</label>
                <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-all" placeholder="MM/YY" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">CVC</label>
                <div className="relative">
                   <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 pl-10 text-white focus:border-indigo-500 outline-none transition-all" placeholder="123" />
                   <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/20 hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
                {loading ? 'Processing...' : `Pay $${price}.00`}
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mt-4 bg-zinc-900/30 p-2 rounded">
               <Shield className="w-3 h-3 text-emerald-500" />
               Payments secured by Stripe (Simulated)
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-fit sticky top-6">
           <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-4">Order Summary</h3>
           
           <div className="space-y-4 mb-6">
             <div className="flex justify-between items-center">
                <span className="text-zinc-300">Nexus AI {plan} Plan</span>
                <span className="text-white font-medium">${price}.00</span>
             </div>
             <div className="flex justify-between items-center text-sm text-zinc-500">
                <span>Billing Cycle</span>
                <span>Monthly</span>
             </div>
             <div className="flex justify-between items-center text-sm text-zinc-500">
                <span>Tax</span>
                <span>$0.00</span>
             </div>
           </div>

           <div className="border-t border-zinc-800 pt-4 flex justify-between items-center mb-6">
              <span className="text-lg font-bold text-white">Total</span>
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">${price}.00</span>
           </div>

           <div className="bg-zinc-950 rounded-lg p-4 text-xs text-zinc-500 leading-relaxed border border-zinc-800/50">
              By confirming your subscription, you allow Nexus AI to charge your card for this payment and future payments in accordance with our Terms. You can cancel at any time from your dashboard.
           </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;