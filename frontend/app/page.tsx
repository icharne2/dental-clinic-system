"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [dentists, setDentists] = useState([]);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [selectedDentistId, setSelectedDentistId] = useState<number | null>(null); // Nowy stan filtrowania
  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const resApps = await fetch('http://127.0.0.1:8000/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataApps = await resApps.json();
      setAppointments(Array.isArray(dataApps) ? dataApps : []);

      const resDentists = await fetch('http://127.0.0.1:8000/dentists');
      const dataDentists = await resDentists.json();
      setDentists(Array.isArray(dataDentists) ? dataDentists : []);

      const resSlots = await fetch('http://127.0.0.1:8000/slots');
      const dataSlots = await resSlots.json();
      setSlots(Array.isArray(dataSlots) ? dataSlots : []);

    } catch (err) {
      console.error("Błąd sieci:", err);
      setAppointments([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole');

    if (!token) {
      router.push('/auth');
    } else {
      setUserName(name || 'Pacjencie');
      setUserRole(role || 'patient');
      fetchData();
    }
  }, [router]);

  // Logika filtrowania slotów
  const filteredSlots = selectedDentistId
    ? slots.filter((s: any) => s.dentist_id === selectedDentistId)
    : slots;

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth');
  };

  const bookSlot = async (slotId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/book/${slotId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert("Wizyta zarezerwowana!");
        fetchData();
      } else {
        alert(data.error || "Błąd rezerwacji");
      }
    } catch (err) {
      alert("Błąd połączenia");
    }
  };

  const cancelAppointment = async (appId: number, slotId: number) => {
    if (!confirm("Czy na pewno chcesz anulować tę wizytę?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/cancel/${appId}/${slotId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message || "Anulowano wizytę");
      fetchData();
    } catch (err) {
      alert("Błąd połączenia");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* PASEK NAWIGACJI */}
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">DentalCare</h1>
            <p className="text-sm text-slate-500">Witaj, <span className="font-bold text-blue-600">{userName}</span></p>
          </div>
          <div className="flex gap-3">
            {userRole === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Panel Admina
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-600 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all"
            >
              Wyloguj
            </button>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* LEKARZE - FILTROWANIE */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                Nasi Lekarze
              </h2>
              {selectedDentistId && (
                <button
                  onClick={() => setSelectedDentistId(null)}
                  className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                >
                  Wyczyść filtr
                </button>
              )}
            </div>
            <div className="space-y-3">
              {dentists.map((d: any) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDentistId(d.id === selectedDentistId ? null : d.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all shadow-sm border-l-4 ${
                    selectedDentistId === d.id
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white hover:border-blue-400'
                  }`}
                >
                  <p className="font-bold text-lg text-slate-800 text-sm">dr {d.first_name} {d.last_name}</p>
                  <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest">{d.specialization}</p>
                </button>
              ))}
            </div>
          </section>

          {/* TERMINY - WYŚWIETLANIE PRZEFILTROWANYCH */}
          <section className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
              {selectedDentistId ? 'Dostępne terminy lekarza' : 'Wszystkie wolne terminy'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSlots.length > 0 ? filteredSlots.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => bookSlot(s.id)}
                  className="bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 p-5 rounded-3xl text-left transition-all group shadow-sm active:scale-95 flex flex-col justify-between h-full min-h-[140px]"
                >
                  <div>
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                      dr {s.dentist_name || "Lekarz"}
                    </div>
                    <div className="font-black text-2xl text-slate-800">{s.start_time.slice(0,5)}</div>
                    <div className="text-xs text-slate-400 font-medium">{s.slot_date}</div>
                  </div>
                  <div className="mt-4 w-full bg-emerald-100 text-emerald-700 text-center py-2 rounded-xl text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                    Rezerwuj teraz
                  </div>
                </button>
              )) : (
                <div className="col-span-full bg-white p-10 rounded-2xl border border-dashed text-center text-slate-400 italic">
                  Brak dostępnych terminów dla wybranego lekarza.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* MOJE WIZYTY */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            Twoje Wizyty
            <span className="bg-blue-600 text-white text-xs py-1 px-3 rounded-full">{appointments.length}</span>
          </h2>
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Lekarz</th>
                    <th className="px-8 py-5">Data i Godzina</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.length > 0 ? (
                    appointments.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                            <span className="font-bold text-slate-800 text-sm">dr {a.dentist_name}</span>
                        </td>
                        <td className="px-8 py-5 text-slate-600 text-sm">
                            {a.slot_date} <span className="text-slate-300 mx-2">|</span> {a.start_time.slice(0,5)}
                        </td>
                        <td className="px-8 py-5">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                            {a.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => cancelAppointment(a.id, a.slot_id)}
                            className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase tracking-widest transition-all"
                          >
                            Anuluj
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic text-sm">Brak zaplanowanych wizyt.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}