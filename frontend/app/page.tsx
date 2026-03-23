"use client";
import { motion } from 'framer-motion';
import React from 'react';
import Link from 'next/link';
import {
  MapPin, Phone, Clock, ChevronRight, Mail, Star, ShieldCheck,
  HeartPulse, Zap, Microscope, Scissors, Activity,
  Baby, CheckCircle, Sparkles, ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const denticaBlue = "#0A2EE2";

  // Wyciągnięta ikonka zęba z AuthPage
  const ToothIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
      <path d="M17 3C15.5 3 13.5 4.5 12 4.5C10.5 4.5 8.5 3 7 3C4 3 2 5.5 2 9C2 12.5 3.5 15.5 5 18C6.5 20.5 7 22 7 23C7 23.5 7.5 24 8 24H9C9.5 24 10 23.5 10 23C10 20.5 11 18 12 18C13 18 14 20.5 14 23C14 23.5 14.5 24 15 24H16C16.5 24 17 23.5 17 23C17 22 17.5 20.5 19 18C20.5 15.5 22 12.5 22 9C22 5.5 20 3 17 3Z" />
    </svg>
  );

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-600 selection:text-white text-slate-900">

      {/* ===== NAWIGACJA ===== */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-[100]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#0A2EE2] rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-transform">
              <ToothIcon className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-slate-900">DENTICA</span>
          </Link>

          <div className="hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <a href="#uslugi" className="hover:text-blue-600 transition-colors">Klinika</a>
            <a href="#zespol" className="hover:text-blue-600 transition-colors">Specjaliści</a>
            <a href="#fundamenty" className="hover:text-blue-600 transition-colors">Cennik</a>
            <a href="#kontakt" className="hover:text-blue-600 transition-colors">Kontakt</a>
          </div>

          <Link href="/auth">
            <button className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 active:scale-95">
              Panel Pacjenta
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-64 pb-40 px-6 overflow-hidden bg-slate-50/50">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-100/30 rounded-full blur-[150px] -z-10 -translate-y-1/2 translate-x-1/4"></div>
        <div className="max-w-[1400px] mx-auto text-center relative">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white border border-slate-100 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-10 shadow-sm">
            <Sparkles className="w-4 h-4" /> Najwyższy standard opieki dentystycznej
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-6xl md:text-[7.5rem] font-black tracking-tighter leading-[0.85] max-w-6xl mx-auto mb-10 uppercase text-slate-900 text-center">
            Perfekcyjny <span className="text-blue-600">Uśmiech</span> to podstawa.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-14 leading-relaxed">
            Warszawska klinika stomatologii. Bezbolesne metody, precyzja pod mikroskopem i opieka, której potrzebujesz.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Link href="/auth">
              <button className="px-12 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-2xl shadow-blue-600/40 hover:bg-blue-700 transition-all active:scale-95" style={{ backgroundColor: denticaBlue }}>Zarezerwuj wizytę online</button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== USŁUGI ===== */}
      <section id="uslugi" className="py-40 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-32">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-4">Nasze Specjalizacje</h2>
            <p className="text-5xl font-black tracking-tighter uppercase text-slate-900">W czym się specjalizujemy</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { title: 'Zachowawcza', icon: <Zap />, desc: 'Bezbolesne leczenie ubytków nowoczesnymi materiałami kompozytowymi.' },
              { title: 'Endodoncja', icon: <Microscope />, desc: 'Leczenie kanałowe pod mikroskopem, ratujące zęby przed usunięciem.' },
              { title: 'Chirurgia', icon: <Scissors />, desc: 'Ekstrakcje chirurgiczne oraz sterowana regeneracja kości.' },
              { title: 'Ortodoncja', icon: <Star />, desc: 'Korekcja wad zgryzu aparatami stałymi i systemami nakładkowymi.' },
              { title: 'Implantologia', icon: <ShieldCheck />, desc: 'Trwała odbudowa braków zębowych przywracająca pełną funkcję.' },
              { title: 'Dziecięca', icon: <Baby />, desc: 'Wizyty adaptacyjne i leczenie w przyjaznej atmosferze.' }
            ].map((s, i) => (
              <motion.div
                key={`service-${i}`}
                {...fadeInUp} transition={{ delay: i * 0.1 }}
                className="bg-slate-50 p-12 rounded-[3.5rem] border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-2xl transition-all group"
              >
                <div className="w-16 h-16 bg-white text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-10 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {React.cloneElement(s.icon, { size: 28 })}
                </div>
                <h3 className="text-2xl font-black mb-5 tracking-tight uppercase text-slate-900">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ZESPÓŁ ===== */}
      <section id="zespol" className="py-40 bg-slate-900 text-white text-center md:text-left">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div {...fadeInUp} className="flex flex-col lg:flex-row justify-between items-end mb-24 gap-10">
            <div>
              <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4">Zespół Dentica</h2>
              <p className="text-5xl font-black tracking-tighter uppercase leading-none text-white">Nasi Eksperci</p>
            </div>
            <p className="text-slate-400 font-medium text-lg max-w-sm">8 specjalistów gotowych zadbać o każdy aspekt Twojego zdrowia.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Anna Kowalska', spec: 'Zachowawcza', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2' },
              { name: 'Michał Nowak', spec: 'Endodoncja', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d' },
              { name: 'Katarzyna Wiśniewska', spec: 'Ortodoncja', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f' },
              { name: 'Tomasz Zieliński', spec: 'Chirurgia', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d' },
              { name: 'Magdalena Wójcik', spec: 'Protetyka', img: 'https://images.unsplash.com/photo-1643297654416-05795d62e39c' },
              { name: 'Piotr Kamiński', spec: 'Implantologia', img: 'https://images.unsplash.com/photo-1550831107-1553da8c8464' },
              { name: 'Joanna Lewandowska', spec: 'Periodontologia', img: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f' },
              { name: 'Aleksandra Dąbrowska', spec: 'Dziecięca', img: 'https://images.unsplash.com/photo-1618498082410-b4aa22193b38' }
            ].map((d, i) => (
              <motion.div key={`dentist-profile-${i}`} {...fadeInUp} transition={{ delay: i * 0.1 }} className="group">
                <div className="relative h-[450px] rounded-[3.5rem] overflow-hidden mb-6 shadow-2xl">
                  <img src={`${d.img}?auto=format&fit=crop&q=80&w=600&h=800&crop=faces&focus=center`} alt={d.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-10">
                    <p className="text-xs font-black uppercase tracking-widest mb-2 text-blue-300">{d.spec}</p>
                    <Link href="/auth"><button className="bg-white text-blue-900 px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Zapisz się</button></Link>
                  </div>
                </div>
                <h4 className="text-xl font-black tracking-tight uppercase text-white">lek. dent. {d.name}</h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FUNDAMENTY / CENNIK ===== */}
      <section id="fundamenty" className="py-40 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-32">
             <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-4">Cennik usług</h2>
             <p className="text-5xl font-black tracking-tighter uppercase text-slate-900">Przejrzyste zasady</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Przegląd', price: '100 zł', desc: 'Konsultacja z planem leczenia.', icon: <CheckCircle /> },
              { title: 'Higienizacja', price: '350 zł', desc: 'Skaling i piaskowanie.', icon: <HeartPulse /> },
              { title: 'Kanałowe', price: 'od 600 zł', desc: 'Pod mikroskopem Zeiss.', icon: <Microscope /> },
              { title: 'Wypełnienie', price: 'od 220 zł', desc: 'Kompozyt światłoutwardzalny.', icon: <Zap /> }
            ].map((p, i) => (
              <motion.div key={`price-item-${i}`} {...fadeInUp} className="p-12 rounded-[3.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl transition-all">
                <div className="text-blue-600 mb-8">{p.icon}</div>
                <h3 className="text-xl font-black uppercase mb-2 text-slate-900">{p.title}</h3>
                <p className="text-slate-500 text-xs font-medium mb-8 leading-relaxed">{p.desc}</p>
                <div className="pt-6 border-t border-slate-200">
                  <p className="text-3xl font-black text-blue-600">{p.price}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* PRZYCISK DO PEŁNEGO CENNIKA */}
          <motion.div {...fadeInUp} className="mt-20 text-center">
            <Link href="/auth">
              <button className="group relative inline-flex items-center gap-4 px-12 py-6 bg-slate-900 hover:bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-2xl hover:shadow-blue-600/20 active:scale-95">
                Sprawdź pełny cennik usług
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </button>
            </Link>
            <p className="mt-6 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              Zaloguj się do panelu pacjenta, aby zobaczyć ofertę wszystkich lekarzy
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== KONTAKT ===== */}
      <section id="kontakt" className="py-40 bg-slate-50 text-center md:text-left">
        <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-6xl font-black tracking-tighter uppercase mb-12 leading-tight text-slate-900">Klinika w <br/> <span className="text-blue-600">Sercu Warszawy</span></h2>
            <div className="space-y-8">
              <div className="flex items-center gap-6 justify-center md:justify-start">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600"><MapPin /></div>
                <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Nasza lokalizacja</p><p className="font-bold text-slate-900">ul. Puławska 405A, Warszawa</p></div>
              </div>
              <a href="tel:+48777888999" className="flex items-center gap-6 group cursor-pointer justify-center md:justify-start">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Phone /></div>
                <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Zadzwoń do nas</p><p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">+48 777 888 999</p></div>
              </a>
              <a href="mailto:kontakt@dentica.pl" className="flex items-center gap-6 group cursor-pointer justify-center md:justify-start">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Mail /></div>
                <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Napisz wiadomość</p><p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">kontakt@dentica.pl</p></div>
              </a>
              <div className="flex items-center gap-6 justify-center md:justify-start">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 group-hover:rotate-12 transition-transform"><Clock /></div>
                <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Godziny pracy</p><p className="font-bold text-slate-900 tracking-tight uppercase">Pn - Pt: 08:00 - 20:00</p></div>
              </div>
            </div>
          </motion.div>
          <motion.div {...fadeInUp} className="h-[600px] rounded-[4rem] overflow-hidden shadow-2xl border-[16px] border-white relative grayscale hover:grayscale-0 transition-all duration-700">
             <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2446.541164998083!2d21.018991277156947!3d52.179043271973645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471932d966213793%3A0x6b44565750d7554e!2sPu%C5%82awska%20405A%2C%2002-801%20Warszawa!5e0!3m2!1spl!2spl!4v1711200000000!5m2!1spl!2spl" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="Mapa dojazdu Dentica"></iframe>
          </motion.div>
        </div>
      </section>

      {/* ===== STOPKA ===== */}
      <footer className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3 group">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
               <ToothIcon className="text-white w-5 h-5" />
             </div>
             <span className="text-xl font-black tracking-tighter uppercase text-slate-900">Dentica</span>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">© {new Date().getFullYear()} Dentica Medical. Wszystkie prawa zastrzeżone.</p>
          <div className="flex gap-10 text-[9px] font-black uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-blue-600 transition-colors">Prywatność</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Regulamin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}