"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  // Dane z bazy
  const [allAppointments, setAllAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, booked: 0, available: 0 }); // Dodano available
  const [dentists, setDentists] = useState([]);

  // Stan wyszukiwania
  const [searchTerm, setSearchTerm] = useState('');

  // Formularze
  const [newDentist, setNewDentist] = useState({ first_name: '', last_name: '', specialization: '' });
  const [newSlot, setNewSlot] = useState({ dentist_id: '', slot_date: '', start_time: '', service_id: 'Konsultacja' });
  const [newService, setNewService] = useState({ dentist_id: '', name: '', price: '' });

  // Stała do blokowania dat przeszłych
  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth'); return; }

    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Pobieranie rezerwacji
      const resApps = await fetch('http://127.0.0.1:8000/admin/appointments', { headers });
      const dataApps = await resApps.json();

      // 2. Pobieranie wolnych terminów (do licznika)
      const resSlots = await fetch('http://127.0.0.1:8000/slots');
      const dataSlots = await resSlots.json();

      if (Array.isArray(dataApps)) {
        setAllAppointments(dataApps);
        setStats({
          total: dataApps.length,
          booked: dataApps.filter((a: any) => a.status === 'booked').length,
          available: Array.isArray(dataSlots) ? dataSlots.length : 0
        });
      }

      // 3. Pobieranie lekarzy
      const resDent = await fetch('http://127.0.0.1:8000/dentists');
      const dataDent = await resDent.json();
      setDentists(Array.isArray(dataDent) ? dataDent : []);

    } catch (err) {
      console.error("Błąd pobierania danych:", err);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') { router.push('/'); } else { fetchData(); }
  }, [router]);

  // LOGIKA FILTROWANIA TABELI
  const filteredAppointments = allAppointments.filter((a: any) => {
    const query = searchTerm.toLowerCase();
    return (
      a.patient_name?.toLowerCase().includes(query) ||
      a.dentist_name?.toLowerCase().includes(query) ||
      a.service_name?.toLowerCase().includes(query)
    );
  });

  // --- AKCJE ---

  const addDentist = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://127.0.0.1:8000/admin/dentists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newDentist)
    });
    if (res.ok) {
      alert("Lekarz dodany!");
      setNewDentist({ first_name: '', last_name: '', specialization: '' });
      fetchData();
    }
  };

  const deleteDentist = async (id: number) => {
    const name = dentists.find((d: any) => d.id === id)?.last_name;
    if (!confirm(`UWAGA: Czy usunąć dr ${name}?`)) return;
    const token = localStorage.getItem('token');
    await fetch(`http://127.0.0.1:8000/admin/dentists/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const addService = async () => {
    const token = localStorage.getItem('token');
    if (!newService.dentist_id || !newService.name) return alert("Wypełnij dane zabiegu!");
    const res = await fetch('http://127.0.0.1:8000/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        dentist_id: parseInt(newService.dentist_id),
        name: newService.name,
        price: parseInt(newService.price)
      })
    });
    if (res.ok) { setNewService({ ...newService, name: '', price: '' }); fetchData(); }
  };

  const deleteService = async (id: number) => {
    if (!confirm("Usunąć zabieg z cennika?")) return;
    const token = localStorage.getItem('token');
    await fetch(`http://127.0.0.1:8000/admin/services/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const addSlot = async () => {
    const token = localStorage.getItem('token');
    if (!newSlot.dentist_id || !newSlot.slot_date || !newSlot.start_time) {
      return alert("Wybierz lekarza, datę i godzinę!");
    }

    const now = new Date();
    const selectedDateTime = new Date(`${newSlot.slot_date}T${newSlot.start_time}`);
    if (selectedDateTime < now) {
      return alert("Nie można dodać terminu w przeszłości!");
    }

    const res = await fetch('http://127.0.0.1:8000/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        dentist_id: parseInt(newSlot.dentist_id),
        slot_date: newSlot.slot_date,
        start_time: newSlot.start_time,
        service_id: newSlot.service_id
      })
    });
    if (res.ok) {
      alert("Termin udostępniony!");
      setNewSlot({ ...newSlot, slot_date: '', start_time: '' });
      fetchData();
    }
  };

  const cancelApp = async (appId: number, slotId: number) => {
    if (!confirm("Anulować tę wizytę?")) return;
    const token = localStorage.getItem('token');
    await fetch(`http://127.0.0.1:8000/admin/cancel/${appId}/${slotId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  return (
    <main className="min-h-screen bg-[#070b14] p-6 md:p-10 text-slate-200 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* 1. HEADER */}
        <header className="flex justify-between items-center bg-[#0f172a] p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Panel administracyjny</h1>
          <button onClick={() => router.push('/')} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Widok Pacjenta</button>
        </header>

        {/* 2. LICZNIKI (REZERWACJE I WOLNE TERMINY) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-emerald-500/30 text-center shadow-2xl relative overflow-hidden group hover:border-emerald-500/60 transition-all">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-600/10 blur-3xl rounded-full"></div>
            <p className="text-emerald-500 text-xs font-black uppercase tracking-[0.3em] mb-4 text-center">Aktywne rezerwacje</p>
            <p className="text-7xl font-black text-white tracking-tighter text-center">{stats.booked}</p>
          </div>

          <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-blue-500/30 text-center shadow-2xl relative overflow-hidden group hover:border-blue-500/60 transition-all">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full"></div>
            <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4 text-center">Wolne terminy</p>
            <p className="text-7xl font-black text-white tracking-tighter text-center">{stats.available}</p>
          </div>
        </div>

        {/* 3. FORMULARZE (3 KOLUMNY) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEKARZE */}
          <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-slate-800 space-y-6 flex flex-col shadow-xl">
            <h2 className="text-xl font-bold flex items-center gap-3 text-white"><span className="w-1.5 h-6 bg-blue-600 rounded-full"></span> Lekarze</h2>
            <div className="space-y-3 pb-4 border-b border-slate-800">
              <input type="text" placeholder="Imię" className="bg-[#070b14] border border-slate-800 p-4 rounded-2xl w-full outline-none text-white text-sm" value={newDentist.first_name} onChange={e => setNewDentist({...newDentist, first_name: e.target.value})} />
              <input type="text" placeholder="Nazwisko" className="bg-[#070b14] border border-slate-800 p-4 rounded-2xl w-full outline-none text-white text-sm" value={newDentist.last_name} onChange={e => setNewDentist({...newDentist, last_name: e.target.value})} />
              <input type="text" placeholder="Specjalizacja" className="bg-[#070b14] border border-slate-800 p-4 rounded-2xl w-full outline-none text-xs text-white" value={newDentist.specialization} onChange={e => setNewDentist({...newDentist, specialization: e.target.value})} />
              <button onClick={addDentist} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 shadow-lg shadow-blue-900/20">Dodaj Lekarza</button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-48 space-y-2 pr-2 scrollbar-hide">
              {dentists.map((d: any) => (
                <div key={d.id} className="flex justify-between items-center bg-[#070b14] p-3 rounded-xl border border-slate-800 group hover:border-red-500/30 transition-all">
                  <span className="text-xs font-bold uppercase tracking-tighter">dr {d.last_name}</span>
                  <button onClick={() => deleteDentist(d.id)} className="text-red-500 hover:text-red-300 text-[10px] font-black uppercase">Usuń</button>
                </div>
              ))}
            </div>
          </div>

          {/* CENNIK */}
          <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-slate-800 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold flex items-center gap-3 text-white"><span className="w-1.5 h-6 bg-purple-500 rounded-full"></span> Cennik zabiegów</h2>
            <div className="space-y-3">
              <select className="bg-[#070b14] border border-slate-800 p-4 rounded-2xl w-full outline-none text-xs text-white" value={newService.dentist_id} onChange={e => setNewService({...newService, dentist_id: e.target.value})}>
                <option value="">Wybierz lekarza...</option>
                {dentists.map((d:any) => <option key={d.id} value={d.id}>dr {d.last_name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Zabieg" className="bg-[#070b14] border border-slate-800 p-4 rounded-2xl outline-none text-xs text-white" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                <input type="number" placeholder="Cena" className="bg-[#070b14] border border-slate-800 p-4 rounded-2xl outline-none text-xs text-white" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} />
              </div>
              <button onClick={addService} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 shadow-lg shadow-purple-900/20">Dodaj do cennika</button>
              <div className="max-h-40 overflow-y-auto space-y-2 pt-2 scrollbar-hide">
                {dentists.find((d:any) => d.id == newService.dentist_id)?.services?.map((s:any) => (
                  <div key={s.id} className="flex justify-between items-center bg-[#070b14] p-3 rounded-xl border border-slate-800 text-[10px]">
                    <span className="uppercase font-bold">{s.name} — {s.price} zł</span>
                    <button onClick={() => deleteService(s.id)} className="text-red-500 font-black px-2 hover:text-white transition-colors">X</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NOWY TERMIN */}
          <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-slate-800 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold flex items-center gap-3 text-white"><span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span> Dodaj nowy termin</h2>
            <div className="space-y-4">
              <select className="bg-[#070b14] border border-slate-800 p-4 rounded-2xl w-full outline-none text-xs text-white" value={newSlot.dentist_id} onChange={e => setNewSlot({...newSlot, dentist_id: e.target.value})}>
                <option value="">Wybierz lekarza...</option>
                {dentists.map((d:any) => <option key={d.id} value={d.id}>dr {d.last_name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-slate-600 ml-2">Data</label>
                  <input type="date" min={today} className="bg-[#070b14] border border-slate-800 p-4 rounded-2xl w-full outline-none text-white text-xs" value={newSlot.slot_date} onChange={e => setNewSlot({...newSlot, slot_date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-slate-600 ml-2">Godzina</label>
                  <input type="time" className="bg-[#070b14] border border-slate-800 p-4 rounded-2xl w-full outline-none text-white text-xs" value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})} />
                </div>
              </div>
              <button onClick={addSlot} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">Udostępnij Slot</button>
            </div>
          </div>
        </div>

        {/* 4. TABELA WIZYT Z WYSZUKIWARKĄ */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              Lista Rezerwacji
              <span className="bg-blue-600/20 text-blue-400 text-[10px] px-3 py-1 rounded-full border border-blue-500/30">
                {filteredAppointments.length} wyników
              </span>
            </h2>
            <div className="relative w-full md:w-96">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
              <input type="text" placeholder="Szukaj pacjenta, lekarza lub usługi..." className="w-full bg-[#0f172a] border border-slate-800 p-4 pl-12 rounded-2xl outline-none text-sm text-white focus:border-blue-500 transition-all shadow-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">✕</button>}
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl pb-4">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-8 py-6">Pacjent</th>
                  <th className="px-8 py-6">Lekarz</th>
                  <th className="px-8 py-6">Usługa</th>
                  <th className="px-8 py-6">Data | Godzina</th>
                  <th className="px-8 py-6 text-right">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 font-bold text-white uppercase tracking-tighter text-xs">{a.patient_name}</td>
                      <td className="px-8 py-6 text-slate-400 text-xs">dr {a.dentist_name}</td>
                      <td className="px-8 py-6 text-blue-400 font-bold uppercase text-[10px]">{a.service_name}</td>
                      <td className="px-8 py-6 text-slate-400 text-xs font-mono">{a.slot_date} | {a.start_time?.slice(0,5)}</td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => cancelApp(a.id, a.slot_id)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all">Anuluj</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-600 italic text-sm">Brak wyników.</td>
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