"use client";
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Users, Search, UserPlus, Activity, Eye,
  RotateCcw, CheckCircle2, Mail, Phone, Briefcase,
  LogOut, ShieldCheck, AlertCircle, Clock, TrendingUp,
  UserSearch, History, XCircle, ChevronRight, Trash2, User,
  PlusCircle, LayoutGrid, ClipboardList, DollarSign, Calendar
} from 'lucide-react';

type TabType = 'dashboard' | 'doctors' | 'services' | 'patients';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  // 1. Zapewniamy stan dla pacjentów z bazy danych
  const [dbPatients, setDbPatients] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  const [newDentist, setNewDentist] = useState({
    first_name: "", last_name: "", specialization: "", email: "", phone_number: ""
  });
  const [newService, setNewService] = useState({
    dentist_id: "", name: "", price: ""
  });

  const [newSlot, setNewSlot] = useState({
    dentist_id: "", slot_date: "", start_time: "", service_id: ""
  });

  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [appToCancel, setAppToCancel] = useState<{ appId: number; slotId: number } | null>(null);
  const [showConfirmDeleteDoctor, setShowConfirmDeleteDoctor] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<number | null>(null);
  const [showConfirmDeleteService, setShowConfirmDeleteService] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const notify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    try {
      // 2. Pobieramy dane. Dodajemy obsługę błędu dla pacjentów, by nie blokowała reszty
      const [resApps, resDents, resPats] = await Promise.all([
        fetch("http://127.0.0.1:8000/admin/appointments", { headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } }),
        fetch("http://127.0.0.1:8000/dentists"),
        fetch("http://127.0.0.1:8000/admin/patients", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);

      if (resApps && resApps.ok) setAppointments(await resApps.json());
      if (resDents && resDents.ok) setDentists(await resDents.json());

      // Jeśli endpoint /admin/patients działa, wpisujemy pacjentów do stanu
      if (resPats && resPats.ok) {
        const patsData = await resPats.json();
        setDbPatients(Array.isArray(patsData) ? patsData : []);
      }
    } catch (err) {
      notify("Błąd połączenia z bazą", "error");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- AKCJE (BEZ ZMIAN) ---
  const handleAddDentist = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:8000/admin/dentists", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newDentist)
    });
    if (res.ok) { notify("Lekarz dodany."); setNewDentist({first_name:"", last_name:"", specialization:"", email:"", phone_number:""}); fetchData(); }
  };

  const proceedWithDoctorDelete = async () => {
    if (!doctorToDelete) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`http://127.0.0.1:8000/admin/dentists/${doctorToDelete}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) { notify("Lekarz usunięty."); fetchData(); }
    setShowConfirmDeleteDoctor(false);
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:8000/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ ...newSlot, dentist_id: Number(newSlot.dentist_id) })
    });
    if (res.ok) { notify("Termin dodany."); setNewSlot({ dentist_id: "", slot_date: "", start_time: "", service_id: "" }); fetchData(); }
    else { notify("Błąd: Sprawdź dane", "error"); }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:8000/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ ...newService, dentist_id: Number(newService.dentist_id), price: Number(newService.price) })
    });
    if (res.ok) { notify("Usługa dodana."); setNewService({dentist_id:"", name:"", price:""}); fetchData(); }
  };

  const proceedWithServiceDelete = async () => {
    if (!serviceToDelete) return;
    const res = await fetch(`http://127.0.0.1:8000/admin/services/${serviceToDelete}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    if (res.ok) { notify("Usługa usunięta."); fetchData(); }
    setShowConfirmDeleteService(false);
  };

  const proceedWithCancellation = async () => {
    if (!appToCancel) return;
    const res = await fetch(`http://127.0.0.1:8000/admin/cancel/${appToCancel.appId}/${appToCancel.slotId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    if (res.ok) { notify("Wizyta anulowana."); fetchData(); }
    setShowConfirmCancel(false);
  };

  // --- FILTROWANIE ---
  // 3. NAPRAWA: Łączymy pacjentów z bazy (dbPatients) oraz tych z wizyt (appointments)
  const patientsList = useMemo(() => {
    const fromDb = dbPatients.map(p => `${p.first_name} ${p.last_name}`);
    const fromApps = appointments.map(a => a.patient_name);

    // Set usuwa duplikaty
    const allNames = Array.from(new Set([...fromDb, ...fromApps]));

    return allNames.filter(name =>
      name && name.toLowerCase().includes(patientSearch.toLowerCase())
    );
  }, [dbPatients, appointments, patientSearch]);

  const filteredApps = appointments.filter(a =>
    String(a.patient_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(a.dentist_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDentistsForServices = useMemo(() => {
    return dentists.filter(d => `${d.first_name} ${d.last_name}`.toLowerCase().includes(serviceSearch.toLowerCase()));
  }, [dentists, serviceSearch]);

  const stats = [
    { label: 'Wszystkie Wizyty', val: appointments.length, icon: <CalendarDays />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Baza Pacjentów', val: patientsList.length, icon: <Users />, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Zespół Lekarski', val: dentists.length, icon: <Briefcase />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Status Systemu', val: 'LIVE', icon: <Activity />, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const ToothIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17 3C15.5 3 13.5 4.5 12 4.5C10.5 4.5 8.5 3 7 3C4 3 2 5.5 2 9C2 12.5 3.5 15.5 5 18C6.5 20.5 7 22 7 23C7 23.5 7.5 24 8 24H9C9.5 24 10 23.5 10 23C10 20.5 11 18 12 18C13 18 14 20.5 14 23C14 23.5 14.5 24 15 24H16C16.5 24 17 23.5 17 23C17 22 17.5 20.5 19 18C20.5 15.5 22 12.5 22 9C22 5.5 20 3 17 3Z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 selection:bg-blue-600">

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 py-5">
        <div className="max-w-[1700px] mx-auto px-10 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 transition-transform hover:rotate-6">
              <ToothIcon className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none text-slate-900">Dentica Admin</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Professional Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchData} className={`p-3 rounded-xl bg-slate-50 ${isLoading ? 'animate-spin' : ''}`}><RotateCcw size={20} className="text-slate-400"/></button>
            <Link href="/dashboard"><button className="px-7 py-3.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">Widok Pacjenta</button></Link>
            <button onClick={() => {localStorage.clear(); router.push("/");}} className="px-7 py-3.5 rounded-2xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Wyloguj</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto px-10 py-12 space-y-12">

        {/* STATYSTYKI */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex items-center gap-8">
              <div className={`w-20 h-20 ${s.bg} ${s.color} rounded-[2rem] flex items-center justify-center shadow-inner`}>{React.cloneElement(s.icon as React.ReactElement, { size: 32 })}</div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p><p className="text-4xl font-black tracking-tighter uppercase">{s.val}</p></div>
            </div>
          ))}
        </section>

        {/* TABS NAVIGATION */}
        <div className="flex gap-4 p-2 bg-white rounded-[2.5rem] border border-slate-100 w-fit shadow-sm">
          {[
            { id: 'dashboard', label: 'Wizyty', icon: <LayoutGrid size={18}/> },
            { id: 'doctors', label: 'Lekarze', icon: <Users size={18}/> },
            { id: 'services', label: 'Cennik', icon: <DollarSign size={18}/> },
            { id: 'patients', label: 'Pacjenci', icon: <UserSearch size={18}/> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-400 hover:bg-slate-50"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
              <div className="flex justify-between items-center px-4">
                <h2 className="text-xl font-black uppercase flex items-center gap-3 text-slate-900"><Clock className="text-blue-600" /> Kolejka Rezerwacji</h2>
                <div className="relative w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600" size={16} />
                  <input type="text" placeholder="Szukaj wizyty..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-none text-xs font-bold outline-none focus:ring-2 focus:ring-blue-50 transition-all uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left uppercase">
                  <thead><tr className="text-[10px] font-black text-slate-400 tracking-widest border-b border-slate-50"><th className="px-4 pb-4">Status</th><th className="px-4 pb-4">Pacjent</th><th className="px-4 pb-4">Lekarz</th><th className="px-4 pb-4">Termin</th><th className="px-4 pb-4 text-right">Akcja</th></tr></thead>
                  <tbody className="divide-y divide-slate-50 text-[12px] font-black">
                    {filteredApps.map((a, i) => {
                      const appointmentDateTime = new Date(`${a.slot_date}T${a.start_time}`);
                      const isPast = appointmentDateTime < new Date();

                      return (
                        <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isPast ? 'opacity-60' : ''}`}>
                          <td className="py-8 px-4">
                            {isPast ? (
                              <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[8px] tracking-widest">ZAKOŃCZONA</span>
                            ) : (
                              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] tracking-widest animate-pulse">NADCHODZĄCA</span>
                            )}
                          </td>
                          <td className="py-8 px-4 text-slate-900">{a.patient_name || 'Pacjent'}</td>
                          <td className="py-8 px-4 text-slate-700">lek. dent. {a.dentist_name}</td>
                          <td className="py-8 px-4 text-slate-900">{a.slot_date} | {a.start_time?.slice(0,5)}</td>
                          <td className="py-8 px-4 text-right">
                            {!isPast && (
                              <button onClick={() => {setAppToCancel({appId: a.id, slotId: a.slot_id}); setShowConfirmCancel(true);}} className="p-3 text-slate-300 hover:text-red-500 transition-all"><XCircle size={20} /></button>
                            )}
                            {isPast && <span className="p-3 text-slate-200"><CheckCircle2 size={20}/></span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB: DOCTORS */}
          {activeTab === 'doctors' && (
            <motion.div key="docs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-10">
              <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 h-fit">
                  <h2 className="text-xl font-black uppercase flex items-center gap-3 text-slate-900"><UserPlus className="text-blue-600" /> Dodaj Lekarza</h2>
                  <form onSubmit={handleAddDentist} className="space-y-4">
                    <input required type="text" placeholder="Imię" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 uppercase" value={newDentist.first_name} onChange={e => setNewDentist({...newDentist, first_name: e.target.value})} />
                    <input required type="text" placeholder="Nazwisko" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 uppercase" value={newDentist.last_name} onChange={e => setNewDentist({...newDentist, last_name: e.target.value})} />
                    <input required type="text" placeholder="Specjalizacja" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 uppercase" value={newDentist.specialization} onChange={e => setNewDentist({...newDentist, specialization: e.target.value})} />
                    <input required type="email" placeholder="E-mail" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100" value={newDentist.email} onChange={e => setNewDentist({...newDentist, email: e.target.value})} />
                    <input required type="text" placeholder="Telefon" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100" value={newDentist.phone_number} onChange={e => setNewDentist({...newDentist, phone_number: e.target.value})} />
                    <button type="submit" className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase shadow-xl tracking-widest">Zapisz Lekarza</button>
                  </form>
                </div>

                <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 h-fit">
                  <h2 className="text-xl font-black uppercase flex items-center gap-3 text-slate-900"><Calendar className="text-blue-600" /> Dodaj Termin</h2>
                  <form onSubmit={handleAddSlot} className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">1. Wybierz Lekarza</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
                        {dentists.map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setNewSlot({...newSlot, dentist_id: String(d.id), service_id: ""})}
                            className={`p-4 rounded-2xl text-left transition-all flex items-center gap-4 border ${
                              newSlot.dentist_id === String(d.id) 
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg" 
                              : "bg-white border-transparent hover:border-blue-100 text-slate-700 shadow-sm"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] ${newSlot.dentist_id === String(d.id) ? "bg-white/20" : "bg-blue-50 text-blue-600"}`}>
                              {d.first_name[0]}{d.last_name[0]}
                            </div>
                            <span className="text-[11px] font-black uppercase truncate leading-none">
                              {d.first_name}<br/>{d.last_name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">2. Dzień</label>
                        <input required type="date" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none border-none focus:ring-2 focus:ring-blue-100" value={newSlot.slot_date} onChange={e => setNewSlot({...newSlot, slot_date: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">3. Godzina</label>
                        <input required type="time" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none border-none focus:ring-2 focus:ring-blue-100" value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">4. Usługa</label>
                        <select required className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none border-none disabled:opacity-30 focus:ring-2 focus:ring-blue-100" value={newSlot.service_id} onChange={e => setNewSlot({...newSlot, service_id: e.target.value})} disabled={!newSlot.dentist_id}>
                          <option value="">Wybierz...</option>
                          {dentists.find(d => String(d.id) === String(newSlot.dentist_id))?.services?.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <button type="submit" disabled={!newSlot.service_id} className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase shadow-lg tracking-widest hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-300 transition-all">Otwórz termin dla pacjentów</button>
                  </form>
                </div>
              </div>

              {/* LISTA LEKARZY */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                <h2 className="text-xl font-black uppercase flex items-center gap-3 text-slate-900"><Users className="text-blue-600" /> Baza Lekarzy</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dentists.map(d => (
                    <div key={d.id} className="p-6 rounded-3xl bg-slate-50 flex justify-between items-center transition-all hover:bg-white hover:shadow-lg border border-transparent hover:border-slate-100 group">
                      <div className="uppercase">
                        <p className="font-black text-slate-900 text-[12px]">lek. dent. {d.first_name} {d.last_name}</p>
                        <p className="text-[10px] font-bold text-blue-600 tracking-widest mt-1">{d.specialization}</p>
                      </div>
                      <button onClick={() => {setDoctorToDelete(d.id); setShowConfirmDeleteDoctor(true);}} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: SERVICES */}
          {activeTab === 'services' && (
             <motion.div key="serv" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 h-fit">
                  <h2 className="text-xl font-black uppercase flex items-center gap-3 text-slate-900"><PlusCircle className="text-blue-600" /> Nowa Usługa</h2>
                  <form onSubmit={handleAddService} className="space-y-4 uppercase">
                    <select required className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none border-none focus:ring-2 focus:ring-blue-100" value={newService.dentist_id} onChange={e => setNewService({...newService, dentist_id: e.target.value})}>
                      <option value="">Wybierz lekarza...</option>
                      {dentists.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
                    </select>
                    <input required type="text" placeholder="Zabieg" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 uppercase" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                    <input required type="number" placeholder="Cena (zł)" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} />
                    <button type="submit" className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase shadow-xl tracking-widest">Dodaj do cennika</button>
                  </form>
                </div>
                <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex justify-between items-center px-4">
                      <h2 className="text-xl font-black uppercase flex items-center gap-3 text-slate-900"><ClipboardList className="text-blue-600" /> Cennik Specjalistów</h2>
                      <div className="relative w-64 group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600" size={16} /><input type="text" placeholder="Filtruj lekarza..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-none text-xs font-bold outline-none focus:ring-2 focus:ring-blue-50 transition-all uppercase" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} /></div>
                    </div>
                    <div className="space-y-8 uppercase">
                    {filteredDentistsForServices.map(d => (
                        <div key={d.id} className="border-b border-slate-50 pb-6 last:border-none">
                        <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Dr {d.last_name}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {d.services?.map((s: any) => (
                            <div key={s.id} className="bg-slate-50 px-6 py-4 rounded-2xl flex justify-between items-center group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                                <div><span className="text-[12px] font-black text-slate-800">{s.name}</span><p className="text-[11px] font-black text-blue-600 mt-1">{s.price} zł</p></div>
                                <button onClick={() => {setServiceToDelete(s.id); setShowConfirmDeleteService(true);}} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                            </div>
                            ))}
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
             </motion.div>
          )}

          {/* TAB: PATIENTS */}
          {activeTab === 'patients' && (
            <motion.div key="pats" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
               <div className="flex justify-between items-center px-4">
                  <h2 className="text-xl font-black uppercase flex items-center gap-3 text-slate-900"><UserSearch className="text-blue-600" /> Baza Pacjentów</h2>
                  <div className="relative w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/><input type="text" placeholder="Szukaj..." className="w-full pl-12 p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm outline-none uppercase" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} /></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* WYŚWIETLANIE LISTY PACJENTÓW */}
                  {patientsList.length > 0 ? (
                    patientsList.map((p, i) => (
                      <button key={i} onClick={() => setSelectedPatient(p)} className="w-full text-left p-6 rounded-3xl bg-slate-50 hover:bg-blue-600 hover:text-white transition-all flex justify-between items-center group shadow-sm">
                         <span className="font-black text-[12px] uppercase">{p || 'Bezimienny'}</span><History size={16} className="group-hover:text-white text-slate-300"/>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-10 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">
                      Brak pacjentów w bazie danych
                    </div>
                  )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MODALE POZOSTAJĄ BEZ ZMIAN */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPatient(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-3xl p-12 rounded-[4rem] shadow-2xl flex flex-col max-h-[85vh] uppercase border border-white">
               <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Pełna Historia: {selectedPatient}</h3>
                  <button onClick={() => setSelectedPatient(null)} className="p-3 bg-slate-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"><XCircle size={24} /></button>
               </div>
               <div className="overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                {appointments.filter(a => a.patient_name === selectedPatient).map((a, i) => {
                  const appointmentDateTime = new Date(`${a.slot_date}T${a.start_time}`);
                  const isPast = appointmentDateTime < new Date();
                  return (
                    <div key={i} className={`p-8 rounded-[2.5rem] border flex justify-between items-center ${isPast ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-blue-50 border-blue-100 shadow-sm'}`}>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                           {isPast ? <div className="px-3 py-1 bg-slate-200 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest">Archiwalna / Zakończona</div> : <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">Nadchodząca</div>}
                           <p className="text-[10px] font-black text-slate-400">lek. dent. {a.dentist_name}</p>
                        </div>
                        <p className="font-black text-slate-900 text-lg">{a.service_name}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-lg font-black text-slate-900">{a.slot_date}</p>
                         <p className="text-xs text-blue-600 font-black uppercase tracking-widest">godz. {a.start_time?.slice(0,5)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {showConfirmCancel && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmCancel(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md p-12 rounded-[4rem] shadow-2xl text-center border border-red-50">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><Trash2 size={48} /></div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-slate-900 leading-tight">Anulować Wizytę?</h3>
              <p className="text-slate-500 font-medium text-sm mb-10 italic">Termin wróci do puli wolnych slotów.</p>
              <div className="flex flex-col gap-4">
                <button onClick={proceedWithCancellation} className="w-full py-5 rounded-3xl bg-red-600 text-white font-black uppercase shadow-xl tracking-widest hover:bg-red-700">Potwierdzam</button>
                <button onClick={() => setShowConfirmCancel(false)} className="w-full py-5 rounded-3xl bg-slate-50 text-slate-400 font-black uppercase">Wróć</button>
              </div>
            </motion.div>
          </div>
        )}

        {showConfirmDeleteDoctor && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmDeleteDoctor(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md p-12 rounded-[4rem] shadow-2xl text-center border border-red-50">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><Users size={48} /></div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-slate-900 leading-tight">Usunąć Lekarza?</h3>
              <p className="text-slate-500 font-medium text-sm mb-10 italic text-center uppercase tracking-widest text-[10px]">Uwaga: Stracisz wszystkie powiązane wizyty i usługi!</p>
              <div className="flex flex-col gap-4">
                <button onClick={proceedWithDoctorDelete} className="w-full py-5 rounded-3xl bg-red-600 text-white font-black uppercase shadow-xl tracking-widest">Tak, usuń lekarza</button>
                <button onClick={() => setShowConfirmDeleteDoctor(false)} className="w-full py-5 rounded-3xl bg-slate-50 text-slate-400 font-black uppercase">Wróć</button>
              </div>
            </motion.div>
          </div>
        )}

        {showConfirmDeleteService && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmDeleteService(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md p-12 rounded-[4rem] shadow-2xl text-center border border-red-50">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><DollarSign size={48} /></div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-slate-900 leading-tight">Usunąć Usługę?</h3>
              <p className="text-slate-500 font-medium text-sm mb-10 italic">Zniknie z cennika wszystkich lekarzy.</p>
              <div className="flex flex-col gap-4">
                <button onClick={proceedWithServiceDelete} className="w-full py-5 rounded-3xl bg-red-600 text-white font-black uppercase shadow-xl tracking-widest">Tak, usuń usługę</button>
                <button onClick={() => setShowConfirmDeleteService(false)} className="w-full py-5 rounded-3xl bg-slate-50 text-slate-400 font-black uppercase">Wróć</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NOTYFIKACJA */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: 50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0 }} className="fixed bottom-10 left-1/2 z-[300] w-full max-w-md px-6">
            <div className={`px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-5 text-white backdrop-blur-xl border border-white/10 ${notification.type === 'success' ? 'bg-emerald-600/90' : 'bg-red-600/90'}`}>
              {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <p className="font-black uppercase text-[10px] tracking-widest">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}