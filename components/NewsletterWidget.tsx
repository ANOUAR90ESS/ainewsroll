import React, { useState } from 'react';
import { Mail, CheckCircle2, Sparkles, Send, ShieldCheck } from 'lucide-react';

interface NewsletterWidgetProps {
  variant?: 'card' | 'sidebar' | 'footer';
  className?: string;
}

const NewsletterWidget: React.FC<NewsletterWidgetProps> = ({ variant = 'card', className = '' }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setErrorMessage('Por favor introduce un correo electrónico válido');
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 800);
  };

  if (status === 'success') {
    return (
      <div className={`bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3 shadow-xl ${className}`}>
        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
          <CheckCircle2 className="w-6 h-6 animate-bounce" />
        </div>
        <h4 className="text-lg font-bold text-white">¡Gracias por suscribirte! / Thank you!</h4>
        <p className="text-xs md:text-sm text-zinc-300 max-w-md mx-auto">
          Te hemos añadido a nuestra lista. Recibirás las 5 mejores herramientas y noticias de IA directamente en tu correo semanalmente.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-xs text-emerald-400 underline font-semibold hover:text-emerald-300"
        >
          Suscribir otro correo
        </button>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`bg-gradient-to-b from-zinc-900 via-indigo-950/30 to-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Boletín semanal IA</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Recibe las top 5 herramientas y noticias más importantes de la semana en tu email.
        </p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            className="w-full px-3 py-2 bg-black/60 border border-zinc-700 focus:border-indigo-500 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          {status === 'error' && <p className="text-[11px] text-red-400">{errorMessage}</p>}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-900/20"
          >
            {status === 'loading' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Suscribirme gratis
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-indigo-950/70 via-zinc-900 to-purple-950/60 border border-indigo-500/30 rounded-2xl p-6 md:p-8 shadow-2xl ${className}`}>
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-medium">
            <Mail className="w-3.5 h-3.5" />
            <span>Newsletter de Inteligencia Artificial</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">
            Recibe las 5 mejores noticias y herramientas de IA cada semana 🚀
          </h3>
          <p className="text-xs md:text-sm text-zinc-400 max-w-xl">
            Sin spam. Solo lo más relevante del mundo de la Inteligencia Artificial resumido para ahorrarte tiempo.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-zinc-500 pt-1 justify-center md:justify-start">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Gratuito
            </span>
            <span>•</span>
            <span>Cancela cuando quieras</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full md:w-auto flex-shrink-0 flex flex-col sm:flex-row gap-2 max-w-md">
          <input
            type="email"
            placeholder="Introduce tu correo electrónico..."
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            className="px-4 py-3 bg-black/70 border border-zinc-700 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none min-w-[260px]"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 shrink-0"
          >
            {status === 'loading' ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Suscribirme
              </>
            )}
          </button>
        </form>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-400 mt-2 text-center md:text-right font-medium">{errorMessage}</p>
      )}
    </div>
  );
};

export default NewsletterWidget;
