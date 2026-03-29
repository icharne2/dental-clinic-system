"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, LogOut, Calendar, Stethoscope, Search, CheckCircle,
  AlertCircle, ChevronRight, ChevronLeft, Clock, Activity,
  CalendarCheck, LayoutDashboard, User, Sparkles, MapPin, X
} from "lucide-react";

export default function DashboardPage() {
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showConfirmBook, setShowConfirmBook] = useState(false);
  const [appToCancel, setAppToCancel] = useState<{ appId: number; slotId: number } | null>(null);
  const [slotToBook, setSlotToBook] = useState<number | null>(null);

  const [dentists, setDentists] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [selectedDentistId, setSelectedDentistId] = useState<number | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [dentistPage, setDentistPage] = useState(1);
  const dentistsPerPage = 4;

  const router = useRouter();
  const denticaBlue = "#0A2EE2";

  const ToothIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17 3C15.5 3 13.5 4.5 12 4.5C10.5 4.5 8.5 3 7 3C4 3 2 5.5 2 9C2 12.5 3.5 15.5 5 18C6.5 20.5 7 22 7 23C7 23.5 7.5 24 8 24H9C9.5 24 10 23.5 10 23C10 20.5 11 18 12 18C13 18 14 20.5 14 23C14 23.5 14.5 24 15 24H16C16.5 24 17 23.5 17 23C17 22 17.5 20.5 19 18C20.5 15.5 22 12.5 22 9C22 5.5 20 3 17 3Z" />
    </svg>
  );

  const notify = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const normalizeText = (value: any) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [resApps, resDentists, resSlots] = await Promise.all([
        fetch("http://127.0.0.1:8000/appointments", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://127.0.0.1:8000/dentists"),
        fetch("http://127.0.0.1:8000/slots")
      ]);
      setAppointments(await resApps.json());
      setDentists(await resDentists.json());
      setSlots(await resSlots.json());
    } catch (err) { notify("Błąd synchronizacji.", "error"); }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole")?.trim().toLowerCase() || "patient";
    if (!token) { router.push("/auth"); }
    else {
      setUserName(localStorage.getItem("userName") || "Pacjencie");
      setUserRole(role);
      fetchData();
    }
  }, [router]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDentistId(null);
    setSelectedServiceName(null);
    setDentistPage(1);
  };

  const searchedDentists = useMemo(() => {
    return dentists.filter((d: any) => {
      const fullName = `${d.first_name} ${d.last_name}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || d.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [dentists, searchTerm]);

  const currentDentists = searchedDentists.slice((dentistPage - 1) * dentistsPerPage, dentistPage * dentistsPerPage);
  const totalDentistPages = Math.ceil(searchedDentists.length / dentistsPerPage);

  const filteredSlots = useMemo(() => {
    if (!selectedDentistId || !selectedServiceName) return [];
    const now = new Date();
    return slots.filter((s: any) => {
      const isSameDentist = Number(s.dentist_id) === Number(selectedDentistId);
      const isSameService = normalizeText(s.type || s.service_name) === normalizeText(selectedServiceName);
      const slotDateTime = new Date(`${s.slot_date}T${s.start_time}`);
      return isSameDentist && isSameService && slotDateTime > now;
    });
  }, [slots, selectedDentistId, selectedServiceName]);

  const proceedWithBooking = async () => {
    if (!slotToBook) return;
    const res = await fetch(`http://127.0.0.1:8000/book/${slotToBook}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) { notify("Wizyta zarezerwowana!"); fetchData(); }
    setShowConfirmBook(false);
  };

  const proceedWithCancellation = async () => {
    if (!appToCancel) return;
    const res = await fetch(`http://127.0.0.1:8000/cancel/${appToCancel.appId}/${appToCancel.slotId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) { notify("Wizyta anulowana."); fetchData(); }
    setShowConfirmCancel(false);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 selection:bg-blue-600">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-100">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <ToothIcon className="text-white w-6 h-6" />
             </div>
             <h1 className="text-xl font-black tracking-tighter uppercase text-slate-900">Dentica</h1>
          </div>
          <div className="flex items-center gap-4">
            {userRole === "admin" && (
              <button onClick={() => router.push("/admin")} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Panel Admina</button>
            )}
            <button onClick={() => { localStorage.clear(); router.push("/"); }} className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Wyloguj</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 mt-10 space-y-12">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-8 lg:p-16 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-black mb-4 uppercase">Witaj, {userName}!</h2>
            <p className="text-slate-300 text-lg mb-8 font-medium">Twój zdrowy uśmiech, nasza misja.</p>
            <div className="flex items-center gap-2 bg-white/10 w-fit px-4 py-2 rounded-full border border-white/10 text-sm font-bold uppercase tracking-widest">
               <Calendar size={16} className="text-blue-400" />
               <span>{new Date().toLocaleDateString('pl-PL')}</span>
            </div>
          </div>
          <Sparkles className="absolute right-10 top-10 text-blue-500/20 w-32 h-32 rotate-12" />
        </motion.section>

        <div className="grid lg:grid-cols-12 gap-10">
          <section className="lg:col-span-4 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900"><Stethoscope className="text-blue-600" /> Nasi Eksperci</h3>
              {(searchTerm || selectedDentistId) && (
                <button onClick={handleResetFilters} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 transition-all"><X size={12} /> Usuń filtrowanie</button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input type="text" placeholder="Szukaj specjalisty..." className="w-full bg-white border border-slate-100 p-5 pl-14 rounded-[2rem] text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100/30 transition-all shadow-sm" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setDentistPage(1);}} />
            </div>
            <div className="space-y-4">
              {currentDentists.map((d: any) => (
                <button key={d.id} onClick={() => {setSelectedDentistId(d.id); setSelectedServiceName(null);}} className={`w-full text-left p-6 rounded-[2.5rem] border transition-all flex items-center gap-5 ${selectedDentistId === d.id ? "bg-blue-600 border-blue-600 text-white shadow-xl" : "bg-white border-slate-100 hover:border-blue-400"}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${selectedDentistId === d.id ? "bg-white/20" : "bg-blue-50 text-blue-600"}`}>{d.first_name[0]}{d.last_name[0]}</div>
                  <div className="flex-1 uppercase leading-tight">
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selectedDentistId === d.id ? "text-blue-100" : "text-blue-600"}`}>{d.specialization}</p>
                    <p className="text-lg font-black tracking-tight uppercase leading-none">lek. dent. {d.first_name} {d.last_name}</p>
                  </div>
                  <ChevronRight size={18} className={selectedDentistId === d.id ? "rotate-90" : ""} />
                </button>
              ))}

              {/* SEKACJA PAGINACJI LEKARZY */}
              {totalDentistPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 py-4">
                  <button
                    disabled={dentistPage === 1}
                    onClick={() => setDentistPage(prev => Math.max(prev - 1, 1))}
                    className={`p-3 rounded-full border transition-all ${dentistPage === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-50 hover:border-blue-600 text-blue-600 bg-white shadow-sm"}`}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {dentistPage} / {totalDentistPages}
                  </span>

                  <button
                    disabled={dentistPage === totalDentistPages}
                    onClick={() => setDentistPage(prev => Math.min(prev + 1, totalDentistPages))}
                    className={`p-3 rounded-full border transition-all ${dentistPage === totalDentistPages ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-50 hover:border-blue-600 text-blue-600 bg-white shadow-sm"}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="lg:col-span-8 space-y-10">
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tight px-2 flex items-center gap-3 text-slate-900"><Activity className="text-blue-600" /> Rodzaj usługi</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {selectedDentistId ? (
                   dentists.find(d => d.id === selectedDentistId)?.services?.map((s: any, idx: number) => (
                    <button key={idx} onClick={() => setSelectedServiceName(s.name)} className={`p-6 rounded-[2rem] border text-left transition-all flex justify-between items-center ${selectedServiceName === s.name ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-white border-slate-100 hover:border-blue-400 shadow-sm"}`}>
                      <span className="font-bold text-sm tracking-tight uppercase leading-none">{s.name}</span>
                      <span className={`text-sm font-black ${selectedServiceName === s.name ? "text-white" : "text-blue-600"}`}>{s.price} zł</span>
                    </button>
                  ))
                ) : ( <div className="col-span-full p-12 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center text-slate-400 font-medium italic flex flex-col items-center gap-2 uppercase tracking-widest text-[10px]">Wybierz lekarza z listy.</div> )}
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tight px-2 flex items-center gap-3 text-slate-900"><Clock className="text-emerald-500" /> Dostępne terminy</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSlots.length > 0 ? filteredSlots.map((s: any) => (
                  <motion.button whileHover={{ scale: 1.03 }} key={s.id} onClick={() => {setSlotToBook(s.id); setShowConfirmBook(true);}} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] text-left hover:border-emerald-400 hover:shadow-xl transition-all shadow-sm group">
                    <div className="text-[9px] font-black uppercase text-emerald-500 tracking-widest mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Wolny termin</div>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1 group-hover:text-emerald-600">{(s.start_time || "").slice(0, 5)}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{s.slot_date}</div>
                    <div className="mt-8 w-full bg-emerald-600 text-white text-center py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 group-hover:bg-emerald-700 transition-all">Rezerwuj</div>
                  </motion.button>
                )) : (
                  <div className="col-span-full p-12 bg-white rounded-[3rem] border border-slate-100 text-center text-slate-400 font-medium italic flex flex-col items-center gap-2 uppercase tracking-widest text-[10px]">Brak przyszłych terminów.</div>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="space-y-8 pt-10">
          <h3 className="text-2xl font-black uppercase tracking-tighter px-2 text-slate-900">Nadchodzące wizyty <span className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-full ml-2 leading-none">{appointments.length}</span></h3>
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <table className="w-full text-left uppercase">
              <thead><tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100"><th className="px-10 py-8">Specjalista</th><th className="px-10 py-8 text-center">Harmonogram</th><th className="px-10 py-8 text-center">Usługa</th><th className="px-10 py-8 text-right">Zarządzaj</th></tr></thead>
              <tbody className="divide-y divide-slate-50 text-[12px] font-black">
                {appointments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-10 py-8 text-slate-800">lek. dent. {a.dentist_name}</td>
                    <td className="px-10 py-8 text-center"><span className="text-slate-900 block leading-none">{a.slot_date}</span><span className="text-[10px] text-blue-600 tracking-widest uppercase">godz. {(a.start_time || "").slice(0, 5)}</span></td>
                    <td className="px-10 py-8 text-center"><span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black tracking-widest">{a.service_name || "Konsultacja"}</span></td>
                    <td className="px-10 py-8 text-right">
                       <button onClick={() => {setAppToCancel({appId: a.id, slotId: a.slot_id}); setShowConfirmCancel(true);}} className="p-3 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={20} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length === 0 && <div className="py-24 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Brak nadchodzących wizyt</div>}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showConfirmBook && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmBook(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md p-12 rounded-[4rem] shadow-2xl text-center border border-slate-50">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><CalendarCheck size={48} /></div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-slate-900">Umówić wizytę?</h3>
              <p className="text-slate-500 font-medium text-sm mb-10 italic uppercase tracking-widest text-[10px]">Potwierdzasz rezerwację terminu w klinice Dentica.</p>
              <div className="flex flex-col gap-4">
                <button onClick={proceedWithBooking} className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black uppercase shadow-xl hover:bg-blue-700 transition-all">Tak, rezerwuję</button>
                <button onClick={() => setShowConfirmBook(false)} className="w-full py-5 rounded-3xl bg-slate-50 text-slate-400 font-black uppercase hover:bg-slate-100 transition-all">Wróć</button>
              </div>
            </motion.div>
          </div>
        )}
        {showConfirmCancel && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmCancel(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md p-12 rounded-[4rem] shadow-2xl text-center border border-red-50">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><Trash2 size={48} /></div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-slate-900">Anulować Wizytę?</h3>
              <p className="text-slate-500 font-medium text-sm mb-10 italic uppercase tracking-widest text-[10px]">Miejsce zostanie zwolnione dla innych pacjentów.</p>
              <div className="flex flex-col gap-4">
                <button onClick={proceedWithCancellation} className="w-full py-5 rounded-3xl bg-red-600 text-white font-black uppercase shadow-xl hover:bg-red-700 transition-all">Tak, anuluj</button>
                <button onClick={() => setShowConfirmCancel(false)} className="w-full py-5 rounded-3xl bg-slate-50 text-slate-400 font-black uppercase hover:bg-slate-100 transition-all">Wróć</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: 50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, scale: 0.9, x: "-50%" }} className="fixed bottom-10 left-1/2 z-[300] w-full max-w-md">
            <div className={`px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-5 backdrop-blur-xl border border-white/20 text-white ${notification.type === "success" ? "bg-emerald-600/90" : "bg-red-600/90"}`}>
              {notification.type === "success" ? <CheckCircle size={24}/> : <AlertCircle size={24}/>}
              <p className="font-black uppercase text-[10px] tracking-widest leading-none">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}