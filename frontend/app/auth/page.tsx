"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    const endpoint = isLogin ? 'login' : 'register';
    const url = `http://127.0.0.1:8000/${endpoint}`;

    // Przygotowanie obiektu danych zgodnie z modelami Pydantic w FastAPI
    const bodyData = isLogin
      ? { email, password }
      : {
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password
        };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          // Logowanie udane - zapisujemy dane sesji
          localStorage.setItem('token', data.token);
          localStorage.setItem('userName', data.name);
          localStorage.setItem('userRole', data.role);

          alert(`Witaj ponownie, ${data.name}!`);

          // Przekierowanie na podstawie roli użytkownika
          if (data.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        } else {
          // Rejestracja udana
          alert("Konto utworzone! Możesz się teraz zalogować.");
          setIsLogin(true);
        }
      } else {
        // Obsługa błędów z backendu (np. 401 Unauthorized lub 422 Validation Error)
        const errorMsg = data.detail || data.error || "Wystąpił błąd autoryzacji";
        alert(`Błąd: ${errorMsg}`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Błąd połączenia z serwerem. Upewnij się, że backend (uvicorn) działa na porcie 8000.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6 border border-slate-200">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">
            {isLogin ? 'Logowanie' : 'Rejestracja'}
          </h1>
          <p className="text-slate-400 text-sm italic">System dentica</p>
        </header>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Imię"
                className="w-full p-3 border border-slate-200 rounded-xl outline-blue-500 text-slate-800"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Nazwisko"
                className="w-full p-3 border border-slate-200 rounded-xl outline-blue-500 text-slate-800"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border border-slate-200 rounded-xl outline-blue-500 text-slate-800"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Hasło"
            className="w-full p-3 border border-slate-200 rounded-xl outline-blue-500 text-slate-800"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
          >
            {isLogin ? 'Zaloguj się' : 'Utwórz konto'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 font-bold hover:underline transition-colors"
          >
            {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
          </button>
        </div>
      </div>
    </main>
  );
}