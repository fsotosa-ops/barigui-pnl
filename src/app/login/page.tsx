'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Loader2, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage('¡Cuenta creada! Revisa tu correo para confirmar.');
        setLoading(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // REEMPLAZO CLAVE: Forzamos la redirección y carga total de la página 
        // para que el middleware de Supabase capture la cookie inmediatamente.
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
        
        <div className="flex flex-col items-center mb-12 relative z-10">
          <div className="bg-gradient-to-tr from-emerald-400 to-cyan-400 p-4 rounded-[1.5rem] mb-6 shadow-xl shadow-emerald-200">
             <TrendingUp className="text-slate-900" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            FLUXO<span className="text-emerald-500">.</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            Control Centre
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl border border-rose-100 flex items-center gap-2">
            <span className="bg-rose-100 w-5 h-5 flex items-center justify-center rounded-full">!</span> {error}
          </div>
        )}
        {message && (
          <div className="mb-8 p-4 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-2xl border border-emerald-100">
            {message}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-slate-700 py-4 rounded-2xl font-bold text-sm border border-slate-200 hover:border-slate-400 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Acceder con Google
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-4 text-slate-300 font-black tracking-[0.2em]">O mediante correo</span></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email</label>
              <div className="relative">
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-slate-900 transition-all border border-transparent focus:border-slate-200 placeholder:text-slate-200"
                  placeholder="ejemplo@fluxo.com"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Contraseña</label>
              <div className="relative">
                <input 
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-slate-900 transition-all border border-transparent focus:border-slate-200 placeholder:text-slate-200"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {isSignUp ? 'Empezar ahora' : 'Entrar al Panel'} 
                  <ArrowRight size={20} className="opacity-40 group-hover:translate-x-1 transition-transform"/>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-slate-400 hover:text-emerald-500 transition-colors"
          >
            {isSignUp ? '¿Ya eres usuario? Inicia sesión' : '¿Nuevo emprendedor? Crea tu cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}