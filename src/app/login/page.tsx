'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Wallet, Loader2, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // --- LÓGICA GOOGLE ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirige a nuestra nueva ruta de callback
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      // No necesitamos redirigir manualmente, Supabase lo hace al proveedor
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // --- LÓGICA EMAIL/PASSWORD ---
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
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage('¡Cuenta creada! Revisa tu correo para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
        
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-900 p-4 rounded-2xl mb-4 shadow-lg shadow-slate-200">
             <Wallet className="text-emerald-400" size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CFO<span className="text-emerald-500">Personal</span></h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Tu centro de control financiero</p>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl border border-rose-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="bg-rose-100 p-1 rounded-full px-2">!</span> {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2">
            {message}
          </div>
        )}

        <div className="space-y-4">
          
          {/* BOTÓN GOOGLE */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-slate-700 py-4 rounded-2xl font-bold text-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            {/* Logo SVG de Google */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-300 font-bold tracking-widest">o usa tu email</span></div>
          </div>

          {/* FORMULARIO EMAIL */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 p-4 pl-11 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-slate-900 transition-all border border-transparent focus:border-slate-200 placeholder:text-slate-300"
                  placeholder="nombre@empresa.com"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Contraseña</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 p-4 pl-11 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-slate-900 transition-all border border-transparent focus:border-slate-200 pr-10 placeholder:text-slate-300"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {isSignUp ? 'Crear Cuenta' : 'Ingresar'} 
                  {!loading && <ArrowRight size={20} className="opacity-50"/>}
                </>
              )}
            </button>
          </form>
        </div>

        {/* TOGGLE MODE */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>

      </div>
    </div>
  );
}