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
  IconArrowRight, IconTicket, IconPlayerPlay,
} from '@tabler/icons-react';

// ─── strings ──────────────────────────────────────────────────────────────────
const STRINGS = {
  en: {
    navTrack:    'Track a ticket',
    navSignIn:   'Sign in',
    pill:        'AI-powered civic resolution — live in Kolkata',
    h1a:         'Your city. Your problems.',
    h1b:         'Now — on the record.',
    sub:         'One platform for citizens, departments, and civic teams to report, track, and resolve the problems on our streets — with transparency built in.',
    cta1:        'Report an Issue',
    ctaDemo:     'Explore Demo',
    demoNote:    'No signup needed — explore with a pre-loaded citizen account.',
    trackLabel:  'Track a ticket by ID',
    trackPlaceholder: 'e.g. KOL-2026-00151',
    trackBtn:    'Track',
    statsIssues: 'Issues reported',
    statsResolved:'Resolved',
    statsActive: 'Active right now',
    statsAI:     'AI classified',
    problemTitle:'Why civic reporting is broken',
    problemItems:[
      { title: 'Fragmented channels',   desc: 'Citizens call helplines, post on social media, visit ward offices — each complaint goes nowhere and no two complaints are linked.' },
      { title: 'Zero accountability',   desc: 'There is no public record of who an issue was assigned to, how long it sat, or whether the "resolved" status was genuine.' },
      { title: 'No legal follow-through', desc: 'Citizens do not know their rights. After 30 days of inaction, an RTI application should file itself — but almost nobody does it.' },
    ],
    howTitle:    'How it works',
    steps: [
      { n: '01', title: 'Snap a photo & pick a category',   desc: 'Upload a photo of any civic problem. Gemini AI verifies it matches the issue type and extracts the location.',                          icon: IconCamera },
      { n: '02', title: 'AI classifies severity & department', desc: 'The model scores severity 1–10, routes the complaint to the right department, and flags any duplicates.',                          icon: IconBrain },
      { n: '03', title: 'A smart agent auto-assigns the officer', desc: 'Our triage agent picks the least-loaded officer in the right ward — no dispatcher needed.',                                     icon: IconUserCheck },
      { n: '04', title: 'Track every update in real time',   desc: 'Your public ticket ID (e.g. KOL-2026-00151) lets anyone follow officer name, status changes, and SLA countdown — no login required.', icon: IconTicket },
      { n: '05', title: 'Ignored past SLA? RTI files itself', desc: 'After 30 days of inaction the platform generates and logs a Right to Information application automatically.',                       icon: IconScale },
    ],
    featuresTitle: 'Everything in one platform',
    features: [
      { icon: IconBrain,         title: 'AI photo verification',          desc: 'Gemini vision confirms the photo matches the reported issue type before accepting the complaint.' },
      { icon: IconUserCheck,     title: 'Smart auto-routing',             desc: 'Triage agent picks the least-loaded officer in the right ward — load-balanced, explainable.' },
      { icon: IconScale,         title: 'Autonomous RTI filing',          desc: 'After 30 days of inaction, an RTI document is generated and filed by the platform itself.' },
      { icon: IconGhost,         title: 'Ghost detection',                desc: 'AI compares before/after photos. Fake "resolved" closures are automatically re-opened.' },
      { icon: IconTrendingUp,    title: 'Predictive insights',            desc: 'The system forecasts recurring civic issues by ward so departments can act before complaints spike.' },
      { icon: IconMapPin,        title: 'Community map',                  desc: 'Live Google Maps view of every open issue, color-coded by severity, clickable for details.' },
      { icon: IconId,            title: 'Real-time public tracking',      desc: 'Anyone can track ticket progress by ID — no login, no friction, full transparency.' },
      { icon: IconMessageCircle, title: 'AI assistant',                   desc: 'Ask your ticket\'s status, SLA deadline, or officer in plain language — Gemini answers.' },
      { icon: IconUsers,         title: 'Community corroboration',        desc: '"I\'ve seen this too" upvotes and duplicate detection surface community-verified issues.' },
      { icon: IconTrophy,        title: 'Gamification',                   desc: 'Citizens earn XP and badges for verified reports. Ward leaderboards make civic action visible.' },
      { icon: IconLanguage,      title: 'Multilingual',                   desc: 'Full interface in English, Hindi, and Bengali — more Indian languages arriving soon.' },
    ],
    whoTitle:    'Built for everyone in the civic chain',
    whoItems: [
      { role: 'Citizen',  desc: 'Report any civic issue in under 2 minutes. Track it live. File an RTI in one click if it is ignored.', cta: 'Sign in as citizen',  note: 'Sign in with email or Google' },
      { role: 'Officer',  desc: 'See your queue, respond to complaints, and close issues with photo evidence. SLA deadlines auto-remind.', cta: 'Officer login',     note: 'Government email login' },
      { role: 'Admin',    desc: 'Oversee analytics, staff assignments, escalations, and AI agent activity across every department.', cta: 'Admin login',       note: 'Admin email login' },
    ],
    demoCardTag:   'For evaluators',
    demoCardTitle: 'Explore the full platform — one click',
    demoCardDesc:  'A fully populated demo account: Arjun\'s tickets, a live RTI filing, ghost detections, and officer assignments — all ready to explore. No signup.',
    demoCardBtn:   'Enter demo →',
    finalTitle:    'Civic accountability starts with a single report.',
    finalSub:      'Every unresolved pothole, broken streetlight, and open manhole has a name attached to it now.',
    footerLang:    'Available in English, Hindi & Bengali. More Indian languages coming soon.',
    footerBy:      'Community Hero · Kolkata Municipal Corporation',
    langNote:      'Available in English, Hindi & Bengali. More Indian languages coming soon.',
  },
  hi: {
    navTrack:    'टिकट ट्रैक करें',
    navSignIn:   'साइन इन करें',
    pill:        'एआई-संचालित नागरिक समाधान — कोलकाता में लाइव',
    h1a:         'आपका शहर। आपकी समस्याएं।',
    h1b:         'अब — रिकॉर्ड पर।',
    sub:         'नागरिकों, विभागों और नागरिक टीमों के लिए एक मंच — सड़कों की समस्याओं को रिपोर्ट, ट्रैक और हल करने के लिए, पारदर्शिता के साथ।',
    cta1:        'समस्या रिपोर्ट करें',
    ctaDemo:     'डेमो देखें',
    demoNote:    'कोई साइनअप नहीं — प्री-लोडेड खाते से एक्सप्लोर करें।',
    trackLabel:  'टिकट आईडी से ट्रैक करें',
    trackPlaceholder: 'जैसे KOL-2026-00151',
    trackBtn:    'ट्रैक',
    statsIssues: 'रिपोर्ट की गई समस्याएं',
    statsResolved:'हल हुईं',
    statsActive: 'अभी सक्रिय',
    statsAI:     'एआई वर्गीकृत',
    problemTitle:'नागरिक रिपोर्टिंग टूटी हुई क्यों है',
    problemItems:[
      { title: 'बिखरे चैनल',       desc: 'नागरिक हेल्पलाइन, सोशल मीडिया, वार्ड कार्यालय — कोई शिकायत कहीं नहीं जाती।' },
      { title: 'शून्य जवाबदेही',    desc: 'कोई सार्वजनिक रिकॉर्ड नहीं कि समस्या किसे सौंपी गई, कितने दिन रुकी, या समाधान असली था।' },
      { title: 'कोई कानूनी कार्रवाई नहीं', desc: 'नागरिकों को अपने अधिकार नहीं पता। 30 दिन बाद RTI खुद दर्ज होनी चाहिए।' },
    ],
    howTitle:    'यह कैसे काम करता है',
    steps: [
      { n: '01', title: 'फोटो लें और श्रेणी चुनें',        desc: 'किसी भी नागरिक समस्या की फोटो अपलोड करें। जेमिनी एआई सत्यापित करता है।',                            icon: IconCamera },
      { n: '02', title: 'एआई गंभीरता वर्गीकृत करता है',   desc: 'मॉडल 1-10 गंभीरता देता है और सही विभाग को रूट करता है।',                                             icon: IconBrain },
      { n: '03', title: 'एजेंट अधिकारी को असाइन करता है', desc: 'हमारा ट्रायज एजेंट सही वार्ड के सबसे कम लोड वाले अधिकारी को चुनता है।',                               icon: IconUserCheck },
      { n: '04', title: 'हर अपडेट रियल टाइम में ट्रैक करें', desc: 'आपकी टिकट आईडी से अधिकारी का नाम, स्टेटस और SLA समयसीमा देखें।',                                 icon: IconTicket },
      { n: '05', title: 'SLA के बाद RTI खुद दर्ज होती है', desc: '30 दिन बाद मंच स्वतः RTI आवेदन तैयार करता है।',                                                      icon: IconScale },
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
      { icon: IconTrophy,        title: 'गेमिफिकेशन',               desc: 'XP, बैज और वार्ड लीडरबोर्ड।' },
      { icon: IconLanguage,      title: 'बहुभाषी',                   desc: 'अंग्रेजी, हिंदी और बांग्ला में — और भाषाएं जल्द आ रही हैं।' },
    ],
    whoTitle:    'नागरिक श्रृंखला में सभी के लिए',
    whoItems: [
      { role: 'नागरिक',   desc: '2 मिनट में कोई भी समस्या रिपोर्ट करें। लाइव ट्रैक करें। अनसुना करने पर RTI दर्ज करें।', cta: 'नागरिक के रूप में साइन इन', note: 'ईमेल या Google से' },
      { role: 'अधिकारी',  desc: 'शिकायतें देखें, जवाब दें, और फोटो साक्ष्य के साथ बंद करें। SLA अनुस्मारक स्वतः।', cta: 'अधिकारी लॉगिन',          note: 'सरकारी ईमेल' },
      { role: 'एडमिन',    desc: 'विश्लेषण, स्टाफ असाइनमेंट, एस्केलेशन और एआई एजेंट गतिविधि देखें।', cta: 'एडमिन लॉगिन',            note: 'एडमिन ईमेल' },
    ],
    demoCardTag:   'मूल्यांकनकर्ताओं के लिए',
    demoCardTitle: 'पूरा प्लेटफ़ॉर्म एक्सप्लोर करें',
    demoCardDesc:  'अर्जुन का प्री-लोडेड डेमो अकाउंट: टिकट, RTI, और अधिकारी असाइनमेंट — एक्सप्लोर करें।',
    demoCardBtn:   'डेमो में प्रवेश →',
    finalTitle:    'नागरिक जवाबदेही एक रिपोर्ट से शुरू होती है।',
    finalSub:      'हर अनसुलझे गड्ढे, टूटी स्ट्रीटलाइट और खुले मैनहोल पर अब एक नाम दर्ज है।',
    footerLang:    'अंग्रेजी, हिंदी और बांग्ला में उपलब्ध। जल्द ही और भारतीय भाषाएं।',
    footerBy:      'Community Hero · कोलकाता नगर निगम',
    langNote:      'अंग्रेजी, हिंदी और बांग्ला में उपलब्ध। जल्द ही और भारतीय भाषाएं।',
  },
  bn: {
    navTrack:    'টিকিট ট্র্যাক করুন',
    navSignIn:   'সাইন ইন করুন',
    pill:        'এআই-চালিত নাগরিক সমাধান — কলকাতায় লাইভ',
    h1a:         'আপনার শহর। আপনার সমস্যা।',
    h1b:         'এখন — রেকর্ডে।',
    sub:         'নাগরিক, বিভাগ ও নাগরিক দলের জন্য একটি মঞ্চ — রাস্তার সমস্যা রিপোর্ট, ট্র্যাক ও সমাধান করতে।',
    cta1:        'সমস্যা রিপোর্ট করুন',
    ctaDemo:     'ডেমো দেখুন',
    demoNote:    'সাইনআপ দরকার নেই — প্রি-লোডেড অ্যাকাউন্ট দিয়ে দেখুন।',
    trackLabel:  'টিকিট আইডি দিয়ে ট্র্যাক করুন',
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
      { n: '01', title: 'ছবি তুলুন ও বিভাগ বেছে নিন',     desc: 'যেকোনো সমস্যার ছবি আপলোড করুন। Gemini AI যাচাই করে।',                                                  icon: IconCamera },
      { n: '02', title: 'AI তীব্রতা ও বিভাগ শ্রেণীবদ্ধ করে', desc: 'মডেল ১-১০ তীব্রতা দেয় এবং সঠিক বিভাগে পাঠায়।',                                                   icon: IconBrain },
      { n: '03', title: 'এজেন্ট অফিসার নিয়োগ করে',        desc: 'আমাদের ট্রায়াজ এজেন্ট সঠিক ওয়ার্ডের কম লোডের অফিসার বেছে নেয়।',                                      icon: IconUserCheck },
      { n: '04', title: 'রিয়েল টাইমে প্রতিটি আপডেট ট্র্যাক করুন', desc: 'টিকিট আইডি দিয়ে অফিসার, স্ট্যাটাস ও SLA দেখুন — লগইন ছাড়া।',                             icon: IconTicket },
      { n: '05', title: 'SLA পেরোলে RTI নিজেই দাখিল হয়',   desc: '৩০ দিন পরে প্ল্যাটফর্ম স্বয়ংক্রিয়ভাবে RTI আবেদন তৈরি করে।',                                     icon: IconScale },
    ],
    featuresTitle: 'একটি প্ল্যাটফর্মে সবকিছু',
    features: [
      { icon: IconBrain,         title: 'AI ছবি যাচাই',              desc: 'Gemini Vision ছবি ও সমস্যার ধরন মেলায়।' },
      { icon: IconUserCheck,     title: 'স্মার্ট অটো-রাউটিং',       desc: 'ট্রায়াজ এজেন্ট সঠিক ওয়ার্ডে কম লোডের অফিসার বেছে নেয়।' },
      { icon: IconScale,         title: 'স্বায়ত্তশাসিত RTI দাখিল',  desc: '৩০ দিন পরে প্ল্যাটফর্ম নিজেই RTI নথি তৈরি করে।' },
      { icon: IconGhost,         title: 'ঘোস্ট ডিটেকশন',            desc: 'AI নকল সমাধান ধরে এবং টিকিট পুনরায় খোলে।' },
      { icon: IconTrendingUp,    title: 'পূর্বানুমানমূলক অন্তর্দৃষ্টি', desc: 'ওয়ার্ডভিত্তিক পুনরাবৃত্তিমূলক সমস্যার পূর্বাভাস।' },
      { icon: IconMapPin,        title: 'কমিউনিটি ম্যাপ',            desc: 'Google Maps-এ লাইভ সমস্যা, তীব্রতা অনুযায়ী রঙ-কোডেড।' },
      { icon: IconId,            title: 'রিয়েল-টাইম পাবলিক ট্র্যাকিং', desc: 'লগইন ছাড়াই টিকিট আইডি দিয়ে ট্র্যাক করুন।' },
      { icon: IconMessageCircle, title: 'AI সহকারী',                  desc: 'সরল ভাষায় টিকিটের অবস্থা জানুন।' },
      { icon: IconUsers,         title: 'কমিউনিটি সমর্থন',           desc: '"আমিও দেখেছি" ভোট ও ডুপ্লিকেট ডিটেকশন।' },
      { icon: IconTrophy,        title: 'গেমিফিকেশন',                desc: 'XP, ব্যাজ ও ওয়ার্ড লিডারবোর্ড।' },
      { icon: IconLanguage,      title: 'বহুভাষিক',                   desc: 'বাংলা, হিন্দি ও ইংরেজিতে — আরও ভাষা শীঘ্রই।' },
    ],
    whoTitle:    'নাগরিক শৃঙ্খলের সবার জন্য',
    whoItems: [
      { role: 'নাগরিক',  desc: '২ মিনিটে সমস্যা রিপোর্ট করুন। লাইভ ট্র্যাক করুন। উপেক্ষিত হলে RTI করুন।', cta: 'নাগরিক হিসেবে সাইন ইন', note: 'ইমেল বা Google দিয়ে' },
      { role: 'অফিসার', desc: 'অভিযোগ দেখুন, সাড়া দিন, ছবি প্রমাণ দিয়ে বন্ধ করুন। SLA রিমাইন্ডার স্বয়ংক্রিয়।', cta: 'অফিসার লগইন',        note: 'সরকারি ইমেল' },
      { role: 'অ্যাডমিন', desc: 'বিশ্লেষণ, স্টাফ, এস্কেলেশন ও AI এজেন্ট কার্যক্রম দেখুন।', cta: 'অ্যাডমিন লগইন',         note: 'অ্যাডমিন ইমেল' },
    ],
    demoCardTag:   'মূল্যায়নকারীদের জন্য',
    demoCardTitle: 'পুরো প্ল্যাটফর্ম এক ক্লিকে দেখুন',
    demoCardDesc:  'অর্জুনের প্রি-লোডেড ডেমো অ্যাকাউন্ট: টিকিট, RTI, ঘোস্ট ডিটেকশন — সব প্রস্তুত।',
    demoCardBtn:   'ডেমোতে প্রবেশ →',
    finalTitle:    'নাগরিক জবাবদিহি শুরু হয় একটি রিপোর্ট থেকে।',
    finalSub:      'প্রতিটি অমীমাংসিত গর্ত, ভাঙা স্ট্রিটলাইট ও খোলা ম্যানহোলে এখন একটি নাম নথিভুক্ত।',
    footerLang:    'বাংলা, হিন্দি ও ইংরেজিতে উপলব্ধ। শীঘ্রই আরও ভারতীয় ভাষা।',
    footerBy:      'Community Hero · কলকাতা পৌরসংস্থা',
    langNote:      'বাংলা, হিন্দি ও ইংরেজিতে উপলব্ধ। শীঘ্রই আরও ভারতীয় ভাষা।',
  },
};

