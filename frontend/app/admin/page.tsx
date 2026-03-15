"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  // Stany dla danych z bazy
  const [dentists, setDentists] = useState([]);
  const [allApps, setAllApps] = useState([]);

  // Stany dla formularzy
  const [dentistForm, setDentistForm] = useState({ first_name: '', last_name: '', specialization: '' });
  const [slotForm, setSlotForm] = useState({ dentist_id: '', date: '', time: '' });

  // 1. Weryfikacja uprawnień i pobieranie danych na starcie
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
      alert("Dostęp tylko dla administratorów!");
      router.push('/');
    } else {
      setAuthorized(true);
      refreshData();
    }
  }, [router]);

  const refreshData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      // Pobierz wszystkich lekarzy (do listy w formularzu slotów)
      const resDentists = await fetch('http://127.0.0.1:8000/dentists');
      setDentists(await resDentists.json());

      // Pobierz wszystkie wizyty (JOIN z bazy)
      const resApps = await fetch('http://127.0.0.1:8000/admin/appointments', { headers });
      const dataApps = await resApps.json();
      setAllApps(Array.isArray(dataApps) ? dataApps : []);
    } catch (err) {
      console.error("Błąd pobierania danych admina:", err);
    }
  };

  // 2. Obsługa dodawania lekarza
  const handleAddDentist = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = `http://127.0.0.1:8000/admin/dentists?first_name=${encodeURIComponent(dentistForm.first_name)}&last_name=${encodeURIComponent(dentistForm.last_name)}&specialization=${encodeURIComponent(dentistForm.specialization)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      alert("Lekarz dodany!");
      setDentistForm({ first_name: '', last_name: '', specialization: '' });
      refreshData();
    }
  };

  // 3. Obsługa dodawania slotu (terminu)
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = `http://127.0.0.1:8000/admin/slots?dentist_id=${slotForm.dentist_id}&slot_date=${slotForm.date}&start_time=${slotForm.time}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      alert("Wolny termin został dodany do bazy!");
      setSlotForm({ ...slotForm, date: '', time: '' });
    }
  };

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* HEADER */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Panel Sterowania</h1>
            <p className="text-slate-500 font-medium text-sm mt-1 text-emerald-400">Zalogowano jako Administrator Systemu</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold text-xs transition-all border border-slate-700"
          >
            POWRÓT DO PACJENTA
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* SEKCJA: DODAWANIE LEKARZA */}
          <section className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
              Dodaj Lekarza (SQL INSERT)
            </h2>
            <form onSubmit={handleAddDentist} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Imię"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition-all"
                  value={dentistForm.first_name}
                  onChange={e => setDentistForm({...dentistForm, first_name: e.target.value})}
                  required
                />
                <input
                  placeholder="Nazwisko"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition-all"
                  value={dentistForm.last_name}
                  onChange={e => setDentistForm({...dentistForm, last_name: e.target.value})}
                  required
                />
              </div>
              <input
                placeholder="Specjalizacja (np. Ortodonta)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition-all"
                value={dentistForm.specialization}
                onChange={e => setDentistForm({...dentistForm, specialization: e.target.value})}
                required
              />
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all">
                DODAJ LEKARZA
              </button>
            </form>
          </section>

          {/* SEKCJA: DODAWANIE TERMINU */}
          <section className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
              Generuj Slot (Termin)
            </h2>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:border-emerald-500 outline-none transition-all"
                value={slotForm.dentist_id}
                onChange={e => setSlotForm({...slotForm, dentist_id: e.target.value})}
                required
              >
                <option value="">Wybierz lekarza z bazy...</option>
                {dentists.map((d: any) => (
                  <option key={d.id} value={d.id}>dr {d.first_name} {d.last_name} ({d.specialization})</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:border-emerald-500 outline-none transition-all"
                  value={slotForm.date}
                  onChange={e => setSlotForm({...slotForm, date: e.target.value})}
                  required
                />
                <input
                  type="time"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:border-emerald-500 outline-none transition-all"
                  value={slotForm.time}
                  onChange={e => setSlotForm({...slotForm, time: e.target.value})}
                  required
                />
              </div>
              <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all">
                UDOSTĘPNIJ TERMIN
              </button>
            </form>
          </section>
        </div>

        {/* TABELA WIZYT */}
        <section className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-bold">Wszystkie Wizyty w Klinice (SQL JOIN)</h2>
            <button onClick={refreshData} className="text-xs text-blue-400 font-bold hover:underline">ODŚWIEŻ LISTĘ</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Pacjent</th>
                  <th className="px-8 py-5">Lekarz</th>
                  <th className="px-8 py-5">Data i Godzina</th>
                  <th className="px-8 py-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {allApps.length > 0 ? allApps.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-8 py-5 font-bold text-blue-100">{a.patient_name}</td>
                    <td className="px-8 py-5 text-slate-400">dr {a.dentist_name}</td>
                    <td className="px-8 py-5 text-slate-300 text-xs font-mono">
                      {a.slot_date} <span className="text-slate-700">|</span> {a.start_time}
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-blue-500/20">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-600 italic">
                      Brak zarezerwowanych wizyt w systemie.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}