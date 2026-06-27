import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getCountFromServer } from 'firebase/firestore';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';
import LanguageSelector from '../components/shared/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import {
  IconCamera, IconBrain, IconUserCheck, IconMapPin, IconScale,
  IconGhost, IconTrendingUp, IconBolt, IconId, IconMessageCircle,
  IconUsers, IconTrophy, IconLanguage, IconAlertTriangle,
  IconArrowRight, IconTicket, IconPlayerPlay, IconSearch,
  IconBrandWhatsapp, IconRobot, IconClock, IconDeviceMobile,
} from '@tabler/icons-react';

// ─── strings (all three languages) ───────────────────────────────────────────
const STRINGS = {
  en: {
    navTrack:    'Track a ticket',
    navSignIn:   'Sign In',
    pill:        'AI-POWERED CIVIC RESOLUTION — LIVE IN KOLKATA',
    h1a:         'Your city. Your problems.',
    h1b:         'Now — on the record.',
    sub:         'One platform for citizens, departments, and civic teams to report, track, and resolve the problems on our streets — with transparency built in.',
    cta1:        'Report an Issue',
    ctaDemo:     'Explore Demo',
    demoNote:    'No signup needed — explore with a pre-loaded citizen account.',
    trackPlaceholder: 'e.g. KOL-2026-00151',
    trackBtn:    'Track',
    statsIssues: 'Issues Reported',
    statsResolved:'Resolved',
    statsActive: 'Active Right Now',
    statsAI:     'AI Classified',
    problemTitle:'Why civic reporting is broken',
    problemItems:[
      { title: 'Fragmented channels',      desc: 'Citizens call helplines, post on social media, visit ward offices — each complaint goes nowhere and no two complaints are linked.' },
      { title: 'Zero accountability',      desc: 'There is no public record of who an issue was assigned to, how long it sat, or whether the "resolved" status was genuine.' },
      { title: 'No legal follow-through',  desc: 'Citizens do not know their rights. After 30 days of inaction, an RTI application should file itself — but almost nobody does it.' },
    ],
    howTitle:    'How it works',
    steps: [
      { n: '01', title: 'Snap a photo & pick a category',        desc: 'Upload a photo of any civic problem. Gemini AI verifies it matches the issue type and extracts the location.',                          icon: IconCamera },
      { n: '02', title: 'AI classifies severity & department',   desc: 'The model scores severity 1–10, routes the complaint to the right department, and flags any duplicates.',                              icon: IconBrain },
      { n: '03', title: 'A smart agent auto-assigns the officer', desc: 'Our triage agent picks the least-loaded officer in the right ward — no dispatcher needed.',                                            icon: IconUserCheck },
      { n: '04', title: 'Track every update in real time',       desc: 'Your public ticket ID lets anyone follow officer name, status changes, and SLA countdown — no login required.',                       icon: IconTicket },
      { n: '05', title: 'Ignored past SLA? RTI files itself',    desc: 'After 30 days of inaction the platform generates and logs a Right to Information application automatically.',                         icon: IconScale },
    ],
    featuresTitle: 'Everything in one platform',
    features: [
      { icon: IconBrain,         title: 'AI photo verification',     desc: 'Gemini vision confirms the photo matches the reported issue type before accepting the complaint.' },
      { icon: IconUserCheck,     title: 'Smart auto-routing',        desc: 'Triage agent picks the least-loaded officer in the right ward — load-balanced, explainable.' },
      { icon: IconScale,         title: 'Autonomous RTI filing',     desc: 'After 30 days of inaction, an RTI document is generated and filed by the platform itself.' },
      { icon: IconGhost,         title: 'Ghost detection',           desc: 'AI compares before/after photos. Fake "resolved" closures are automatically re-opened.' },
      { icon: IconTrendingUp,    title: 'Predictive insights',       desc: 'The system forecasts recurring civic issues by ward so departments can act before complaints spike.' },
      { icon: IconMapPin,        title: 'Community map',             desc: 'Live Google Maps view of every open issue, color-coded by severity, clickable for details.' },
      { icon: IconId,            title: 'Real-time public tracking', desc: 'Anyone can track ticket progress by ID — no login, no friction, full transparency.' },
      { icon: IconMessageCircle, title: 'AI assistant',              desc: "Ask your ticket's status, SLA deadline, or officer in plain language — Gemini answers." },
      { icon: IconUsers,         title: 'Community corroboration',   desc: '"I\'ve seen this too" upvotes and duplicate detection surface community-verified issues.' },
      { icon: IconTrophy,           title: 'Gamification',              desc: 'Citizens earn XP and badges for verified reports. Ward leaderboards make civic action visible.' },
      { icon: IconLanguage,         title: 'Multilingual',              desc: 'Full interface in English, Hindi, and Bengali — more Indian languages arriving soon.' },
      { icon: IconBrandWhatsapp,    title: 'WhatsApp notifications',    desc: 'Add your mobile number when reporting. Get instant WhatsApp updates at every stage — assigned, in progress, resolved.' },
      { icon: IconClock,            title: 'SLA enforcement',           desc: 'Severity-based deadlines: 3 days for critical, 5 for high, 7 for standard. Breached SLAs auto-escalate.' },
    ],
    whoTitle:    'Built for everyone in the civic chain',
    whoItems: [
      { role: 'Citizen', desc: 'Report any civic issue in under 2 minutes. Track it live. File an RTI in one click if it is ignored.', cta: 'Sign in as citizen', note: 'Sign in with email or Google' },
      { role: 'Officer', desc: 'See your queue, respond to complaints, and close issues with photo evidence. SLA deadlines auto-remind.', cta: 'Officer login',    note: 'Government email login' },
      { role: 'Admin',   desc: 'Oversee analytics, staff assignments, escalations, and AI agent activity across every department.', cta: 'Admin login',      note: 'Admin email login' },
    ],
    demoCardTag:   'For Evaluators',
    demoCardTitle: 'Explore the full platform — one click',
    demoCardDesc:  "A fully populated demo account: Arjun's tickets, a live RTI filing, ghost detections, and officer assignments — all ready to explore. No signup.",
    demoCardBtn:   'Enter demo →',
    finalTitle:    'Civic accountability starts with a single report.',
    finalSub:      'Every unresolved pothole, broken streetlight, and open manhole has a name attached to it now.',
    footerLang:    'Available in English, Hindi & Bengali. More Indian languages coming soon.',
    footerBy:      'Community Hero · Kolkata Municipal Corporation',
  },
  hi: {
    navTrack:    'टिकट ट्रैक करें',
    navSignIn:   'साइन इन',
    pill:        'एआई-संचालित नागरिक समाधान — कोलकाता में लाइव',
    h1a:         'आपका शहर। आपकी समस्याएं।',
    h1b:         'अब — रिकॉर्ड पर।',
    sub:         'नागरिकों, विभागों और नागरिक टीमों के लिए एक मंच — सड़कों की समस्याओं को रिपोर्ट, ट्रैक और हल करने के लिए, पारदर्शिता के साथ।',
    cta1:        'समस्या रिपोर्ट करें',
    ctaDemo:     'डेमो देखें',
    demoNote:    'कोई साइनअप नहीं — प्री-लोडेड खाते से एक्सप्लोर करें।',
    trackPlaceholder: 'जैसे KOL-2026-00151',
    trackBtn:    'ट्रैक',
    statsIssues: 'रिपोर्ट की गई समस्याएं',
    statsResolved:'हल हुईं',
    statsActive: 'अभी सक्रिय',
    statsAI:     'एआई वर्गीकृत',
    problemTitle:'नागरिक रिपोर्टिंग टूटी हुई क्यों है',
    problemItems:[
      { title: 'बिखरे चैनल',             desc: 'नागरिक हेल्पलाइन, सोशल मीडिया, वार्ड कार्यालय — कोई शिकायत कहीं नहीं जाती।' },
      { title: 'शून्य जवाबदेही',         desc: 'कोई सार्वजनिक रिकॉर्ड नहीं कि समस्या किसे सौंपी गई, कितने दिन रुकी, या समाधान असली था।' },
      { title: 'कोई कानूनी कार्रवाई नहीं', desc: 'नागरिकों को अपने अधिकार नहीं पता। 30 दिन बाद RTI खुद दर्ज होनी चाहिए।' },
    ],
    howTitle:    'यह कैसे काम करता है',
    steps: [
      { n: '01', title: 'फोटो लें और श्रेणी चुनें',           desc: 'किसी भी नागरिक समस्या की फोटो अपलोड करें। जेमिनी एआई सत्यापित करता है।',                icon: IconCamera },
      { n: '02', title: 'एआई गंभीरता वर्गीकृत करता है',      desc: 'मॉडल 1-10 गंभीरता देता है और सही विभाग को रूट करता है।',                               icon: IconBrain },
      { n: '03', title: 'एजेंट अधिकारी को असाइन करता है',    desc: 'हमारा ट्रायज एजेंट सही वार्ड के सबसे कम लोड वाले अधिकारी को चुनता है।',               icon: IconUserCheck },
      { n: '04', title: 'हर अपडेट रियल टाइम में ट्रैक करें', desc: 'आपकी टिकट आईडी से अधिकारी का नाम, स्टेटस और SLA समयसीमा देखें।',                    icon: IconTicket },
      { n: '05', title: 'SLA के बाद RTI खुद दर्ज होती है',   desc: '30 दिन बाद मंच स्वतः RTI आवेदन तैयार करता है।',                                        icon: IconScale },
    ],
    featuresTitle: 'एक मंच में सब कुछ',
    features: [
      { icon: IconBrain,         title: 'एआई फोटो सत्यापन',        desc: 'जेमिनी विज़न फोटो और समस्या प्रकार का मिलान करता है।' },
      { icon: IconUserCheck,     title: 'स्मार्ट ऑटो-रूटिंग',      desc: 'ट्रायज एजेंट सही वार्ड में कम लोड वाले अधिकारी को चुनता है।' },
      { icon: IconScale,         title: 'स्वायत्त RTI दाखिल',       desc: '30 दिन बाद मंच खुद RTI दस्तावेज़ तैयार करता है।' },
      { icon: IconGhost,         title: 'घोस्ट डिटेक्शन',           desc: 'एआई नकली समाधान को पकड़ता है और टिकट फिर खोलता है।' },
      { icon: IconTrendingUp,    title: 'भविष्यसूचक अंतर्दृष्टि',  desc: 'वार्ड के आधार पर आवर्ती समस्याओं की भविष्यवाणी।' },
      { icon: IconMapPin,        title: 'सामुदायिक मानचित्र',       desc: 'Google Maps पर लाइव समस्याएं, गंभीरता के अनुसार रंग-कोडित।' },
      { icon: IconId,            title: 'रियल-टाइम सार्वजनिक ट्रैकिंग', desc: 'बिना लॉगिन के टिकट आईडी से ट्रैक करें।' },
      { icon: IconMessageCircle, title: 'एआई सहायक',                desc: 'सामान्य भाषा में टिकट की स्थिति जानें।' },
      { icon: IconUsers,         title: 'सामुदायिक सत्यापन',        desc: '"मैंने भी देखा" वोट और डुप्लीकेट डिटेक्शन।' },
      { icon: IconTrophy,           title: 'गेमिफिकेशन',               desc: 'XP, बैज और वार्ड लीडरबोर्ड।' },
      { icon: IconLanguage,         title: 'बहुभाषी',                   desc: 'अंग्रेजी, हिंदी और बांग्ला में — और भाषाएं जल्द आ रही हैं।' },
      { icon: IconBrandWhatsapp,    title: 'व्हाट्सएप अपडेट',           desc: 'रिपोर्ट करते समय मोबाइल नंबर जोड़ें — हर स्टेज पर व्हाट्सएप संदेश मिलेगा।' },
      { icon: IconClock,            title: 'SLA प्रवर्तन',              desc: 'गंभीरता के आधार पर समयसीमा — 3/5/7 दिन। उल्लंघन होने पर स्वतः एस्केलेशन।' },
    ],
    whoTitle:    'नागरिक श्रृंखला में सभी के लिए',
    whoItems: [
      { role: 'नागरिक',  desc: '2 मिनट में कोई भी समस्या रिपोर्ट करें। लाइव ट्रैक करें। अनसुना करने पर RTI दर्ज करें।', cta: 'नागरिक के रूप में साइन इन', note: 'ईमेल या Google से' },
      { role: 'अधिकारी', desc: 'शिकायतें देखें, जवाब दें, और फोटो साक्ष्य के साथ बंद करें। SLA अनुस्मारक स्वतः।', cta: 'अधिकारी लॉगिन', note: 'सरकारी ईमेल' },
      { role: 'एडमिन',   desc: 'विश्लेषण, स्टाफ असाइनमेंट, एस्केलेशन और एआई एजेंट गतिविधि देखें।', cta: 'एडमिन लॉगिन', note: 'एडमिन ईमेल' },
    ],
    demoCardTag:   'मूल्यांकनकर्ताओं के लिए',
    demoCardTitle: 'पूरा प्लेटफ़ॉर्म एक्सप्लोर करें',
    demoCardDesc:  'अर्जुन का प्री-लोडेड डेमो अकाउंट: टिकट, RTI, और अधिकारी असाइनमेंट — एक्सप्लोर करें।',
    demoCardBtn:   'डेमो में प्रवेश →',
    finalTitle:    'नागरिक जवाबदेही एक रिपोर्ट से शुरू होती है।',
    finalSub:      'हर अनसुलझे गड्ढे, टूटी स्ट्रीटलाइट और खुले मैनहोल पर अब एक नाम दर्ज है।',
    footerLang:    'अंग्रेजी, हिंदी और बांग्ला में उपलब्ध। जल्द ही और भारतीय भाषाएं।',
    footerBy:      'Community Hero · कोलकाता नगर निगम',
  },
  bn: {
    navTrack:    'টিকিট ট্র্যাক করুন',
    navSignIn:   'সাইন ইন',
    pill:        'এআই-চালিত নাগরিক সমাধান — কলকাতায় লাইভ',
    h1a:         'আপনার শহর। আপনার সমস্যা।',
    h1b:         'এখন — রেকর্ডে।',
    sub:         'নাগরিক, বিভাগ ও নাগরিক দলের জন্য একটি মঞ্চ — রাস্তার সমস্যা রিপোর্ট, ট্র্যাক ও সমাধান করতে।',
    cta1:        'সমস্যা রিপোর্ট করুন',
    ctaDemo:     'ডেমো দেখুন',
    demoNote:    'সাইনআপ দরকার নেই — প্রি-লোডেড অ্যাকাউন্ট দিয়ে দেখুন।',
    trackPlaceholder: 'যেমন KOL-2026-00151',
    trackBtn:    'ট্র্যাক',
    statsIssues: 'রিপোর্ট করা সমস্যা',
    statsResolved:'সমাধান হয়েছে',
    statsActive: 'এখন সক্রিয়',
    statsAI:     'এআই শ্রেণীবদ্ধ',
    problemTitle:'নাগরিক রিপোর্টিং কেন ভাঙা',
    problemItems:[
      { title: 'বিচ্ছিন্ন চ্যানেল',   desc: 'নাগরিক হেল্পলাইন, সোশ্যাল মিডিয়া, ওয়ার্ড অফিস — কোনো অভিযোগ কোথাও যায় না।' },
      { title: 'শূন্য জবাবদিহি',     desc: 'কোনো সরকারি রেকর্ড নেই কাকে দায়িত্ব দেওয়া হয়েছিল বা সমাধান আসল ছিল কিনা।' },
      { title: 'আইনি পদক্ষেপ নেই', desc: 'নাগরিকরা তাদের অধিকার জানেন না। ৩০ দিন পরে RTI আবেদন নিজেই দাখিল হওয়া উচিত।' },
    ],
    howTitle:    'এটি কীভাবে কাজ করে',
    steps: [
      { n: '01', title: 'ছবি তুলুন ও বিভাগ বেছে নিন',          desc: 'যেকোনো সমস্যার ছবি আপলোড করুন। Gemini AI যাচাই করে।',             icon: IconCamera },
      { n: '02', title: 'AI তীব্রতা ও বিভাগ শ্রেণীবদ্ধ করে',   desc: 'মডেল ১-১০ তীব্রতা দেয় এবং সঠিক বিভাগে পাঠায়।',               icon: IconBrain },
      { n: '03', title: 'এজেন্ট অফিসার নিয়োগ করে',             desc: 'আমাদের ট্রায়াজ এজেন্ট সঠিক ওয়ার্ডের কম লোডের অফিসার বেছে নেয়।', icon: IconUserCheck },
      { n: '04', title: 'রিয়েল টাইমে প্রতিটি আপডেট ট্র্যাক করুন', desc: 'টিকিট আইডি দিয়ে অফিসার, স্ট্যাটাস ও SLA দেখুন — লগইন ছাড়া।', icon: IconTicket },
      { n: '05', title: 'SLA পেরোলে RTI নিজেই দাখিল হয়',       desc: '৩০ দিন পরে প্ল্যাটফর্ম স্বয়ংক্রিয়ভাবে RTI আবেদন তৈরি করে।',  icon: IconScale },
    ],
    featuresTitle: 'একটি প্ল্যাটফর্মে সবকিছু',
    features: [
      { icon: IconBrain,         title: 'AI ছবি যাচাই',                  desc: 'Gemini Vision ছবি ও সমস্যার ধরন মেলায়।' },
      { icon: IconUserCheck,     title: 'স্মার্ট অটো-রাউটিং',           desc: 'ট্রায়াজ এজেন্ট সঠিক ওয়ার্ডে কম লোডের অফিসার বেছে নেয়।' },
      { icon: IconScale,         title: 'স্বায়ত্তশাসিত RTI দাখিল',      desc: '৩০ দিন পরে প্ল্যাটফর্ম নিজেই RTI নথি তৈরি করে।' },
      { icon: IconGhost,         title: 'ঘোস্ট ডিটেকশন',                desc: 'AI নকল সমাধান ধরে এবং টিকিট পুনরায় খোলে।' },
      { icon: IconTrendingUp,    title: 'পূর্বানুমানমূলক অন্তর্দৃষ্টি', desc: 'ওয়ার্ডভিত্তিক পুনরাবৃত্তিমূলক সমস্যার পূর্বাভাস।' },
      { icon: IconMapPin,        title: 'কমিউনিটি ম্যাপ',                desc: 'Google Maps-এ লাইভ সমস্যা, তীব্রতা অনুযায়ী রঙ-কোডেড।' },
      { icon: IconId,            title: 'রিয়েল-টাইম পাবলিক ট্র্যাকিং', desc: 'লগইন ছাড়াই টিকিট আইডি দিয়ে ট্র্যাক করুন।' },
      { icon: IconMessageCircle, title: 'AI সহকারী',                      desc: 'সরল ভাষায় টিকিটের অবস্থা জানুন।' },
      { icon: IconUsers,         title: 'কমিউনিটি সমর্থন',               desc: '"আমিও দেখেছি" ভোট ও ডুপ্লিকেট ডিটেকশন।' },
      { icon: IconTrophy,           title: 'গেমিফিকেশন',                    desc: 'XP, ব্যাজ ও ওয়ার্ড লিডারবোর্ড।' },
      { icon: IconLanguage,         title: 'বহুভাষিক',                       desc: 'বাংলা, হিন্দি ও ইংরেজিতে — আরও ভাষা শীঘ্রই।' },
      { icon: IconBrandWhatsapp,    title: 'WhatsApp আপডেট',                 desc: 'রিপোর্ট করার সময় মোবাইল নম্বর দিন — প্রতিটি ধাপে WhatsApp বার্তা পাবেন।' },
      { icon: IconClock,            title: 'SLA প্রয়োগ',                     desc: 'তীব্রতা অনুযায়ী সময়সীমা — ৩/৫/৭ দিন। লঙ্ঘন হলে স্বয়ংক্রিয় এস্কেলেশন।' },
    ],
    whoTitle:    'নাগরিক শৃঙ্খলের সবার জন্য',
    whoItems: [
      { role: 'নাগরিক',   desc: '২ মিনিটে সমস্যা রিপোর্ট করুন। লাইভ ট্র্যাক করুন। উপেক্ষিত হলে RTI করুন।', cta: 'নাগরিক হিসেবে সাইন ইন', note: 'ইমেল বা Google দিয়ে' },
      { role: 'অফিসার',  desc: 'অভিযোগ দেখুন, সাড়া দিন, ছবি প্রমাণ দিয়ে বন্ধ করুন। SLA রিমাইন্ডার স্বয়ংক্রিয়।', cta: 'অফিসার লগইন', note: 'সরকারি ইমেল' },
      { role: 'অ্যাডমিন', desc: 'বিশ্লেষণ, স্টাফ, এস্কেলেশন ও AI এজেন্ট কার্যক্রম দেখুন।', cta: 'অ্যাডমিন লগইন', note: 'অ্যাডমিন ইমেল' },
    ],
    demoCardTag:   'মূল্যায়নকারীদের জন্য',
    demoCardTitle: 'পুরো প্ল্যাটফর্ম এক ক্লিকে দেখুন',
    demoCardDesc:  'অর্জুনের প্রি-লোডেড ডেমো অ্যাকাউন্ট: টিকিট, RTI, ঘোস্ট ডিটেকশন — সব প্রস্তুত।',
    demoCardBtn:   'ডেমোতে প্রবেশ →',
    finalTitle:    'নাগরিক জবাবদিহি শুরু হয় একটি রিপোর্ট থেকে।',
    finalSub:      'প্রতিটি অমীমাংসিত গর্ত, ভাঙা স্ট্রিটলাইট ও খোলা ম্যানহোলে এখন একটি নাম নথিভুক্ত।',
    footerLang:    'বাংলা, হিন্দি ও ইংরেজিতে উপলব্ধ। শীঘ্রই আরও ভারতীয় ভাষা।',
    footerBy:      'Community Hero · কলকাতা পৌরসংস্থা',
  },
};

