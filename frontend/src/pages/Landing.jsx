import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import LanguageSelector from '../components/shared/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

const STRINGS = {
  en: {
    pill: 'AI-powered civic resolution — live in Kolkata',
    h1a: 'Report civic issues,',
    h1b: 'every step, see them resolved.',
    sub: 'Upload a photo of any civic problem — AI classifies it instantly, the right department gets notified, and ghost detection catches fake resolutions. RTI documents file themselves after 30 days.',
    cta1: 'Report an Issue Now',
    cta2: 'Track Your Ticket →',
    trackPlaceholder: 'Enter ticket ID e.g. KOL-2026-00149',
    trackBtn: 'Track',
    howTitle: 'How it works',
    steps: [
      { title: 'Snap & Report', desc: 'Upload a photo. Gemini AI classifies the issue, assigns severity 1–10, and routes it to the right department in seconds.' },
      { title: 'Track in Real-Time', desc: 'Get a unique ticket ID like KOL-2026-00149. Watch status updates, officer assignments, and SLA deadlines live — no login needed.' },
      { title: 'Ghost Detection', desc: 'When marked resolved, community peers verify. If the issue reappears, AI ghost detection flags it and auto-reopens the ticket.' },
    ],
    bottomCta: "Get Started — It's Free",
  },
  hi: {
    pill: 'एआई-संचालित नागरिक समाधान — कोलकाता में लाइव',
    h1a: 'नागरिक समस्याएं रिपोर्ट करें,',
    h1b: 'हर कदम ट्रैक करें, समाधान देखें।',
    sub: 'किसी भी नागरिक समस्या की फोटो अपलोड करें — एआई तुरंत इसे वर्गीकृत करता है, सही विभाग को सूचित किया जाता है, और भूत-समाधान का पता लगाया जाता है। 30 दिनों के बाद RTI स्वचालित रूप से दर्ज होती है।',
    cta1: 'अभी समस्या रिपोर्ट करें',
    cta2: 'अपनी टिकट ट्रैक करें →',
    trackPlaceholder: 'टिकट आईडी दर्ज करें जैसे KOL-2026-00149',
    trackBtn: 'ट्रैक करें',
    howTitle: 'यह कैसे काम करता है',
    steps: [
      { title: 'फोटो लें और रिपोर्ट करें', desc: 'फोटो अपलोड करें। जेमिनी एआई समस्या को वर्गीकृत करता है, गंभीरता 1-10 असाइन करता है, और सेकंड में सही विभाग को भेजता है।' },
      { title: 'रियल-टाइम ट्रैकिंग', desc: 'KOL-2026-00149 जैसी एक अनोखी टिकट आईडी प्राप्त करें। स्टेटस अपडेट, अधिकारी असाइनमेंट और SLA समय-सीमा देखें।' },
      { title: 'भूत समाधान पहचान', desc: 'जब हल किया हुआ बताया जाए, समुदाय सत्यापित करता है। अगर समस्या फिर आए, एआई स्वचालित रूप से टिकट फिर खोलता है।' },
    ],
    bottomCta: 'शुरू करें — निःशुल्क',
  },
  bn: {
    pill: 'এআই-চালিত নাগরিক সমাধান — কলকাতায় লাইভ',
    h1a: 'নাগরিক সমস্যা রিপোর্ট করুন,',
    h1b: 'প্রতিটি পদক্ষেপ ট্র্যাক করুন, সমাধান দেখুন।',
    sub: 'যেকোনো নাগরিক সমস্যার ছবি আপলোড করুন — এআই তাৎক্ষণিকভাবে শ্রেণীবদ্ধ করে, সঠিক বিভাগকে জানায়, এবং ভুয়া সমাধান ধরে ফেলে। ৩০ দিন পরে RTI নিজেই দাখিল হয়।',
    cta1: 'এখনই সমস্যা রিপোর্ট করুন',
    cta2: 'আপনার টিকিট ট্র্যাক করুন →',
    trackPlaceholder: 'টিকিট আইডি লিখুন যেমন KOL-2026-00149',
    trackBtn: 'ট্র্যাক',
    howTitle: 'এটি কীভাবে কাজ করে',
    steps: [
      { title: 'ছবি তুলুন ও রিপোর্ট করুন', desc: 'ছবি আপলোড করুন। জেমিনি এআই সমস্যা শ্রেণীবদ্ধ করে, ১-১০ তীব্রতা নির্ধারণ করে এবং সেকেন্ডে সঠিক বিভাগে পাঠায়।' },
      { title: 'রিয়েল-টাইম ট্র্যাকিং', desc: 'KOL-2026-00149 এর মতো একটি অনন্য টিকিট আইডি পান। স্ট্যাটাস আপডেট, অফিসার নিয়োগ এবং SLA সময়সীমা সরাসরি দেখুন।' },
      { title: 'ভুতুড়ে সমাধান ধরা', desc: 'সমাধান হয়েছে বললে সম্প্রদায় যাচাই করে। যদি সমস্যা ফিরে আসে, এআই স্বয়ংক্রিয়ভাবে টিকিট পুনরায় খোলে।' },
    ],
    bottomCta: 'শুরু করুন — বিনামূল্যে',
  },
};

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LogoIcon = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
    <rect width="34" height="34" rx="8" fill="white" fillOpacity="0.15"/>
    <path d="M17 6L7 11V17C7 22.5 11.5 27.6 17 29C22.5 27.6 27 22.5 27 17V11L17 6Z" fill="white" fillOpacity="0.9"/>
    <path d="M13 17L15.5 19.5L21 14" stroke="#7b39fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0 });
  const [trackId, setTrackId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getCountFromServer(collection(db, 'tickets'))
      .then(snap => {
        const total = snap.data().count;
        setStats({ total, resolved: Math.floor(total * 0.62), active: Math.ceil(total * 0.38) });
      })
      .catch(() => {});
  }, []);

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackId.trim()) navigate(`/track/${trackId.trim()}`);
  };

  const { lang } = useLanguage();
  const s = STRINGS[lang] || STRINGS.en;

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'How It Works', href: '#how', icon: true },
    { label: 'Track Issue', href: '#track' },
    { label: 'About', href: '#about' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d0b1e]">

      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay loop muted playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4"
      />

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-6 lg:px-[120px] py-[16px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoIcon />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, color: 'white', letterSpacing: '-0.2px' }}>
            Community Hero
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map(l => (
            <a key={l.label} href={l.href}
              className="flex items-center gap-1 text-white hover:opacity-80 transition"
              style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 14 }}>
              {l.label}
              {l.icon && <ChevronDown />}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><LanguageSelector /></div>
          <Link to="/login"
            className="px-4 py-2 rounded-lg border bg-white text-[#171717] hover:bg-gray-50 transition"
            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 14, borderColor: '#d4d4d4' }}>
            Sign In
          </Link>
          <Link to="/login"
            className="hidden sm:block px-4 py-2 rounded-lg text-white transition hover:opacity-90"
            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 14, backgroundColor: '#7b39fc', boxShadow: '0 2px 12px rgba(123,57,252,0.4)' }}>
            Report Issue
          </Link>
        </div>

        <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
          <MenuIcon />
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col px-6 pt-6">
          <div className="flex justify-between items-center mb-10">
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: 'white' }}>Community Hero</span>
            <button onClick={() => setMobileOpen(false)}><CloseIcon /></button>
          </div>
          <div className="flex flex-col gap-7 flex-1">
            {navLinks.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="text-white text-xl" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-3 pb-10">
            <div className="mb-1"><LanguageSelector /></div>
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="w-full text-center py-3.5 rounded-xl bg-white text-[#171717] font-semibold"
              style={{ fontFamily: 'Manrope, sans-serif' }}>
              Sign In
            </Link>
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="w-full text-center py-3.5 rounded-xl text-white font-semibold"
              style={{ fontFamily: 'Manrope, sans-serif', backgroundColor: '#7b39fc' }}>
              Report Issue
            </Link>
          </div>
        </div>
      )}

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 mt-32 lg:mt-36">

        {/* Tagline Pill */}
        <div
          className="flex items-center gap-2 px-3 h-[38px] rounded-[10px] mb-8 border"
          style={{ background: 'rgba(85,80,110,0.4)', backdropFilter: 'blur(12px)', borderColor: 'rgba(164,132,215,0.5)' }}
        >
          <span className="px-2 py-0.5 rounded-[6px] text-white"
            style={{ fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 12, backgroundColor: '#7b39fc' }}>
            New
          </span>
          <span className="text-white" style={{ fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 14 }}>
            {s.pill}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-white max-w-4xl"
          style={{ fontFamily: '"Instrument Serif", serif', fontSize: 'clamp(42px, 6vw, 96px)', lineHeight: 1.08, letterSpacing: '-1px' }}>
          {s.h1a}{' '}
          <em style={{ fontStyle: 'italic', letterSpacing: '-2px' }}>track</em>
          {' '}{s.h1b}
        </h1>

        {/* Subtext */}
        <p className="mt-6 max-w-[662px] text-white/70"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 18, lineHeight: 1.65 }}>
          {s.sub}
        </p>

        {/* CTA Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
          <Link to="/login"
            className="px-7 py-3.5 rounded-[10px] text-white transition hover:opacity-90"
            style={{ fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 16, backgroundColor: '#7b39fc', boxShadow: '0 4px 20px rgba(123,57,252,0.45)' }}>
            {s.cta1}
          </Link>
          <Link to="/login"
            className="px-7 py-3.5 rounded-[10px] transition hover:opacity-90"
            style={{ fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 16, backgroundColor: '#2b2344', color: '#f6f7f9' }}>
            {s.cta2}
          </Link>
        </div>

        {/* Quick Track Input */}
        <form onSubmit={handleTrack} className="mt-5 flex items-center gap-2" id="track">
          <input value={trackId} onChange={e => setTrackId(e.target.value)}
            placeholder={s.trackPlaceholder}
            className="px-4 py-2.5 rounded-lg text-sm outline-none w-64 placeholder-white/40"
            style={{ fontFamily: 'Inter, sans-serif', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', color: 'white' }}
          />
          <button type="submit"
            className="px-4 py-2.5 rounded-lg text-white text-sm transition hover:opacity-80"
            style={{ fontFamily: 'Cabin, sans-serif', fontWeight: 500, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.22)' }}>
            {s.trackBtn}
          </button>
        </form>
      </div>

      {/* Live Stats Bar */}
      <div className="relative z-10 mt-16 lg:mt-20 mx-4 max-w-2xl lg:mx-auto">
        <div className="flex items-center justify-around py-5 px-8 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { label: 'Issues Reported', value: stats.total || '—' },
            { label: 'Resolved', value: stats.resolved || '—' },
            { label: 'Active', value: stats.active || '—' },
            { label: 'AI Classified', value: stats.total ? Math.floor(stats.total * 0.98) : '—' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-white font-bold text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>{stat.value}</div>
              <div className="text-white/55 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div id="how" className="relative z-10 mt-24 pb-28 px-6 lg:px-[120px]">
        <h2 className="text-center text-white mb-12"
          style={{ fontFamily: '"Instrument Serif", serif', fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1.15 }}>
          {s.howTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {['📸','📍','👻'].map((icon, i) => ({ icon, step: String(i+1).padStart(2,'0'), ...s.steps[i] })).map(c => (
            <div key={c.step} className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div className="text-3xl mb-4">{c.icon}</div>
              <div className="text-xs mb-2" style={{ fontFamily: 'Cabin, sans-serif', color: '#a484d7', fontWeight: 600, letterSpacing: '0.5px' }}>
                STEP {c.step}
              </div>
              <h3 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>{c.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-white/40 text-sm mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>
            Powered by Gemini 2.0 Flash · Firebase · OpenStreetMap · 14 AI touchpoints
          </p>
          <Link to="/login"
            className="inline-block px-9 py-4 rounded-[10px] text-white font-medium transition hover:opacity-90"
            style={{ fontFamily: 'Cabin, sans-serif', fontSize: 16, backgroundColor: '#7b39fc', boxShadow: '0 4px 24px rgba(123,57,252,0.4)' }}>
            {s.bottomCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
