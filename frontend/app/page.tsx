"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const [dentists, setDentists] = useState([]);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [selectedDentistId, setSelectedDentistId] = useState<number | null>(null);

  // PAGINACJA LEKARZY
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const dentistsPerPage = 4;

  // PAGINACJA TERMINÓW
  const [slotPage, setSlotPage] = useState(1);
  const slotsPerPage = 9;

  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const resApps = await fetch('http://127.0.0.1:8000/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAppointments(await resApps.json());

      const resDentists = await fetch('http://127.0.0.1:8000/dentists');
      setDentists(await resDentists.json());

      const resSlots = await fetch('http://127.0.0.1:8000/slots');
      setSlots(await resSlots.json());
    } catch (err) {
      console.error("Błąd pobierania danych:", err);
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

  useEffect(() => {
    setSlotPage(1);
  }, [selectedDentistId]);

  // --- LOGIKA FILTROWANIA I PAGINACJI LEKARZY ---
  const searchedDentists = dentists.filter((d: any) =>
    `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastDentist = currentPage * dentistsPerPage;
  const indexOfFirstDentist = indexOfLastDentist - dentistsPerPage;
  const currentDentists = searchedDentists.slice(indexOfFirstDentist, indexOfLastDentist);
  const totalPages = Math.ceil(searchedDentists.length / dentistsPerPage);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDentistId(null);
    setCurrentPage(1);
  };

  // --- LOGIKA PAGINACJI TERMINÓW ---
  const selectedDentist = dentists.find((d: any) => Number(d.id) === Number(selectedDentistId));
  const filteredSlots = selectedDentistId
    ? slots.filter((s: any) => Number(s.dentist_id) === Number(selectedDentistId))
    : slots;

  const indexOfLastSlot = slotPage * slotsPerPage;
  const indexOfFirstSlot = indexOfLastSlot - slotsPerPage;
  const currentSlots = filteredSlots.slice(indexOfFirstSlot, indexOfLastSlot);
  const totalSlotPages = Math.ceil(filteredSlots.length / slotsPerPage);

  // --- AKCJE ---
  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth');
  };

  const bookSlot = async (slotId: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://127.0.0.1:8000/book/${slotId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      alert("Wizyta zarezerwowana!");
      fetchData();
    }
  };

  const cancelAppointment = async (appId: number, slotId: number) => {
    if (!confirm("Anulować wizytę?")) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://127.0.0.1:8000/cancel/${appId}/${slotId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchData();
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <header className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <div>
            {/* LOGO ZAMIAST TEKSTU */}
            <div className="flex items-center mb-1">
              <Image
                src="/src/dentica.jpg"
                alt="Dentica Logo"
                width={200}
                height={55}
                priority
                className="object-contain"
              />
            </div>
            <p className="text-sm text-slate-500">Witaj, <span className="font-bold text-blue-600">{userName}</span></p>
          </div>
          <div className="flex gap-3">
            {userRole === 'admin' && (
              <button onClick={() => router.push('/admin')} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase hover:bg-blue-700 transition-all">
                Panel Admina
              </button>
            )}
            <button onClick={handleLogout} className="bg-red-50 text-red-600 px-5 py-2.5 rounded-2xl text-xs font-black uppercase hover:bg-red-100 transition-all">
              Wyloguj
            </button>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-3">

          {/* KOLUMNA LEWA: LEKARZE */}
          <section className="space-y-4">
            <div className="flex flex-col gap-4 mb-2">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  Nasi Lekarze
                </h2>
                {(searchTerm || selectedDentistId) && (
                  <button onClick={resetFilters} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                    Wyczyść filtry
                  </button>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                <input
                  type="text"
                  placeholder="Szukaj lekarza lub specjalizacji..."
                  className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-blue-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              {currentDentists.length > 0 ? currentDentists.map((d: any) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDentistId(d.id === selectedDentistId ? null : d.id)}
                  className={`w-full text-left p-6 rounded-[2rem] border transition-all shadow-sm ${
                    selectedDentistId === d.id ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-100/50' : 'border-white bg-white hover:border-blue-400'
                  }`}
                >
                  <p className="font-bold text-lg text-slate-800">lek. {d.first_name} {d.last_name}</p>
                  <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest mb-4">{d.specialization}</p>
                  <div className="space-y-1 opacity-60 text-[11px]">
                    <p>📧 {d.email || 'brak'}</p>
                    <p>📞 {d.phone_number || 'brak'}</p>
                  </div>
                </button>
              )) : (
                <p className="text-center py-10 text-slate-400 italic text-sm">Nie znaleziono lekarza.</p>
              )}
            </div>

            {/* POPRAWIONY PASEK PAGINACJI LEKARZY */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center p-4 bg-white/50 rounded-[2rem] border border-slate-200 shadow-sm">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:text-blue-600 transition-all">← Poprzedni</button>
                <span className="text-[10px] font-bold text-slate-500">Strona {currentPage} z {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:text-blue-600 transition-all">Następny →</button>
              </div>
            )}
          </section>

          {/* KOLUMNA PRAWA: ZABIEGI I TERMINY */}
          <section className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <span className="w-1.5 h-6 bg-blue-400 rounded-full"></span>
                Dostępne Zabiegi {selectedDentistId && `(lek. ${selectedDentist?.last_name})`}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDentistId && selectedDentist?.services?.length > 0 ? (
                  selectedDentist.services.map((s: any, idx: number) => (
                    <div key={idx} className="bg-white p-5 rounded-3xl border border-blue-50 shadow-sm flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-800">{s.name}</span>
                      <span className="text-sm font-black text-blue-600">{s.price} zł</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-8 bg-slate-100/50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center text-slate-400 italic">
                    {selectedDentistId ? "Brak przypisanych zabiegów." : "Wybierz lekarza po lewej, aby zobaczyć ofertę."}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                Dostępne terminy ({filteredSlots.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentSlots.length > 0 ? currentSlots.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => bookSlot(s.id)}
                    className="bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 p-6 rounded-[2rem] text-left transition-all group shadow-sm flex flex-col justify-between min-h-[140px]"
                  >
                    <div>
                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">lek. {s.dentist_name}</div>
                      <div className="font-black text-3xl text-slate-800">{s.start_time?.slice(0,5)}</div>
                      <div className="text-xs text-slate-400 font-bold">{s.slot_date}</div>
                    </div>
                    <div className="mt-4 w-full bg-emerald-600 text-white text-center py-2.5 rounded-2xl text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-all shadow-md">
                      Rezerwuj
                    </div>
                  </button>
                )) : (
                  <div className="col-span-full p-10 text-center text-slate-400 italic bg-white rounded-3xl border border-dashed border-slate-200">
                    Brak wolnych terminów.
                  </div>
                )}
              </div>

              {/* POPRAWIONY PASEK PAGINACJI TERMINÓW (Z KOŁAMI) */}
              {totalSlotPages > 1 && (
                <div className="flex justify-between items-center p-4 bg-white/50 rounded-[2rem] border border-slate-200 shadow-sm mt-6">
                  <button
                    disabled={slotPage === 1}
                    onClick={() => setSlotPage(prev => prev - 1)}
                    className="text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:text-emerald-600 transition-all"
                  >
                    ← Poprzednie
                  </button>
                  <div className="flex gap-2">
                    {[...Array(totalSlotPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlotPage(i + 1)}
                        className={`w-8 h-8 rounded-full text-[10px] font-bold transition-all ${
                          slotPage === i + 1 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-emerald-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={slotPage === totalSlotPages}
                    onClick={() => setSlotPage(prev => prev + 1)}
                    className="text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:text-emerald-600 transition-all"
                  >
                    Dalsze →
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* TWOJE WIZYTY */}
        <section className="space-y-6 pt-10 pb-20">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            Twoje Zaplanowane Wizyty
            <span className="bg-blue-600 text-white text-xs py-1 px-3 rounded-full">{appointments.length}</span>
          </h2>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6">Lekarz</th>
                  <th className="px-10 py-6">Data | Godzina</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6 text-right">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6 font-bold text-slate-800">lek. {a.dentist_name}</td>
                    <td className="px-10 py-6 text-slate-600 text-sm font-medium">{a.slot_date} | {a.start_time?.slice(0,5)}</td>
                    <td className="px-10 py-6"><span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">{a.status}</span></td>
                    <td className="px-10 py-6 text-right">
                      <button onClick={() => cancelAppointment(a.id, a.slot_id)} className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase tracking-widest transition-colors">Anuluj</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}