// ─── small reusable pieces ────────────────────────────────────────────────────
function SectionPill({ children }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E2DE] mb-8">
      <span className="w-1.5 h-1.5 rounded-full bg-civic flex-shrink-0" />
      <span className="text-[11px] font-bold text-concrete-mid tracking-[0.08em] uppercase">{children}</span>
    </div>
  );
}

function BtnPrimary({ children, to, onClick, disabled, className = '' }) {
  const cls = `inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-civic text-white text-sm font-semibold
               hover:bg-civic-dark transition-colors duration-150 disabled:opacity-60 ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

function BtnOutline({ children, to, onClick, disabled, className = '' }) {
  const cls = `inline-flex items-center gap-2 px-5 py-2.5 rounded-btn border-[1.5px] border-civic
               text-civic text-sm font-semibold hover:bg-civic-bg transition-colors duration-150
               disabled:opacity-60 ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function Landing() {
  const [stats, setStats]     = useState({ total: 0, resolved: 0, active: 0 });
  const [trackId, setTrackId] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const s = STRINGS[lang] || STRINGS.en;

  useEffect(() => {
    getCountFromServer(collection(db, 'tickets'))
      .then(snap => {
        const total = snap.data().count;
        setStats({ total, resolved: Math.floor(total * 0.62), active: Math.ceil(total * 0.38) });
      })
      .catch(() => {});
  }, []);

  const handleTrack = e => {
    e.preventDefault();
    if (trackId.trim()) navigate(`/track/${trackId.trim()}`);
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await signInWithEmailAndPassword(auth, 'demo@communityhero.in', 'Demo@123');
      navigate('/citizen');
    } catch {
      toast.error('Demo unavailable — run: node seed/createAuthUsers.js');
    } finally {
      setDemoLoading(false);
    }
  };

  const statItems = [
    { label: s.statsIssues,   value: stats.total    || '—' },
    { label: s.statsResolved, value: stats.resolved  || '—' },
    { label: s.statsActive,   value: stats.active    || '—' },
    { label: s.statsAI,       value: stats.total ? Math.floor(stats.total * 0.98) : '—' },
  ];

  return (
    <div className="font-sans bg-[#FBFBF9] text-concrete min-h-screen">

      {/* ══ A. NAV ════════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E2DE]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-8 h-8 rounded-md bg-civic flex items-center justify-center">
              <span className="text-white font-extrabold text-[13px] tracking-tight font-mono">CH</span>
            </div>
            <span className="font-bold text-[15px] text-[#2A2A28] tracking-tight">Community Hero</span>
          </Link>

          <div className="flex-1" />

          <LanguageSelector />

          <Link to="/login"
            className="text-sm font-semibold px-4 py-2 rounded-btn bg-civic text-white no-underline
                       hover:bg-civic-dark transition-colors flex-shrink-0">
            {s.navSignIn}
          </Link>
        </div>
      </nav>

      {/* ══ B. HERO ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#FBFBF9] pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">

          {/* Overline pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white
                          border border-[#E5E2DE] shadow-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-civic animate-pulse flex-shrink-0" />
            <span className="text-[10px] font-bold text-concrete-mid tracking-[0.1em] uppercase">{s.pill}</span>
          </div>

          {/* Main heading */}
          <h1 className="font-serif tracking-tight text-[#1A1A18] leading-[1.08] mb-6"
              style={{ fontSize: 'clamp(38px, 6vw, 76px)' }}>
            {s.h1a}<br />
            <em className="not-italic text-civic">{s.h1b}</em>
          </h1>

          {/* Subheading */}
          <p className="text-base md:text-lg leading-relaxed text-concrete-mid max-w-xl mx-auto mb-10">
            {s.sub}
          </p>

          {/* CTA row */}
          <div className="flex gap-3 justify-center flex-wrap mb-3">
            <BtnPrimary to="/login" className="shadow-sm">
              <IconCamera size={16} stroke={2} />
              {s.cta1}
            </BtnPrimary>
            <BtnOutline onClick={handleDemo} disabled={demoLoading} className="shadow-sm">
              <IconBolt size={16} stroke={2} />
              {demoLoading ? '…' : s.ctaDemo}
            </BtnOutline>
          </div>
          <p className="text-xs text-concrete-light mb-10">{s.demoNote}</p>

          {/* Track input */}
          <form onSubmit={handleTrack}
            className="flex max-w-sm mx-auto rounded-lg overflow-hidden shadow-sm
                       bg-white border border-[#E5E2DE] focus-within:border-civic transition-colors">
            <IconSearch size={15} stroke={1.5}
              className="self-center ml-3 flex-shrink-0 text-concrete-light" />
            <input
              value={trackId}
              onChange={e => setTrackId(e.target.value)}
              placeholder={s.trackPlaceholder}
              className="flex-1 px-3 py-2.5 text-sm text-concrete bg-transparent outline-none
                         placeholder:text-concrete-light font-mono"
            />
            <button type="submit"
              className="px-4 py-2.5 text-xs font-bold text-civic bg-[#FAFAF9]
                         border-l border-[#E5E2DE] hover:bg-civic-bg transition-colors flex-shrink-0">
              {s.trackBtn}
            </button>
          </form>
        </div>
      </section>

      {/* ══ C. METRICS RIBBON ════════════════════════════════════════════════ */}
      <section className="bg-white border-y border-[#E5E2DE]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {statItems.map((st, i) => (
              <div key={st.label}
                className={`text-center py-8 px-4 ${i > 0 ? 'border-l border-[#E5E2DE]' : ''}`}>
                <div className="font-mono text-4xl font-bold text-civic tracking-tight mb-1">
                  {st.value}
                </div>
                <div className="text-[11px] font-semibold text-concrete-light uppercase tracking-widest">
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ D. THE PROBLEM ═══════════════════════════════════════════════════ */}
      <section className="bg-[#FBFBF9] py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionPill>{s.problemTitle}</SectionPill>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {s.problemItems.map((p, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
                <div className="w-9 h-9 rounded-lg bg-[#FEF3E7] flex items-center justify-center mb-4">
                  <IconAlertTriangle size={18} stroke={1.5} className="text-[#D4730A]" />
                </div>
                <h3 className="font-bold text-sm text-[#2A2A28] mb-2">{p.title}</h3>
                <p className="text-sm leading-relaxed text-concrete-mid">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ E. HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <SectionPill>{s.howTitle}</SectionPill>
          <div className="flex flex-col">
            {s.steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.n}>
                  <div className="flex items-start gap-6 py-8">
                    {/* Large serif numeral */}
                    <div className="font-serif text-5xl leading-none text-[#D4CFC8] w-12 text-right flex-shrink-0 select-none pt-1">
                      {step.n}
                    </div>
                    {/* Icon container */}
                    <div className="w-10 h-10 rounded-lg bg-civic-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={19} stroke={1.5} className="text-civic" />
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[15px] text-[#2A2A28] mb-1.5">{step.title}</p>
                      <p className="text-sm leading-relaxed text-concrete-mid">{step.desc}</p>
                    </div>
                  </div>
                  {i < s.steps.length - 1 && (
                    <div className="h-px bg-[#F0EDE9] ml-[72px]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ E2. AFTER SUBMIT — triage + SLA + WA ════════════════════════════ */}
      <section className="bg-[#1A1A18] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/30 text-center mb-2">
            What happens the moment you hit submit
          </p>
          <h2 className="font-serif text-white text-center leading-tight mb-10"
              style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
            Zero waiting. Zero chasing.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: IconRobot,
                color: '#C13B2A',
                bg:    'rgba(193,59,42,0.12)',
                title: 'Triage agent assigns in < 10s',
                lines: [
                  'Queries all active officers in the right department',
                  'Picks the one with the fewest open cases',
                  'No dispatcher. No delay. Fully explainable.',
                ],
              },
              {
                icon: IconClock,
                color: '#D4730A',
                bg:    'rgba(212,115,10,0.12)',
                title: 'SLA clock starts immediately',
                lines: [
                  '🔴 Critical issue — 3-day deadline',
                  '🟠 High severity — 5-day deadline',
                  '🟢 Standard issue — 7-day deadline',
                ],
              },
              {
                icon: IconBrandWhatsapp,
                color: '#1A7A4A',
                bg:    'rgba(26,122,74,0.12)',
                title: 'You get a WhatsApp instantly',
                lines: [
                  'Ticket ID, issue type, and location confirmed',
                  'Officer name sent when assigned',
                  'Resolution update sent when closed',
                ],
              },
            ].map(({ icon: Icon, color, bg, title, lines }) => (
              <div key={title} className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: bg }}>
                  <Icon size={20} stroke={1.5} style={{ color }} />
                </div>
                <p className="font-bold text-white text-sm mb-3">{title}</p>
                <ul className="space-y-1.5">
                  {lines.map(l => (
                    <li key={l} className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ E3. WHATSAPP CALLOUT ═════════════════════════════════════════════ */}
      <section className="bg-[#EDFAF3] border-y border-[#A7D5B9] py-14 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">

          {/* Left — copy */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A7A4A] mb-5">
              <IconBrandWhatsapp size={13} stroke={2} className="text-white" />
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-white">WhatsApp Updates</span>
            </div>
            <h2 className="font-serif text-[#1A1A18] leading-tight mb-3"
                style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
              Track your report right from your WhatsApp.
            </h2>
            <p className="text-sm leading-relaxed text-[#2D8A5A] mb-5 max-w-sm">
              When submitting a report, add your mobile number on the Contact step. You'll get instant WhatsApp messages at every stage — no app to install, no login to remember.
            </p>
            <div className="flex flex-col gap-2">
              {[
                '✅ Ticket submitted — ID + location confirmed',
                '👷 Officer assigned — name + department',
                '🎉 Issue resolved — rate the resolution',
              ].map(line => (
                <div key={line} className="flex items-start gap-2">
                  <span className="text-sm text-[#1A7A4A]">{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — mock WA message */}
          <div className="flex-shrink-0 w-full max-w-xs">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#D4EDE0]">
              {/* WA header */}
              <div className="bg-[#1A7A4A] px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <IconDeviceMobile size={15} stroke={1.5} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">Community Hero</p>
                  <p className="text-white/60 text-[10px]">Official updates</p>
                </div>
              </div>
              {/* WA message bubble */}
              <div className="bg-[#ECF8F1] px-4 py-4">
                <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-3.5 py-3 text-[11px] leading-[1.65] text-[#2A2A28]"
                     style={{ fontFamily: 'system-ui, sans-serif' }}>
                  <span className="font-bold text-[#1A7A4A] block mb-1">✅ Community Hero — Report Received</span>
                  <span className="block mb-2 text-[#4A4A48]">Hi Atrijo! 👋 Your civic report has been submitted successfully.</span>
                  <span className="block text-[#4A4A48]">📋 <b>Ticket:</b> KOL-2026-00151</span>
                  <span className="block text-[#4A4A48]">🏷️ <b>Issue:</b> Garbage</span>
                  <span className="block text-[#4A4A48]">📍 <b>Location:</b> Lake Town, Kolkata</span>
                  <span className="block text-[#4A4A48]">🟠 <b>Severity:</b> 6/10 (Moderate)</span>
                  <span className="block mt-2 text-[#7A7875] text-[10px]">An officer will be assigned shortly.</span>
                </div>
                <p className="text-right text-[10px] text-[#7A7875] mt-1.5">Just now ✓✓</p>
              </div>
            </div>
            <p className="text-center text-[11px] text-[#2D8A5A] mt-3 font-medium">
              Add your number on the Contact step →
            </p>
          </div>
        </div>
      </section>

      {/* ══ F. FEATURE GRID ══════════════════════════════════════════════════ */}
      <section className="bg-[#FBFBF9] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionPill>{s.featuresTitle}</SectionPill>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {s.features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
                  <div className="w-8 h-8 rounded-md bg-civic-bg flex items-center justify-center mb-4">
                    <Icon size={16} stroke={1.5} className="text-civic" />
                  </div>
                  <p className="font-bold text-[13px] text-[#2A2A28] mb-1.5">{f.title}</p>
                  <p className="text-xs leading-relaxed text-concrete-mid">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ G. PERSONA CARDS ═════════════════════════════════════════════════ */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionPill>{s.whoTitle}</SectionPill>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Standard role cards */}
            {s.whoItems.map((w, i) => (
              <div key={i} className="bg-[#FAFAF9] rounded-xl shadow-sm p-6 flex flex-col">
                <p className="text-[11px] font-extrabold text-concrete-mid uppercase tracking-[0.1em] mb-3">
                  {w.role}
                </p>
                <p className="text-sm leading-relaxed text-concrete-mid flex-1 mb-5">{w.desc}</p>
                <div>
                  <BtnPrimary to="/login" className="text-xs px-3.5 py-2 mb-2 w-full justify-center">
                    {w.cta} <IconArrowRight size={12} stroke={2} />
                  </BtnPrimary>
                  <p className="text-[11px] text-concrete-light">{w.note}</p>
                </div>
              </div>
            ))}

            {/* Evaluator card — distinctive terracotta border */}
            <div className="relative bg-civic-bg border-[1.5px] border-civic rounded-xl p-6 flex flex-col shadow-sm">
              <div className="absolute -top-px right-5 bg-civic text-white text-[9px] font-extrabold
                              uppercase tracking-[0.1em] px-2.5 py-1 rounded-b-md">
                {s.demoCardTag}
              </div>
              <p className="text-[11px] font-extrabold text-[#2A2A28] uppercase tracking-[0.1em] mb-3 mt-2">
                {s.demoCardTitle}
              </p>
              <p className="text-sm leading-relaxed text-concrete flex-1 mb-5">{s.demoCardDesc}</p>
              <button onClick={handleDemo} disabled={demoLoading}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5
                           rounded-btn bg-civic text-white text-sm font-bold
                           hover:bg-civic-dark transition-colors disabled:opacity-60">
                <IconPlayerPlay size={13} stroke={2} />
                {demoLoading ? '…' : s.demoCardBtn}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════════════ */}
      <section className="bg-civic-bg border-t border-civic/20 py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif tracking-tight text-[#1A1A18] leading-tight mb-4"
              style={{ fontSize: 'clamp(26px, 4vw, 46px)' }}>
            {s.finalTitle}
          </h2>
          <p className="text-base text-concrete-mid leading-relaxed mb-10 max-w-lg mx-auto">
            {s.finalSub}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <BtnPrimary to="/login" className="shadow-sm">
              <IconCamera size={16} stroke={2} />{s.cta1}
            </BtnPrimary>
            <BtnOutline onClick={handleDemo} disabled={demoLoading} className="shadow-sm">
              <IconBolt size={16} stroke={2} />
              {demoLoading ? '…' : s.ctaDemo}
            </BtnOutline>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-white border-t border-[#E5E2DE] py-6 px-6 text-center">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-civic flex items-center justify-center">
              <span className="text-white font-extrabold text-[9px] font-mono">CH</span>
            </div>
            <span className="text-xs font-semibold text-concrete-mid">{s.footerBy}</span>
          </div>
          <p className="text-xs text-concrete-light">{s.footerLang}</p>
        </div>
      </footer>
    </div>
  );
}
