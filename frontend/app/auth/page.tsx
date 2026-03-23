"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const denticaBlue = "#0A2EE2";

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    try {
      if (isLogin) {
        // --- LOGIKA LOGOWANIA ---
        const res = await fetch('http://127.0.0.1:8000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (res.ok) {
          const data = await res.json();
          // Zapisujemy dane do pamięci przeglądarki
          localStorage.setItem('token', data.token);
          localStorage.setItem('userRole', data.role);
          localStorage.setItem('userName', data.name);

          // PRZEKIEROWANIE:
          if (data.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        } else {
          setError('Błędny adres e-mail lub hasło.');
        }

      } else {
        // --- LOGIKA REJESTRACJI ---
        if (!firstName || !lastName || !email || !password) {
          setError('Proszę wypełnić wszystkie wymagane pola.');
          return;
        }

        const res = await fetch('http://127.0.0.1:8000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            password
          })
        });

        if (res.ok) {
          setSuccess('Konto utworzone pomyślnie. Możesz się teraz zalogować.');
          setIsLogin(true);
          setPassword('');
        } else {
          const data = await res.json();
          setError(data.detail || 'Wystąpił błąd podczas rejestracji.');
        }
      }
    } catch (err) {
      setError('Brak połączenia z serwerem. Upewnij się, że system działa.');
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes levitate {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-levitate {
          animation: levitate 6s ease-in-out infinite;
        }
        .animate-pulse-ring {
          animation: pulse-ring 3.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .animate-slide-up {
          animation: slide-up-fade 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>

      <div className="min-h-screen flex font-sans bg-[#F8FAFC] relative overflow-hidden">

        {/* ===== LEWA STRONA ===== */}
        <div
          className="hidden lg:flex w-1/2 flex-col justify-center relative overflow-hidden"
          style={{ backgroundColor: denticaBlue }}
        >
          <div className="absolute inset-0 z-0 opacity-20 blur-[3px]">
            <img
              src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=2070"
              alt="Klinika"
              className="w-full h-full object-cover mix-blend-luminosity"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#041154] to-transparent opacity-80 z-0"></div>

          <div className="relative z-10 w-full max-w-2xl px-16 flex flex-col items-center text-center mx-auto">

              <div className="relative flex items-center justify-center w-56 h-56 mb-12">
                <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse-ring"></div>
                <div className="absolute inset-4 rounded-full bg-white/20 animate-pulse-ring" style={{ animationDelay: '1.7s' }}></div>

                <div className="relative z-10 w-[120px] h-[120px] bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center animate-levitate border border-white/40">

                  {/* === ZAKTUALIZOWANY, PROFESJONALNY ZĄB === */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-[50px] h-[50px] drop-shadow-sm transition-transform hover:scale-110 duration-500"
                    style={{ color: denticaBlue }}
                  >
                    <path d="M17 3C15.5 3 13.5 4.5 12 4.5C10.5 4.5 8.5 3 7 3C4 3 2 5.5 2 9C2 12.5 3.5 15.5 5 18C6.5 20.5 7 22 7 23C7 23.5 7.5 24 8 24H9C9.5 24 10 23.5 10 23C10 20.5 11 18 12 18C13 18 14 20.5 14 23C14 23.5 14.5 24 15 24H16C16.5 24 17 23.5 17 23C17 22 17.5 20.5 19 18C20.5 15.5 22 12.5 22 9C22 5.5 20 3 17 3Z" />
                  </svg>

                </div>
              </div>

              <h1 className="text-5xl lg:text-[4.2rem] font-black text-white mb-8 tracking-tighter drop-shadow-lg leading-[1.05] animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Twój uśmiech,<br /> nasza pasja.
              </h1>
              <p className="text-white/80 text-lg lg:text-xl font-light leading-relaxed max-w-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Zaloguj się do portalu, aby umówić wizytę, sprawdzić historię leczenia i mieć bezpośredni kontakt ze swoim lekarzem prowadzącym.
              </p>
          </div>
        </div>

        {/* ===== PRAWA STRONA (Bez zmian, doskonały kaskadowy formularz) ===== */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

          <div className={`w-full max-w-[420px] bg-white/80 backdrop-blur-xl p-10 sm:p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

            <div className="text-center mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-6 shadow-sm border border-blue-100/50">
                {isLogin ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                )}
              </div>
              <h2 className="text-[1.75rem] font-black text-slate-800 tracking-tight">
                {isLogin ? 'Witaj ponownie' : 'Stwórz konto'}
              </h2>
              <p className="mt-2 text-slate-500 text-sm font-medium">
                {isLogin ? 'Wprowadź swoje dane, aby kontynuować' : 'Wypełnij formularz, aby dołączyć do pacjentów'}
              </p>
            </div>

            {error && <div className="mb-6 bg-red-50 text-red-600 text-xs font-bold p-4 rounded-xl flex items-center gap-3 border border-red-100"><svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{error}</div>}
            {success && <div className="mb-6 bg-emerald-50 text-emerald-600 text-xs font-bold p-4 rounded-xl flex items-center gap-3 border border-emerald-100"><svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">

              {!isLogin && (
                <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                      <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <input
                      type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required={!isLogin}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-semibold text-slate-800 transition-all focus:bg-white focus:ring-4 focus:border-transparent placeholder-slate-400 hover:bg-white"
                      style={{ '--tw-ring-color': `${denticaBlue}22` } as any} placeholder="Imię"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                      <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <input
                      type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required={!isLogin}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-semibold text-slate-800 transition-all focus:bg-white focus:ring-4 focus:border-transparent placeholder-slate-400 hover:bg-white"
                      style={{ '--tw-ring-color': `${denticaBlue}22` } as any} placeholder="Nazwisko"
                    />
                  </div>
                </div>
              )}

              <div className="relative group animate-slide-up" style={{ animationDelay: isLogin ? '0.2s' : '0.3s' }}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full pl-11 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-semibold text-slate-800 transition-all focus:bg-white focus:ring-4 focus:border-transparent placeholder-slate-400 hover:bg-white"
                  style={{ '--tw-ring-color': `${denticaBlue}22` } as any} placeholder="Adres e-mail"
                />
              </div>

              <div className="relative group animate-slide-up" style={{ animationDelay: isLogin ? '0.3s' : '0.4s' }}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full pl-11 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-semibold text-slate-800 transition-all focus:bg-white focus:ring-4 focus:border-transparent placeholder-slate-400 hover:bg-white"
                  style={{ '--tw-ring-color': `${denticaBlue}22` } as any} placeholder="Hasło"
                />
              </div>

              {isLogin && (
                <div className="flex justify-end pt-1 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <a href="#" className="text-xs font-bold hover:underline transition-colors opacity-80 hover:opacity-100" style={{ color: denticaBlue }}>Zapomniałeś hasła?</a>
                </div>
              )}

              <div className="pt-2 animate-slide-up" style={{ animationDelay: isLogin ? '0.5s' : '0.6s' }}>
                <button
                  type="submit"
                  className="w-full text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] hover:shadow-2xl hover:-translate-y-1 flex justify-center items-center gap-3 overflow-hidden relative group"
                  style={{ background: `linear-gradient(135deg, ${denticaBlue} 0%, #051466 100%)`, boxShadow: `0 10px 30px -10px ${denticaBlue}` }}
                >
                  <span className="relative z-10">{isLogin ? 'Zaloguj się' : 'Utwórz konto'}</span>
                  <svg className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                </button>
              </div>
            </form>

            <div className="mt-10 relative flex justify-center animate-slide-up" style={{ animationDelay: isLogin ? '0.6s' : '0.7s' }}>
              <div className="absolute top-1/2 w-full border-t border-slate-200"></div>
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white px-5 relative z-10 uppercase tracking-widest"
              >
                {isLogin ? 'Nie masz konta?' : 'Masz już konto?'}{' '}
                <span style={{ color: denticaBlue }} className="ml-1">{isLogin ? 'Zarejestruj się' : 'Zaloguj się'}</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}