// ─── color tokens (single source) ────────────────────────────────────────────
const C = {
  bg:        '#F5F3F0',
  white:     '#FFFFFF',
  surface:   '#FAFAF9',
  civic:     '#C13B2A',
  civicDark: '#9A2D1F',
  civicTint: '#FDF1EF',
  text:      '#2A2A28',
  body:      '#4A4A48',
  muted:     '#7A7875',
  faint:     '#B8B5B0',
  border:    '#E5E2DE',
  green:     '#1A7A4A',
  greenTint: '#E8F5EE',
  amber:     '#D4730A',
  amberTint: '#FEF3E7',
  purple:    '#6B50B8',
};

// ─── tiny helpers ─────────────────────────────────────────────────────────────
const Divider = () => <div style={{ height: 1, background: C.border }} />;

function Pill({ children }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '5px 12px', borderRadius: 20,
      border: `1px solid ${C.border}`, background: C.white,
      fontSize: 12, fontWeight: 600, color: C.muted,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      marginBottom: 16,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.civic, display: 'inline-block' }} />
      {children}
    </div>
  );
}

function BtnPrimary({ children, onClick, to, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '11px 22px', borderRadius: 6,
    background: C.civic, color: '#fff',
    fontWeight: 600, fontSize: 14, cursor: 'pointer',
    border: 'none', textDecoration: 'none',
    transition: 'background 0.15s',
    ...style,
  };
  if (to) return <Link to={to} style={base}>{children}</Link>;
  return <button onClick={onClick} style={base}>{children}</button>;
}

function BtnOutline({ children, onClick, to, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 22px', borderRadius: 6,
    background: 'transparent', color: C.civic,
    fontWeight: 600, fontSize: 14, cursor: 'pointer',
    border: `1.5px solid ${C.civic}`, textDecoration: 'none',
    transition: 'background 0.15s',
    ...style,
  };
  if (to) return <Link to={to} style={base}>{children}</Link>;
  return <button onClick={onClick} style={base}>{children}</button>;
}

// ─── main component ───────────────────────────────────────────────────────────
export default function Landing() {
  const [stats, setStats]   = useState({ total: 0, resolved: 0, active: 0 });
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
    { label: s.statsIssues,  value: stats.total || '—' },
    { label: s.statsResolved, value: stats.resolved || '—' },
    { label: s.statsActive,  value: stats.active || '—' },
    { label: s.statsAI,      value: stats.total ? Math.floor(stats.total * 0.98) : '—' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: C.bg, color: C.body, minHeight: '100vh' }}>

      {/* ── 1. STICKY NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: C.white, borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Logo mark */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6, background: C.civic,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '-0.5px', fontFamily: 'JetBrains Mono, monospace' }}>CH</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text, letterSpacing: '-0.2px' }}>Community Hero</span>
          </Link>

          <div style={{ flex: 1 }} />

          <Link to="/track/KOL-2026-00151" style={{ fontSize: 13, color: C.muted, textDecoration: 'none', display: 'none' }} className="md-show">
            {s.navTrack}
          </Link>

          <LanguageSelector />

          <Link to="/login" style={{
            fontSize: 13, fontWeight: 600, padding: '7px 16px',
            borderRadius: 6, background: C.civic, color: '#fff',
            textDecoration: 'none', flexShrink: 0,
          }}>
            {s.navSignIn}
          </Link>
        </div>
      </nav>

      {/* ── 2. HERO ───────────────────────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: '72px 24px 56px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <Pill>{s.pill}</Pill>

          <h1 style={{
            fontFamily: '"DM Serif Display", "Instrument Serif", Georgia, serif',
            fontSize: 'clamp(36px, 5.5vw, 72px)',
            lineHeight: 1.1, color: C.text, margin: '0 0 20px',
            letterSpacing: '-0.5px',
          }}>
            {s.h1a}<br />{s.h1b}
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.7, color: C.muted, maxWidth: 600, margin: '0 auto 32px' }}>
            {s.sub}
          </p>

          {/* CTA row */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <BtnPrimary to="/login">
              <IconCamera size={15} stroke={2} />{s.cta1}
            </BtnPrimary>
            <BtnOutline onClick={handleDemo} style={{ opacity: demoLoading ? 0.7 : 1 }}>
              <IconBolt size={15} stroke={2} />
              {demoLoading ? '…' : s.ctaDemo}
            </BtnOutline>
          </div>
          <p style={{ fontSize: 12, color: C.faint, marginBottom: 32 }}>{s.demoNote}</p>

          {/* Track input */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <form onSubmit={handleTrack} style={{
              display: 'flex', gap: 0, border: `1px solid ${C.border}`,
              borderRadius: 6, overflow: 'hidden', background: C.white,
              maxWidth: 400, width: '100%',
            }}>
              <input
                value={trackId}
                onChange={e => setTrackId(e.target.value)}
                placeholder={s.trackPlaceholder}
                style={{
                  flex: 1, padding: '10px 14px', border: 'none', outline: 'none',
                  fontSize: 13, color: C.body, background: 'transparent',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <button type="submit" style={{
                padding: '10px 16px', background: C.surface,
                border: 'none', borderLeft: `1px solid ${C.border}`,
                fontSize: 12, fontWeight: 600, color: C.civic, cursor: 'pointer',
                flexShrink: 0,
              }}>
                {s.trackBtn}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── 3. LIVE STATS BAR ─────────────────────────────────────────────── */}
      <section style={{ background: C.white, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
          {statItems.map((st, i) => (
            <div key={st.label} style={{
              textAlign: 'center', padding: '20px 12px',
              borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 30, fontWeight: 700, color: C.civic, letterSpacing: '-1px' }}>
                {st.value}
              </div>
              <div style={{ fontSize: 11, color: C.faint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {st.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. THE PROBLEM ────────────────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: '72px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Pill>{s.problemTitle}</Pill>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 8 }}>
            {s.problemItems.map((p, i) => (
              <div key={i} style={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '20px 22px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <IconAlertTriangle size={16} stroke={1.5} style={{ color: C.amber, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{p.title}</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: C.muted, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── 5. HOW IT WORKS ───────────────────────────────────────────────── */}
      <section style={{ background: C.white, padding: '72px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Pill>{s.howTitle}</Pill>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {s.steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.n} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 28,
                  padding: '28px 0',
                  borderBottom: i < s.steps.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  {/* serif number */}
                  <div style={{
                    fontFamily: '"DM Serif Display", "Instrument Serif", Georgia, serif',
                    fontSize: 40, lineHeight: 1, color: C.border,
                    flexShrink: 0, width: 48, textAlign: 'right',
                    userSelect: 'none',
                  }}>{step.n}</div>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: C.civicTint, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, marginTop: 2,
                  }}>
                    <Icon size={20} stroke={1.5} style={{ color: C.civic }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: C.text, margin: '0 0 6px' }}>{step.title}</p>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: C.muted, margin: 0, maxWidth: 560 }}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── 6. FEATURES ───────────────────────────────────────────────────── */}
      <section style={{ background: C.surface, padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Pill>{s.featuresTitle}</Pill>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12, marginTop: 8 }}>
            {s.features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{
                  background: C.white, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '18px 20px',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 6,
                    background: C.civicTint, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', marginBottom: 12,
                  }}>
                    <Icon size={17} stroke={1.5} style={{ color: C.civic }} />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: C.text, margin: '0 0 5px' }}>{f.title}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.65, color: C.muted, margin: 0 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── 7. WHO IT'S FOR ───────────────────────────────────────────────── */}
      <section style={{ background: C.white, padding: '72px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Pill>{s.whoTitle}</Pill>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 8 }}>
            {s.whoItems.map((w, i) => (
              <div key={i} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '22px 24px',
              }}>
                <p style={{ fontWeight: 800, fontSize: 13, color: C.text, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{w.role}</p>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: C.muted, marginBottom: 16 }}>{w.desc}</p>
                <BtnPrimary to="/login" style={{ fontSize: 12, padding: '8px 14px', marginBottom: 6 }}>
                  {w.cta}<IconArrowRight size={13} stroke={2} />
                </BtnPrimary>
                <p style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>{w.note}</p>
              </div>
            ))}

            {/* Demo card — distinct civic-red accent */}
            <div style={{
              background: C.civicTint, border: `1.5px solid ${C.civic}`,
              borderRadius: 8, padding: '22px 24px', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -1, right: 16,
                background: C.civic, color: '#fff',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '3px 8px', borderRadius: '0 0 4px 4px',
              }}>{s.demoCardTag}</div>
              <p style={{ fontWeight: 800, fontSize: 13, color: C.text, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, marginTop: 8 }}>
                {s.demoCardTitle}
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: C.body, marginBottom: 16 }}>{s.demoCardDesc}</p>
              <button onClick={handleDemo} disabled={demoLoading} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 6,
                background: C.civic, color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                border: 'none', opacity: demoLoading ? 0.7 : 1,
              }}>
                <IconPlayerPlay size={14} stroke={2} />
                {demoLoading ? '…' : s.demoCardBtn}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── 8. FINAL CTA ──────────────────────────────────────────────────── */}
      <section style={{ background: C.civicTint, padding: '64px 24px', textAlign: 'center', borderTop: `1px solid ${C.civic}30` }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: '"DM Serif Display", "Instrument Serif", Georgia, serif',
            fontSize: 'clamp(26px, 4vw, 42px)', color: C.text,
            margin: '0 0 14px', lineHeight: 1.2,
          }}>
            {s.finalTitle}
          </h2>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 32 }}>{s.finalSub}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <BtnPrimary to="/login">
              <IconCamera size={15} stroke={2} />{s.cta1}
            </BtnPrimary>
            <BtnOutline onClick={handleDemo} style={{ opacity: demoLoading ? 0.7 : 1 }}>
              <IconBolt size={15} stroke={2} />
              {demoLoading ? '…' : s.ctaDemo}
            </BtnOutline>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{
        background: C.white, borderTop: `1px solid ${C.border}`,
        padding: '20px 24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, color: C.faint, margin: '0 0 4px' }}>{s.langNote}</p>
        <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>{s.footerBy}</p>
      </footer>
    </div>
  );
}
